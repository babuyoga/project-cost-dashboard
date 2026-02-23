import Database from 'better-sqlite3';
import path from 'path';

// Singleton pattern for database connection
const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'cost-dashboard.db');

let db: Database.Database;

// Check if we are in production or development
if (process.env.NODE_ENV === 'production') {
  db = new Database(dbPath);
} else {
  //In development, attach the db instance to the global object to prevent multiple connections on hot reload
  if (!(global as any).db) {
     (global as any).db = new Database(dbPath);
  }
  db = (global as any).db;
}

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export default db;
