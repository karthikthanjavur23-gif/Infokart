const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const JWT_SECRET = process.env.JWT_SECRET || 'infokart_secret_key_123';
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

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

// Helper to get Active WhatsApp Config (Authenticated)
async function getWhatsAppConfig(orgId) {
  let config;
  if (orgId) {
    config = db.prepare('SELECT * FROM whatsapp_settings WHERE org_id = ? AND is_active = 1').get(orgId);
  } else {
    config = db.prepare('SELECT * FROM whatsapp_settings WHERE is_active = 1').get();
  }

  if (config && config.access_token && config.phone_number_id) {
    return {
      id: config.id,
      nickname: config.nickname,
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      wabaId: config.waba_id
    };
  }
  // Fallback to first available if none active
  let first;
  if (orgId) {
    first = db.prepare('SELECT * FROM whatsapp_settings WHERE org_id = ?').get(orgId);
  } else {
    first = db.prepare('SELECT * FROM whatsapp_settings LIMIT 1').get();
  }
  if (first) return { id: first.id, accessToken: first.access_token, phoneNumberId: first.phone_number_id, wabaId: first.waba_id };
  return null;
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

// Helper to Log System Actions
function logAction(userId, orgId, action, details) {
  try {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, org_id, action, details) VALUES (?, ?, ?, ?)');
    stmt.run(userId, orgId, action, JSON.stringify(details));
  } catch (e) { console.error('Audit Log Error:', e); }
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

// 1. Auth & Multi-Tenancy Seed
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, org_id: user.org_id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  
  logAction(user.id, user.org_id, 'LOGIN', { email: user.email });
  
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});
(function seedAuth() {
  try {
    // 1. Ensure at least one organization exists
    let org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
    let orgId;
    if (!org) {
      const result = db.prepare('INSERT INTO organizations (name) VALUES (?)').run('Infokart Demo');
      orgId = result.lastInsertRowid;
    } else {
      orgId = org.id;
    }

    // 2. Ensure admin user exists and has the correct password
    const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@infokart.in');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    if (adminUser) {
      db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, 'admin@infokart.in');
      console.log('Force reset existing admin password to admin123.');
    } else {
      db.prepare('INSERT INTO users (org_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
        .run(orgId, 'Karthik', 'admin@infokart.in', hashedPassword, 'admin');
      console.log('Created admin@infokart.in user with password admin123.');
    }
  } catch (e) { console.error('Seed Error:', e.message); }
})();

// 2. WhatsApp Accounts Management
app.get('/api/whatsapp/accounts', authenticateToken, (req, res) => {
  const accounts = db.prepare('SELECT id, nickname, display_phone_number, verified_name, is_active FROM whatsapp_settings WHERE org_id = ?').all(req.user.org_id);
  res.json(accounts);
});

app.post('/api/whatsapp/switch-account', authenticateToken, (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE whatsapp_settings SET is_active = 0 WHERE org_id = ?').run(req.user.org_id);
  db.prepare('UPDATE whatsapp_settings SET is_active = 1 WHERE id = ? AND org_id = ?').run(id, req.user.org_id);
  
  logAction(req.user.id, req.user.org_id, 'SWITCH_ACCOUNT', { accountId: id });
  
  res.json({ success: true });
});

app.get('/api/whatsapp/status', authenticateToken, async (req, res) => {
  const dbConfig = await getWhatsAppConfig(req.user.org_id);
  const isConnected = !!(dbConfig?.accessToken);
  res.json({ connected: isConnected, details: dbConfig });
});

const fs = require('fs');

app.get('/api/whatsapp/debug-log', (req, res) => {
  try {
    if (fs.existsSync('signup_debug.log')) {
      const content = fs.readFileSync('signup_debug.log', 'utf8');
      res.type('text/plain').send(content);
    } else {
      res.send("No debug log found yet.");
    }
  } catch (e) {
    res.status(500).send("Error reading log: " + e.message);
  }
});

