const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');
const admin = require('firebase-admin');

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const serviceKeyPath = path.resolve(__dirname, 'serviceAccountKey.json');

const isFirebaseConfigured = (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) || fs.existsSync(serviceKeyPath);

const dbPath = isFirebaseConfigured ? ':memory:' : (process.env.PERSISTENT_DB_PATH || path.resolve(__dirname, 'infokart.db'));

// Ensure parent directory exists (if not in-memory)
if (dbPath !== ':memory:') {
  const parentDir = path.dirname(dbPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
}

const rawDb = new Database(dbPath);
if (dbPath === ':memory:') {
  console.log("⚡ Database is running in In-Memory Mode synced directly to Firebase Realtime Database!");
}

// Initialize Firebase (if configured)
let rtdb = null;
const firebaseDatabaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://infowaves-waba-default-rtdb.firebaseio.com/';

if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey.replace(/\\n/g, '\n')
      }),
      databaseURL: firebaseDatabaseUrl
    });
    rtdb = admin.database();
    console.log(`🔥 Connected to Firebase Realtime Database at ${firebaseDatabaseUrl} via Env Variables!`);
  } catch (e) {
    console.error("Failed to initialize Firebase via env:", e.message);
  }
} else if (fs.existsSync(serviceKeyPath)) {
  try {
    const serviceAccount = require(serviceKeyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseDatabaseUrl
    });
    rtdb = admin.database();
    console.log(`🔥 Connected to Firebase Realtime Database at ${firebaseDatabaseUrl} via serviceAccountKey.json!`);
  } catch (e) {
    console.error("Failed to initialize Firebase via serviceAccountKey.json:", e.message);
  }
} else {
  console.log("⚠️ Firebase not configured. Running in local SQLite mode only.");
}

