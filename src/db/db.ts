import { drizzle } from 'drizzle-orm/better-sqlite3';
import betterSqlite3 from 'better-sqlite3';

const db = drizzle(betterSqlite3('./db.sqlite'), {
  // dialect options if needed
});

export default db;
