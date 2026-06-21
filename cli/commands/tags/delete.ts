/** Delete Tag Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, tags, postTags, eq } from '../../utils/db.ts';
import { promptTagName, promptConfirm } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'tag-delete',
  description: 'Delete a tag',
  usage: '[--name <text>] [--yes]',
  examples: [
    'blog tag-delete --name "old-tag"',
    'blog tag-delete --name "deprecated" --yes',
  ],
  async execute(args, flags) {
    await ensureTables();
    let tagName = args.name || args.tagName;
    if (!tagName) {
      tagName = await promptTagName();
    }

    const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
    if (!tagRow.length) {
      console.error(`Tag "${tagName}" not found.`);
      return;
    }

    if (!flags.yes && !flags.y) {
      const confirmed = await promptConfirm(`Delete tag "${tagName}" and all associations?`, false);
      if (!confirmed) {
        console.log('Cancelled.');
        return;
      }
    }

    await db.delete(postTags).where(eq(postTags.tagId, tagRow[0].id));
    await db.delete(tags).where(eq(tags.id, tagRow[0].id));

    console.log(`✅ Deleted tag "${tagName}"`);
  },
};

registry.register(command);
export default command;