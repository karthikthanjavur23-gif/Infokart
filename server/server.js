const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' 
  ? new GoogleGenerativeAI(GEMINI_API_KEY) 
  : null;

const aiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

// Helper to get WhatsApp Config (prefer DB over ENV)
async function getWhatsAppConfig() {
  const config = db.prepare('SELECT * FROM whatsapp_settings WHERE id = 1').get();
  if (config && config.access_token && config.phone_number_id) {
    return {
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      wabaId: config.waba_id
    };
  }
  return {
    accessToken: process.env.META_ACCESS_TOKEN,
    phoneNumberId: process.env.PHONE_NUMBER_ID,
    wabaId: null
  };
}

// Helper to call Gemini
async function askAI(prompt, systemInstruction = "You are a professional WhatsApp Marketing Assistant for InfoKart.") {
  if (!aiModel) {
    return "AI is currently in simulation mode. Please provide a valid GEMINI_API_KEY in the .env file.";
  }
  try {
    const fullPrompt = `${systemInstruction}\n\nUser Request: ${prompt}`;
    const result = await aiModel.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble thinking right now. Please try again later.";
  }
}

// --- API ENDPOINTS ---

// 0. WhatsApp Connection (Embedded Signup)
app.get('/api/whatsapp/init-config', (req, res) => {
  const sanitize = (val) => (val && !val.includes('your_')) ? val : '';
  res.json({
    appId: sanitize(process.env.META_APP_ID),
    configId: sanitize(process.env.META_CONFIG_ID)
  });
});

app.get('/api/whatsapp/status', async (req, res) => {
  const config = db.prepare('SELECT * FROM whatsapp_settings WHERE id = 1').get();
  res.json({ connected: !!(config && config.access_token), details: config });
});

const fs = require('fs');

