/** Create Post Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq } from '../../utils/db.ts';
import { slugify } from '../../utils/db.ts';
import { promptPostTitle, promptPostContent, promptTags } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'create',
  description: 'Create a new post (interactive or via flags)',
  usage: '[--title <text>] [--slug <text>] [--content <html>] [--tags <list>] [--series <name>] [--series-order <n>]',
  examples: [
    'blog create --title "My Post" --content "<p>Hello</p>" --tags "tech,tutorial"',
    'blog create',
  ],
  async execute(args, flags) {
    await ensureTables();

    let { title, slug, content, tags: tagNames, series, seriesOrder } = args;

    if (!title || !content) {
      const answers = await Promise.all([
        title ? Promise.resolve(title) : promptPostTitle(),
        content ? Promise.resolve(content) : promptPostContent(),
        tagNames ? Promise.resolve(tagNames) : promptTags(),
      ]);
      title = answers[0];
      content = answers[1];
      tagNames = answers[2];
    }

    if (!slug) {
      slug = slugify(title!);
    }

    const now = Math.floor(Date.now() / 1000);

    let tagIds: number[] = [];
    if (tagNames) {
      const tagList = tagNames.split(',').map(t => t.trim()).filter(Boolean);
      for (const tagName of tagList) {
        let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
        if (tagRow.length === 0) {
          const inserted = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id }).execute();
          tagIds.push(inserted[0].id);
        } else {
          tagIds.push(tagRow[0].id);
        }
      }
    }

    const result = await db
      .insert(posts)
      .values({ 
        title: title!, 
        slug: slug!, 
        content: content!, 
        created_at: now,
        series: series || null,
        series_order: seriesOrder ? parseInt(seriesOrder, 10) : null,
      })
      .returning({ id: posts.id })
      .execute();

    const postId = result[0].id;

    if (tagIds.length) {
      await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
    }

    console.log(`✅ Created post #${postId}: "${title}" (slug: ${slug})`);
    if (tagIds.length) console.log(`   Tags: ${tagNames}`);
    if (series) console.log(`   Series: ${series} (order: ${seriesOrder || 'N/A'})`);
  },
};

registry.register(command);
export default command;