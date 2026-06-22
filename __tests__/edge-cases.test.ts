import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import testDb, {
  tags,
  postTags,
  createPost,
  updatePost,
  deletePost,
  getPostBySlug,
  listPosts,
  listAllTags,
  listTagsForPost,
  listPostsPaginated
} from './test-db';

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Tables are created in test-db.ts setup
});

afterAll(() => {
  // Cleanup handled in test-db.ts
});

// ─── Edge case: Unicode characters ────────────────────────────────────────────

describe('Unicode and special characters', () => {
  it('should handle Unicode in post title', async () => {
    await createPost({
      title: '日本語の投稿',
      slug: 'japanese-post',
      content: 'This post has Japanese characters.',
    });
    const post = await getPostBySlug('japanese-post');
    expect(post).toBeDefined();
    expect(post!.title).toBe('日本語の投稿');
    await deletePost(post!.id);
  });

  it('should handle Unicode in post content', async () => {
    await createPost({
      title: 'Emoji Post',
      slug: 'emoji-post',
      content: 'Hello 🌍 world! This is 🚀 testing. Привет мир! Привет! 🎉',
    });
    const post = await getPostBySlug('emoji-post');
    expect(post).toBeDefined();
    expect(post!.content).toContain('🌍');
    expect(post!.content).toContain('Привет мир');
    await deletePost(post!.id);
  });

  it('should handle special characters in slug', async () => {
    await createPost({
      title: 'Special Slug Post',
      slug: 'post-with-dashes_and_underscores',
      content: 'Slug with mixed separators.',
    });
    const post = await getPostBySlug('post-with-dashes_and_underscores');
    expect(post).toBeDefined();
    await deletePost(post!.id);
  });

  it('should handle tag names with special characters', async () => {
    const res = await testDb
      .insert(tags)
      .values([{ name: 'c++' }, { name: 'node.js' }])
      .returning({ id: tags.id })
      .execute();
    const tagId = res[0].id;

    await createPost({
      title: 'Tagged Special',
      slug: 'tagged-special',
      content: 'Has special tag names.',
    });
    const post = await getPostBySlug('tagged-special');
    const postId = post!.id;
    await testDb.insert(postTags).values([{ postId: postId, tagId }]).execute();

    const foundTags = await listTagsForPost(postId);
    expect(foundTags.length).toBe(1);
    expect(foundTags[0].name).toBe('c++');

    // Cleanup in FK order
    testDb.$client.exec('DELETE FROM post_tags WHERE post_id = ' + postId);
    await deletePost(postId);
    testDb.$client.exec(`DELETE FROM tags WHERE id = ${tagId}`);
  });
});

// ─── Edge case: Empty and minimal values ──────────────────────────────────────

describe('Empty and minimal values', () => {
  it('should handle single-character content', async () => {
    await createPost({
      title: 'X',
      slug: 'single-char-content',
      content: 'X',
    });
    const post = await getPostBySlug('single-char-content');
    expect(post).toBeDefined();
    expect(post!.content).toBe('X');
    await deletePost(post!.id);
  });

  it('should handle post with no tags', async () => {
    await createPost({
      title: 'No Tags Here',
      slug: 'no-tags-here',
      content: 'No tags at all.',
    });
    const post = await getPostBySlug('no-tags-here');
    const tagsResult = await listTagsForPost(post!.id);
    expect(tagsResult).toEqual([]);
    await deletePost(post!.id);
  });

  it('should handle listTagsForPost with non-existent post', async () => {
    const result = await listTagsForPost(-1);
    expect(result).toEqual([]);
  });

  it('should handle listAllTags with no tags', async () => {
    // First ensure clean state
    testDb.$client.exec('DELETE FROM tags');
    const result = await listAllTags();
    expect(result).toEqual([]);
  });
});

// ─── Edge case: Very long content ─────────────────────────────────────────────

