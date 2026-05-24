import { sql } from "drizzle-orm";
import type { AdapterColumn, AdapterIndex, AdapterTable } from "@drizzle-team/database-internals";

// Posts table schema
export const posts = {
  id: sql`INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`,
  title: sql`TEXT NOT NULL`,
  slug: sql`TEXT UNIQUE NOT NULL`,
  content: sql`TEXT NOT NULL`,
  publishedAt: sql`DATETIME DEFAULT CURRENT_TIMESTAMP`,
};

// Tags table schema (for storing unique tags)
export const tags = {
  id: sql`INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`,
  name: sql`TEXT UNIQUE NOT NULL COLLATE NOCASE`, // Case-insensitive uniqueness, e.g., "js" === "JS"
};

// Post_Tags junction table (many-to-many relationship)
export const postTags = {
  postId: sql`INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE`,
  tagId: sql`INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE`,
  PRIMARY KEY(postId, tagId), // Enforce uniqueness per post-tag pair
};