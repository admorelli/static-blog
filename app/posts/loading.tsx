import React from 'react';

export default function Loading() {
  return (
    <main className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border p-3 rounded">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </main>
  );
}