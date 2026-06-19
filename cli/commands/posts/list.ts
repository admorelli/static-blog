/** List Posts Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq, desc, and } from '../../utils/db.ts';
import { slugify } from '../../utils/db.ts';

const command: Command = {
  name: 'posts',
  description: 'List all posts',
  usage: '[--limit <n>] [--search <term>] [--tag <name>]',
  examples: [
    'blog posts --search "Next.js" --tag tech',
    'blog posts --limit 10',
  ],
  async execute(args) {
    await ensureTables();
    const { limit = '20', search, tag } = args;

    const allPosts = await db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      created_at: posts.created_at,
      series: posts.series,
      series_order: posts.series_order,
    }).from(posts).orderBy(desc(posts.created_at)).execute();

    let filteredPosts = allPosts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
      );
    }
    if (tag) {
      const tagRows = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tag)).execute();
      if (tagRows.length) {
        const tagId = tagRows[0].id;
        const postTagRows = await db.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagId, tagId)).execute();
        const taggedPostIds = new Set(postTagRows.map(r => r.postId));
        filteredPosts = filteredPosts.filter(p => taggedPostIds.has(p.id));
      } else {
        filteredPosts = [];
      }
    }

    const rows = filteredPosts.slice(0, parseInt(args.limit || '20', 10));

    if (rows.length === 0) {
      console.log('No posts found.');
      return;
    }

    console.log('\n📝 Posts:\n');
    for (const post of rows) {
      const postTagsList = await db
        .select({ name: tags.name })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, post.id))
        .execute();
      const tagNames = postTagsList.map(t => t.name).join(', ') || '(no tags)';
      const seriesInfo = post.series ? ` [${post.series} #${post.series_order}]` : '';
      console.log(`  #${post.id}  ${post.title}${seriesInfo}`);
      console.log(`        slug: ${post.slug}`);
      console.log(`        tags: ${tagNames}`);
      console.log(`        created: ${new Date(post.created_at * 1000).toLocaleString()}`);
      console.log('');
    }
  },
};

registry.register(command);
export default command;