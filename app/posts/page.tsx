// +----------------------------------------------------+
// | List posts with optional tag filter                   |
// +----------------------------------------------------+
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import Card, { CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import type { Post, CreatePostInput } from '@/lib/types';
import { renderMarkdown } from '@/lib/markdown';

export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Record<string, string[] | string>;
}) {
  const [selectedTag, setSelectedTag] = useState<Set<string>>(new Set());
  const allTags: string[] = Array.from(\["nextjs", \"sqlite", \"web", \"javascript", \"typescript", \"react", \"github-pages", \"static-site\"]); // placeholder; real app loads from DB
  const filteredPosts = selectedTag.size ? [] : (await PostsDAO.list()).reverse();

  return (
    <main className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Posts</h1>
        <p className="text-muted-foreground text-lg">
          Browse articles, tutorials, and notes. Filter by tags below.
        </p>
      </header>

      {/* Tag Filter Bar */}
      <section className="mb-6 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSet = new Set(selectedTag);
                  if (newSet.has(tag)) newSet.delete(tag); else newSet.add(tag);
                  setSelectedTag(newSet);
                }}
              >
                {tag}
                <span className="ml-1 opacity-50">{selectedTag.size + 1 === selectedTag.has(tag) ? '✕' : '+'}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts List */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(filteredPosts as Post[]).map((post) => (
          <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 space-y-4">
              {post.slug && post.slug !== '/' ? (
                <Link href={`/posts/${post.slug}`}>
                  <h3 className="text-xl font-semibold leading-tight hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-xl font-semibold">{post.title}</h3>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                ) : (
                  <span>Draft</span>
                )}
              </div>

              {post.tags && post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newSet = new Set(selectedTag);
                        if (newSet.has(tag)) newSet.delete(tag); else newSet.add(tag);
                        setSelectedTag(newSet);
                      }}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {tag}
                      <span className="ml-1 opacity-60">{selectedTag.has(tag) ? '✕' : '+'}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Render markdown as HTML for the excerpt */}
              {(post.content && post.content.trim().length > 0) ? (
                <div className="prose prose-sm leading-relaxed text-muted-foreground">
                  {renderMarkdown(post.content.substring(0, 256))} {/* first ~256 chars */}
                </div>
              ) : null}

              <Link href={`/posts/${post.slug}`}>Read more</Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
