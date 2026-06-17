import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: text('content').notNull(),
  created_at: integer('created_at').default(0).notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name').unique().notNull(),
});

export const postTags = sqliteTable('post_tags', {
  postId: integer('post_id').notNull().references(() => posts.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
});

// FTS5 virtual table for full-text search
// Note: This is created via raw SQL, not Drizzle ORM
export const postsFts = sqliteTable('posts_fts', {
  id: integer('id').primaryKey(),
  title: text('title'),
  content: text('content'),
});