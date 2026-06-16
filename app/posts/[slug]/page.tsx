import { notFound } from 'next/navigation';
import postsIndex from '@/public/data/posts-index.json';
import matter from 'gray-matter';
import { marked } from 'marked';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
}

interface ParsedPost {
  title: string;
  date: string;
  tags: string[];
  content: string;
}

function parseFrontmatter(content: string): ParsedPost {
  const { data, content: markdownContent } = matter(content);
  
  return {
    title: data.title || '',
    date: data.date || '',
    tags: data.tags || [],
    content: markdownContent,
  };
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export async function generateStaticParams() {
  return postsIndex.posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: Post | undefined = postsIndex.posts.find((p) => p.slug === slug);
  if (!post) return notFound();

  const { title, date, tags, content } = parseFrontmatter(post.content);
  const htmlContent = markdownToHtml(content);

  return (
    <article className="p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{title || post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      </header>
      <div className="prose dark:prose-invert flex-1" dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </article>
  );
}
