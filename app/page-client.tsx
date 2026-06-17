"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tag } from "@/lib/tags";
import { useInfiniteQuery } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}

function getBasePath(): string {
  if (typeof window !== "undefined") {
    const meta = document.querySelector('meta[name="next-base-path"]');
    if (meta) return meta.getAttribute("content") || "";
  }
  return "";
}

function TagFilter() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = getBasePath();

  useEffect(() => {
    fetch(`${basePath}/data/tags.json`)
      .then((res) => res.json())
      .then(setTags)
      .catch(() => setTags([]));
  }, [basePath]);

  const toggleTag = (id: number) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
    const params = new URLSearchParams();
    newSet.forEach((i) => params.append("tag", i.toString()));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          className="w-full border rounded p-2 bg-card-bg border-card-border text-foreground"
          onChange={(e) => {
            const q = e.target.value;
            const params = new URLSearchParams(searchParams);
            if (q) params.set("q", q);
            else params.delete("q");
            router.push(`?${params.toString()}`);
          }}
        />
      </div>
      <div className="mb-4">
        <strong className="block mb-2">Filter by tags:</strong>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selected.has(t.id)
                  ? "bg-accent text-white border-accent hover:bg-accent-hover"
                  : "bg-card-bg text-muted border-card-border hover:bg-card-border hover:text-foreground"
              }`}
              aria-pressed={selected.has(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostsList() {
  const searchParams = useSearchParams();
  const search = searchParams.get("q")?.toLowerCase();
  const tagIds = searchParams
    .getAll("tag")
    .map(Number)
    .filter(Boolean);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["posts", search, tagIds],
      queryFn: async ({ pageParam = 0 }) => {
        const basePath = getBasePath();
        const res = await fetch(`${basePath}/data/posts-index.json`);
        const indexData = await res.json();
        let posts = indexData.posts as Post[];

        if (search) {
          posts = posts.filter(
            (p) =>
              p.title.toLowerCase().includes(search) ||
              p.content.toLowerCase().includes(search)
          );
        }

        if (tagIds.length > 0) {
          const tagRes = await fetch(`${basePath}/data/post-tags.json`);
          const postTags = await tagRes.json();
          const taggedPostIds = new Set(
            postTags
              .filter((pt: { tagId: number }) => tagIds.includes(pt.tagId))
              .map((pt: { postId: number }) => pt.postId)
          );
          posts = posts.filter((p) => taggedPostIds.has(p.id));
        }

        const offset = pageParam;
        const limit = 10;
        const paginatedPosts = posts.slice(offset, offset + limit);

        return {
          posts: paginatedPosts,
          total: posts.length,
        };
      },
      getNextPageParam: (lastPage, allPages) => {
        const totalLoaded = allPages.reduce(
          (sum, page) => sum + page.posts.length,
          0
        );
        if (totalLoaded < lastPage.total) {
          return totalLoaded;
        }
        return undefined;
      },
      initialPageParam: 0,
    });

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading && allPosts.length === 0) {
    return <div className="p-4 text-center text-muted">Loading posts...</div>;
  }

  if (allPosts.length === 0) {
    return <p className="p-4 text-center text-muted">No posts found.</p>;
  }

  const basePath = getBasePath();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <ul className="space-y-3">
        {allPosts.map((post) => (
          <li key={post.id} className="border p-3 rounded bg-card-bg border-card-border">
            <a href={`${basePath}/posts/${post.slug}`} className="text-foreground hover:text-accent transition-colors">
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </a>
            <p className="text-sm text-muted">
              {new Date(post.created_at * 1000).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
      <div ref={loadMoreRef} className="h-4">
        {isFetchingNextPage && <div className="text-center py-2 text-muted">Loading more...</div>}
        {hasNextPage === false && allPosts.length > 0 && (
          <div className="text-center py-2 text-muted">End of posts</div>
        )}
      </div>
    </div>
  );
}

export default function HomePageClient() {
  return (
    <>
      <TagFilter />
      <PostsList />
    </>
  );
}