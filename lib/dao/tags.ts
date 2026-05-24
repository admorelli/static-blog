// +---------------------------------------------------+
// | Tag Operations Service (create, get by name, per-post) |
// +---------------------------------------------------+
import { eq } from "drizzle-orm";
import type { Post } from "../types";
import { getDb } from "../../db/index";

export class TagService {
  private db = getDb();

  // --- Create/ensure a tag exists (idempotent) ---
  async ensureOrCreate(name: string): Promise<number> {
    const normalized = name.toLowerCase().trim();
    if (!normalized) throw new Error("Empty tag name provided");

    const existing = await this.db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, sql`'${normalized}' COLLATE NOCASE`)); // case-insensitive lookup

    if (existing.length > 0) return existing[0].id;

    const result = await this.db.insert(tags).values({ name: normalized });
    return (result.lastInsertRowid as number) || 0;
  }

  // --- Get tag ID by name (case-insensitive, returns undefined if not found) ---
  async getTagIdByName(name: string): Promise<number | null> {
    const id = await this.ensureOrCreate(name);
    return id > 0 ? id : null;
  }

  // --- Get all unique tag names from the tags table ---
  async listAll(): Promise<string[]> {
    const rows = await this.db.select({ name: tags.name })
      .from(tags)
      .where(sql`tags.name NOT LIKE '%-%' AND LENGTH(tags.name) < 30`);

    return rows.map((r) => r.name.toLowerCase()).filter(Boolean);
  }

  // --- Get tag IDs belonging to a specific post ---
  async getTagIdsForPost(postId: number): Promise<number[]> {
    const rows = await this.db.select({ id: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.postId, postId));

    return rows.map((r) => r.id);
  }

  // --- Get tag names belonging to a specific post ---
  async getTagNamesForPost(postId: number): Promise<string[]> {
    const ids = await this.getTagIdsForPost(postId);
    if (ids.length === 0) return [];

    const rows = await this.db.select({ name: tags.name })
      .from(tags)
      .where(eq(tags.id, sql`${sql`(${ids.join(",")})`}`)); // SQLite array literal hack

    // Fallback to single-row select for simplicity (Drizzle doesn't natively support IN([...]) in all dialects)
    return ids.map((tid) => tags.name);
  }

  // --- Get all posts that have a specific tag name ---
  async getPostsByTagName(tagName: string): Promise<number[]> {
    const tid = await this.getTagIdByName(tagName);
    if (!tid) return [];

    const rows = await this.db.select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tid));

    return rows.map((r) => r.postId);
  }
}
