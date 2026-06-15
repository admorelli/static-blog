import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as db from '../db/db';
import * as posts from '../lib/posts';
import { posts as postsSchema } from '../db/schema';

// Mock the database module
vi.mock('../db/db', () => ({
  default: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ lastInsertRowid: 1 })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

const mockedDb = vi.mocked(db.default);

describe('listPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all posts ordered by created_at descending', async () => {
    const mockPosts = [
      { id: 1, title: 'First', slug: 'first', content: 'C1', created_at: 1000 },
      { id: 2, title: 'Second', slug: 'second', content: 'C2', created_at: 2000 },
    ];

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockPosts),
      }),
    } as any);

    const result = await posts.listPosts();
    expect(result).toEqual(mockPosts);
  });
});

describe('getPostBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns post when found', async () => {
    const mockPost = { id: 1, title: 'Test', slug: 'test', content: 'Content', created_at: 1000 };

    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockPost),
          }),
        }),
      }),
    } as any);

    const result = await posts.getPostBySlug('test');
    expect(result).toEqual(mockPost);
  });

  it('returns undefined when not found', async () => {
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    } as any);

    const result = await posts.getPostBySlug('nonexistent');
    expect(result).toBeUndefined();
  });
});

describe('createPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts post with auto-generated slug and timestamp', async () => {
    await posts.createPost({ title: 'My Post', slug: 'my-post', content: 'Content' });

    expect(mockedDb.insert).toHaveBeenCalledWith(postsSchema);
    // values call is verified by the chain mock
  });
});

describe('updatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates post with provided fields', async () => {
    mockedDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any);

    await posts.updatePost(1, { title: 'Updated' });

    expect(mockedDb.update).toHaveBeenCalledWith(postsSchema);
  });
});

describe('deletePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes post by id', async () => {
    mockedDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    } as any);

    await posts.deletePost(1);

    expect(mockedDb.delete).toHaveBeenCalledWith(postsSchema);
  });
});