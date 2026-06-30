"use client";

import { Fragment, useRef, useEffect, useMemo, createElement, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTags, useTagFilter, useFilteredPosts } from "./hooks/use-home-filters";

function getBasePath(): string {
  if (typeof window === "undefined") return "";
  const meta = document.querySelector('meta[name="next-base-path"]');
  return meta?.getAttribute("content") ?? "";
}

function Excerpt({ html }: { html: string }) {
  const text = useMemo(() => {
    const normalized = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    const sentences = normalized.match(/[^.!?]+[.!?]*/g) ?? [];
    return sentences.slice(0, 20).join(" ") + (sentences.length > 20 ? "..." : "");
  }, [html]);

  return createElement(
    "p",
    {
      className: "prose prose-sm text-muted mb-3",
      dangerouslySetInnerHTML: { __html: text },
    }
  );
}

export default function HomePageClient() {
  const tags = useTags();
  const { selected, toggleTag } = useTagFilter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = getBasePath();
  const [localSearch, setLocalSearch] = useState(
    () => searchParams.get("q")?.toLowerCase() ?? ""
  );
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFilteredPosts({ search: localSearch, tagIds: Array.from(selected) });
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = useMemo(() => data?.pages.flatMap((page) => page.posts) ?? [], [data]);

  if (isLoading && posts.length === 0) {
    return <div className="p-4 text-center text-muted">Loading posts...</div>;
  }

  if (posts.length === 0) {
    if (localSearch) {
      return (
        <div className="p-4 text-center text-muted">
          No results for &quot;{localSearch}&quot;
        </div>
      );
    }
    return <p className="p-4 text-center text-muted">No posts found.</p>;
  }

  const updateQuery = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (!value) params.delete("q");
    else params.set("q", value);
    const next = params.toString();
    router.replace(next ? `?${next}` : location.pathname);
  };

  return (
    <Fragment>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Home</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={localSearch}
            className="w-full border rounded p-2 bg-card-bg border-card-border text-foreground"
            onChange={(e) => setLocalSearch(e.target.value)}
            onBlur={() => updateQuery(localSearch)}
          />
        </div>
        <div className="mb-4">
          <strong className="block mb-2">Filter by tags:</strong>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                aria-pressed={selected.has(tag.id)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selected.has(tag.id)
                    ? "bg-accent text-white border-accent hover:bg-accent-hover"
                    : "bg-card-bg text-muted border-card-border hover:bg-card-border hover:text-foreground"
                }`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 max-w-2xl mx-auto">
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="border p-4 rounded bg-card-bg border-card-border"
            >
              <a
                href={`${basePath}/posts/${post.slug}`}
                className="text-foreground hover:text-accent transition-colors"
              >
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-sm text-muted mb-2">
                  {new Date(post.created_at * 1000).toLocaleDateString()}
                </p>
              </a>
              <Excerpt html={post.excerpt ?? post.content} />
              <a
                href={`${basePath}/posts/${post.slug}`}
                className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
              >
                Read more
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="text-center py-2 text-muted">
            Loading more...
          </div>
        )}
      </div>
    </Fragment>
  );
}