app.post('/api/whatsapp/embedded-signup', async (req, res) => {
  const { code, redirectUri } = req.body;
  fs.appendFileSync('signup_debug.log', `\n[${new Date().toISOString()}] Payload: ${JSON.stringify(req.body)}\n`);
  console.log('[DEBUG] Received embedded signup payload:', { code: code ? 'PRESENT' : 'MISSING', redirectUri });
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!code || !appId || !appSecret) {
    return res.status(400).json({ error: 'Missing code, appId, or appSecret' });
  }

  try {
    let accessToken;

    // 1. Exchange code for access token. 
    // We use the same version as the frontend SDK (v22.0).
    // We pass the exact redirectUri from the frontend for a perfect match.
    const tokenRes = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
      params: {
        client_id: appId,
        client_secret: appSecret,
        code: code,
        redirect_uri: redirectUri
      }
    });
    accessToken = tokenRes.data.access_token;
    fs.appendFileSync('signup_debug.log', `\n[SUCCESS] Token exchange worked with redirectUri: ${redirectUri}\n`);

    // 2. Inspect the token to get the WABA ID granted during Embedded Signup
    // The debug_token endpoint returns granular_scopes which includes the WABA IDs
    const debugRes = await axios.get(`https://graph.facebook.com/v22.0/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${appId}|${appSecret}`
      }
    });

    fs.appendFileSync('signup_debug.log', `\n[DEBUG_TOKEN] ${JSON.stringify(debugRes.data)}\n`);

    // Extract WABA ID from granular scopes
    const granularScopes = debugRes.data?.data?.granular_scopes || [];
    const wabaScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');
    let wabaId = wabaScope?.target_ids?.[0];

    if (!wabaId) {
      // Granular scopes exist but without target_ids — fetch WABAs directly
      fs.appendFileSync('signup_debug.log', `\n[INFO] No target_ids in granular_scopes, fetching via /me/whatsapp_business_accounts\n`);
      
      const wabaRes = await axios.get(`https://graph.facebook.com/v22.0/me/whatsapp_business_accounts`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      fs.appendFileSync('signup_debug.log', `\n[WABA_ACCOUNTS] ${JSON.stringify(wabaRes.data)}\n`);
      
      wabaId = wabaRes.data?.data?.[0]?.id;
    }

    if (!wabaId) throw new Error("No WhatsApp Business Account found. Please complete the full signup flow.");

    fs.appendFileSync('signup_debug.log', `\n[WABA] Found WABA ID: ${wabaId}\n`);

    // 3. Fetch Phone Numbers for this WABA
    const phoneRes = await axios.get(`https://graph.facebook.com/v22.0/${wabaId}/phone_numbers`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const phoneData = phoneRes.data.data[0];
    if (!phoneData) throw new Error("No verified phone numbers found in this WABA.");

    const phoneNumberId = phoneData.id;
    const displayPhoneNumber = phoneData.display_phone_number;
    const verifiedName = phoneData.verified_name;

    // 4. Save to Database
    const stmt = db.prepare(`
      INSERT INTO whatsapp_settings (id, waba_id, phone_number_id, access_token, display_phone_number, verified_name, status)
      VALUES (1, ?, ?, ?, ?, ?, 'Connected')
      ON CONFLICT(id) DO UPDATE SET 
        waba_id = excluded.waba_id,
        phone_number_id = excluded.phone_number_id,
        access_token = excluded.access_token,
        display_phone_number = excluded.display_phone_number,
        verified_name = excluded.verified_name,
        status = 'Connected',
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(wabaId, phoneNumberId, accessToken, displayPhoneNumber, verifiedName);

    res.json({ success: true, displayPhoneNumber });

  } catch (error) {
    console.error("Embedded Signup Error:", error.response?.data || error.message);
    fs.appendFileSync('signup_debug.log', `[${new Date().toISOString()}] Error: ${JSON.stringify(error.response?.data || error.message)}\n`);
    res.status(500).json({ error: "Failed to complete signup", details: error.response?.data || error.message });
  }
});

app.post('/api/whatsapp/disconnect', (req, res) => {
  db.prepare('DELETE FROM whatsapp_settings WHERE id = 1').run();
  res.json({ success: true });
});

// 1. Dashboard Stats
app.get('/api/dashboard', (req, res) => {
  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const activeCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = 'Active'").get().count;
  const botResponses = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'bot'").get().count;
  const leadsClosed = Math.floor(totalContacts * 0.15); // Simulated metric

  res.json({
    totalContacts,
    activeCampaigns,
    botResponses,
    leadsClosed
  });
});

// 2. Campaigns
app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY id DESC').all();
  res.json(campaigns);
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

app.get('/api/campaigns/:id/contacts', (req, res) => {
  const contacts = db.prepare(`
    SELECT c.*, cc.status as campaign_status 
    FROM contacts c
    JOIN campaign_contacts cc ON c.id = cc.contact_id
    WHERE cc.campaign_id = ?
  `).all(req.params.id);
  res.json(contacts);
});

app.post('/api/campaigns', (req, res) => {
  const { name, channel, target, template, contactIds, settings, scheduledAt } = req.body;
  
  // If we have selected contacts, the target count is the length of that selection
  const finalTarget = (contactIds && Array.isArray(contactIds)) ? contactIds.length : (target || 0);
  
  const stmt = db.prepare('INSERT INTO campaigns (name, channel, status, target, template, settings, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    name, 
    channel, 
    'Draft', 
    finalTarget, 
    template || '', 
    settings ? JSON.stringify(settings) : null,
    scheduledAt || null
  );
  
  const campaignId = info.lastInsertRowid;

  // If specific contacts were selected, record them in campaign_contacts table
  if (contactIds && Array.isArray(contactIds)) {
    const insertTarget = db.prepare('INSERT INTO campaign_contacts (campaign_id, contact_id) VALUES (?, ?)');
    const insertMany = db.transaction((list) => {
      for (const contactId of list) {
        insertTarget.run(campaignId, contactId);
      }
    });
    insertMany(contactIds);
  }

  res.json({ id: campaignId, success: true });
});

app.post('/api/campaigns/:id/send', async (req, res) => {
  const campaignId = req.params.id;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (campaign.status === 'Completed') return res.status(400).json({ error: 'Campaign already completed' });

  // Update status to Active
  db.prepare("UPDATE campaigns SET status = 'Active' WHERE id = ?").run(campaignId);

  // Fetch pending contacts for this campaign
  const contacts = db.prepare(`
    SELECT c.* 
    FROM contacts c
    JOIN campaign_contacts cc ON c.id = cc.contact_id
    WHERE cc.campaign_id = ? AND cc.status = 'Pending'
  `).all(campaignId);

  const config = await getWhatsAppConfig();

  if (!config.phoneNumberId || !config.accessToken) {
    return res.status(400).json({ error: 'WhatsApp is not connected. Connect via Marketing Workspace first.' });
  }

  // Response immediately to let UI know it started
  res.json({ success: true, message: `Started sending to ${contacts.length} contacts.` });

  // Process in background
  (async () => {
    console.log(`🚀 Starting background processing for Campaign ${campaignId}`);
    for (const contact of contacts) {
      try {
        // Simple variable replacement: {{name}}
        const personalizedMsg = (campaign.template || '').replace(/\{\{name\}\}/g, contact.name || 'Friend');

        await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
          headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
          data: { messaging_product: 'whatsapp', to: contact.phone_number, type: 'text', text: { body: personalizedMsg } },
        });

        // Update successful status
        db.prepare('UPDATE campaign_contacts SET status = "Sent" WHERE campaign_id = ? AND contact_id = ?')
          .run(campaignId, contact.id);
        
        db.prepare('UPDATE campaigns SET sent = sent + 1 WHERE id = ?').run(campaignId);

        // Optional: Small delay to prevent rate issues
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.error(`Failed to send to ${contact.phone_number}:`, err.response?.data || err.message);
        db.prepare('UPDATE campaign_contacts SET status = "Failed" WHERE campaign_id = ? AND contact_id = ?')
          .run(campaignId, contact.id);
      }
    }

    // Mark as completed
    db.prepare("UPDATE campaigns SET status = 'Completed' WHERE id = ?").run(campaignId);
    console.log(`✅ Campaign ${campaignId} processing finished.`);
  })();
});

// 3. Contacts
app.get('/api/contacts', (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json(contacts);
});

app.post('/api/contacts', (req, res) => {
  const { name, phone_number, tags } = req.body;
  if (!phone_number) return res.status(400).json({ error: "Phone number required" });
  try {
    const stmt = db.prepare('INSERT INTO contacts (name, phone_number, tags) VALUES (?, ?, ?)');
    const info = stmt.run(name || 'Unknown', phone_number, tags || '');
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      const stmt = db.prepare('UPDATE contacts SET name = ?, tags = ? WHERE phone_number = ?');
      stmt.run(name || 'Unknown', tags || '', phone_number);
      res.json({ success: true, updated: true });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.post('/api/contacts/bulk', (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: "Array of contacts required" });

  const insert = db.prepare(`
    INSERT INTO contacts (name, phone_number, tags) VALUES (?, ?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET 
      name = excluded.name,
      tags = excluded.tags
  `);

  const insertMany = db.transaction((list) => {
    for (const c of list) {
      if (c.phone_number) {
        insert.run(c.name || 'Unknown', c.phone_number, c.tags || '');
      }
    }
  });

  try {
    insertMany(contacts);
    res.json({ success: true, count: contacts.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// 4. Shared Inbox
app.get('/api/inbox', (req, res) => {
  // Get latest message per contact for sidebar
  const inbox = db.prepare(`
    SELECT phone_number, content, direction, created_at, sender
    FROM messages 
    WHERE id IN (SELECT MAX(id) FROM messages GROUP BY phone_number)
    ORDER BY created_at DESC
  `).all();
  res.json(inbox);
});

app.get('/api/messages/:phone_number', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE phone_number = ? ORDER BY created_at ASC').all(req.params.phone_number);
  res.json(messages);
});

app.post('/api/messages/reply', async (req, res) => {
  const { to, message } = req.body;
  const config = await getWhatsAppConfig();
  
  // Log outbound agent message to DB
  db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)')
    .run(to, 'agent', 'outbound', message);

  // Attempt to send via Meta API
  if (config.phoneNumberId && config.accessToken) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
        headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
        data: { messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } },
      });
    } catch (e) {
      console.error("Meta API Failed (but saved to local DB):", e.response?.data || e.message);
    }
  } else {
    console.log(`[SIMULATED] Outbound to ${to}: ${message}`);
  }

  res.json({ success: true });
});

app.post('/api/send-message', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing to or message" });
  
  const config = await getWhatsAppConfig();
  
  // Log outbound to DB
  db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)')
    .run(to, 'agent', 'outbound', message);

  if (config.phoneNumberId && config.accessToken) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
        headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
        data: { messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } },
      });
      res.json({ success: true });
    } catch (e) {
      console.error("Meta API Failed:", e.response?.data || e.message);
      res.status(500).json({ error: "Meta API Failed", details: e.response?.data || e.message });
    }
  } else {
    console.log(`[SIMULATED] Outbound to ${to}: ${message}`);
    res.json({ success: true, simulated: true });
  }
});


// 5. Bot Config & Options
app.get('/api/bot/options/:platform', (req, res) => {
  console.log(`GET Bot Options for ${req.params.platform}`);
  const config = db.prepare('SELECT value FROM bot_configs WHERE platform = ? AND key = ?').get(req.params.platform, 'botOptions');
  res.json(config ? JSON.parse(config.value) : []);
});

app.post('/api/bot/options', (req, res) => {
  const { platform, options } = req.body;
  const stmt = db.prepare(`
    INSERT INTO bot_configs (platform, key, value) VALUES (?, ?, ?)
    ON CONFLICT(platform, key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(platform, 'botOptions', JSON.stringify(options));
  res.json({ success: true });
});

app.get('/api/bot/config/:platform', (req, res) => {
  const configs = db.prepare('SELECT key, value FROM bot_configs WHERE platform = ?').all(req.params.platform);
  const result = {};
  configs.forEach(c => result[c.key] = c.value === 'true');
  res.json(result);
});

app.post('/api/bot/config', (req, res) => {
  const { platform, key, value } = req.body;
  const stmt = db.prepare(`
    INSERT INTO bot_configs (platform, key, value) VALUES (?, ?, ?)
    ON CONFLICT(platform, key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(platform, key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
  res.json({ success: true });
});

// 6. AI Helper (Real Gemini Integration)
app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = req.body;
  const response = await askAI(prompt, "You are a creative marketing expert. Help the user write WhatsApp templates, Instagram captions, or campaign strategies. Keep it punchy and professional.");
  res.json({ response });
});

app.post('/api/ai/suggest-reply', async (req, res) => {
  const { phone_number } = req.body;
  
  // Get last 10 messages for context
  const history = db.prepare('SELECT sender, content FROM messages WHERE phone_number = ? ORDER BY created_at DESC LIMIT 10').all(phone_number);
  const context = history.reverse().map(m => `${m.sender === 'user' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n');
  
  const prompt = `Based on the following conversation history, suggest a professional and helpful reply to the customer's last message:\n\n${context}\n\nSuggested Reply:`;
  const response = await askAI(prompt, "You are a customer support agent for InfoKart. Keep replies helpful, concise, and friendly.");
  
  res.json({ response });
});

app.post('/api/ai/plan-campaign', async (req, res) => {
  const { goal } = req.body;
  const prompt = `Create a detailed WhatsApp marketing campaign plan for the following goal: "${goal}". 
  Provide a Campaign Name, a Message Template, and a target audience description.
  Format your response as a JSON object with keys: "name", "template", "audience". 
  Only return the JSON object.`;
  
  let response = await askAI(prompt, "You are a marketing strategist. Return ONLY a valid JSON object.");
  
  // Clean up JSON if AI adds markdown blocks
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) response = jsonMatch[0];
    const plan = JSON.parse(response);
    res.json(plan);
  } catch (e) {
    res.status(500).json({ error: "Failed to parse AI plan", raw: response });
  }
});

// 7. Message Templates
app.get('/api/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
  res.json(templates);
});

app.post('/api/templates', (req, res) => {
  const { name, content, category } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and Content are required' });
  }
  const stmt = db.prepare('INSERT INTO templates (name, content, category) VALUES (?, ?, ?)');
  const info = stmt.run(name, content, category || 'Marketing');
  res.json({ id: info.lastInsertRowid, success: true });
});

app.delete('/api/templates/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// --- WEBHOOK ENDPOINTS ---

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const phoneNumber = body.entry[0].changes[0].value.messages[0].from;
      const msgBody = body.entry[0].changes[0].value.messages[0].text?.body;
      
      console.log(`[Webhook] Incoming from ${phoneNumber}: ${msgBody}`);

      // 1. Log to Database
      db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)')
        .run(phoneNumber, 'user', 'inbound', msgBody);

      // Ensure contact exists
      db.prepare('INSERT OR IGNORE INTO contacts (phone_number, name) VALUES (?, ?)')
        .run(phoneNumber, 'Unknown User');

      // 2. Chatbot Auto-Reply Logic
      const autoReplyEnabled = db.prepare("SELECT value FROM bot_configs WHERE platform='whatsapp' AND key='autoReplyEnabled'").get()?.value;
      
      if (autoReplyEnabled === 'true') {
        const config = await getWhatsAppConfig();
        const replyMsg = `Hi! Thanks for your message ("${msgBody}"). I am the automated assistant. We will be right with you.`;
        
        db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)')
          .run(phoneNumber, 'bot', 'outbound', replyMsg);

        if (config.phoneNumberId && config.accessToken) {
           await axios({
             method: 'POST',
             url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
             headers: { 'Authorization': `Bearer ${config.accessToken}` },
             data: { messaging_product: 'whatsapp', to: phoneNumber, type: 'text', text: { body: replyMsg } },
           }).catch(e => console.error(e));
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// All other routes should serve the frontend index.html
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