app.post('/api/whatsapp/embedded-signup', authenticateToken, async (req, res) => {
  const { code, redirectUri } = req.body;
  const orgId = req.user.org_id;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!code || !appId || !appSecret) {
    console.error('[ERROR] Missing critical credentials:', { 
      hasCode: !!code, 
      hasAppId: !!appId, 
      hasAppSecret: !!appSecret 
    });
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
    console.log('[DEBUG] Token exchange successful');
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
      // Granular scopes exist but without target_ids — fetch WABAs by querying associated businesses
      fs.appendFileSync('signup_debug.log', `\n[INFO] No target_ids in granular_scopes, fetching via businesses fallback\n`);
      try {
        const businessesRes = await axios.get(`https://graph.facebook.com/v22.0/me/businesses`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const businesses = businessesRes.data?.data || [];
        for (const business of businesses) {
          // Try owned_whatsapp_business_accounts
          const wabaRes = await axios.get(`https://graph.facebook.com/v22.0/${business.id}/owned_whatsapp_business_accounts`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const accounts = wabaRes.data?.data || [];
          if (accounts.length > 0) {
            wabaId = accounts[0].id;
            break;
          }
          
          // Also try client_whatsapp_business_accounts
          const clientWabaRes = await axios.get(`https://graph.facebook.com/v22.0/${business.id}/client_whatsapp_business_accounts`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const clientAccounts = clientWabaRes.data?.data || [];
          if (clientAccounts.length > 0) {
            wabaId = clientAccounts[0].id;
            break;
          }
        }
      } catch (fallbackError) {
        console.error("Fallback WABA retrieval failed:", fallbackError.response?.data || fallbackError.message);
        fs.appendFileSync('signup_debug.log', `\n[ERROR] Fallback WABA failed: ${JSON.stringify(fallbackError.response?.data || fallbackError.message)}\n`);
      }
    }

    if (!wabaId) {
      return res.status(400).json({
        error: "Failed to complete signup",
        details: "No WhatsApp Business Account found. Please complete the full signup flow.",
        debugTokenData: debugRes.data
      });
    }

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

    // 3.5 Register the Phone Number on Meta Cloud API client (required for sending messages)
    console.log(`[INFO] Registering phone number ID ${phoneNumberId} on Meta Cloud API client`);
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${phoneNumberId}/register`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          pin: '123456'
        }
      });
      console.log(`[SUCCESS] Phone number ID ${phoneNumberId} registered successfully`);
      fs.appendFileSync('signup_debug.log', `\n[SUCCESS] Phone number ID ${phoneNumberId} registered successfully\n`);
    } catch (regError) {
      console.error("Failed to register phone number with Meta:", regError.response?.data || regError.message);
      fs.appendFileSync('signup_debug.log', `\n[WARNING] Registration failed: ${JSON.stringify(regError.response?.data || regError.message)}\n`);
    }

    // 4. Save to Database (Multi-tenant)
    const stmt = db.prepare(`
      INSERT INTO whatsapp_settings (org_id, waba_id, phone_number_id, access_token, display_phone_number, verified_name, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 'Connected', 1)
    `);

    stmt.run(orgId, wabaId, phoneNumberId, accessToken, displayPhoneNumber, verifiedName);

    logAction(req.user.id, orgId, 'CONNECT_WHATSAPP', { method: 'EMBEDDED', phone: displayPhoneNumber });

    res.json({ success: true, displayPhoneNumber });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("Embedded Signup Error:", errorDetails);
    fs.appendFileSync('signup_debug.log', `[${new Date().toISOString()}] Error: ${JSON.stringify(errorDetails)}\n`);
    res.status(500).json({ error: "Failed to complete signup", details: errorDetails });
  }
});

app.post('/api/whatsapp/register-phone', authenticateToken, async (req, res) => {
  const { countryCode, phoneNumber, verifiedName } = req.body;
  const wabaId = process.env.WABA_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!wabaId || !accessToken) {
    return res.status(400).json({ error: 'Server Meta configurations are missing. Please add WABA_ID and META_ACCESS_TOKEN in env.' });
  }

  if (!countryCode || !phoneNumber || !verifiedName) {
    return res.status(400).json({ error: 'Missing required fields: countryCode, phoneNumber, verifiedName' });
  }

  try {
    // 1. Add phone number to WABA
    console.log(`[INFO] Adding phone number +${countryCode}${phoneNumber} to WABA ${wabaId}`);
    const addRes = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        cc: countryCode.replace('+', ''),
        phone_number: phoneNumber,
        verified_name: verifiedName
      }
    });

    const phoneNumberId = addRes.data.id;
    console.log(`[INFO] Phone number added successfully. ID: ${phoneNumberId}. Requesting OTP...`);

    // 2. Request Verification OTP Code
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v22.0/${phoneNumberId}/register`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        pin: '123456',
        code_method: 'SMS',
        language: 'en'
      }
    });

    res.json({ success: true, phoneNumberId });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[ERROR] Register phone failed:', errData);
    res.status(500).json({ error: 'Failed to add/register phone number', details: errData });
  }
});

