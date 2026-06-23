const CLEANUP_SQL = `DELETE FROM post_tags; DELETE FROM posts; DELETE FROM tags;`;

type DbClient = { exec(sql: string): void };

export function resetDatabase(db: { $client: DbClient }): void {
  db.$client.exec(CLEANUP_SQL);
}
