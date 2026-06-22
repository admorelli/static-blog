'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Post not found</h1>
      <p className="text-gray-600 mb-4">The post you&apos;re looking for doesn&apos;t exist or there was an error loading it.</p>
      <div className="space-x-2">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
        <Link href="/posts" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 inline-block">
          Back to posts
        </Link>
      </div>
    </div>
  );
}