app.post('/api/whatsapp/verify-phone', authenticateToken, async (req, res) => {
  const { phoneNumberId, code, verifiedName, countryCode, phoneNumber } = req.body;
  const wabaId = process.env.WABA_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!phoneNumberId || !code) {
    return res.status(400).json({ error: 'Missing required fields: phoneNumberId, code' });
  }

  try {
    // 1. Verify OTP code
    console.log(`[INFO] Verifying OTP code for phone ID ${phoneNumberId}`);
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v22.0/${phoneNumberId}/verify`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        code: code
      }
    });

    console.log('[INFO] OTP verification successful. Saving to database...');

    // 2. Save to DB
    const stmt = db.prepare(`
      INSERT INTO whatsapp_settings (org_id, waba_id, phone_number_id, access_token, display_phone_number, verified_name, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 'Connected', 1)
    `);
    stmt.run(
      req.user.org_id,
      wabaId,
      phoneNumberId,
      accessToken,
      `+${countryCode}${phoneNumber}`,
      verifiedName
    );

    logAction(req.user.id, req.user.org_id, 'CONNECT_WHATSAPP', { method: 'DIRECT_OTP', phone: `+${countryCode}${phoneNumber}` });

    res.json({ success: true });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[ERROR] Verify phone failed:', errData);
    res.status(500).json({ error: 'Failed to verify phone number', details: errData });
  }
});

app.post('/api/whatsapp/manual-config', authenticateToken, async (req, res) => {
  const { accessToken, phoneNumberId, wabaId, verifiedName, nickname } = req.body;
  
  if (!accessToken || !phoneNumberId || !wabaId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Try to register the phone number ID with Meta Cloud API client
  try {
    console.log(`[INFO] Registering manual phone number ID ${phoneNumberId} on Meta Cloud API client`);
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v22.0/${phoneNumberId}/register`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        pin: '123456'
      }
    });
    console.log(`[SUCCESS] Phone number ID ${phoneNumberId} registered successfully`);
    fs.appendFileSync('signup_debug.log', `\n[SUCCESS] Manual phone number ID ${phoneNumberId} registered successfully\n`);
  } catch (regError) {
    const errorDetails = regError.response?.data || regError.message;
    console.warn("Failed to register manual phone number with Meta:", errorDetails);
    fs.appendFileSync('signup_debug.log', `\n[WARNING] Manual registration failed/skipped: ${JSON.stringify(errorDetails)}\n`);
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO whatsapp_settings (org_id, waba_id, phone_number_id, access_token, display_phone_number, verified_name, nickname, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Connected', 1)
    `);

    stmt.run(
      req.user.org_id, 
      wabaId, 
      phoneNumberId, 
      accessToken, 
      'Manual Config', 
      verifiedName || 'Manual Account',
      nickname || 'Main Line'
    );
    
    logAction(req.user.id, req.user.org_id, 'CONNECT_WHATSAPP', { method: 'MANUAL' });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Manual Config Error:", error);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

app.post('/api/whatsapp/disconnect', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM whatsapp_settings WHERE id = ? AND org_id = ?').run(req.body.id, req.user.org_id);
  res.json({ success: true });
});

// 1. Dashboard Stats
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const orgId = req.user.org_id;
  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE org_id = ?').get(orgId).count;
  const activeCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = 'Active' AND org_id = ?").get(orgId).count;
  const botResponses = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'bot' AND org_id = ?").get(orgId).count;
  const leadsClosed = Math.floor(totalContacts * 0.15);

  res.json({ totalContacts, activeCampaigns, botResponses, leadsClosed });
});

// 2. Campaigns
app.get('/api/campaigns', authenticateToken, (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE org_id = ? ORDER BY id DESC').all(req.user.org_id);
  res.json(campaigns);
});

app.get('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND org_id = ?').get(req.params.id, req.user.org_id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

app.get('/api/campaigns/:id/contacts', authenticateToken, (req, res) => {
  const contacts = db.prepare(`
    SELECT c.*, cc.status as campaign_status 
    FROM contacts c
    JOIN campaign_contacts cc ON c.id = cc.contact_id
    WHERE cc.campaign_id = ?
  `).all(req.params.id);
  res.json(contacts);
});

app.post('/api/campaigns', authenticateToken, (req, res) => {
  const { name, channel, target, template, contactIds, settings, scheduledAt } = req.body;
  
  // If we have selected contacts, the target count is the length of that selection
  const finalTarget = (contactIds && Array.isArray(contactIds)) ? contactIds.length : (target || 0);
  
  const stmt = db.prepare('INSERT INTO campaigns (name, channel, status, target, template, settings, scheduled_at, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    name, 
    channel, 
    'Draft', 
    finalTarget, 
    template || '', 
    settings ? JSON.stringify(settings) : null,
    scheduledAt || null,
    req.user.org_id
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

app.post('/api/campaigns/:id/send', authenticateToken, async (req, res) => {
  const campaignId = req.params.id;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND org_id = ?').get(campaignId, req.user.org_id);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (campaign.status === 'Completed') return res.status(400).json({ error: 'Campaign already completed' });

  // Update status to Active
  db.prepare("UPDATE campaigns SET status = 'Active' WHERE id = ? AND org_id = ?").run(campaignId, req.user.org_id);

  // Fetch pending contacts for this campaign
  const contacts = db.prepare(`
    SELECT c.* 
    FROM contacts c
    JOIN campaign_contacts cc ON c.id = cc.contact_id
    WHERE cc.campaign_id = ? AND cc.status = 'Pending'
  `).all(campaignId);

  const config = await getWhatsAppConfig(req.user.org_id);

  if (!config || !config.phoneNumberId || !config.accessToken) {
    return res.status(400).json({ error: 'WhatsApp is not connected. Connect via Marketing Workspace first.' });
  }

  // Response immediately to let UI know it started
  res.json({ success: true, message: `Started sending to ${contacts.length} contacts.` });

  logAction(req.user.id, req.user.org_id, 'SEND_CAMPAIGN', { campaignId, targetCount: contacts.length });

  // Process in background
  (async () => {
    console.log(`🚀 Starting background processing for Campaign ${campaignId}`);
    for (const contact of contacts) {
      try {
        // Determine whether to send as an official Meta Template or free-form text
        let postData;
        if (campaign.template) {
          // Convert template name to Meta-compatible slug (e.g., "Summer Sale Blast" -> "summer_sale_blast")
          const templateNameSlug = campaign.template.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
          
          postData = {
            messaging_product: 'whatsapp',
            to: contact.phone_number,
            type: 'template',
            template: {
              name: templateNameSlug,
              language: {
                code: 'en' // Default language code on Meta
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    {
                      type: 'text',
                      text: contact.name || 'Friend'
                    }
                  ]
                }
              ]
            }
          };
        } else {
          const personalizedMsg = 'Hi there!';
          postData = {
            messaging_product: 'whatsapp',
            to: contact.phone_number,
            type: 'text',
            text: { body: personalizedMsg }
          };
        }

        await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
          headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
          data: postData,
        });

        // Update successful status
        db.prepare('UPDATE campaign_contacts SET status = \'Sent\' WHERE campaign_id = ? AND contact_id = ?')
          .run(campaignId, contact.id);
        
        db.prepare('UPDATE campaigns SET sent = sent + 1 WHERE id = ?').run(campaignId);

        // Optional: Small delay to prevent rate issues
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`Failed to send to ${contact.phone_number}:`, errorMsg);
        fs.appendFileSync('signup_debug.log', `\n[${new Date().toISOString()}] Meta API Failed in campaign send: ${errorMsg}\n`);
        db.prepare('UPDATE campaign_contacts SET status = \'Failed\' WHERE campaign_id = ? AND contact_id = ?')
          .run(campaignId, contact.id);
      }
    }

    // Mark as completed
    db.prepare("UPDATE campaigns SET status = 'Completed' WHERE id = ?").run(campaignId);
    console.log(`✅ Campaign ${campaignId} processing finished.`);
  })();
});

// 3. Contacts
app.get('/api/contacts', authenticateToken, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts WHERE org_id = ? ORDER BY created_at DESC').all(req.user.org_id);
  res.json(contacts);
});

app.get('/api/contacts/:phone_number', authenticateToken, (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE phone_number = ? AND org_id = ?').get(req.params.phone_number, req.user.org_id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

app.patch('/api/contacts/:phone_number', authenticateToken, (req, res) => {
  const { name, email, tags, notes } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE contacts 
      SET name = COALESCE(?, name), 
          email = COALESCE(?, email), 
          tags = COALESCE(?, tags), 
          notes = COALESCE(?, notes) 
      WHERE phone_number = ? AND org_id = ?
    `);
    stmt.run(name, email, tags, notes, req.params.phone_number, req.user.org_id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/contacts', authenticateToken, (req, res) => {
  const { name, phone_number, tags } = req.body;
  if (!phone_number) return res.status(400).json({ error: "Phone number required" });
  try {
    const stmt = db.prepare('INSERT INTO contacts (name, phone_number, tags, org_id) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name || 'Unknown', phone_number, tags || '', req.user.org_id);
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      const stmt = db.prepare('UPDATE contacts SET name = ?, tags = ? WHERE phone_number = ? AND org_id = ?');
      stmt.run(name || 'Unknown', tags || '', phone_number, req.user.org_id);
      res.json({ success: true, updated: true });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.post('/api/contacts/bulk', authenticateToken, (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: "Array of contacts required" });
  const insert = db.prepare(`
    INSERT INTO contacts (name, phone_number, tags, org_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET 
      name = excluded.name,
      tags = excluded.tags
  `);
  const insertMany = db.transaction((list) => {
    for (const c of list) {
      if (c.phone_number) {
        insert.run(c.name || 'Unknown', c.phone_number, c.tags || '', req.user.org_id);
      }
    }
  });
  insertMany(contacts);
  res.json({ success: true, count: contacts.length });
});


// 4. Shared Inbox
app.get('/api/inbox', authenticateToken, (req, res) => {
  const inbox = db.prepare(`
    SELECT phone_number, content, direction, created_at, sender
    FROM messages 
    WHERE org_id = ? AND id IN (SELECT MAX(id) FROM messages GROUP BY phone_number)
    ORDER BY created_at DESC
  `).all(req.user.org_id);
  res.json(inbox);
});

app.get('/api/messages/:phone_number', authenticateToken, (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE phone_number = ? AND org_id = ? ORDER BY created_at ASC').all(req.params.phone_number, req.user.org_id);
  res.json(messages);
});

app.post('/api/messages/reply', async (req, res) => {
  const { to, message } = req.body;
  const config = await getWhatsAppConfig();
  
  // Log outbound agent message to DB
  db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)')
    .run(to, 'agent', 'outbound', message);

  // Attempt to send via Meta API
  if (config && config.phoneNumberId && config.accessToken) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
        headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
        data: { messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } },
      });
    } catch (e) {
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      console.error("Meta API Failed (but saved to local DB):", errorMsg);
      fs.appendFileSync('signup_debug.log', `\n[${new Date().toISOString()}] Meta API Failed in /api/messages/reply: ${errorMsg}\n`);
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

  if (config && config.phoneNumberId && config.accessToken) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${config.phoneNumberId}/messages`,
        headers: { 'Authorization': `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
        data: { messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } },
      });
      res.json({ success: true });
    } catch (e) {
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      console.error("Meta API Failed:", errorMsg);
      fs.appendFileSync('signup_debug.log', `\n[${new Date().toISOString()}] Meta API Failed in /api/send-message: ${errorMsg}\n`);
      res.status(500).json({ error: "Meta API Failed", details: errorMsg });
    }
  } else {
    console.log(`[SIMULATED] Outbound to ${to}: ${message}`);
    res.json({ success: true, simulated: true });
  }
});


