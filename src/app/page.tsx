import { listPosts } from '@/lib/posts';
import Link from 'next/link';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  // no dynamic routes for index
  return [];
}

export async function getStaticProps() {
  const allPosts = await listPosts();
  return { props: { posts: JSON.parse(JSON.stringify(allPosts)) } };
}

type Props = {
  posts: Array<{ id: number; title: string; slug: string }>; 
};

export default function Home({ posts }: Props) {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Blog</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border p-4 rounded">
            <Link href={`/post/${post.slug}`} className="text-2xl text-blue-600">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
