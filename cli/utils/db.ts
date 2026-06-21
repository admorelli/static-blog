/** Database Utilities - Shared DB connection and helpers */

import db from '../../db/db.ts';
import { posts, tags, postTags, subscribers } from '../../db/schema.ts';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureTables(): Promise<void> {
  try {
    await db.select().from(posts).limit(1).execute();
  } catch {
    console.log('Tables not found, running drizzle push...');
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
  }
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export { db, posts, tags, postTags, subscribers, eq, desc, inArray, and, sql };