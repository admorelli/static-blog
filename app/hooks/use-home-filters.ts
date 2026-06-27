"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface Tag {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

export interface PagedPosts {
  posts: Post[];
  total: number;
}

function getBasePath(): string {
  if (typeof window === "undefined") return "";
  const meta = document.querySelector('meta[name="next-base-path"]');
  return meta?.getAttribute("content") ?? "";
}

export async function fetchTags(): Promise<Tag[]> {
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/data/tags.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFilteredPosts({
  search,
  tagIds,
  offset = 0,
  limit = 10,
  signal,
}: {
  search: string;
  tagIds: number[];
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<PagedPosts> {
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/data/posts-index.json`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load posts (${res.status})`);
  }
  const indexData = (await res.json()) as { posts: Post[] };

  const normalizedSearch = search.trim().toLowerCase();
  const tagIdSet = new Set(tagIds);
  const filtered = indexData.posts.filter((post) => {
    const matchesSearch =
      !normalizedSearch ||
      post.title.toLowerCase().includes(normalizedSearch) ||
      post.content.toLowerCase().includes(normalizedSearch);
    const matchesTags = tagIdSet.size === 0;
    return matchesSearch && matchesTags;
  });

  return {
    posts: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchTags()
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return tags;
}

export function useTagFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<Set<number>>(() => {
    const values = searchParams.getAll("tag");
    return new Set(
      values
        .map(Number)
        .filter((value): value is number => !Number.isNaN(value)),
    );
  });

  const toggleTag = useCallback(
    (id: number) => {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);

        const params = new URLSearchParams(searchParams.toString());
        next.forEach((tagId) => params.append("tag", String(tagId)));

        const query = params.toString();
        router.push(query ? `?${query}` : "/");
        return next;
      });
    },
    [router, searchParams],
  );

  return { selected, toggleTag };
}

export function useSearchFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("q")?.toLowerCase() ?? "";

  const setSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");

      const query = params.toString();
      router.push(query ? `?${query}` : "/");
    },
    [router, searchParams],
  );

  return { search, setSearch };
}

export function useFilteredPosts({
  search,
  tagIds,
}: {
  search: string;
  tagIds: number[];
}) {
  return useInfiniteQuery<PagedPosts, Error, { pages: PagedPosts[]; pageParams: number[] }, ["posts", "home", string, number[]]>({
    queryKey: ["posts", "home", search, tagIds],
    queryFn: ({ pageParam = 0, signal }) =>
      fetchFilteredPosts({
        search,
        tagIds,
        offset: Number(pageParam),
        signal,
      }),
    getNextPageParam: (lastPage, pages) =>
      pages.reduce((count, page) => count + page.posts.length, 0) <
      lastPage.total
        ? pages.reduce((count, page) => count + page.posts.length, 0)
        : undefined,
    initialPageParam: 0,
  });
}
