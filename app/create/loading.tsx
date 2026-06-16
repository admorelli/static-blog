import React from 'react';

export default function Loading() {
  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-500">Loading editor...</p>
    </div>
  );
}