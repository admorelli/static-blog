import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import testDb, { createPost, updatePost, deletePost, getPostBySlug } from './test-db';

// Helper to reset test DB before each test suite
async function setupDatabase() {
  // Tables are created in test-db.ts setup
}

async function resetDatabase() {
  // Delete in order to respect foreign keys
  testDb.$client.exec('DELETE FROM post_tags');
  testDb.$client.exec('DELETE FROM posts');
  testDb.$client.exec('DELETE FROM tags');
}

describe('Posts library API', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it('creates a post and returns its id', async () => {
    const id = await createPost({ title: 'Hello', content: 'World', tags: [] });
    expect(typeof id).toBe('number');
    const post = await getPostBySlug('hello');
    expect(post?.title).toBe('Hello');
  });

  it('updates a post title', async () => {
    const id = await createPost({ title: 'Old', content: 'Text', tags: [] });
    await updatePost(id, { title: 'New' });
    const post = await getPostBySlug('old');
    expect(post?.title).toBe('New');
  });

  it('deletes a post', async () => {
    const id = await createPost({ title: 'Temp', content: 'Tmp', tags: [] });
    await deletePost(id);
    const post = await getPostBySlug('temp');
    expect(post).toBeUndefined();
  });
});