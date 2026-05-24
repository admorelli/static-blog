// +----------------------------------------------------+
// | Single post detail page                            |
// +----------------------------------------------------+
import Link from 'next/link';

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // TODO: Fetch singlePost(slug) and render content with markdown rendering (marked.js, react-markdown, etc.)
  return (
    <main className="min-h-screen p-6 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/posts" className="hover:text-foreground">Posts</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate max-w-[15ch] overflow-hidden text-ellipsis">{slug}</span>
      </nav>

      {/* TODO: Insert fetched post data here */}
      <div className="text-center py-12">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Loading article \"{slug}\"… (implement fetch and markdown rendering in this step).
        </p>
      </div>
    </main>
  );
}
