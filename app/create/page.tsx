'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/data/tags.json')
      .then((res) => res.json())
      .then((data) => setTagSuggestions(data.map((t: { name: string }) => t.name)))
      .catch(() => setTagSuggestions([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const body = { title, slug, content, tags: tagsArray };
    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push(`/posts/${slug}`);
    } else {
      alert('Error creating post');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded p-2"
        />
        <input
          type="text"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="w-full border rounded p-2"
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full border rounded p-2 h-32"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            list="tag-suggestions"
            className="w-full border rounded p-2"
          />
          <datalist id="tag-suggestions">
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Start typing to see existing tags, or create new ones
          </p>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded"
        >
          Create
        </button>
      </form>
    </div>
  );
}