// Initialize database tables
const initDb = () => {
  // 0. Base tables: Organizations, Users, Audit Logs (essential for multi-tenancy)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member', -- 'admin', 'member'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 1. Contacts (CRM)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER DEFAULT 1,
      name TEXT,
      email TEXT,
      phone_number TEXT UNIQUE NOT NULL,
      tags TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Messages (Shared Team Inbox / Logs)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER DEFAULT 1,
      phone_number TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'user', 'bot', 'agent'
      direction TEXT NOT NULL, -- 'inbound', 'outbound'
      content TEXT NOT NULL,
      status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Campaigns (Broadcast engine)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      channel TEXT NOT NULL, -- 'WhatsApp', 'Email', etc.
      status TEXT DEFAULT 'Draft', -- 'Draft', 'Active', 'Completed'
      sent INTEGER DEFAULT 0,
      opened INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      target INTEGER DEFAULT 0,
      template TEXT,
      settings TEXT, -- JSON blob for advanced settings (throttle, schedule etc)
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3.1 Campaign Contacts (Join Table for specific targeting)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS campaign_contacts (
      campaign_id INTEGER,
      contact_id INTEGER,
      status TEXT DEFAULT 'Pending', -- 'Pending', 'Sent', 'Failed'
      PRIMARY KEY (campaign_id, contact_id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  // 4. Bot Configurations (Flows)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS bot_configs (
      platform TEXT NOT NULL, -- 'whatsapp' or 'instagram'
      key TEXT NOT NULL,
      value TEXT,
      org_id INTEGER DEFAULT 1,
      PRIMARY KEY (platform, key)
    )
  `);

  // 5. Message Templates
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Marketing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. WhatsApp Settings (Embedded Signup Data)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one primary setting for now
      waba_id TEXT,
      phone_number_id TEXT,
      access_token TEXT,
      display_phone_number TEXT,
      verified_name TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      org_id INTEGER DEFAULT 1,
      nickname TEXT,
      is_active INTEGER DEFAULT 0
    )
  `);

  // 6.5 WhatsApp Accounts (frictionless signup)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      org_id INTEGER DEFAULT 1,
      business_id TEXT,
      waba_id TEXT,
      phone_number_id TEXT,
      phone_number TEXT,
      display_name TEXT,
      access_token TEXT,
      quality_rating TEXT,
      messaging_limit TEXT,
      status TEXT DEFAULT 'Connected',
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. WhatsApp Rich Templates
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      waba_id TEXT,
      meta_template_id TEXT,
      template_name TEXT NOT NULL,
      category TEXT NOT NULL,
      language TEXT NOT NULL,
      header_type TEXT DEFAULT 'NONE',
      header_content TEXT,
      body_content TEXT NOT NULL,
      footer_content TEXT,
      buttons_json TEXT,
      status TEXT DEFAULT 'DRAFT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(org_id, template_name)
    )
  `);

  // 8. Inbox Conversations
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      channel TEXT NOT NULL, -- 'WhatsApp', 'Instagram', 'Website'
      status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived', 'spam'
      assigned_to INTEGER, -- references users.id
      priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
      sentiment TEXT DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
      sla_warning_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES contacts(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    )
  `);

  // 9. Conversations Internal Notes
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(agent_id) REFERENCES users(id)
    )
  `);

  // 10. AI Knowledge Base Data
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS inbox_knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      source_type TEXT NOT NULL, -- 'url', 'faq', 'text'
      title TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Active Agents Presence (Collision Detection)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS active_agents (
      org_id INTEGER NOT NULL,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      typing_status INTEGER DEFAULT 0, -- 0 = idle, 1 = typing
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (org_id, conversation_id, user_id)
    )
  `);

  // 12. Bot Profiles
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      bot_name TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'INACTIVE'
      ai_mode TEXT DEFAULT 'BALANCED', -- 'CONSERVATIVE', 'BALANCED', 'CREATIVE'
      ai_tone TEXT DEFAULT 'FRIENDLY', -- 'FRIENDLY', 'PROFESSIONAL', 'SALES', 'SUPPORT'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. Bot Flows
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS bot_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id INTEGER UNIQUE NOT NULL,
      flow_json TEXT NOT NULL,
      FOREIGN KEY(bot_id) REFERENCES bots(id) ON DELETE CASCADE
    )
  `);

  // 14. Bot Documents / FAQ Knowledge Base
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS bot_knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_id INTEGER NOT NULL,
      source_type TEXT NOT NULL, -- 'FAQ', 'PDF', 'URL', 'TEXT'
      document_url TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bot_id) REFERENCES bots(id) ON DELETE CASCADE
    )
  `);

  // Upgrades: Add new fields to existing messages table dynamically
  try {
    rawDb.exec("ALTER TABLE messages ADD COLUMN conversation_id INTEGER;");
    console.log("Added conversation_id column to messages table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'user';");
    console.log("Added sender_type column to messages table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE messages ADD COLUMN media_url TEXT;");
    console.log("Added media_url column to messages table.");
  } catch (e) { /* Already exists */ }

  // Upgrade conversations table dynamically to add bot_paused
  try {
    rawDb.exec("ALTER TABLE conversations ADD COLUMN bot_paused INTEGER DEFAULT 0;");
    console.log("Added bot_paused column to conversations table.");
  } catch (e) { /* Already exists */ }

  // Upgrade conversations table dynamically to add current_node_id
  try {
    rawDb.exec("ALTER TABLE conversations ADD COLUMN current_node_id TEXT;");
    console.log("Added current_node_id column to conversations table.");
  } catch (e) { /* Already exists */ }

  // AI Agent upgrades for Spark AI
  try {
    rawDb.exec("ALTER TABLE bots ADD COLUMN spark_api_key TEXT;");
    console.log("Added spark_api_key column to bots table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE bots ADD COLUMN spark_agent_id TEXT;");
    console.log("Added spark_agent_id column to bots table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE bots ADD COLUMN system_prompt TEXT;");
    console.log("Added system_prompt column to bots table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE bots ADD COLUMN greeting_message TEXT;");
    console.log("Added greeting_message column to bots table.");
  } catch (e) { /* Already exists */ }

  try {
    rawDb.exec("ALTER TABLE bots ADD COLUMN model_name TEXT DEFAULT 'gemini-1.5-flash';");
    console.log("Added model_name column to bots table.");
  } catch (e) { /* Already exists */ }

  console.log("Database initialized successfully!");
};

