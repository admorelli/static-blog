/** Create Series Command - assigns a series to a post */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq } from '../../utils/db.ts';
import { promptPostId, promptPostTitle, promptConfirm } from '../../utils/inquirer.ts';

const command: Command = {
  name: 'series-create',
  description: 'Create a new series or assign series to a post',
  usage: '[--id <n>] [--post-id <n>] [--name <text>] [--order <n>]',
  examples: [
    'blog series-create --id 5 --name "Getting Started" --order 1',
    'blog series-create --post-id 5 --name "Getting Started" --order 1',
    'blog series-create',
  ],
  async execute(args) {
    await ensureTables();
    let { postId: postIdStr, name, order, id } = args;
    let postId = postIdStr ? parseInt(postIdStr, 10) : (args['post-id'] ? parseInt(args['post-id'], 10) : (id ? parseInt(id, 10) : undefined));

    if (!postId) {
      postId = await promptPostId();
    }
    if (!name) {
      name = await promptPostTitle(); // reuse for "Series name: "
    }
    if (!order) {
      // Find the next order number for this series
      const existingPosts = await db
        .select({ series_order: posts.series_order })
        .from(posts)
        .where(eq(posts.series, name!))
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
    if (currentSeries && !await promptConfirm(`Post already in series "${currentSeries}". Change to "${name}"?`, false)) {
      console.log('Cancelled.');
      return;
    }

    await db.update(posts).set({ 
      series: name, 
      series_order: parseInt(order, 10) 
    }).where(eq(posts.id, postId!));

    console.log(`✅ Post #${postId} added to series "${name}" as #${order}`);
  },
};

registry.register(command);
export default command;