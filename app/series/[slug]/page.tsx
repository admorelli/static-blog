import { notFound } from 'next/navigation';
import { Header } from '@/app/header';
import { getPostsBySeries } from '@/lib/posts';
import { Metadata } from 'next';
import Link from 'next/link';
import postsIndex from '@/public/data/posts-index.json';

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

interface PostWithSeries {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

async function getSeriesMetadata(slug: string): Promise<Metadata> {
  const seriesPosts = await getPostsBySeries(slug);
  
  if (seriesPosts.length === 0) {
    return { title: 'Series Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';
  const seriesUrl = `${baseUrl}/series/${slug}`;
  
  return {
    title: `${slug} - Series`,
    description: `Posts in the "${slug}" series (${seriesPosts.length} posts)`,
    openGraph: {
      title: `${slug} - Series`,
      description: `Posts in the "${slug}" series (${seriesPosts.length} posts)`,
      type: 'website',
      url: seriesUrl,
      siteName: 'Static Blog',
    },
    twitter: {
      card: 'summary',
      title: `${slug} - Series`,
      description: `Posts in the "${slug}" series (${seriesPosts.length} posts)`,
    },
  };
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  return getSeriesMetadata(slug);
}

export function generateSeriesJsonLd(slug: string, seriesPosts: PostWithSeries[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${slug} - Series`,
    description: `Posts in the "${slug}" series (${seriesPosts.length} posts)`,
    url: `${baseUrl}/series/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/`,
    },
  };
}

export async function generateStaticParams() {
  console.log('generateStaticParams called for series');
  const series = new Set<string>();
  const allPosts = postsIndex.posts as unknown as Array<PostWithSeries>;
  for (const post of allPosts) {
    if (post.series && post.series.trim()) {
      series.add(post.series);
    }
  }
  console.log('generateStaticParams called for series, found:', Array.from(series).sort());
  return Array.from(series).sort().map(slug => ({ slug }));
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const seriesPosts = await getPostsBySeries(slug);
  
  if (seriesPosts.length === 0) {
    return notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';

  const allPosts = postsIndex.posts as unknown as Array<PostWithSeries>;
  const allSeries = allPosts
    .filter(p => p.series !== null && p.series !== undefined && p.series !== '')
    .map(p => p.series)
    .filter((s, i, arr) => s !== null && s !== undefined && s !== '' && arr.indexOf(s) === i)
    .sort();

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateSeriesJsonLd(slug, seriesPosts, baseUrl)),
        }}
      />
      <div className="p-6 max-w-4xl mx-auto">
        <header className="mb-8">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/posts" className="hover:text-foreground transition-colors">Posts</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/series" className="hover:text-foreground transition-colors">Series</Link>
              </li>
              <li>/</li>
              <li className="text-foreground">{slug}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold mb-2">{slug}</h1>
          <p className="text-muted">{seriesPosts.length} post{seriesPosts.length !== 1 ? 's' : ''} in this series</p>
        </header>

        <ul className="space-y-4">
          {seriesPosts.map((post, index) => (
            <li key={post.id} className="border p-4 rounded bg-card-bg border-card-border">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-accent/10 text-accent font-medium text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <a href={`/posts/${post.slug}`} className="text-foreground hover:text-accent transition-colors">
                    <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
                  </a>
                  <p className="text-sm text-muted">
                    {new Date(post.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <nav className="mt-8 pt-8 border-t border-card-border">
          <h2 className="text-lg font-semibold mb-4">Other Series</h2>
          <ul className="flex flex-wrap gap-2">
            {allSeries
              .filter(s => s !== slug)
              .slice(0, 10)
              .map(series => (
                <li key={series}>
                  <a
                    href={`/series/${series}`}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-card-bg border border-card-border hover:bg-card-border hover:text-accent transition-colors"
                  >
                    {series}
                  </a>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </>
  );
}