describe('Long content and slugs', () => {
  it('should handle very long post content', async () => {
    const longContent = 'Lorem ipsum '.repeat(500); // ~8500 chars
    await createPost({
      title: 'Long Content Post',
      slug: 'long-content-post',
      content: longContent,
    });
    const post = await getPostBySlug('long-content-post');
    expect(post).toBeDefined();
    expect(post!.content.length).toBe(longContent.length);
    await deletePost(post!.id);
  });

  it('should handle moderately long slug', async () => {
    const longSlug = 'a-very-long-slug-with-many-dashes-that-goes-on-and-on-and-on-and-on-post';
    await createPost({
      title: 'Long Slug Post',
      slug: longSlug,
      content: 'This post has a very long slug.',
    });
    const post = await getPostBySlug(longSlug);
    expect(post).toBeDefined();
    expect(post!.slug).toBe(longSlug);
    await deletePost(post!.id);
  });

  it('should handle many tags on a single post', async () => {
    await createPost({
      title: 'Many Tags Post',
      slug: 'many-tags-post',
      content: 'This post has many tags.',
    });
    const post = await getPostBySlug('many-tags-post');
    const postId = post!.id;

    // Create multiple tags
    const tagNames = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
    const tagRes = await testDb
      .insert(tags)
      .values(tagNames.map(n => ({ name: n })))
      .returning({ id: tags.id, name: tags.name })
      .execute();

    await testDb
      .insert(postTags)
      .values(tagRes.map((t: { id: number }) => ({ postId: postId, tagId: t.id })))
      .execute();

    const tagsResult = await listTagsForPost(postId);
    expect(tagsResult.length).toBe(20);

    // Cleanup in FK order
    testDb.$client.exec('DELETE FROM post_tags WHERE post_id = ' + postId);
    await deletePost(postId);
    for (const tag of tagRes) {
      testDb.$client.exec(`DELETE FROM tags WHERE id = ${tag.id}`);
    }
  });
});

// ─── Edge case: Update and delete behavior ────────────────────────────────────

describe('Update and delete edge cases', () => {
  it('should allow updating title only', async () => {
    await createPost({
      title: 'Original',
      slug: 'update-slug',
      content: 'Original content',
    });
    const post = await getPostBySlug('update-slug');

    await updatePost(post!.id, { title: 'Updated Title' });

    const updated = await getPostBySlug('update-slug');
    expect(updated!.title).toBe('Updated Title');
    expect(updated!.slug).toBe('update-slug'); // Unchanged
    expect(updated!.content).toBe('Original content'); // Unchanged
    await deletePost(updated!.id);
  });

  it('should allow updating content only', async () => {
    await createPost({
      title: 'Content Update',
      slug: 'content-update',
      content: 'Original',
    });
    const post = await getPostBySlug('content-update');

    await updatePost(post!.id, { content: 'New content' });

    const updated = await getPostBySlug('content-update');
    expect(updated!.content).toBe('New content');
    expect(updated!.title).toBe('Content Update'); // Unchanged
    await deletePost(updated!.id);
  });

  it('should not affect other posts when deleting', async () => {
    await createPost({
      title: 'Keep Me',
      slug: 'keep-me',
      content: 'Do not delete me.',
    });
    await createPost({
      title: 'Remove Me',
      slug: 'remove-me',
      content: 'Delete me.',
    });

    const before = await listPosts();
    const beforeCount = before.length;

    const toDelete = before.find(p => p.slug === 'remove-me');
    await deletePost(toDelete!.id);

    const after = await listPosts();
    expect(after.length).toBe(beforeCount - 1);

    const stillThere = after.find(p => p.slug === 'keep-me');
    expect(stillThere).toBeDefined();

    // Cleanup
    await deletePost(stillThere!.id);
  });

  it('should handle delete of non-existent post gracefully', async () => {
    // Deleting a non-existent post should not throw
    await expect(deletePost(99999)).resolves.not.toThrow();
  });
});

// ─── Edge case: Search and filter ─────────────────────────────────────────────

