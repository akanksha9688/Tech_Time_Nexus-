const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use same database path as Capsule model
const dbPath = process.env.DATABASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../data/db.sqlite')
    : path.join(__dirname, '../db.sqlite'));

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      githubToken TEXT
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating users table:", err);
    } else {
      console.log("✅ Users table ready");
    }
  });
  
  // Add githubToken column if it doesn't exist
  db.all("PRAGMA table_info('users')", (err, cols) => {
    if (err) return;
    const hasGithubToken = cols.some((c) => c.name === "githubToken");
    if (!hasGithubToken) {
      db.run("ALTER TABLE users ADD COLUMN githubToken TEXT", (alterErr) => {
        if (alterErr)
          console.warn("Could not add githubToken column:", alterErr.message);
        else console.log("✅ Added githubToken column to users table");
      });
    }
  });
});

module.exports = db;
