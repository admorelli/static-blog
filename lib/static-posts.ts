import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

const DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'posts-index.json');

let postsCache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (postsCache) return postsCache;
  if (!fs.existsSync(DATA_PATH)) return [];
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  postsCache = data.posts as Post[];
  return postsCache;
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}