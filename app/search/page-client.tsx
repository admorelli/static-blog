"use client";
import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function getBasePath(): string {
  if (typeof window !== "undefined") {
    const meta = document.querySelector('meta[name="next-base-path"]');
    if (meta) return meta.getAttribute("content") || "";
  }
  return "";
}

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = (searchParams.get("q") || "").trim();

  const query = useMemo(
    () => ({
      queryKey: ["search", initialQuery],
      queryFn: async ({ pageParam = 0 }) => {
        const basePath = getBasePath();
        const res = await fetch(`${basePath}/data/posts-index.json`);
        const indexData = await res.json();
        const term = initialQuery.toLowerCase();
        const filtered = (indexData.posts as Post[]).filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            stripHtml(p.content).toLowerCase().includes(term)
        );
        const offset = pageParam;
        const limit = 10;
        return {
          posts: filtered.slice(offset, offset + limit),
          total: filtered.length,
        };
      },
      getNextPageParam: (lastPage: { posts: Post[]; total: number }, allPages: { posts: Post[] }[]) => {
        const totalLoaded = allPages.reduce((sum, page) => sum + page.posts.length, 0);
        if (totalLoaded < lastPage.total) {
          return totalLoaded;
        }
        return undefined;
      },
      initialPageParam: 0,
    }),
    [initialQuery]
  );

  const { data, isLoading } = useInfiniteQuery(query);

  const allPosts = useMemo(() => data?.pages.flatMap((page) => page.posts) ?? [], [data]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get("query") || "").trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="text"
          name="query"
          defaultValue={initialQuery}
          placeholder="Search posts..."
          className="w-full border rounded p-3 bg-card-bg border-card-border text-foreground"
        />
      </form>

      {isLoading && <p className="text-muted">Searching...</p>}

      {!isLoading && initialQuery && (
        <>
          <p className="text-sm text-muted mb-4">
            {allPosts.length} result{allPosts.length === 1 ? "" : "s"} for &quot;{initialQuery}&quot;
          </p>
          {allPosts.length === 0 ? (
            <p className="text-muted">No matching posts found.</p>
          ) : (
            <ul className="space-y-4">
              {allPosts.map((post) => (
                <li
                  key={post.id}
                  className="border p-4 rounded bg-card-bg border-card-border"
                >
                  <a
                    href={`${getBasePath()}/posts/${post.slug}`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  </a>
                  <p className="text-sm text-muted mb-2">
                    {new Date(post.created_at * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-muted text-sm line-clamp-3">
                    {stripHtml(post.content).slice(0, 200)}...
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!initialQuery && !isLoading && (
        <p className="text-muted">Enter a query to search posts by title and content.</p>
      )}
    </div>
  );
}
