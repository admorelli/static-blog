import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import testDb, {
  posts,
  tags,
  postTags,
  listPosts,
  createPost,
  getPostBySlug,
  updatePost,
  deletePost,
  listPostsPaginated,
  listAllTags,
  listTagsForPost,
  getPostsBySeries,
  getAllSeries,
  getNextInSeries,
  getPrevInSeries,
  searchPostsFTS,
} from './test-db';
import { eq } from 'drizzle-orm';

// Helper functions for series tests
async function createSeriesPosts(seriesName: string, titles: string[]): Promise<number[]> {
  const postIds: number[] = [];
  for (let i = 0; i < titles.length; i++) {
    const id = await createPost({
      title: titles[i],
      slug: `${seriesName.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      content: `Content for ${titles[i]}`,
    });
    await testDb.update(posts).set({ series: seriesName, series_order: i + 1 }).where(eq(posts.id, id));
    postIds.push(id);
  }
  return postIds;
}

describe('listPosts', () => {
  beforeEach(async () => {
    // Clear posts table
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns all posts ordered by created_at descending', async () => {
    // Use raw inserts with explicit timestamps for predictable ordering
    const baseTime = Math.floor(Date.now() / 1000);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('First', 'first-post', 'C1', ${baseTime - 10})`);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('Second', 'second-post', 'C2', ${baseTime})`);

    const result = await listPosts();
    // Posts are ordered by newest first (desc on created_at)
    expect(result.length).toBe(2);
    // Second has newer timestamp, should appear first
    expect(result[0].title).toBe('Second');
    expect(result[1].title).toBe('First');
  });

  it('includes series and series_order fields', async () => {
    await createPost({ title: 'With Series', slug: 'with-series', content: 'C1' });
    const post = await getPostBySlug('with-series');
    expect(post).toBeDefined();
    expect(post!.series).toBeNull();
    expect(post!.series_order).toBeNull();
  });
});

describe('getPostBySlug', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns post when found', async () => {
    await createPost({ title: 'Test', slug: 'test', content: 'Content' });
    const result = await getPostBySlug('test');
    expect(result).toBeDefined();
    expect(result!.title).toBe('Test');
    expect(result!.slug).toBe('test');
  });

  it('returns undefined when not found', async () => {
    const result = await getPostBySlug('nonexistent');
    expect(result).toBeUndefined();
  });
});

describe('createPost', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('inserts post with auto-generated slug and timestamp', async () => {
    const id = await createPost({ title: 'My Post', slug: 'my-post', content: 'Content' });
    expect(id).toBeGreaterThan(0);
    const post = await getPostBySlug('my-post');
    expect(post).toBeDefined();
    expect(post!.title).toBe('My Post');
  });

  it('generates slug from title if not provided', async () => {
    await createPost({ title: 'Auto Slug Post', content: 'Content' });
    const post = await getPostBySlug('auto-slug-post');
    expect(post).toBeDefined();
  });
});

describe('updatePost', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('updates post with provided fields', async () => {
    await createPost({ title: 'Original', slug: 'original', content: 'Content' });
    const post = await getPostBySlug('original');
    await updatePost(post!.id, { title: 'Updated' });

    const updated = await getPostBySlug('original');
    expect(updated!.title).toBe('Updated');
    expect(updated!.content).toBe('Content'); // Unchanged
  });
});

describe('deletePost', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('deletes post by id', async () => {
    await createPost({ title: 'To Delete', slug: 'to-delete', content: 'Content' });
    const post = await getPostBySlug('to-delete');
    await deletePost(post!.id);

    const deleted = await getPostBySlug('to-delete');
    expect(deleted).toBeUndefined();
  });
});

describe('getPostsBySeries', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns posts in series ordered by series_order', async () => {
    await createSeriesPosts('Series A', ['Part 1', 'Part 2', 'Part 3']);
    await createSeriesPosts('Series B', ['Part 1', 'Part 2']);

    const seriesA = await getPostsBySeries('Series A');
    expect(seriesA.length).toBe(3);
    expect(seriesA[0].series_order).toBe(1);
    expect(seriesA[1].series_order).toBe(2);
    expect(seriesA[2].series_order).toBe(3);

    const seriesB = await getPostsBySeries('Series B');
    expect(seriesB.length).toBe(2);
  });

  it('returns empty array when series not found', async () => {
    const result = await getPostsBySeries('Non-existent Series');
    expect(result).toEqual([]);
  });
});

describe('getAllSeries', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns unique series names sorted', async () => {
    await createSeriesPosts('Z Series', ['Post 1']);
    await createSeriesPosts('A Series', ['Post 1']);
    await createSeriesPosts('M Series', ['Post 1']);

    const result = await getAllSeries();
    expect(result).toEqual(['A Series', 'M Series', 'Z Series']);
  });

  it('ignores posts without series', async () => {
    await createPost({ title: 'No Series', slug: 'no-series', content: 'Content' });
    await createSeriesPosts('Existing Series', ['Post 1']);

    const result = await getAllSeries();
    expect(result).toEqual(['Existing Series']);
  });
});

describe('getNextInSeries', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns next post in series', async () => {
    await createSeriesPosts('Test Series', ['First', 'Second', 'Third']);
    const posts = await getPostsBySeries('Test Series');

    const next = await getNextInSeries('Test Series', posts[0].series_order!);
    expect(next).toBeDefined();
    expect(next!.title).toBe('Second');

    const next2 = await getNextInSeries('Test Series', posts[1].series_order!);
    expect(next2!.title).toBe('Third');
  });

  it('returns undefined when no next post', async () => {
    await createSeriesPosts('Test Series', ['First', 'Second']);
    const posts = await getPostsBySeries('Test Series');

    const next = await getNextInSeries('Test Series', posts[1].series_order!);
    expect(next).toBeUndefined();
  });
});

describe('getPrevInSeries', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns previous post in series', async () => {
    await createSeriesPosts('Test Series', ['First', 'Second', 'Third']);
    const posts = await getPostsBySeries('Test Series');

    const prev = await getPrevInSeries('Test Series', posts[1].series_order!);
    expect(prev).toBeDefined();
    expect(prev!.title).toBe('First');

    const prev2 = await getPrevInSeries('Test Series', posts[2].series_order!);
    expect(prev2!.title).toBe('Second');
  });

  it('returns undefined when no previous post', async () => {
    await createSeriesPosts('Test Series', ['First', 'Second']);
    const posts = await getPostsBySeries('Test Series');

    const prev = await getPrevInSeries('Test Series', posts[0].series_order!);
    expect(prev).toBeUndefined();
  });
});

describe('listAllTags', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM tags');
    testDb.$client.exec('DELETE FROM post_tags');
  });

  it('returns all tags ordered by name', async () => {
    await testDb.insert(tags).values([{ name: 'b-tag' }, { name: 'a-tag' }]).execute();

    const result = await listAllTags();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('a-tag');
    expect(result[1].name).toBe('b-tag');
  });
});

describe('listPostsPaginated', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
    testDb.$client.exec('DELETE FROM post_tags');
    testDb.$client.exec('DELETE FROM tags');
  });

  it('returns paginated posts with total count', async () => {
    // Create 25 posts with decreasing timestamps for predictable ordering
    const baseTime = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 25; i++) {
      testDb.$client.exec(
        `INSERT INTO posts (title, slug, content, created_at) VALUES ('Post ${i + 1}', 'post-${i + 1}', 'Content ${i + 1}', ${baseTime - i * 100})`
      );
    }

    const result = await listPostsPaginated({ offset: 0, limit: 10 });
    expect(result.posts.length).toBe(10);
    expect(result.total).toBe(25);
    // First page should have newest posts (i=0 has highest created_at)
    expect(result.posts[0].title).toBe('Post 1');
    expect(result.posts[9].title).toBe('Post 10');
  });

  it('returns empty when no posts match tag filter', async () => {
    await createPost({ title: 'Post', slug: 'post', content: 'C' });
    const tagRow = await testDb.insert(tags).values({ name: 'unused-tag' }).returning({ id: tags.id }).execute();

    const result = await listPostsPaginated({ offset: 0, limit: 10, tags: [tagRow[0].id] });
    // Post doesn't have that tag, so should return empty
    expect(result.posts).toEqual([]);
  });

  it('handles pagination at boundary', async () => {
    // Use raw insert with explicit timestamps for predictable ordering
    const baseTime = Math.floor(Date.now() / 1000);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P1', 'pag-1', 'P1', ${baseTime})`);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P2', 'pag-2', 'P2', ${baseTime - 1})`);
    testDb.$client.exec(`INSERT INTO posts (title, slug, content, created_at) VALUES ('P3', 'pag-3', 'P3', ${baseTime - 2})`);

    const first = await listPostsPaginated({ offset: 0, limit: 1 });
    expect(first.posts.length).toBe(1);
    expect(first.posts[0].title).toBe('P1'); // Newest first (P1 has highest created_at)

    const second = await listPostsPaginated({ offset: 1, limit: 1 });
    expect(second.posts.length).toBe(1);
    expect(second.posts[0].title).toBe('P2');

    const last = await listPostsPaginated({ offset: 2, limit: 1 });
    expect(last.posts.length).toBe(1);
    expect(last.posts[0].title).toBe('P3');

    const empty = await listPostsPaginated({ offset: 3, limit: 1 });
    expect(empty.posts.length).toBe(0);
    expect(empty.total).toBe(3);

    // Cleanup
    for (const slug of ['pag-1', 'pag-2', 'pag-3']) {
      const p = await getPostBySlug(slug);
      if (p) await deletePost(p.id);
    }
  });
});

