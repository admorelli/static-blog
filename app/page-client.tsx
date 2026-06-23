"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

const BRAND_LINKS = [
	{ label: "GitHub", href: "https://github.com/admribeiro" },
	{ label: "Ko-fi", href: "https://ko-fi.com/admribeiro" },
	{ label: "LinkedIn", href: "https://linkedin.com/in/admribeiro" },
];

const TAG_FILTER_PATH = "/data/tags.json";
const POST_INDEX_PATH = "/data/posts-index.json";
const POST_TAG_PATH = "/data/post-tags.json";
const PAGE_SIZE = 10;

interface Tag {
	id: number;
	name: string;
}

interface Post {
	id: number;
	title: string;
	slug: string;
	content: string;
	created_at: number;
	series: string | null;
	series_order: number | null;
}

interface PageResult {
	posts: Post[];
	total: number;
}

async function fetchTags(basePath: string): Promise<Tag[]> {
	return fetch(`${basePath}${TAG_FILTER_PATH}`)
		.then((response) => response.json())
		.catch(() => []);
}

async function fetchIndex(basePath: string): Promise<{ posts: Post[] }> {
	return fetch(`${basePath}${POST_INDEX_PATH}`).then((response) =>
		response.json(),
	);
}

async function fetchPostTags(
	basePath: string,
): Promise<{ tagId: number; postId: number }[]> {
	return fetch(`${basePath}${POST_TAG_PATH}`).then((response) =>
		response.json(),
	);
}

function filterBySearch(posts: Post[], search: string) {
	const term = search;
	if (!term) return posts;
	return posts.filter(
		(post) =>
			post.title.toLowerCase().includes(term) ||
			post.content.toLowerCase().includes(term),
	);
}

function filterByTags(
	posts: Post[],
	tagIds: number[],
	postTags: { tagId: number; postId: number }[],
) {
	if (!tagIds.length) return posts;
	const taggedPostIds = new Set(
		postTags
			.filter((entry) => tagIds.includes(entry.tagId))
			.map((entry) => entry.postId),
	);
	return posts.filter((post) => taggedPostIds.has(post.id));
}

function resolveTaggedPosts(
	search: string,
	tagIds: number[],
	offset: number,
): Promise<PageResult> {
	const basePath = getBasePath();
	return Promise.all([fetchIndex(basePath), fetchPostTags(basePath)]).then(
		([indexData, postTags]) => {
			const posts = filterByTags(
				filterBySearch(indexData.posts, search),
				tagIds,
				postTags,
			);
			return {
				posts: posts.slice(offset, offset + PAGE_SIZE),
				total: posts.length,
			};
		},
	);
}

function getBasePath(): string {
	if (typeof window !== "undefined") {
		const meta = document.querySelector('meta[name="next-base-path"]');
		if (meta) return meta.getAttribute("content") || "";
	}
	return "";
}

function useTaggedPages(search: string, tagIds: number[]) {
	const basePath = getBasePath();
	return useInfiniteQuery<PageResult, Error>({
		queryKey: ["posts", search, tagIds, basePath],
		queryFn: ({ pageParam = 0 }) =>
			resolveTaggedPosts(search, tagIds, pageParam),
		getNextPageParam: (lastPage, allPages) => {
			const loaded = allPages.reduce(
				(sum, page) => sum + page.posts.length,
				0,
			);
			return loaded < lastPage.total ? loaded : undefined;
		},
		initialPageParam: 0,
	});
}

function TagFilter() {
	const [tags, setTags] = useState<Tag[]>([]);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const router = useRouter();
	const searchParams = useSearchParams();
	const basePath = getBasePath();

	useEffect(() => {
		fetchTags(basePath).then(setTags).catch(() => setTags([]));
	}, [basePath]);

	const toggleTag = useCallback(
		(id: number) => {
			const next = new Set(selected);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			setSelected(next);
			const params = new URLSearchParams();
			next.forEach((tagId) => params.append("tag", tagId.toString()));
			router.push(`?${params.toString()}`);
		},
		[selected, router],
	);

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<div>
				<h1 className="text-3xl font-bold mb-4">Home</h1>
				<div className="mb-4">
					<input
						type="text"
						placeholder="Search posts..."
						className="w-full border rounded p-2 bg-card-bg border-card-border text-foreground"
						onChange={(event) => {
							const value = event.target.value;
							const params = new URLSearchParams(searchParams);
							if (value) {
								params.set("q", value);
							} else {
								params.delete("q");
							}
							router.push(`?${params.toString()}`);
						}}
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
				<p className="text-center text-muted text-sm mt-2">
					by Youseff Abd El-Noor
				</p>
				<nav aria-label="Links">
					<ul className="list-none m-0 p-0 flex flex-wrap justify-center gap-6 text-sm">
						{BRAND_LINKS.map(({ label, href }) => (
							<li key={label}>
								<a
									className="text-accent hover:underline"
									href={href}
									target="_blank"
									rel="noreferrer"
								>
									{label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</div>
	);
}

function PostsList() {
	const searchParams = useSearchParams();
	const search = searchParams.get("q")?.toLowerCase() || "";
	const tagIds = searchParams
		.getAll("tag")
		.map(Number)
		.filter((value): value is number => !Number.isNaN(value));

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useTaggedPages(search, tagIds);

	const loadMoreRef = useRef<IntersectionObserver | null>(null);
	const sentinelReference = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sentinel = sentinelReference.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (
					entry.isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage
				) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);
		loadMoreRef.current = observer;
		observer.observe(sentinel);

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

	if (isLoading && allPosts.length === 0) {
		return (
			<div className="p-4 text-center text-muted">Loading posts...</div>
		);
	}

	if (allPosts.length === 0) {
		const searchValue = searchParams.get("q") || "";
		if (searchValue) {
			return (
				<div className="p-4 text-center text-muted">
					No results for &quot;{searchValue}&quot;
				</div>
			);
		}
		return <p className="p-4 text-center text-muted">No posts found.</p>;
	}

	const basePath = getBasePath();

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<ul className="space-y-4">
				{allPosts.map((post) => (
					<li
						key={post.id}
						className="border p-4 rounded bg-card-bg border-card-border"
					>
						<a
							href={`${basePath}/posts/${post.slug}`}
							className="text-foreground hover:text-accent transition-colors"
						>
							<h2 className="text-xl font-semibold mb-2">
								{post.title}
							</h2>
							<p className="text-sm text-muted mb-2">
								{new Date(
									post.created_at * 1000,
								).toLocaleDateString()}
							</p>
						</a>
						<div
							className="prose prose-sm text-muted mb-3"
							dangerouslySetInnerHTML={{
								__html: getExcerpt(post.content, 20),
							}}
						/>
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
							>
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</a>
					</li>
				))}
			</ul>
			<div ref={sentinelReference} className="h-4" />
			{isFetchingNextPage && (
				<div className="text-center py-2 text-muted">
					Loading more...
				</div>
			)}
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
