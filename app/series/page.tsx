import { Header } from '@/app/header';
import { Metadata } from 'next';
import Link from 'next/link';
import postsIndex from '@/public/data/posts-index.json';

interface PostWithSeries {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

async function getSeriesMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';

  return {
    title: 'Series',
    description: 'Browse post series.',
    openGraph: {
      title: 'Series',
      description: 'Browse post series.',
      type: 'website',
      url: `${baseUrl}/series`,
      siteName: 'Static Blog',
    },
    twitter: {
      card: 'summary',
      title: 'Series',
      description: 'Browse post series.',
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return getSeriesMetadata();
}

export async function generateStaticParams() {
  return [];
}

export default async function SeriesListPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';

  const allPosts = postsIndex.posts as unknown as Array<PostWithSeries>;
  const allSeries = allPosts
    .filter(p => p.series !== null && p.series !== undefined && p.series !== '')
    .map(p => p.series)
    .filter((s, i, arr) => s !== null && s !== undefined && s !== '' && arr.indexOf(s) === i)
    .sort();

  const seriesWithCounts = allSeries.map(slug => {
    const count = allPosts.filter(p => p.series === slug).length;
    return { slug, count };
  });

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Series',
            description: 'Browse post series.',
            url: `${baseUrl}/series`,
            isPartOf: {
              '@type': 'WebSite',
              '@id': `${baseUrl}/`,
            },
          }),
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
              <li className="text-foreground">Series</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold mb-2">Series</h1>
          <p className="text-muted">{seriesWithCounts.length} series</p>
        </header>

        {seriesWithCounts.length === 0 ? (
          <p className="text-muted">No series yet.</p>
        ) : (
          <ul className="space-y-3">
            {seriesWithCounts.map(({ slug, count }) => (
              <li key={slug} className="border p-4 rounded bg-card-bg border-card-border">
                <Link href={`/series/${slug}`} className="text-foreground hover:text-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{slug}</h2>
                    <span className="text-sm text-muted">{count} post{count !== 1 ? 's' : ''}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
