import { drizzle, Drizzle } from "drizzle-orm/better-sqlite";
import Database from "better-sqlite3";

// Initialize database connection
let db: Drizzle<Database> | null = null;

export function getDb(): Drizzle<Database> {
  if (!db) {
    const path = process.env.DB_PATH || "../db.sqlite";
    console.log(`📦 Connecting to SQLite at: ${path}`);
    db = drizzle(new Database(path));
  }
  return db;
}

// Migration placeholder (will be added as schema evolves)
export async function migrate() {
  // Add migrations here as the schema grows
}