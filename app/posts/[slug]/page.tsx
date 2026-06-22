import { notFound } from 'next/navigation';
import { Header } from '@/app/header';
import { TableOfContents } from '@/app/components/TableOfContents';
import { GiscusComments } from '@/app/components/GiscusComments';
import { getPostsBySeries, getNextInSeries, getPrevInSeries } from '@/lib/posts';
import Link from 'next/link';
import postsIndex from '@/public/data/posts-index.json';
import matter from 'gray-matter';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';


interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
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

type PostImage = {
  id: string;
  original: string;
  src: string;
  srcset: string;
  sizes: string;
  blurDataUri: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

function loadPostImages(slug: string): PostImage[] {
  const imgDir = path.join(process.cwd(), 'public', 'posts', slug, 'img');
  if (!fs.existsSync(imgDir) || !fs.statSync(imgDir).isDirectory()) {
    return [];
  }

  const ids = fs.readdirSync(imgDir).filter((id) => fs.statSync(path.join(imgDir, id)).isDirectory());

  return ids
    .map((id) => {
      const manifestPath = path.join(imgDir, id, 'manifest.json');
      if (!fs.existsSync(manifestPath)) return null;
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PostImage;
      } catch {
        return null;
      }
    })
    .filter((item): item is PostImage => item !== null);
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function generateJsonLd(post: Post, parsed: ParsedPost, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: parsed.title || post.title,
    description: parsed.description || `Read ${parsed.title || post.title} on Static Blog`,
    image: `${baseUrl}/og-image.png`,
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
          url: `${baseUrl}/og-image.png`,
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
  const postImages = loadPostImages(post.slug);
  const optimizedContent = postImages.length
    ? content.replace(/!\[([^\]]*)\]\((\/posts\/[^/]+\/img\/[^)]+)\)/g, (match, alt, src) => {
        const parts = decodeURIComponent(src).split('/');
        const imgId = parts[parts.length - 2] || '';
        const candidate = postImages.find((item) => item.id === imgId);
        if (!candidate) {
          return match;
        }

        const widthAttr = candidate.width ? ` width="${candidate.width}"` : '';
        const heightAttr = candidate.height ? ` height="${candidate.height}"` : '';

        return [
          '<picture>',
          `<source type="image/webp" srcset="${candidate.srcset}" sizes="${candidate.sizes}">`,
          `<img src="${candidate.src}" alt="${alt}" style="background-image:url('${candidate.blurDataUri}');background-size:cover;background-position:center;" class="blur-up"${heightAttr}${widthAttr}>`,
          '</picture>',
        ].join('');
      })
    : content;
  const htmlContent = markdownToHtml(optimizedContent);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';
  const postTitle = title || post.title;

  const jsonLd = generateJsonLd(post, { title, date, tags, description, content }, baseUrl);

  const nextPost = post.series && post.series_order ? await getNextInSeries(post.series, post.series_order) : null;
  const prevPost = post.series && post.series_order ? await getPrevInSeries(post.series, post.series_order) : null;

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          <article className="lg:col-span-8 p-6 max-w-2xl mx-auto">
            <header className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>
                <span className="text-gray-500">{calculateReadingTime(htmlContent)} min read</span>
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </header>
            <div className="prose dark:prose-invert flex-1" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </article>
          <aside className="lg:block hidden">
            <TableOfContents content={htmlContent} />
            {post.series ? (
              <nav className="mt-8 pt-8 border-t border-card-border" aria-label="Series contents">
                <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">{post.series}</h3>
                <ol className="space-y-1 text-sm" start={1}>
                  {(await getPostsBySeries(post.series)).map((sp, i) => (
                    <li key={sp.id} className={sp.slug === post.slug ? 'font-semibold text-accent' : ''}>
                      {sp.slug === post.slug ? (
                        <span className="text-sm font-semibold text-accent">{i + 1}. {sp.title}</span>
                      ) : (
                        <a href={`/posts/${sp.slug}`} className="text-gray-600 dark:text-gray-400 hover:text-accent transition-colors block py-1 px-2 rounded">
                          {i + 1}. {sp.title}
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
          </aside>
        </div>
      </div>
      <GiscusComments
        repo="admorelli/static-blog"
        repoId="R_kgDOKQhNvg"
        category="Announcements"
        categoryId="DIC_kwDOKQhNvs4CgQ0H"
      />
      {(nextPost || prevPost) && (
        <nav className="mt-12 pt-8 border-t border-card-border" aria-label="Series navigation">
          <h2 className="text-lg font-semibold mb-4">Series Navigation</h2>
          <div className="flex justify-between">
            {prevPost ? (
              <Link
                href={`/posts/${prevPost.slug}`}
                className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Prev: {prevPost.title}
              </Link>
            ) : (
              <span className="text-sm text-muted">This is the first post in the series</span>
            )}
            {nextPost ? (
              <Link
                href={`/posts/${nextPost.slug}`}
                className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
              >
                Next: {nextPost.title}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="text-sm text-muted">This is the last post in the series</span>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
