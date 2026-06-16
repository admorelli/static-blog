import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '@/lib/static-posts-generated';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();
  return (
    <article className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{new Date(post.created_at * 1000).toLocaleDateString()}</p>
      <div className="prose dark:prose-invert flex-1" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
