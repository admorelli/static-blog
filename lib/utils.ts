// +-----------------------------------------------+
// | Utils: slugify, getPostsByTag, generateTimestamp  |
// +-----------------------------------------------+

import { eq } from "drizzle-orm";
import type { Post } from "./types";
import { getDb } from "../db/index";
import { TagService } from "./dao/tags";

/** Slugify: lower-case, space → hyphen, collapse multiple hyphens */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s/]/g, "-")           // space/slash → hyphen
    .replace(/[^a-z0-9-]+/g, "")     // remove non-alphanumeric except hyphens
    .replace(/(-+)$/, "")          // strip trailing hyphens
    .replace(/-+/g, "-");         // collapse multiple hyphens into one
}

/** Generate a short unique timestamp (12 chars) */
export function generateTimestamp(): string {
  return Date.now().toString(36).slice(-12);
}

// +-----------------------------------------------+
// | Get all posts from SQLite, with tags populated    |
// +-----------------------------------------------+
export async function getPostsByTag(tagName: string): Promise<Post[]> {
  const db = getDb();
  const tagService = new TagService();

  // Ensure the tag exists (or get its ID if it already does)
  const tid = await tagService.getTagIdByName(tagName);
  if (!tid) return [];

  // Fetch junction entries for this tag
  const rows = await db.select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, tid));

  if (rows.length === 0) return [];

  const postIds = Array.from(new Set(rows.map((r) => r.postId))) as number[];
  if (postIds.length === 0) return [];

  // Fetch posts by IDs
  const rows2 = await db.select().from(posts)
    .where(sql`posts.id IN (${sql`${postIds.join(",")}`})`);

  return rows2.map((row) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug ? slugify(row.slug) : null,
    content: row.content,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
    date: new Date(Date.now()).toISOString(),
    tags: [tagName], // simplified; in production you'd resolve all tags
  }));
}
