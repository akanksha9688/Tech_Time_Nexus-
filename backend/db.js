const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      message TEXT,
      triggerType TEXT,
      triggerValue TEXT,
      isDelivered INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      openedAt TEXT,
      reminderSent INTEGER DEFAULT 0,
      reminder7Sent INTEGER DEFAULT 0,
      reminder1Sent INTEGER DEFAULT 0,
      userEmail TEXT
    )
  `);
});

module.exports = db;
