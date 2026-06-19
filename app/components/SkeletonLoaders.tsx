"use client";

export function PostSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TagSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1" />
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function PostsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NoPostsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19" />
        </svg>
      }
      title="No posts found"
      description="There are no posts matching your criteria. Try adjusting your search or filters."
    />
  );
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={`No posts found matching "${query}". Try a different search term.`}
    />
  );
}

export function NoTagsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4h6a4 4 0 014 4v5" />
        </svg>
      }
      title="No tags yet"
      description="Create your first tag to start organizing your posts."
    />
  );
}