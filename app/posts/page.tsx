import Link from "next/link";
import { listPosts } from '@/lib/posts';

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostsPage() {
  const posts = await listPosts();
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="border p-3 rounded">
            <Link href={`/posts/${post.slug}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </Link>
            <p className="text-sm text-gray-500">{new Date(post.created_at * 1000).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}