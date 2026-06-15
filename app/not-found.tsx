import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50 mb-8">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Static Blog</span>
          <nav className="flex items-center space-x-4">
            <Link href="/posts" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Posts
            </Link>
            <Link href="/create" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Create
            </Link>
          </nav>
        </div>
      </div>
      <div className="text-center py-12">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}