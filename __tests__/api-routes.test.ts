import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import testDb, { createPost, updatePost, deletePost, getPostBySlug } from './test-db';
import { resetDatabase } from '../utils/cleanup';

async function setupDatabase() {
  // Tables are created in test-db.ts setup
}

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
});

describe('Posts library API', () => {
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
