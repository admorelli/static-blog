import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: text('content').notNull(),
  created_at: integer('created_at').default(0).notNull(),
});
