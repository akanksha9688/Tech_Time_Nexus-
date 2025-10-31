const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Use persistent directory in production (if DATABASE_URL not set)
// For Render: use /opt/render/project/src/data
const dbPath = process.env.DATABASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../data/db.sqlite')
    : path.join(__dirname, '../db.sqlite'));

console.log("📁 Database path:", dbPath);

// Ensure data directory exists in production
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✅ Created data directory:", dataDir);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Connected to SQLite database at:", dbPath);
  }
});

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
  `, (err) => {
    if (err) {
      console.error("❌ Error creating capsules table:", err);
    } else {
      console.log("✅ Capsules table ready");
    }
  });
});

// Add 'type' column if it doesn't exist (safe for existing DB)
db.all("PRAGMA table_info('capsules')", (err, cols) => {
  if (err) {
    console.error("❌ Error checking table schema:", err);
    return;
  }
  
  console.log("📋 Database columns:", cols.map(c => c.name).join(', '));
  
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
