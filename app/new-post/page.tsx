import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

import { renderMarkdown } from '@/lib/markdown';

// +----------------------------------------------------+
// | Form to create a new post (title, content, tags)      |
// +----------------------------------------------------+
'use client';

import { useState } from 'react';
import type { Post, CreatePostInput } from '@/lib/types';
import Card, { CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState(\[\]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      // TODO: POST /api/posts with body { title, content, date } and tags parsed from tagsStr
      alert('Post creation not yet connected to real API — implement the fetch call.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">New Post</h1>
        <p className="text-muted-foreground text-lg">
          Write a new article. Tags can be added via comma-separated list (e.g., \"nextjs,sqlite\").
        </p>
      </header>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Title field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:bg-transparent file:text-inherit file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          {/* Content field */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Body / Markdown
            </label>
            <textarea
              id="content"
              rows={12}
              placeholder="Write your article here in markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:bg-transparent file:text-inherit file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          {/* Tags field */}
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tags (comma-separated, e.g. \"nextjs,sqlite\")
            </label>
            <input
              id="tags"
              type="text"
              placeholder="e.g., nextjs, sqlite, web"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:bg-transparent file:text-inherit file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Preview / Status */}
          <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            <p>📝 Writing in markdown. Tags will be stored as-is and searchable on the posts page.</p>
            <button
              onClick={() => {
                const preview = post.content ? renderMarkdown(post.content) : null;
                // TODO: Insert a live preview div here with contentEditable or React.StrictMode wrapper for WYSIWYG editing.
              }}
              className="underline text-primary"
            >
              Live Preview (WIP)
            </button>
          </div>

          {/* Submit button */}
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting} size="lg" className="w-full">
            {isSubmitting ? 'Publishing...' : 'Create Post'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
