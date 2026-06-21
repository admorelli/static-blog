import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import Database from 'better-sqlite3';

const fixtureDir = '/tmp/static-blog-cli-e2e-fixtures';

function runCli(args: string[], env: Record<string, string | undefined> = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const cmd = 'npx tsx cli/index.ts ' + args.join(' ');
    const child = spawn('/bin/bash', ['-c', cmd], {
      cwd: '/home/allfa/git-projects/static_blog',
      env: { ...process.env, ...env, CI: '1', TERM: 'dumb' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`Command failed: ${cmd}\n${stderr}`) as any;
        err.stdout = stdout;
        err.stderr = stderr;
        err.code = code;
        reject(err);
      }
    });
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

describe('cli e2e', () => {
  beforeAll(() => {
    mkdirSync(fixtureDir, { recursive: true });
  });

  afterAll(() => {
    try { rmSync(fixtureDir, { recursive: true }); } catch {}
  });

  async function runCli(args: string[], env: Record<string, string | undefined> = {}) {
    return exec(
      'npx tsx cli/index.ts ' + args.join(' '),
      {
        cwd: '/home/allfa/git-projects/static_blog',
        env: { ...process.env, ...env, CI: '1', TERM: 'dumb' },
      }
    );
  }

  it('create post via flags', async () => {
    const dbPath = '/tmp/cli-e2e-list.sqlite';
    try {
      createTables(dbPath);

      await runCli(['create', '--title', 'E2E List', '--content', 'List body', '--slug', 'e2e-list'], { TEST_DB_PATH: dbPath });

      const db = new Database(dbPath);
      const rows = db.prepare('SELECT title, slug FROM posts').all() as { title: string; slug: string }[];
      db.close();

      expect(rows.map((r) => r.slug)).toContain('e2e-list');
    } finally {
      try { rmSync(dbPath); } catch {}
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

      const [post] = db.prepare('SELECT id, title, slug FROM posts WHERE slug = ?').all('e2e-markdown-post') as { id: number; title: string; slug: string }[];
      db.close();

      expect(post.title).toBe('E2E Markdown Post');

      const db2 = new Database(dbPath);
      const joined = db2.prepare(`
        SELECT tags.name
        FROM post_tags
        JOIN tags ON tags.id = post_tags.tag_id
        WHERE post_tags.post_id = ?
      `).all(post.id) as { name: string }[];
      db2.close();

      expect(joined.map((r) => r.name).sort()).toEqual(['cli', 'e2e']);
    } finally {
      try { rmSync(dbPath); } catch {}
    }
  });

  it('tag-create and tags list', async () => {
    const dbPath = '/tmp/cli-e2e-tags.sqlite';
    try {
      createTables(dbPath);

      await runCli(['tag-create', '--name', 'tag-e2e'], { TEST_DB_PATH: dbPath });

      const db = new Database(dbPath);
      const rows = db.prepare('SELECT name FROM tags').all() as { name: string }[];
      db.close();

      expect(rows.map((r) => r.name)).toContain('tag-e2e');
    } finally {
      try { rmSync(dbPath); } catch {}
    }
  });

  it('tag-delete removes tag by name', async () => {
    const dbPath = '/tmp/cli-e2e-tagdelete.sqlite';
    try {
      createTables(dbPath);

      await runCli(['tag-create', '--name', 'deleteme'], { TEST_DB_PATH: dbPath });

      let db = new Database(dbPath);
      let rows = db.prepare('SELECT name FROM tags').all() as { name: string }[];
      db.close();
      expect(rows.map((r) => r.name)).toContain('deleteme');

      await runCli(['tag-delete', '--name', 'deleteme', '--yes'], { TEST_DB_PATH: dbPath });

      db = new Database(dbPath);
      rows = db.prepare('SELECT name FROM tags').all() as { name: string }[];
      db.close();

      expect(rows.map((r) => r.name)).not.toContain('deleteme');
    } finally {
      try { rmSync(dbPath); } catch {}
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
      try { rmSync(dbPath); } catch {}
    }
  });

  it('delete removes an existing post', async () => {
    const dbPath = '/tmp/cli-e2e-delete.sqlite';
    try {
      createTables(dbPath);

      await runCli(['create', '--title', 'Delete Me', '--content', 'body', '--slug', 'delete-me'], { TEST_DB_PATH: dbPath });

      let db = new Database(dbPath);
      let rows = db.prepare('SELECT id FROM posts WHERE slug = ?').all('delete-me') as { id: number }[];
      db.close();
      expect(rows).toHaveLength(1);

      await runCli(['delete', '--slug', 'delete-me', '--yes'], { TEST_DB_PATH: dbPath });

      db = new Database(dbPath);
      rows = db.prepare('SELECT id FROM posts WHERE slug = ?').all('delete-me') as { id: number }[];
      db.close();

      expect(rows).toHaveLength(0);
    } finally {
      try { rmSync(dbPath); } catch {}
    }
  });
});
