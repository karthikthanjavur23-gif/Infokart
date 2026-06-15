const db = require('./database');

console.log("Database wrapper loaded successfully.");

try {
  // 1. Query users to test select/get statement
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@infokart.in');
  console.log("✅ Query SELECT SUCCESS:", user ? `Found user: ${user.name} (${user.email})` : "User not found");

  // 2. Perform a test insert to verify write interceptor
  console.log("Inserting test contact...");
  const insertContact = db.prepare('INSERT INTO contacts (org_id, name, email, phone_number, tags, notes) VALUES (?, ?, ?, ?, ?, ?)');
  const res = insertContact.run(1, 'Test User', 'test@example.com', '+1999999999', 'test-tag', 'test notes');
  console.log("✅ Query INSERT SUCCESS. result:", res);

  // 3. Verify inserted contact in SQLite
  const contact = db.prepare('SELECT * FROM contacts WHERE phone_number = ?').get('+1999999999');
  console.log("✅ Query SELECT inserted contact SUCCESS:", contact);

  // 4. Delete the test contact to clean up database
  console.log("Cleaning up test contact...");
  const deleteContact = db.prepare('DELETE FROM contacts WHERE phone_number = ?');
  const delRes = deleteContact.run('+1999999999');
  console.log("✅ Query DELETE SUCCESS. result:", delRes);

  console.log("🎉 Database wrapper test passed!");
} catch (err) {
  console.error("❌ Database wrapper test failed:", err.stack);
}
