import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getPostBySlug, listPosts } from '@/lib/posts';

export const dynamic = 'force-static';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Not Found' };
  return { title: post.title };
}

export async function generateStaticParams() {
  const all = await listPosts();
  return all.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();
  return (
    <article className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
