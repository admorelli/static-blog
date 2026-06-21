/** Update Post Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq } from '../../utils/db.ts';
import { slugify } from '../../utils/db.ts';
import { promptPostTitle, promptPostContent, promptTags, promptPostId, promptConfirm } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'update',
  description: 'Update an existing post',
  usage: '[--id <n>] [--slug <text>] [--title <text>] [--content <html>] [--tags <list>] [--series <name>] [--series-order <n>] [--yes]',
  examples: [
    'blog update --id 5 --title "New Title"',
    'blog update --slug hello-world --content "<p>Updated</p>" --tags "tech,updated"',
    'blog update --id 3 --series "My Series" --series-order 2',
  ],
  async execute(args, flags) {
    await ensureTables();
    const { id, slug, title, content, tags: tagNames, series, seriesOrder } = args;
    const skipPrompts = flags.yes || flags.y;

    let postId: number | undefined;
    if (id) {
      postId = parseInt(id, 10);
    } else if (slug) {
      const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1).execute();
      if (!post.length) {
        console.error(`Post with slug "${slug}" not found.`);
        return;
      }
      postId = post[0].id;
    } else if (!skipPrompts) {
      postId = await promptPostId();
    }

    if (!postId || isNaN(postId)) {
      console.error('Invalid post ID.');
      return;
    }

    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).execute();
    if (!post.length) {
      console.error(`Post #${postId} not found.`);
      return;
    }

    const currentPost = post[0];
    
    let newTitle = title;
    if (!newTitle && !skipPrompts) {
      newTitle = await promptConfirm(`Keep current title "${currentPost.title}"?`, true) ? currentPost.title : await promptPostTitle();
    } else if (!newTitle) {
      newTitle = currentPost.title;
    }

    let newSlug = slug;
    if (!newSlug && !skipPrompts) {
      newSlug = await promptConfirm(`Keep current slug "${currentPost.slug}"?`, true) ? currentPost.slug : slugify(await promptPostTitle());
    } else if (!newSlug) {
      newSlug = currentPost.slug;
    }

    let newContent = content;
    if (!newContent && !skipPrompts) {
      newContent = await promptConfirm(`Keep current content?`, true) ? currentPost.content : await promptPostContent();
    } else if (!newContent) {
      newContent = currentPost.content;
    }

    let newTagNames = tagNames;
    if (newTagNames === undefined && !skipPrompts) {
      newTagNames = await promptConfirm(`Keep current tags?`, true) ? undefined : await promptTags();
    }

    let newSeries = series;
    if (newSeries === undefined && !skipPrompts) {
      newSeries = await promptConfirm(`Keep current series "${currentPost.series || 'none'}"?`, true) ? currentPost.series : (await promptConfirm('Add series?', false) ? await promptPostTitle() : null);
    }

    let newSeriesOrder = seriesOrder !== undefined ? parseInt(seriesOrder, 10) : currentPost.series_order;

    const updateData: Record<string, unknown> = {
      title: newTitle,
      slug: newSlug,
      content: newContent,
    };
    if (newSeries !== undefined) updateData.series = newSeries;
    if (newSeriesOrder !== undefined) updateData.series_order = newSeriesOrder;

    await db.update(posts).set(updateData).where(eq(posts.id, postId));

    // Handle tags if provided
    if (newTagNames !== undefined) {
      await db.delete(postTags).where(eq(postTags.postId, postId));
      if (newTagNames) {
        const tagList = newTagNames.split(',').map(t => t.trim()).filter(Boolean);
        const tagIds: number[] = [];
        for (const tagName of tagList) {
          let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
          if (tagRow.length === 0) {
            const inserted = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id }).execute();
            tagIds.push(inserted[0].id);
          } else {
            tagIds.push(tagRow[0].id);
          }
        }
        if (tagIds.length) {
          await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
        }
      }
    }

    console.log(`✅ Updated post #${postId}: "${newTitle}" (slug: ${newSlug})`);
    if (newTagNames !== undefined && newTagNames) console.log(`   Tags: ${newTagNames}`);
    if (newSeries) console.log(`   Series: ${newSeries} (order: ${newSeriesOrder || 'N/A'})`);
  },
};

registry.register(command);
export default command;