describe('Search and filter edge cases', () => {
  it('should find posts by partial title match', async () => {
    await createPost({
      title: 'My Special Post About Tech',
      slug: 'partial-match',
      content: 'Test content.',
    });

    const result = await listPostsPaginated({
      offset: 0,
      limit: 10,
      search: 'Special',
    });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);
    const found = result.posts.find(p => p.slug === 'partial-match');
    expect(found).toBeDefined();

    await deletePost(found!.id);
  });

  it('should find posts by partial content match', async () => {
    await createPost({
      title: 'Content Match Post',
      slug: 'content-match-post',
      content: 'This content has the word database in it.',
    });

    const result = await listPostsPaginated({
      offset: 0,
      limit: 10,
      search: 'database',
    });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);

    await deletePost(result.posts[0].id);
  });

  it('should handle empty search string', async () => {
    const result = await listPostsPaginated({
      offset: 0,
      limit: 10,
      search: '',
    });
    expect(Array.isArray(result.posts)).toBe(true);
  });

  it('should handle case-sensitive search (SQLite LIKE)', async () => {
    await createPost({
      title: 'Case Sensitive',
      slug: 'case-sensitive-post',
      content: 'Testing case sensitivity.',
    });

    // SQLite LIKE is case-insensitive for ASCII by default
    const result = await listPostsPaginated({
      offset: 0,
      limit: 10,
      search: 'CASE',
    });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);

    await deletePost(result.posts.find(p => p.slug === 'case-sensitive-post')!.id);
  });

  it('should handle pagination at boundary', async () => {
    // Use raw insert with explicit timestamps for predictable ordering
    const baseTime = Math.floor(Date.now() / 1000);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P3', 'pag-3', 'P3', ${baseTime})`);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P2', 'pag-2', 'P2', ${baseTime - 1})`);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P1', 'pag-1', 'P1', ${baseTime - 2})`);

    const first = await listPostsPaginated({ offset: 0, limit: 1 });
    expect(first.posts.length).toBe(1);
    expect(first.posts[0].title).toBe('P3');

    const second = await listPostsPaginated({ offset: 1, limit: 1 });
    expect(second.posts.length).toBe(1);
    expect(second.posts[0].title).toBe('P2');

    const last = await listPostsPaginated({ offset: 2, limit: 1 });
    expect(last.posts.length).toBe(1);
    expect(last.posts[0].title).toBe('P1');

    const empty = await listPostsPaginated({ offset: 3, limit: 1 });
    expect(empty.posts.length).toBe(0);

    // Cleanup
    for (const slug of ['pag-1', 'pag-2', 'pag-3']) {
      const p = await getPostBySlug(slug);
      if (p) await deletePost(p.id);
    }
  });

  it('should handle large offset gracefully', async () => {
    const result = await listPostsPaginated({
      offset: 9999,
      limit: 10,
    });
    expect(result.posts).toEqual([]);
    // Note: total may be > 0 if there are other posts in the test DB
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

// ─── Edge case: Tag operations ────────────────────────────────────────────────

describe('Tag operation edge cases', () => {
  it('should handle duplicate tag name insertion gracefully', async () => {
    // The schema has UNIQUE constraint on tags.name
    await testDb.insert(tags).values([{ name: 'unique-test' }]).execute();

    await expect(
      testDb.insert(tags).values([{ name: 'unique-test' }]).execute()
    ).rejects.toThrow();

    // Cleanup
    testDb.$client.exec("DELETE FROM tags WHERE name = 'unique-test'");
  });

  it('should handle post with multiple tags correctly', async () => {
    await createPost({
      title: 'Multi-Tag Post',
      slug: 'multi-tag-post',
      content: 'Multiple tags test.',
    });
    const post = await getPostBySlug('multi-tag-post');
    const postId = post!.id;

    // Create multiple tags
    const tagRes = await testDb
      .insert(tags)
      .values([
        { name: 'edge-a' },
        { name: 'edge-b' },
        { name: 'edge-c' },
      ])
      .returning({ id: tags.id })
      .execute();

    await testDb.insert(postTags).values([
      { postId: postId, tagId: tagRes[0].id },
      { postId: postId, tagId: tagRes[1].id },
      { postId: postId, tagId: tagRes[2].id },
    ]).execute();

    const tagsResult = await listTagsForPost(postId);
    expect(tagsResult.length).toBe(3);

    // Cleanup in FK order
    testDb.$client.exec('DELETE FROM post_tags WHERE post_id = ' + postId);
    await deletePost(postId);
    for (const tag of tagRes) {
      testDb.$client.exec(`DELETE FROM tags WHERE id = ${tag.id}`);
    }
  });
});