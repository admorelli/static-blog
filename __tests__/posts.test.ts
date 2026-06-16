import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '../db/db';
import * as posts from '../lib/posts';
import { posts as postsSchema } from '../db/schema';

const mockedDb = vi.mocked(db.default);

// Safe escape hatch for incompatible test mock types
function asType<T>(value: unknown): T {
  return value as T;
}

// Type helpers using the actual mocked method return types
type SelectBuilder = ReturnType<typeof mockedDb.select>;
type InsertBuilder = ReturnType<typeof mockedDb.insert>;
type UpdateBuilder = ReturnType<typeof mockedDb.update>;
type DeleteBuilder = ReturnType<typeof mockedDb.delete>;

function createSelectMock<T>(result: T): SelectBuilder {
  return asType<SelectBuilder>({
    from: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockResolvedValue(result),
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  });
}

function createInsertMock(lastInsertRowid: number = 1): InsertBuilder {
  return asType<InsertBuilder>({
    values: vi.fn().mockReturnValue({
      run: vi.fn().mockResolvedValue({ lastInsertRowid }),
    }),
  });
}

function createUpdateMock(): UpdateBuilder {
  return asType<UpdateBuilder>({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
}

function createDeleteMock(): DeleteBuilder {
  return asType<DeleteBuilder>({
    where: vi.fn().mockResolvedValue(undefined),
  });
}

vi.mock('../db/db', () => ({
  default: {
    select: vi.fn().mockReturnValue(createSelectMock([])),
    insert: vi.fn().mockReturnValue(createInsertMock()),
    update: vi.fn().mockReturnValue(createUpdateMock()),
    delete: vi.fn().mockReturnValue(createDeleteMock()),
  },
}));

describe('listPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all posts ordered by created_at descending', async () => {
    const mockPosts = [
      { id: 1, title: 'First', slug: 'first', content: 'C1', created_at: 1000 },
      { id: 2, title: 'Second', slug: 'second', content: 'C2', created_at: 2000 },
    ];

    mockedDb.select.mockReturnValue(createSelectMock(mockPosts));

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

    mockedDb.select.mockReturnValue(createSelectMock(mockPost));

    const result = await posts.getPostBySlug('test');
    expect(result).toEqual(mockPost);
  });

  it('returns undefined when not found', async () => {
    mockedDb.select.mockReturnValue(createSelectMock(undefined));

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
  });
});

describe('updatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates post with provided fields', async () => {
    mockedDb.update.mockReturnValue(createUpdateMock());

    await posts.updatePost(1, { title: 'Updated' });

    expect(mockedDb.update).toHaveBeenCalledWith(postsSchema);
  });
});

describe('deletePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes post by id', async () => {
    mockedDb.delete.mockReturnValue(createDeleteMock());

    await posts.deletePost(1);

    expect(mockedDb.delete).toHaveBeenCalledWith(postsSchema);
  });
});