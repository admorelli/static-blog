/** Delete Post Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, postTags, eq } from '../../utils/db.ts';
import { promptPostId, promptConfirm } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'delete',
  description: 'Delete a post',
  usage: '[--id <n>] [--slug <text>] [--yes]',
  examples: [
    'blog delete --id 5',
    'blog delete --slug hello-world --yes',
  ],
  async execute(args, flags) {
    await ensureTables();
    const { id, slug } = args;

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
    } else if (!flags.yes) {
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

    if (!flags.yes && !flags.y) {
      const confirmed = await promptConfirm(`Delete "${post[0].title}" (ID: ${postId})?`, false);
      if (!confirmed) {
        console.log('Cancelled.');
        return;
      }
    }

    await db.delete(postTags).where(eq(postTags.postId, postId));
    await db.delete(posts).where(eq(posts.id, postId));

    console.log(`✅ Deleted post #${postId}: "${post[0].title}"`);
  },
};

registry.register(command);
export default command;