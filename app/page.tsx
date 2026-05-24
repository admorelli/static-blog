'use client';
import { useEffect, useState, useRef } from 'react';
// Debounce hook implementation (replaces missing external library)
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
import { Tag } from '../../src/lib/tags';
import { Post } from '../../src/lib/posts';

const PAGE_LIMIT = 10;

export default function Home() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Load tags once
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then(setTags);
  }, []);

  const fetchPosts = async (reset = false) => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    selectedTags.forEach((id) => params.append('tag', String(id)));
    params.set('offset', reset ? '0' : String(offset));
    params.set('limit', String(PAGE_LIMIT));
    const res = await fetch(`/api/posts/search?${params.toString()}`);
    const data = await res.json();
    if (reset) setPosts(data.posts);
    else setPosts((p) => [...p, ...data.posts]);
    setHasMore(data.total > (reset ? data.posts.length : posts.length + data.posts.length));
    setOffset((s) => (reset ? PAGE_LIMIT : s + PAGE_LIMIT));
  };

  // Refetch when search or tags change
  useEffect(() => {
    setOffset(0);
    fetchPosts(true);
  }, [debouncedSearch, selectedTags]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchPosts();
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, hasMore]);

  const toggleTag = (id: number) => {
    setSelectedTags((s) => {
      const newSet = new Set(s);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  return (
    <main className="p-6 max-w-3xl mx-auto bg-transparent rounded-lg shadow-md mt-10" style={{width: '98vw', display:'flex', flexDirection:'column'}}>
      <h1 className="text-2xl font-bold mb-4">Static Blog</h1>
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-4 mb-4 rounded-full border border-gray-300 bg-transparent backdrop-filter backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleTag(t.id)}
            className={`px-3 py-1 rounded ${selectedTags.has(t.id) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="text-sm text-gray-500">{new Date(p.created_at * 1000).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
      {hasMore && <div ref={loaderRef} className="h-4 flex items-center justify-center text-gray-500">Loading ({posts.length})...</div>}
    </main>
  );
}
