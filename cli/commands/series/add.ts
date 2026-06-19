/** Add Post to Series Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq, sql } from '../../utils/db.ts';
import { promptPostId, promptConfirm } from '../../utils/inquirer.ts';
import inquirer from 'inquirer';

const command: Command = {
  name: 'series-add',
  description: 'Add a post to an existing series',
  usage: '[--post-id <n>] [--series <name>] [--order <n>]',
  examples: [
    'blog series-add --post-id 7 --series "Getting Started" --order 3',
    'blog series-add',
  ],
  async execute(args) {
    await ensureTables();
    let { postId: postIdStr, series, order } = args;
    let postId = postIdStr ? parseInt(postIdStr, 10) : (args['post-id'] ? parseInt(args['post-id'], 10) : undefined);

    if (!postId) {
      postId = await promptPostId();
    }
    if (!series) {
      // Show available series
      const seriesRows = await db
        .select({ series: posts.series })
        .from(posts)
        .where(sql`${posts.series} IS NOT NULL`)
        .groupBy(posts.series)
        .execute();
      if (seriesRows.length === 0) {
        console.error('No existing series found. Use "blog series-create" first.');
        return;
      }
      console.log('Available series:');
      for (const s of seriesRows) console.log(`  - ${s.series}`);
      const { series: chosen } = await inquirer.prompt([
        { type: 'input', name: 'series', message: 'Series name:', validate: (v: string) => v.length > 0 || 'Required' }
      ]);
      series = chosen;
    }
    if (!order) {
      const existingPosts = await db
        .select({ series_order: posts.series_order })
        .from(posts)
        .where(eq(posts.series, series!))
        .execute();
      const maxOrder = existingPosts.reduce((max, p) => Math.max(max, p.series_order || 0), 0);
      order = String(maxOrder + 1);
    }

    const post = await db.select().from(posts).where(eq(posts.id, postId!)).limit(1).execute();
    if (!post.length) {
      console.error(`Post #${postId} not found.`);
      return;
    }

    const currentSeries = post[0].series;
    if (currentSeries && !await promptConfirm(`Post already in series "${currentSeries}". Move to "${series}"?`, false)) {
      console.log('Cancelled.');
      return;
    }

    await db.update(posts).set({ 
      series, 
      series_order: parseInt(order, 10) 
    }).where(eq(posts.id, postId!));

    console.log(`✅ Post #${postId} added to series "${series}" as #${order}`);
  },
};

registry.register(command);
export default command;