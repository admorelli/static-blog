// +----------------------------------------------------+
// | CLI Utility Functions: addTags, removeTagFromPost     |
// +----------------------------------------------------+
import { eq } from "drizzle-orm";
import type { Post } from "./types";
import { getDb } from "../db/index";

export async function addTagsToPost(postId: number, tagNames: string[]): Promise<void> {
  if (!tagNames || !Array.isArray(tagNames)) throw new Error("Invalid tags array");
  const db = getDb();
  const tagService = new TagService();

  for (const name of tagNames) {
    const tid = await tagService.getTagIdByName(name);
    if (!tid) continue;

    // Check if already linked, skip duplicate pairs
    const exists = await db.select({})
      .from(postTags)
      .where(sql`${postTags.postId} = ${postId} AND postTags.tagId = ${tid}`);

    if (exists.length === 0) {
      await db.insert(postTags).values({ postId, tagId: tid });
    }
  }
}

export async function removeTagFromPost(postId: number, tagName: string): Promise<boolean> {
  const tagService = new TagService();
  const tid = await tagService.getTagIdByName(tagName);
  if (!tid) return false;

  const db = getDb();
  const result = await db.delete(postTags)
    .where(sql`${postTags.postId} = ${postId} AND postTags.tagId = ${tid}`);
  return result.changes > 0;
}
