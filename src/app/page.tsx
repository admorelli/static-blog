import { useEffect, useState, useRef } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import Image from 'next/image';
import { Tag } from '@/lib/tags';
import { Post } from '@/lib/posts';

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

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags);
  }, []);

  const fetchPosts = async (reset: boolean = false) => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    selectedTags.forEach((id) => params.append('tag', String(id)));
    if (reset) params.set('offset', '0');
    const res = await fetch(`/api/posts/search?${params.toString()}`);
    const data = await res.json();
    if (reset) setPosts(data.posts);
    else setPosts((p) => [...p, ...data.posts]);
    setHasMore(data.total > (reset ? data.posts.length : posts.length + data.posts.length));
    setOffset((s) => (reset ? PAGE_LIMIT : s + PAGE_LIMIT));
  };

  useEffect(() => { fetchPosts(true); }, [debouncedSearch, selectedTags]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchPosts();
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, hasMore]);

  const toggleTag = (id: number) => {
    setSelectedTags((s) => {
      const newSet = new Set(s);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Static Blog</h1>
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
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
            <p className="text-sm text-gray-500">{p.created_at}</p>
          </li>
        ))}
      </ul>
      {hasMore && <div ref={loaderRef} className="h-4">Loading...</div>}
    </main>
  );
}
