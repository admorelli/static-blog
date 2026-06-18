import fs from 'fs';
import path from 'path';

async function generateFeed() {
  console.log('Generating RSS/Atom feed...');

  // Read posts from generated static data
  const dataPath = path.join(process.cwd(), 'public', 'data', 'posts-index.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('No posts data found, skipping feed generation');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const posts = (data.posts || []).sort((a: { created_at: number }, b: { created_at: number }) => b.created_at - a.created_at);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog';
  const siteTitle = 'Static Blog';
  const siteDescription = 'A technology blog built with Next.js, SQLite and Drizzle ORM';

  // Generate Atom feed (modern RSS alternative)
  const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteTitle)}</title>
  <subtitle>${escapeXml(siteDescription)}</subtitle>
  <link href="${siteUrl}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${siteUrl}" rel="alternate" type="text/html"/>
  <updated>${new Date().toISOString()}</updated>
  <id>${siteUrl}</id>
  <author>
    <name>Blog Author</name>
  </author>
${posts.slice(0, 20).map((post: { title: string; slug: string; created_at: number; content: string }) => `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${siteUrl}/posts/${post.slug}"/>
    <id>${siteUrl}/posts/${post.slug}</id>
    <updated>${new Date(post.created_at * 1000).toISOString()}</updated>
    <summary type="html">${escapeXml(post.content)}</summary>
  </entry>`).join('\n')}
</feed>`;

  // Generate RSS 2.0 feed
  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 20).map((post: { title: string; slug: string; created_at: number; content: string }) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.created_at * 1000).toUTCString()}</pubDate>
      <description>${escapeXml(post.content)}</description>
    </item>`).join('\n')}
  </channel>
</rss>`;

  // Write both formats
  const outDir = path.join(process.cwd(), 'out');
  fs.writeFileSync(path.join(outDir, 'feed.xml'), rssFeed);
  fs.writeFileSync(path.join(outDir, 'atom.xml'), atomFeed);

  console.log(`✅ Generated feed.xml (RSS 2.0) with ${Math.min(posts.length, 20)} items`);
  console.log(`✅ Generated atom.xml (Atom 1.0) with ${Math.min(posts.length, 20)} items`);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

generateFeed().catch((err: unknown) => {
  console.error('Feed generation failed:', err);
  process.exit(1);
});