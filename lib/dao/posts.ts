import { eq, sql } from "drizzle-orm";
import type { Post } from "../types";
import { getDb } from "../../db/index";

export interface CreatePostInput {
  title: string;
  slug?: string; // normalized URL slug if provided
  content: string;
  date?: string; // ISO-8601 timestamp, default to now() if omitted
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

// +-------------------------------------------+
// |         Posts DAO (CRUD)                   |
// +-------------------------------------------+
export class PostsDAO {
  private db = getDb();

  // --- Lifecycle: create a post ---
  async create(input: CreatePostInput): Promise<Post> {
    const dateStr = input.date ?? new Date().toISOString();
    const result = await this.db.insert(posts).values({
      title: input.title,
      slug: input.slug ? input.slug.toLowerCase().replace(/\s+/g, "-") : undefined,
      content: input.content,
      publishedAt: input.publishedAt || sql`CURRENT_TIMESTAMP`,
    });

    const id = (result.lastInsertRowid as number) || 0;
    return {
      id: String(id), // convert to string for JSON serialization
      title: result[0].title,
      slug: input.slug ? input.slug.toLowerCase().replace(/\s+/g, "-") : null,
      content: result[0].content,
      publishedAt: result[0].published_at ? new Date(result[0].published_at).toISOString() : undefined,
      date: dateStr,
      tags: [], // will be populated by a separate tag-service
    };
  }

  async list(): Promise<Post[]> {
    const rows = await this.db.select().from(posts);
    return rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      slug: row.slug ? row.slug.toLowerCase().replace(/\s+/g, "-") : null,
      content: row.content,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      date: new Date(Date.now()).toISOString(),
      tags: [], // will be populated by a separate tag-service
    }));
  }

  async getOne(idOrSlug: string): Promise<Post | null> {
    const rows = await this.db.select().from(posts).where(sql`${posts.slug} = '${idOrSlug}' OR posts.id = ${parseInt(idOrSlug)}`);
    return rows[0] ? ({
      id: String(rows[0].id),
      title: rows[0].title,
      slug: rows[0].slug ? rows[0].slug.toLowerCase().replace(/\s+/g, "-") : null,
      content: rows[0].content,
      publishedAt: rows[0].published_at ? new Date(rows[0].published_at).toISOString() : undefined,
      date: new Date(Date.now()).toISOString(),
      tags: [], // will be populated by a separate tag-service
    }) : null;
  }

  async updateOne(id: number, input: UpdatePostInput): Promise<Post | null> {
    const result = await this.db.update(posts)
      .set({
        title: input.title ?? posts.title,
        slug: input.slug ? input.slug.toLowerCase().replace(/\s+/g, "-") : posts.slug,
        content: input.content ?? posts.content,
        publishedAt: input.publishedAt ?? sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(posts.id, id));

    return result.changes > 0 ? this.getOne(result.changes[0].slug || String(id)) : null;
  }

  async deleteOne(id: number): Promise<boolean> {
    const result = await this.db.delete(posts).where(eq(posts.id, id));
    return result.changes > 0;
  }
}
