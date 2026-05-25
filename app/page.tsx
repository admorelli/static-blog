"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag } from '@/lib/tags';
export const dynamic = 'force-dynamic';

function TagFilter() {
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    fetch('/api/tags').then((res) => res.json()).then(setTags);
  }, []);

  const toggleTag = (id: number) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelected(newSet);
    const params = new URLSearchParams();
    newSet.forEach((i) => params.append('tag', i.toString()));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          className="w-full border rounded p-2"
          onChange={(e) => {
            const q = e.target.value;
            const params = new URLSearchParams(searchParams);
            if (q) params.set('q', q); else params.delete('q');
            router.push(`?${params.toString()}`);
          }}
        />
      </div>
      <div className="mb-4">
        <strong>Filter by tags:</strong>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((t) => (
            <label key={t.id} className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggleTag(t.id)}
              />
              <span>{t.name}</span>
            </label>
          ))}
        </div>
      </div>
      <p>Posts list will appear here (implementation pending).</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <TagFilter />
    </Suspense>
  );
}
