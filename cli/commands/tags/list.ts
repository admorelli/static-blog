/** List Tags Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, tags, postTags, eq } from '../../utils/db.ts';

const command: Command = {
  name: 'tags',
  description: 'List all tags',
  usage: '',
  examples: [
    'blog tags',
  ],
  async execute() {
    await ensureTables();
    const tagRows = await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name).execute();

    if (tagRows.length === 0) {
      console.log('No tags found.');
      return;
    }

    console.log('\n🏷️  Tags:\n');
    for (const tag of tagRows) {
      const count = await db
        .select({ count: postTags.tagId })
        .from(postTags)
        .where(eq(postTags.tagId, tag.id))
        .execute();
      console.log(`  #${tag.id}  ${tag.name}  (${count.length} post${count.length !== 1 ? 's' : ''})`);
    }
  },
};

registry.register(command);
export default command;