const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'infokart.db'));

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

stmt.run(
  '2014180579531644',
  '1116294888227326',
  'EAAb79nVqTs4BRYfxYBcYfCiI6Goo3uSKe2ZAf3h2XjIBqi0YW3l4cZBba4wGk9w49kcrU4mqAcPAtLaEJ3hSoi0KukOJmTlA61ZBvNU8YcMJ8NOfraFl68CxuZBMNZBJfj7gt3l2vIOgwebkZBbOTk5oMBxnxlGGYGnktJVbZArJ0JW0bXOYc363KciriwyZClG4ws8SPZCSYMF3Av7zyJwZC1TLFKEP2GoGGJ163khm3GLiNNLOFBQvQQv0ZANZBEXmhZCPnoUUvCaVZAVkTz94nR0lBZA',
  '+91 Test Number',
  'Infokart'
);

console.log('SUCCESS: WhatsApp credentials saved to database!');

// Verify
const row = db.prepare('SELECT * FROM whatsapp_settings WHERE id = 1').get();
console.log('Saved record:', JSON.stringify(row, null, 2));

db.close();
