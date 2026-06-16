import { notFound } from 'next/navigation';
import postsIndex from '@/public/data/posts-index.json';

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
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      title: '',
      date: '',
      tags: [],
      content: content,
    };
  }

  const [, frontmatter, markdownContent] = match;
  
  // Parse YAML frontmatter
  const titleMatch = frontmatter.match(/title:\s*"([^"]*)"/);
  const dateMatch = frontmatter.match(/date:\s*"([^"]*)"/);
  const tagsMatch = frontmatter.match(/tags:\s*(\[[\s\S]*?\])/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const date = dateMatch ? dateMatch[1] : '';
  let tags: string[] = [];
  
  if (tagsMatch) {
    try {
      tags = JSON.parse(tagsMatch[1]);
    } catch {
      tags = [];
    }
  }

  return { title, date, tags, content: markdownContent };
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion for common elements
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    .replace(/^\| (.*?) \|$/gim, '<p><strong>$1</strong></p>')
    .replace(/^\|[-| ]+\|$/gim, '')
    .replace(/^\| (.*?) \|$/gim, '<p>$1</p>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\s*-\s*(.*)$/gim, '<li>$1</li>')
    .replace(/^\s*\d+\.\s*(.*)$/gim, '<li>$1</li>');
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
