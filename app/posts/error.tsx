'use client';

import React from 'react';

export default function Error({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading posts</h1>
      <p className="text-gray-600 mb-4">There was an error loading the posts list.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </main>
  );
}