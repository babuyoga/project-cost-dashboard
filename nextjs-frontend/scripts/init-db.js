const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'cost-dashboard.db');
const db = new Database(dbPath);

console.log(`Initializing database at ${dbPath}`);

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    password_updated_at TEXT
  )
`);
console.log('Created users table');

// Create sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_seen_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('Created sessions table');

// Create default admin user
const adminUsername = 'amrinkareem';
const adminPassword = 'armin67tyfg^&';

try {
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, enabled, is_admin)
      VALUES (?, ?, NULL, ?, 1, 1)
    `).run(userId, adminUsername, hash);
    
    console.log(`Created admin user: ${adminUsername}`);
  } else {
    // Ensure existing admin user has admin privileges
    db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run(adminUsername);
    console.log(`Ensured admin privileges for user: ${adminUsername}`);
  }
} catch (error) {
  console.error('Error creating admin user:', error);
}

db.close();
console.log('Database initialization complete');
