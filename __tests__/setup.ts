// Vitest global setup - runs once before all tests
import { getDb } from '@/db/db';

// Reset global singleton so each vitest run starts clean.
if (globalThis.__DB__) globalThis.__DB__ = undefined;

const testDb = getDb(':memory:');

// Create tables
testDb.$client.exec(`CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  series TEXT,
  series_order INTEGER
);`);
testDb.$client.exec(`CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);`);
testDb.$client.exec(`CREATE TABLE post_tags (post_id INTEGER NOT NULL REFERENCES posts(id), tag_id INTEGER NOT NULL REFERENCES tags(id));`);

// Create FTS5 virtual table and triggers
testDb.$client.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    id UNINDEXED, title, content, tokenize='porter unicode61'
  );
`);
testDb.$client.exec(`
  CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(id, title, content) VALUES (new.id, new.title, new.content);
  END;
`);
testDb.$client.exec(`
  CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
    UPDATE posts_fts SET title = new.title, content = new.content WHERE id = new.id;
  END;
`);
testDb.$client.exec(`
  CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
    DELETE FROM posts_fts WHERE id = old.id;
  END;
`);

// Make testDb globally available
// @ts-expect-error global test database for vitest
global.__TEST_DB__ = testDb;
