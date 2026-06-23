const CLEANUP_SQL = `
DELETE FROM post_tags;
DELETE FROM posts;
DELETE FROM tags;
`;

const FTS_RECREATE_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  id UNINDEXED, title, content, tokenize='porter unicode61'
);
`;

const FTS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN INSERT INTO posts_fts(id, title, content) VALUES (new.id, new.title, new.content); END;`,
  `CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN UPDATE posts_fts SET title = new.title, content = new.content WHERE id = new.id; END;`,
  `CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN DELETE FROM posts_fts WHERE id = old.id; END;`,
];

type DbClient = { exec(sql: string): void };

export function resetDatabase(db: { $client: DbClient }) {
  db.$client.exec(CLEANUP_SQL);
}

export function recreatePostsFts(db: { $client: DbClient }) {
  db.$client.exec(FTS_RECREATE_SQL);
  for (const triggerSql of FTS_TRIGGERS) {
    db.$client.exec(triggerSql);
  }
}
