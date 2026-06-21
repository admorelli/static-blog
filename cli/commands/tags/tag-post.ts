/** Tag Post Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq, and } from '../../utils/db.ts';
import { promptPostId, promptTagForPost, promptCreateTag } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'tag-post',
  description: 'Add tag to post',
  usage: '[--post-id <n>] [--tag <name>]',
  examples: [
    'blog tag-post --post-id 3 --tag "deploy"',
    'blog tag-post',
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

    const post = await db.select().from(posts).where(eq(posts.id, postId!)).limit(1).execute();
    if (!post.length) {
      console.error(`Post #${postId} not found.`);
      return;
    }

    let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
    if (!tagRow.length) {
      const create = await promptCreateTag(tagName!);
      if (!create) return;
      const inserted = await db.insert(tags).values({ name: tagName! }).returning({ id: tags.id }).execute();
      tagRow = inserted;
    }

    const existing = await db.select().from(postTags).where(and(eq(postTags.postId, postId!), eq(postTags.tagId, tagRow[0].id))).execute();
    if (existing.length) {
      console.log(`Post already has tag "${tagName}".`);
      return;
    }

    await db.insert(postTags).values({ postId, tagId: tagRow[0].id }).execute();

    console.log(`✅ Tagged post #${postId} with "${tagName}"`);
  },
};

registry.register(command);
export default command;