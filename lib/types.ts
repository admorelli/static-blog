/**
 * Shared types for the static blog
 * This file is committed to git so TypeScript can find types during typecheck
 * The actual data is in lib/static-posts-generated.ts (auto-generated)
 */

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}

export interface Tag {
  id: number;
  name: string;
}