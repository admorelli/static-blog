import { notFound } from 'next/navigation';
import { Header } from '@/app/header';
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
  description?: string;
  content: string;
}

function parseFrontmatter(content: string): ParsedPost {
  const { data, content: markdownContent } = matter(content);
  
  return {
    title: data.title || '',
    date: data.date || '',
    description: data.description || '',
    tags: data.tags || [],
    content: markdownContent,
  };
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

function generateJsonLd(post: Post, parsed: ParsedPost, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: parsed.title || post.title,
    description: parsed.description || `Read ${parsed.title || post.title} on Static Blog`,
    image: `${baseUrl}/og-image.png`, // placeholder, can be customized per post
    datePublished: parsed.date ? new Date(parsed.date).toISOString() : new Date(post.created_at * 1000).toISOString(),
    author: {
      '@type': 'Person',
      name: 'Blog Author',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Static Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/posts/${post.slug}`,
    },
    keywords: parsed.tags?.join(', ') || '',
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: Post | undefined = postsIndex.posts.find((p) => p.slug === slug);
  if (!post) return { title: 'Not Found' };

  const { title, date, tags, description } = parseFrontmatter(post.content);
  const postTitle = title || post.title;
  const postDescription = description || `Read ${postTitle} on Static Blog`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';
  const postUrl = `${baseUrl}/posts/${post.slug}`;

  return {
    title: postTitle,
    description: postDescription,
    openGraph: {
      title: postTitle,
      description: postDescription,
      type: 'article',
      url: postUrl,
      siteName: 'Static Blog',
      publishedTime: date ? new Date(date).toISOString() : new Date(post.created_at * 1000).toISOString(),
      authors: ['Blog Author'],
      tags: tags,
      images: [
        {
          url: `${baseUrl}/og-image.png`, // Placeholder - can add per-post images later
          width: 1200,
          height: 630,
          alt: postTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: postTitle,
      description: postDescription,
      images: [`${baseUrl}/og-image.png`],
    },
    other: {
      'article:published_time': date ? new Date(date).toISOString() : new Date(post.created_at * 1000).toISOString(),
      'article:author': 'Blog Author',
      'article:tags': tags?.join(', ') || '',
    },
  };
}

export async function generateStaticParams() {
  return postsIndex.posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: Post | undefined = postsIndex.posts.find((p) => p.slug === slug);
  if (!post) return notFound();

  const { title, date, tags, description, content } = parseFrontmatter(post.content);
  const htmlContent = markdownToHtml(content);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';
  const postTitle = title || post.title;
  const postDescription = description || `Read ${postTitle} on Static Blog`;

  const jsonLd = generateJsonLd(post, { title, date, tags, description, content }, baseUrl);

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="p-6 max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
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
    </>
  );
}
