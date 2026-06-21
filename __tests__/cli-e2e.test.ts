import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import Database from 'better-sqlite3';

const execFileAsync = promisify(execFile);
const fixtureDir = '/tmp/static-blog-cli-e2e-fixtures';

function runCli(args: string[], env: Record<string, string | undefined> = {}) {
  return execFileAsync('npx', ['tsx', 'cli/index.ts', ...args], {
    cwd: '/home/allfa/git-projects/static_blog',
    env: { ...process.env, ...env, CI: '1', TERM: 'dumb' },
  });
}

function createTables(dbPath: string) {
  const db = new Database(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0,
    series TEXT,
    series_order INTEGER
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id),
    tag_id INTEGER NOT NULL REFERENCES tags(id)
  );`);
  db.close();
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}

interface TagRow {
  id: number;
  name: string;
}

interface TagJoinRow {
  name: string;
}

function allPostRows(db: Database.Database, sql: string, params: unknown[]): PostRow[] {
  return db.prepare(sql).all(...params) as PostRow[];
}

function allTagRows(db: Database.Database, sql: string, params: unknown[]): TagRow[] {
  return db.prepare(sql).all(...params) as TagRow[];
}

function allTagJoinRows(db: Database.Database, sql: string, params: unknown[]): TagJoinRow[] {
  return db.prepare(sql).all(...params) as TagJoinRow[];
}

describe('cli e2e', () => {
  beforeAll(() => {
    mkdirSync(fixtureDir, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(fixtureDir, { recursive: true });
    } catch {}
  });

  it('create post via flags', async () => {
    const dbPath = '/tmp/cli-e2e-list.sqlite';
    try {
      createTables(dbPath);

      await runCli(['create', '--title', 'E2E List', '--content', 'List body', '--slug', 'e2e-list'], { TEST_DB_PATH: dbPath });

      const db = new Database(dbPath);
      const rows = allPostRows(db, 'SELECT title, slug, content, created_at FROM posts WHERE slug = ?', ['e2e-list']);
      db.close();

      expect(rows).toHaveLength(1);
      expect(rows[0]?.title).toBe('E2E List');
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });

  it('create-from-markdown end-to-end', async () => {
    const dbPath = '/tmp/cli-e2e-markdown.sqlite';
    const filePath = join(fixtureDir, 'e2e-markdown-post.md');

    try {
      createTables(dbPath);

      writeFileSync(filePath, '---\ntitle: E2E Markdown Post\ntags: e2e,cli\n---\nHello markdown.\n');

      await runCli(['new', '--file', filePath], { TEST_DB_PATH: dbPath });

      const db = new Database(dbPath);

      const [post] = allPostRows(db, 'SELECT id, title, slug FROM posts WHERE slug = ?', ['e2e-markdown-post']);
      db.close();

      expect(post.title).toBe('E2E Markdown Post');

      const db2 = new Database(dbPath);
      const joined = allTagJoinRows(
        db2,
        'SELECT tags.name FROM post_tags JOIN tags ON tags.id = post_tags.tag_id WHERE post_tags.post_id = ?',
        [post.id]
      );
      db2.close();

      expect(joined.map((r) => r.name).sort()).toEqual(['cli', 'e2e']);
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });

  it('tag-create and tags list', async () => {
    const dbPath = '/tmp/cli-e2e-tags.sqlite';
    try {
      createTables(dbPath);

      await runCli(['tag-create', '--name', 'tag-e2e'], { TEST_DB_PATH: dbPath });

      const db = new Database(dbPath);
      const rows = allTagRows(db, 'SELECT name FROM tags', []);
      db.close();

      expect(rows.map((r) => r.name)).toContain('tag-e2e');
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });

  it('tag-delete removes tag by name', async () => {
    const dbPath = '/tmp/cli-e2e-tagdelete.sqlite';
    try {
      createTables(dbPath);

      await runCli(['tag-create', '--name', 'deleteme'], { TEST_DB_PATH: dbPath });

      let db = new Database(dbPath);
      let rows = allTagRows(db, 'SELECT name FROM tags WHERE name = ?', ['deleteme']);
      db.close();
      expect(rows).toHaveLength(1);

      await runCli(['tag-delete', '--name', 'deleteme', '--yes'], { TEST_DB_PATH: dbPath });

      db = new Database(dbPath);
      rows = allTagRows(db, 'SELECT name FROM tags WHERE name = ?', ['deleteme']);
      db.close();

      expect(rows).toHaveLength(0);
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });

  it('posts list shows newly created post', async () => {
    const dbPath = '/tmp/cli-e2e-list.sqlite';
    try {
      createTables(dbPath);

      await runCli(['create', '--title', 'List Post', '--content', 'body', '--slug', 'list-post'], { TEST_DB_PATH: dbPath });

      const { stdout } = await runCli(['posts'], { TEST_DB_PATH: dbPath });
      expect(stdout).toContain('list-post');
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });

  it('delete removes an existing post', async () => {
    const dbPath = '/tmp/cli-e2e-delete.sqlite';
    try {
      createTables(dbPath);

      await runCli(['create', '--title', 'Delete Me', '--content', 'body', '--slug', 'delete-me'], { TEST_DB_PATH: dbPath });

      let db = new Database(dbPath);
      let rows = allPostRows(db, 'SELECT id FROM posts WHERE slug = ?', ['delete-me']);
      db.close();
      expect(rows).toHaveLength(1);

      await runCli(['delete', '--slug', 'delete-me', '--yes'], { TEST_DB_PATH: dbPath });

      db = new Database(dbPath);
      rows = allPostRows(db, 'SELECT id FROM posts WHERE slug = ?', ['delete-me']);
      db.close();

      expect(rows).toHaveLength(0);
    } finally {
      try {
        rmSync(dbPath);
      } catch {}
    }
  });
});
