/** Untag Post Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq, and } from '../../utils/db.ts';
import { promptPostId, promptTagForPost } from '../../utils/inquirer.ts';

const command: Command = {
  name: 'untag-post',
  description: 'Remove tag from post',
  usage: '[--post-id <n>] [--tag <name>]',
  examples: [
    'blog untag-post --post-id 3 --tag "deploy"',
    'blog untag-post',
  ],
  async execute(args) {
    await ensureTables();
    let { postId: postIdStr, tagName } = args;
    let postId = postIdStr ? parseInt(postIdStr, 10) : (args['post-id'] ? parseInt(args['post-id'], 10) : undefined);
    tagName = tagName || args.tag;

    if (!postId) {
      postId = await promptPostId();
    }
    if (!tagName) {
      tagName = await promptTagForPost();
    }

    const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
    if (!tagRow.length) {
      console.error(`Tag "${tagName}" not found.`);
      return;
    }

    await db.delete(postTags).where(and(eq(postTags.postId, postId!), eq(postTags.tagId, tagRow[0].id)));

    console.log(`✅ Removed tag "${tagName}" from post #${postId}`);
  },
};

registry.register(command);
export default command;