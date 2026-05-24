// +----------------------------------------------------+
// | Fetch all posts that have a specific tag              |
// +----------------------------------------------------+
import type { Post } from "./types";

/**
 * Get an array of Post objects that belong to a given tag name.
 *
 * @param tagName — lowercase, trimmed (e.g., "nextjs")
 * @returns array of Post with tags containing the requested name; empty if none found.
 */
export async function getPostsByTag(tagName: string): Promise<Post[]> {
  // TODO: call db.getPostsByTagName(tagName) and map to Post objects
  return [];
}
