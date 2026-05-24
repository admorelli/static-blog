import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/posts';
import { listTagsForPost } from '@/lib/tags';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return { title: post.title };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();
  const tags = await listTagsForPost(post.id);
  return (
    <article className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{new Date(post.created_at * 1000).toLocaleDateString()}</p>
      <div className="prose dark:prose-invert flex-1">{post.content}</div>
      {tags.length > 0 && (
        <div className="mt-4">
          Tags: {tags.map((t) => t.name).join(', ')}
        </div>
      )}
    </article>
  );
}
