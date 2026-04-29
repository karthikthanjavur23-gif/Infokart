const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'infokart.db');
const db = new Database(dbPath);

// Initialize database tables
const initDb = () => {
  // 1. Contacts (CRM)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone_number TEXT UNIQUE NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Messages (Shared Team Inbox / Logs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'user', 'bot', 'agent'
      direction TEXT NOT NULL, -- 'inbound', 'outbound'
      content TEXT NOT NULL,
      status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Campaigns (Broadcast engine)
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_configs (
      platform TEXT NOT NULL, -- 'whatsapp' or 'instagram'
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (platform, key)
    )
  `);

  // 5. Message Templates
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Marketing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. WhatsApp Settings (Embedded Signup Data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one primary setting for now
      waba_id TEXT,
      phone_number_id TEXT,
      access_token TEXT,
      display_phone_number TEXT,
      verified_name TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database initialized successfully!");
};

// Seed initial data if empty
const seedDb = () => {
  const count = db.prepare('SELECT count(*) as count FROM campaigns').get();
  if (count.count === 0) {
    console.log("Seeding initial data...");
    
    // Seed Bot Configs
    const insertConfig = db.prepare('INSERT INTO bot_configs (platform, key, value) VALUES (?, ?, ?)');
    insertConfig.run('whatsapp', 'autoReplyEnabled', 'true');
    insertConfig.run('whatsapp', 'greetingEnabled', 'true');
    insertConfig.run('instagram', 'autoReplyEnabled', 'true');
    insertConfig.run('instagram', 'storyMentionsEnabled', 'true');

    // Seed Campaigns
    const insertCampaign = db.prepare('INSERT INTO campaigns (name, channel, status, sent, opened, clicks, target) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertCampaign.run('Summer Sale 2026', 'WhatsApp', 'Active', 1200, 950, 420, 5000);
    insertCampaign.run('New Feature Alert', 'WhatsApp', 'Draft', 0, 0, 0, 2000);
    insertCampaign.run('Re-engagement Q1', 'WhatsApp', 'Completed', 5000, 4100, 1205, 5000);
    
    // Seed Contacts
    const insertContact = db.prepare('INSERT INTO contacts (name, phone_number, tags) VALUES (?, ?, ?)');
    insertContact.run('Alice Johnson', '15551234567', 'Lead,VIP');
    insertContact.run('Bob Smith', '15559876543', 'Customer');
    
    // Seed Messages
    const insertMessage = db.prepare('INSERT INTO messages (phone_number, sender, direction, content) VALUES (?, ?, ?, ?)');
    insertMessage.run('15551234567', 'user', 'inbound', 'Hi, I have a question about the Summer Sale.');
    insertMessage.run('15551234567', 'bot', 'outbound', 'Hello! Thanks for reaching out. How can I help you with our Summer Sale today?');
    insertMessage.run('15559876543', 'user', 'inbound', 'Pricing?');
    insertMessage.run('15559876543', 'agent', 'outbound', 'Hi Bob, our pricing starts at $10/mo.');

    // Seed Templates
    const insertTemplate = db.prepare('INSERT INTO templates (name, content, category) VALUES (?, ?, ?)');
    insertTemplate.run('Summer Sale Blast', 'Hey {{name}}! ☀️ Our Summer Splash Sale is LIVE! Get up to 50% off on all premium items.', 'Marketing');
    insertTemplate.run('Welcome Message', 'Hi {{name}}, welcome to InfoKart! We are excited to have you on board. 👋', 'Utility');
    insertTemplate.run('Feedback Request', 'Hello! We hope you enjoyed our service. Would you mind sharing your feedback? ⭐', 'Marketing');
  }
};

initDb();
seedDb();

module.exports = db;