describe('searchPostsFTS', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM posts');
    testDb.$client.exec('DELETE FROM post_tags');
    testDb.$client.exec('DELETE FROM tags');
    // Recreate FTS table
    testDb.$client.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
        id UNINDEXED, title, content, tokenize='porter unicode61'
      );
    `);
  });

  it('returns empty array for empty query', async () => {
    const result = await searchPostsFTS('', 10);
    expect(result).toEqual([]);
  });

  it('finds posts by content', async () => {
    await createPost({
      title: 'Test Post',
      slug: 'test-post',
      content: 'This is about database technology',
    });

    const result = await searchPostsFTS('database', 10);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('listTagsForPost', () => {
  beforeEach(async () => {
    testDb.$client.exec('DELETE FROM tags');
    testDb.$client.exec('DELETE FROM post_tags');
    testDb.$client.exec('DELETE FROM posts');
  });

  it('returns tags for a post', async () => {
    await createPost({ title: 'Tagged Post', slug: 'tagged-post', content: 'Content' });
    const post = await getPostBySlug('tagged-post');
    const postId = post!.id;

    // Create tags
    const tagRes = await testDb
      .insert(tags)
      .values([{ name: 'tag1' }, { name: 'tag2' }])
      .returning({ id: tags.id })
      .execute();

    await testDb
      .insert(postTags)
      .values([
        { postId, tagId: tagRes[0].id },
        { postId, tagId: tagRes[1].id },
      ])
      .execute();

    const result = await listTagsForPost(postId);
    expect(result.length).toBe(2);
    expect(result.map(t => t.name).sort()).toEqual(['tag1', 'tag2']);
  });
});

describe('series navigation integration', () => {
  beforeEach(async () => {
    // Delete in correct order: post_tags first (FK), then posts
    testDb.$client.exec('DELETE FROM post_tags');
    testDb.$client.exec('DELETE FROM posts');
  });

  it('provides correct next/prev navigation for middle post', async () => {
    await createSeriesPosts('Nav Series', ['First', 'Second', 'Third', 'Fourth']);
    const seriesPosts = await getPostsBySeries('Nav Series');

    // Second post should have prev=First, next=Third
    const secondPost = seriesPosts[1];
    const prev = await getPrevInSeries('Nav Series', secondPost.series_order!);
    const next = await getNextInSeries('Nav Series', secondPost.series_order!);

    expect(prev).toBeDefined();
    expect(prev!.title).toBe('First');
    expect(next).toBeDefined();
    expect(next!.title).toBe('Third');
  });

  it('handles first and last posts in series', async () => {
    await createSeriesPosts('End Series', ['Start', 'Middle', 'End']);
    const seriesPosts = await getPostsBySeries('End Series');

    // First post
    const firstNext = await getNextInSeries('End Series', seriesPosts[0].series_order!);
    const firstPrev = await getPrevInSeries('End Series', seriesPosts[0].series_order!);
    expect(firstNext).toBeDefined();
    expect(firstNext!.title).toBe('Middle');
    expect(firstPrev).toBeUndefined();

    // Last post
    const lastNext = await getNextInSeries('End Series', seriesPosts[2].series_order!);
    const lastPrev = await getPrevInSeries('End Series', seriesPosts[2].series_order!);
    expect(lastNext).toBeUndefined();
    expect(lastPrev).toBeDefined();
    expect(lastPrev!.title).toBe('Middle');
  });
});

// Helper to reset test DB
async function resetDatabase() {
  // Delete in order to respect foreign keys
  testDb.$client.exec('DELETE FROM post_tags');
  testDb.$client.exec('DELETE FROM posts');
  testDb.$client.exec('DELETE FROM tags');
}

afterAll(async () => {
  await resetDatabase();
});
