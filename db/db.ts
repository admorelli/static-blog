import { drizzle } from 'drizzle-orm/better-sqlite3';
import betterSqlite3 from 'better-sqlite3';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb(path?: string): ReturnType<typeof drizzle> {
  if (dbInstance && !path) return dbInstance;
  
  const dbPath = path || process.env.TEST_DB_PATH || './db.sqlite';
  const isMemory = path === ':memory:';
  
  const sqlite = isMemory 
    ? new betterSqlite3(':memory:')
    : new betterSqlite3(dbPath);
  
  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');
  
  const db = drizzle(sqlite);
  
  if (!path) dbInstance = db;
  
  return db;
}

export default getDb();
export { getDb };