// Seed initial data if empty
const seedDb = () => {
  const count = rawDb.prepare('SELECT count(*) as count FROM campaigns').get();
  if (count.count === 0) {
    console.log("Seeding initial data...");
    
    // Ensure Org exists
    rawDb.prepare('INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)').run(1, 'Infokart Demo');

    // Seed Bot Configs
    const insertConfig = rawDb.prepare('INSERT INTO bot_configs (platform, key, value, org_id) VALUES (?, ?, ?, ?)');
    insertConfig.run('whatsapp', 'autoReplyEnabled', 'true', 1);
    insertConfig.run('whatsapp', 'greetingEnabled', 'true', 1);
    insertConfig.run('instagram', 'autoReplyEnabled', 'true', 1);
    insertConfig.run('instagram', 'storyMentionsEnabled', 'true', 1);

    // Seed Campaigns
    const insertCampaign = rawDb.prepare('INSERT INTO campaigns (name, channel, status, sent, opened, clicks, target, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertCampaign.run('Summer Sale 2026', 'WhatsApp', 'Active', 1200, 950, 420, 5000, 1);
    insertCampaign.run('New Feature Alert', 'WhatsApp', 'Draft', 0, 0, 0, 2000, 1);
    insertCampaign.run('Re-engagement Q1', 'WhatsApp', 'Completed', 5000, 4100, 1205, 5000, 1);
    
    // Seed Contacts
    const insertContact = rawDb.prepare('INSERT INTO contacts (id, name, phone_number, tags, email, notes, org_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertContact.run(1, 'Alice Johnson', '15551234567', 'Lead,VIP', 'alice@example.com', 'Interested in premium plan.', 1);
    insertContact.run(2, 'Bob Smith', '15559876543', 'Customer,Interested', 'bob@example.com', 'Needs pricing clarification.', 1);
    insertContact.run(3, 'Charlie Brown', '15555550100', 'Lead,Cold Lead', 'charlie@example.com', 'Story reply lead.', 1);
    insertContact.run(4, 'David Miller', 'website_visitor_123', 'Website visitor', 'david@example.com', 'Visited website from ad.', 1);
    
    // Seed Conversations
    const insertConv = rawDb.prepare('INSERT INTO conversations (id, org_id, customer_id, channel, status, assigned_to, priority, sentiment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertConv.run(1, 1, 1, 'WhatsApp', 'open', null, 'high', 'positive'); // WhatsApp Alice unassigned
    insertConv.run(2, 1, 2, 'WhatsApp', 'open', 1, 'medium', 'neutral'); // WhatsApp Bob assigned to agent 1
    insertConv.run(3, 1, 3, 'Instagram', 'open', null, 'low', 'neutral'); // Instagram Charlie unassigned
    insertConv.run(4, 1, 4, 'Website', 'open', null, 'high', 'positive'); // Website Live Chat David
    
    // Seed Messages (linked to conversations)
    const insertMessage = rawDb.prepare('INSERT INTO messages (phone_number, sender, direction, content, conversation_id, sender_type, status, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    // Alice thread (WhatsApp)
    insertMessage.run('15551234567', 'user', 'inbound', 'Hi, I have a question about the Summer Sale.', 1, 'user', 'read', 1);
    insertMessage.run('15551234567', 'bot', 'outbound', 'Hello! Thanks for reaching out. How can I help you with our Summer Sale today?', 1, 'bot', 'read', 1);
    insertMessage.run('15551234567', 'user', 'inbound', 'Is the discount code SUMMER50 applicable on electronics?', 1, 'user', 'delivered', 1);
    
    // Bob thread (WhatsApp)
    insertMessage.run('15559876543', 'user', 'inbound', 'Pricing?', 2, 'user', 'read', 1);
    insertMessage.run('15559876543', 'agent', 'outbound', 'Hi Bob, our pricing starts at $10/mo.', 2, 'agent', 'read', 1);
    insertMessage.run('15559876543', 'user', 'inbound', 'Awesome. Can you send the quotation for 5 team members?', 2, 'user', 'read', 1);
    
    // Charlie thread (Instagram)
    insertMessage.run('15555550100', 'user', 'inbound', 'Wow, that story looked amazing! Do you ship to Canada?', 3, 'user', 'read', 1);
    
    // David thread (Website Live Chat)
    insertMessage.run('website_visitor_123', 'user', 'inbound', 'Hello, is anyone online? I want to know more about the CRM integration.', 4, 'user', 'read', 1);
    insertMessage.run('website_visitor_123', 'bot', 'outbound', 'Hi! I am the Infokart bot. An agent will takeover shortly if you require further assistance.', 4, 'bot', 'read', 1);

    // Seed Templates
    const insertTemplate = rawDb.prepare('INSERT INTO templates (name, content, category) VALUES (?, ?, ?)');
    insertTemplate.run('Summer Sale Blast', 'Hey {{name}}! ☀️ Our Summer Splash Sale is LIVE! Get up to 50% off on all premium items.', 'Marketing');
    insertTemplate.run('Welcome Message', 'Hi {{name}}, welcome to InfoKart! We are excited to have you on board. 👋', 'Utility');
    insertTemplate.run('Feedback Request', 'Hello! We hope you enjoyed our service. Would you mind sharing your feedback? ⭐', 'Marketing');

    // Seed Rich WhatsApp Templates
    const insertWppTemplate = rawDb.prepare(`
      INSERT INTO whatsapp_templates (org_id, template_name, category, language, header_type, header_content, body_content, footer_content, buttons_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWppTemplate.run(
      1,
      'summer_sale_2026',
      'MARKETING',
      'en_US',
      'NONE',
      null,
      'Hey {{1}}! ☀️ Our Summer Splash Sale is LIVE! Get up to 50% off on all premium items.',
      'Reply STOP to unsubscribe',
      JSON.stringify([
        { type: 'QUICK_REPLY', text: 'Shop Now' },
        { type: 'QUICK_REPLY', text: 'More Deals' }
      ]),
      'APPROVED'
    );
    insertWppTemplate.run(
      1,
      'order_shipping_update',
      'UTILITY',
      'en_US',
      'TEXT',
      'Order Shipped!',
      'Hi {{1}}, your order {{2}} has been shipped. Track it here: {{3}}',
      'Thanks for shopping with us!',
      JSON.stringify([
        { type: 'URL', text: 'Track Order', url: 'https://example.com/track/{{1}}' }
      ]),
      'PENDING'
    );
    insertWppTemplate.run(
      1,
      'auth_code_2fa',
      'AUTHENTICATION',
      'en_US',
      'NONE',
      null,
      'Your login verification code is {{1}}. Do not share this code with anyone.',
      'Code expires in 5 minutes.',
      null,
      'APPROVED'
    );

    // Seed Inbox Knowledge Base Training content
    const insertKB = rawDb.prepare('INSERT INTO inbox_knowledge_base (org_id, source_type, title, content) VALUES (?, ?, ?, ?)');
    insertKB.run(1, 'faq', 'Infokart Pricing Model', 'Infokart features three plans: Starter ($10/mo, 1 channel, 2 team members), Growth ($29/mo, 3 channels, 5 team members), and Enterprise ($99/mo, unlimited channels, unlimited team members, dedicated support).');
    insertKB.run(1, 'faq', 'Meta API Connection Setup', 'To connect WhatsApp, click on Marketing Workspace, select Embedded Signup, and authorize your Meta Business Account. Sandboxed accounts can send free templates to up to 10 verified numbers.');
    insertKB.run(1, 'url', 'https://infokart.in/support', 'For customer support, email support@infokart.in or message us on WhatsApp at +15551234567. Normal response time is under 1 hour.');

    // Seed WhatsApp AI Agent profile (Repurposed as Spark AI Agent)
    rawDb.prepare("INSERT OR IGNORE INTO bots (id, org_id, bot_name, status, ai_mode, ai_tone, system_prompt, greeting_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(1, 1, 'Sparky', 'ACTIVE', 'BALANCED', 'FRIENDLY', 'You are Sparky, a premium AI Agent employee. Answer customer queries friendly and professionally using the knowledge base.', 'Hello! How can I assist your business today?');
  }
};

initDb();
seedDb();

// --- Firebase Realtime Database Sync Adapter ---

// Helper to extract table name from SQL query
function getTableName(sql) {
  const insertMatch = sql.match(/insert\s+(?:or\s+ignore\s+|or\s+replace\s+)?into\s+(\w+)/i);
  if (insertMatch) return insertMatch[1];
  const updateMatch = sql.match(/update\s+(\w+)/i);
  if (updateMatch) return updateMatch[1];
  const deleteMatch = sql.match(/delete\s+from\s+(\w+)/i);
  if (deleteMatch) return deleteMatch[1];
  return null;
}

// Get appropriate Doc ID for Firebase path
function getDocId(tableName, row) {
  if (row.id) return row.id.toString();
  if (tableName === 'contacts' && row.phone_number) return row.phone_number.toString();
  if (tableName === 'bot_configs' && row.platform && row.key) return `${row.platform}_${row.key}`;
  if (tableName === 'campaign_contacts' && row.campaign_id && row.contact_id) return `${row.campaign_id}_${row.contact_id}`;
  return (row.id || row.phone_number || Math.random().toString(36).substring(2)).toString();
}

// Write operation sync wrapper
function syncAfterWrite(sql, args, result, affectedRowsForDelete) {
  if (!rtdb) return;
  const tableName = getTableName(sql);
  if (!tableName) return;

  // Execute async
  setTimeout(async () => {
    try {
      if (sql.trim().toLowerCase().startsWith('insert')) {
        const row = rawDb.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`).get(result.lastInsertRowid);
        if (row) {
          const docId = getDocId(tableName, row);
          await rtdb.ref(`${tableName}/${docId}`).set(row);
          console.log(`🔥 [Firebase RTDB] Synced INSERT -> ${tableName}/${docId}`);
        }
      } else if (sql.trim().toLowerCase().startsWith('update')) {
        let rows = [];
        if (sql.includes('WHERE id = ?')) {
          const id = args[args.length - 1];
          const row = rawDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
          if (row) rows = [row];
        } else if (sql.includes('WHERE phone_number = ?')) {
          const phone = args[args.length - 1];
          const row = rawDb.prepare(`SELECT * FROM ${tableName} WHERE phone_number = ?`).get(phone);
          if (row) rows = [row];
        } else {
          // Fallback: sync all records for small configuration tables
          const smallTables = ['whatsapp_accounts', 'whatsapp_settings', 'bots', 'bot_configs', 'templates', 'bot_flows', 'bot_knowledge_base', 'inbox_knowledge_base'];
          if (smallTables.includes(tableName)) {
            const allRows = rawDb.prepare(`SELECT * FROM ${tableName}`).all();
            for (const r of allRows) {
              const docId = getDocId(tableName, r);
              await rtdb.ref(`${tableName}/${docId}`).set(r);
            }
            console.log(`🔥 [Firebase RTDB] Bulk synced UPDATE for small table -> ${tableName}`);
            return;
          }
        }

        for (const row of rows) {
          const docId = getDocId(tableName, row);
          await rtdb.ref(`${tableName}/${docId}`).set(row);
          console.log(`🔥 [Firebase RTDB] Synced UPDATE -> ${tableName}/${docId}`);
        }
      } else if (sql.trim().toLowerCase().startsWith('delete')) {
        if (affectedRowsForDelete && affectedRowsForDelete.length > 0) {
          for (const row of affectedRowsForDelete) {
            const docId = getDocId(tableName, row);
            await rtdb.ref(`${tableName}/${docId}`).remove();
            console.log(`🔥 [Firebase RTDB] Synced DELETE -> ${tableName}/${docId}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ [Firebase RTDB Sync Error] Failed to sync ${tableName}:`, err.message);
    }
  }, 10);
}

// Initial Sync from Firebase RTDB to SQLite
async function syncFromFirebaseToSqlite() {
  if (!rtdb) return;
  console.log("🔄 Syncing data from Firebase Realtime Database to local SQLite cache...");
  const tables = [
    'organizations', 'users', 'contacts', 'messages', 'campaigns', 
    'campaign_contacts', 'bot_configs', 'bots', 'bot_flows', 
    'bot_knowledge_base', 'templates', 'whatsapp_settings', 
    'whatsapp_accounts', 'whatsapp_templates', 'conversations', 
    'notes', 'inbox_knowledge_base', 'active_agents', 'audit_logs'
  ];

  for (const tableName of tables) {
    try {
      const snapshot = await rtdb.ref(tableName).once('value');
      const data = snapshot.val();
      if (!data) continue;
      
      const documents = typeof data === 'object' ? Object.values(data) : [];
      if (documents.length === 0) continue;
      
      console.log(`📥 Syncing ${documents.length} records from RTDB table: ${tableName}`);
      
      rawDb.exec("PRAGMA foreign_keys = OFF;");
      
      for (const row of documents) {
        if (!row || typeof row !== 'object') continue;
        
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');
        
        // Remove existing record to avoid conflict
        if (row.id) {
          rawDb.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(row.id);
        } else if (tableName === 'contacts' && row.phone_number) {
          rawDb.prepare(`DELETE FROM ${tableName} WHERE phone_number = ?`).run(row.phone_number);
        } else if (tableName === 'bot_configs' && row.platform && row.key) {
          rawDb.prepare(`DELETE FROM ${tableName} WHERE platform = ? AND key = ?`).run(row.platform, row.key);
        }
        
        const sql = `INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
        const values = columns.map(col => {
          if (typeof row[col] === 'object' && row[col] !== null) {
            return JSON.stringify(row[col]);
          }
          return row[col];
        });
        
        try {
          rawDb.prepare(sql).run(...values);
        } catch (err) {
          console.error(`Error inserting synced row into ${tableName}:`, err.message);
        }
      }
      
      rawDb.exec("PRAGMA foreign_keys = ON;");
    } catch (e) {
      console.error(`Failed to sync table ${tableName} from Firebase RTDB:`, e.message);
    }
  }
  console.log("✅ Firebase Realtime Database sync completed!");
}

// Wrap db exports
const db = {
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    const tableName = getTableName(sql);

    return {
      get(...args) {
        return stmt.get(...args);
      },
      all(...args) {
        return stmt.all(...args);
      },
      run(...args) {
        let affectedRowsForDelete = [];
        if (tableName && sql.trim().toLowerCase().startsWith('delete')) {
          try {
            const selectSql = sql.replace(/delete\s+from/i, 'SELECT * FROM');
            affectedRowsForDelete = rawDb.prepare(selectSql).all(...args);
          } catch (e) {
            // ignore
          }
        }

        const result = stmt.run(...args);
        syncAfterWrite(sql, args, result, affectedRowsForDelete);
        return result;
      }
    };
  },

  exec(sql) {
    return rawDb.exec(sql);
  },

  transaction(fn) {
    return rawDb.transaction(fn);
  },

  // Expose onReady Promise to allow waiting for initial sync
  onReady: rtdb ? syncFromFirebaseToSqlite() : Promise.resolve()
};

module.exports = db;
