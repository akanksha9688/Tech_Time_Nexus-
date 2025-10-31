const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      message TEXT,
      triggerType TEXT,
      type TEXT,
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

// Add 'type' column if it doesn't exist (safe for existing DB)
db.all("PRAGMA table_info('capsules')", (err, cols) => {
  if (err) return;
  const hasType = cols.some((c) => c.name === "type");
  if (!hasType) {
    db.run("ALTER TABLE capsules ADD COLUMN type TEXT", (alterErr) => {
      if (alterErr)
        console.warn(
          "Could not add type column to capsules table:",
          alterErr.message
        );
      else console.log("✅ Added type column to capsules table");
    });
  }
  
  // Ensure isDelivered column exists
  const hasIsDelivered = cols.some((c) => c.name === "isDelivered");
  if (!hasIsDelivered) {
    db.run("ALTER TABLE capsules ADD COLUMN isDelivered INTEGER DEFAULT 0", (alterErr) => {
      if (alterErr)
        console.warn("Could not add isDelivered column:", alterErr.message);
      else console.log("✅ Added isDelivered column to capsules table");
    });
  }
  
  // Ensure openedAt column exists
  const hasOpenedAt = cols.some((c) => c.name === "openedAt");
  if (!hasOpenedAt) {
    db.run("ALTER TABLE capsules ADD COLUMN openedAt TEXT", (alterErr) => {
      if (alterErr)
        console.warn("Could not add openedAt column:", alterErr.message);
      else console.log("✅ Added openedAt column to capsules table");
    });
  }
  
  // Ensure userEmail column exists
  const hasUserEmail = cols.some((c) => c.name === "userEmail");
  if (!hasUserEmail) {
    db.run("ALTER TABLE capsules ADD COLUMN userEmail TEXT", (alterErr) => {
      if (alterErr)
        console.warn("Could not add userEmail column:", alterErr.message);
      else console.log("✅ Added userEmail column to capsules table");
    });
  }
});

module.exports = db;