// 5. Bot Config & Options
app.get('/api/bot/options/:platform', authenticateToken, (req, res) => {
  const config = db.prepare('SELECT value FROM bot_configs WHERE platform = ? AND key = ? AND org_id = ?').get(req.params.platform, 'botOptions', req.user.org_id);
  res.json(config ? JSON.parse(config.value) : []);
});

app.post('/api/bot/options', authenticateToken, (req, res) => {
  const { platform, options } = req.body;
  const stmt = db.prepare(`
    INSERT INTO bot_configs (platform, key, value, org_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(platform, key, org_id) DO UPDATE SET value = excluded.value
  `);
  stmt.run(platform, 'botOptions', JSON.stringify(options), req.user.org_id);
  res.json({ success: true });
});

app.get('/api/bot/config/:platform', authenticateToken, (req, res) => {
  const configs = db.prepare('SELECT key, value FROM bot_configs WHERE platform = ? AND org_id = ?').all(req.params.platform, req.user.org_id);
  const result = {};
  configs.forEach(c => result[c.key] = c.value === 'true');
  res.json(result);
});

app.post('/api/bot/config', authenticateToken, (req, res) => {
  const { platform, key, value } = req.body;
  const stmt = db.prepare(`
    INSERT INTO bot_configs (platform, key, value, org_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(platform, key, org_id) DO UPDATE SET value = excluded.value
  `);
  stmt.run(platform, key, typeof value === 'object' ? JSON.stringify(value) : value.toString(), req.user.org_id);
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
app.get('/api/templates', authenticateToken, (req, res) => {
  const { status, category, language, search } = req.query;
  let query = 'SELECT * FROM whatsapp_templates WHERE org_id = ?';
  const params = [req.user.org_id];

  if (status && status !== 'ALL') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category && category !== 'ALL') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (language && language !== 'ALL') {
    query += ' AND language = ?';
    params.push(language);
  }
  if (search) {
    query += ' AND template_name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const wppTemplates = db.prepare(query).all(...params);
    // Add backward compatibility fields for campaign selection
    const formatted = wppTemplates.map(t => ({
      ...t,
      name: t.template_name,
      content: t.body_content
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Fetch templates error:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.get('/api/templates/:id', authenticateToken, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM whatsapp_templates WHERE id = ? AND org_id = ?').get(req.params.id, req.user.org_id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    
    // Add backward compatibility fields
    res.json({
      ...template,
      name: template.template_name,
      content: template.body_content
    });
  } catch (error) {
    console.error("Fetch template details error:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

app.post('/api/templates/create', authenticateToken, async (req, res) => {
  const { template_name, category, language, header_type, header_content, body_content, footer_content, buttons_json } = req.body;

  if (!template_name || !body_content || !category || !language) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate name slug
  if (!/^[a-z0-9_]+$/.test(template_name)) {
    return res.status(400).json({ error: "Template name must be lowercase, alphanumeric and underscores only (e.g. summer_offer_2026)." });
  }

  try {
    const wConfig = await getWhatsAppConfig(req.user.org_id);
    const wabaId = wConfig?.wabaId || null;

    const stmt = db.prepare(`
      INSERT INTO whatsapp_templates (org_id, waba_id, template_name, category, language, header_type, header_content, body_content, footer_content, buttons_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
      ON CONFLICT(org_id, template_name) DO UPDATE SET
        category = excluded.category,
        language = excluded.language,
        header_type = excluded.header_type,
        header_content = excluded.header_content,
        body_content = excluded.body_content,
        footer_content = excluded.footer_content,
        buttons_json = excluded.buttons_json,
        status = 'DRAFT',
        updated_at = CURRENT_TIMESTAMP
    `);

    const info = stmt.run(
      req.user.org_id,
      wabaId,
      template_name,
      category.toUpperCase(),
      language,
      header_type || 'NONE',
      header_content || null,
      body_content,
      footer_content || null,
      buttons_json ? JSON.stringify(buttons_json) : null
    );

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ error: "Failed to save template draft" });
  }
});

app.put('/api/templates/:id', authenticateToken, async (req, res) => {
  const { template_name, category, language, header_type, header_content, body_content, footer_content, buttons_json } = req.body;

  try {
    const template = db.prepare('SELECT * FROM whatsapp_templates WHERE id = ? AND org_id = ?').get(req.params.id, req.user.org_id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    // Only allow editing if DRAFT or REJECTED
    if (template.status !== 'DRAFT' && template.status !== 'REJECTED') {
      return res.status(400).json({ error: "Only draft or rejected templates can be modified locally." });
    }

    const stmt = db.prepare(`
      UPDATE whatsapp_templates SET
        template_name = ?,
        category = ?,
        language = ?,
        header_type = ?,
        header_content = ?,
        body_content = ?,
        footer_content = ?,
        buttons_json = ?,
        status = 'DRAFT',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND org_id = ?
    `);

    stmt.run(
      template_name || template.template_name,
      category ? category.toUpperCase() : template.category,
      language || template.language,
      header_type || template.header_type,
      header_content !== undefined ? header_content : template.header_content,
      body_content || template.body_content,
      footer_content !== undefined ? footer_content : template.footer_content,
      buttons_json ? JSON.stringify(buttons_json) : template.buttons_json,
      req.params.id,
      req.user.org_id
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

app.delete('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM whatsapp_templates WHERE id = ? AND org_id = ?').get(req.params.id, req.user.org_id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const config = await getWhatsAppConfig(req.user.org_id);

    // Call Meta to delete if it was submitted/active
    if (config && config.accessToken && config.wabaId && template.meta_template_id) {
      try {
        await axios({
          method: 'DELETE',
          url: `https://graph.facebook.com/v22.0/${config.wabaId}/message_templates`,
          headers: { 'Authorization': `Bearer ${config.accessToken}` },
          params: { name: template.template_name }
        });
      } catch (metaError) {
        console.warn("Failed to delete template from Meta, will delete locally:", metaError.response?.data || metaError.message);
      }
    }

    db.prepare('DELETE FROM whatsapp_templates WHERE id = ? AND org_id = ?').run(req.params.id, req.user.org_id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

app.post('/api/templates/submit', authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const template = db.prepare('SELECT * FROM whatsapp_templates WHERE id = ? AND org_id = ?').get(id, req.user.org_id);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const config = await getWhatsAppConfig(req.user.org_id);

    // Format components for Meta API
    const components = [];

    // Header
    if (template.header_type && template.header_type !== 'NONE') {
      if (template.header_type === 'TEXT') {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: template.header_content
        });
      } else {
        // IMAGE, VIDEO, DOCUMENT
        components.push({
          type: 'HEADER',
          format: template.header_type,
          example: {
            header_handle: [template.header_content || "https://images.unsplash.com/photo-1531403009284-440f080d1e12"]
          }
        });
      }
    }

    // Body
    components.push({
      type: 'BODY',
      text: template.body_content
    });

    // Footer
    if (template.footer_content) {
      components.push({
        type: 'FOOTER',
        text: template.footer_content
      });
    }

    // Buttons
    if (template.buttons_json) {
      const buttons = JSON.parse(template.buttons_json);
      if (buttons && buttons.length > 0) {
        const metaButtons = buttons.map(b => {
          if (b.type === 'QUICK_REPLY') {
            return {
              type: 'QUICK_REPLY',
              text: b.text
            };
          } else if (b.type === 'PHONE_NUMBER') {
            return {
              type: 'PHONE_NUMBER',
              text: b.text,
              phone_number: b.phone_number
            };
          } else if (b.type === 'URL') {
            return {
              type: 'URL',
              text: b.text,
              url: b.url
            };
          }
        });
        components.push({
          type: 'BUTTONS',
          buttons: metaButtons
        });
      }
    }

    let metaTemplateId = null;
    let newStatus = 'PENDING';

    if (config && config.accessToken && config.wabaId) {
      try {
        const response = await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v22.0/${config.wabaId}/message_templates`,
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            name: template.template_name,
            category: template.category,
            language: template.language,
            components
          }
        });
        metaTemplateId = response.data.id;
        newStatus = 'PENDING';
      } catch (metaError) {
        const errorDetails = metaError.response?.data || metaError.message;
        console.error("Meta Template Submit Failed:", errorDetails);
        fs.appendFileSync('signup_debug.log', `\n[${new Date().toISOString()}] Meta Template Submit Failed: ${JSON.stringify(errorDetails)}\n`);
        return res.status(400).json({ error: "Meta API Rejected Template", details: errorDetails });
      }
    } else {
      // Simulation mode
      console.log("[SIMULATION] Submitting template to Meta WABA:", template.template_name);
      metaTemplateId = "sim_" + Math.random().toString(36).substr(2, 9);
      newStatus = 'APPROVED'; // Approve immediately in simulation mode for local sandbox testing
    }

    db.prepare('UPDATE whatsapp_templates SET status = ?, meta_template_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?')
      .run(newStatus, metaTemplateId, id, req.user.org_id);

    res.json({ success: true, status: newStatus, metaTemplateId });

  } catch (error) {
    console.error("Submit template error:", error);
    res.status(500).json({ error: "Failed to submit template" });
  }
});

app.post('/api/templates/sync', authenticateToken, async (req, res) => {
  try {
    const config = await getWhatsAppConfig(req.user.org_id);
    if (!config || !config.accessToken || !config.wabaId) {
      // In simulation mode, randomly resolve PENDING templates to APPROVED/REJECTED for demo purposes
      db.prepare(`
        UPDATE whatsapp_templates 
        SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP 
        WHERE status = 'PENDING' AND org_id = ?
      `).run(req.user.org_id);
      return res.json({ success: true, message: "Sync simulated (all pending approved)" });
    }

    const response = await axios({
      method: 'GET',
      url: `https://graph.facebook.com/v22.0/${config.wabaId}/message_templates`,
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
      params: { limit: 100 }
    });

    const metaTemplates = response.data.data || [];
    const updateStmt = db.prepare(`
      UPDATE whatsapp_templates 
      SET status = ?, meta_template_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE template_name = ? AND org_id = ?
    `);

    db.transaction(() => {
      for (const mt of metaTemplates) {
        updateStmt.run(mt.status, mt.id, mt.name, req.user.org_id);
      }
    })();

    res.json({ success: true, count: metaTemplates.length });
  } catch (error) {
    console.error("Sync templates error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to sync with Meta", details: error.response?.data || error.message });
  }
});

app.post('/api/templates/generate-ai', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const systemInstruction = `You are a professional WhatsApp Marketing AI content strategist. 
  Generate a WhatsApp template in a valid JSON format based on the user's campaign goal.
  
  Strict JSON keys in output:
  - "template_name": lowercase letters, underscores only, no spaces (e.g., "diwali_sale_2026")
  - "category": Must be one of: "MARKETING", "UTILITY", "AUTHENTICATION"
  - "header_type": "NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"
  - "header_content": (e.g. text for header like "Diwali Deals!" or null)
  - "body_content": rich text copy. Variables MUST be in format {{1}}, {{2}} (e.g., "Hi {{1}}, get {{2}}% off our festive collection!")
  - "footer_content": optional short text under 60 chars (e.g., "Reply STOP to opt out")
  - "buttons_json": Array of button objects. Supported button types:
    - Quick replies: { "type": "QUICK_REPLY", "text": "Shop Now" } (Max 3 quick replies)
    - Call: { "type": "PHONE_NUMBER", "text": "Call Us", "phone_number": "+15551234567" }
    - URL: { "type": "URL", "text": "Visit Site", "url": "https://example.com/{{1}}" }
    
  Return ONLY the raw JSON object. Do not include markdown code formatting like \`\`\`json.`;

  try {
    const aiResponse = await askAI(prompt, systemInstruction);
    let cleanedResponse = aiResponse;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    const templateData = JSON.parse(cleanedResponse);
    res.json(templateData);
  } catch (error) {
    console.error("Gemini AI template generation error:", error);
    res.status(500).json({ error: "AI Copilot failed to generate template", details: error.message });
  }
});

app.get('/api/messages/recent', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, c.name 
    FROM messages m 
    LEFT JOIN contacts c ON m.phone_number = c.phone_number AND m.org_id = c.org_id
    WHERE m.org_id = ?
    ORDER BY m.created_at DESC 
    LIMIT 10
  `).all(req.user.org_id);
  res.json(messages);
});

// 8. Team Management
app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE org_id = ?').all(req.user.org_id);
  res.json(users);
});

app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can manage team' });
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (org_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.org_id, name, email, hashedPassword, role || 'member');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Email already exists or invalid data' });
  }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can manage team' });
  if (req.user.id == req.params.id) return res.status(400).json({ error: 'Cannot remove yourself' });
  db.prepare('DELETE FROM users WHERE id = ? AND org_id = ?').run(req.params.id, req.user.org_id);
  res.json({ success: true });
});

app.get('/api/audit-logs', authenticateToken, (req, res) => {
  const logs = db.prepare(`
    SELECT a.*, u.name as user_name 
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.org_id = ?
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all(req.user.org_id);
  res.json(logs);
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

        if (config && config.phoneNumberId && config.accessToken) {
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

app.get('/api/debug-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, password, role FROM users').all();
    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      passwordMatchesAdmin123: bcrypt.compareSync('admin123', u.password)
    }));
    res.json({ success: true, users: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// All other routes should serve the frontend index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
