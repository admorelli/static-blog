// Post entity with optional tags
export interface Post {
  id: string; // SQLite auto-increment ID (number) or UUID depending on schema
  title: string;
  slug?: string; // normalized URL slug if defined, otherwise null
  content: string;
  publishedAt: Date | undefined;
  date: string; // ISO-8601 timestamp when created/modified
  tags: string[]; // lowercase tag names (e.g. ["nextjs", "sqlite"])
}

// Post input for creation/update operations
declare global {
  namespace Post {
    interface CreateInput extends Partial<Pick<Post, 'title' | 'slug' | 'content'>> {
      date?: string; // ISO-8601
    }

    interface UpdateInput extends Partial<CreateInput> {}
  }
}
