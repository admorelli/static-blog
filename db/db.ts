import { drizzle } from 'drizzle-orm/better-sqlite3';
import betterSqlite3 from 'better-sqlite3';

type SQLiteDb = ReturnType<typeof drizzle>;

declare global {
   
  var __DB__: SQLiteDb | undefined;
}

function getDb(path?: string): SQLiteDb {
  const dbPath = path || process.env.TEST_DB_PATH || process.env.DB_PATH || './db.sqlite';
  const isMemory = path === ':memory:';

  const instance = globalThis.__DB__;
  if (instance && (!path || isMemory)) {
    return instance;
  }

  const sqlite = isMemory
    ? new betterSqlite3(':memory:')
    : new betterSqlite3(dbPath);

  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite) as SQLiteDb;
  globalThis.__DB__ = db;
  return db;
}

export default getDb();
export { getDb };
