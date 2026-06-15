import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../db/db';
import { posts, tags, postTags } from '../db/schema';
import { listAllTags, listTagsForPost, listPostsPaginated } from '../lib/tags';
import { createPost } from '../lib/posts';

let postId1: number;
let postId2: number;
let postId3: number;
let tagIdTech: number;
let tagIdLife: number;
let tagIdScience: number;

beforeAll(async () => {
  // Clean tables
  db.$client.exec('DELETE FROM post_tags');
  db.$client.exec('DELETE FROM posts');
  db.$client.exec('DELETE FROM tags');

  // Create tables if not exist
  db.$client.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0
  );`);
  db.$client.exec(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);`);
  db.$client.exec(`CREATE TABLE IF NOT EXISTS post_tags (post_id INTEGER NOT NULL REFERENCES posts(id), tag_id INTEGER NOT NULL REFERENCES tags(id));`);

  // Seed exactly 3 tags
  const tagRows = await db
    .insert(tags)
    .values([{ name: 'life' }, { name: 'science' }, { name: 'tech' }])
    .returning({ id: tags.id, name: tags.name })
    .execute();
  const nameToId = Object.fromEntries(tagRows.map(t => [t.name, t.id]));
  tagIdLife = nameToId.life;
  tagIdScience = nameToId.science;
  tagIdTech = nameToId.tech;

  // Seed 3 posts
  const postRows = await db
    .insert(posts)
    .values([
      { title: 'Life Post', slug: 'life-post', content: 'About life', created_at: 1 },
      { title: 'Science Post', slug: 'science-post', content: 'Scientific content', created_at: 2 },
      { title: 'Tech Post', slug: 'tech-post', content: 'Tech content', created_at: 3 },
    ])
    .returning({ id: posts.id, slug: posts.slug })
    .execute();
  const slugToId = Object.fromEntries(postRows.map(p => [p.slug, p.id]));
  postId1 = slugToId['life-post'];
  postId2 = slugToId['science-post'];
  postId3 = slugToId['tech-post'];

  // Link posts to tags
  await db
    .insert(postTags)
    .values([
      { postId: postId1, tagId: tagIdLife },
      { postId: postId2, tagId: tagIdScience },
      { postId: postId3, tagId: tagIdScience },
      { postId: postId3, tagId: tagIdTech },
    ])
    .execute();
});

afterAll(async () => {
  db.$client.exec('DELETE FROM post_tags');
  db.$client.exec('DELETE FROM posts');
  db.$client.exec('DELETE FROM tags');
});

describe('listAllTags', () => {
  it('should return all tags sorted alphabetically', async () => {
    const result = await listAllTags();
    expect(result.length).toBe(3);
    expect(result[0].name).toBe('life');
    expect(result[1].name).toBe('science');
    expect(result[2].name).toBe('tech');
  });
});

describe('listTagsForPost', () => {
  it('should return tags for a post', async () => {
    const result = await listTagsForPost(postId1);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('life');
  });

  it('should return multiple tags for a post', async () => {
    const result = await listTagsForPost(postId3);
    const names = result.map(t => t.name).sort();
    expect(names).toEqual(['science', 'tech']);
  });
});

describe('listPostsPaginated', () => {
  it('should return posts with pagination', async () => {
    const result = await listPostsPaginated({ offset: 0, limit: 2 });
    expect(result.posts.length).toBe(2);
    expect(result.total).toBe(3);
  });

  it('should support search by title', async () => {
    const result = await listPostsPaginated({ offset: 0, limit: 10, search: 'Tech' });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);
  });

  it('should support search by content', async () => {
    const result = await listPostsPaginated({ offset: 0, limit: 10, search: 'Tech content' });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by tag id', async () => {
    console.log('Calling listPostsPaginated with', { offset: 0, limit: 10, tags: [tagIdTech] });
    const result = await listPostsPaginated({ offset: 0, limit: 10, tags: [tagIdTech] });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);
  });
});