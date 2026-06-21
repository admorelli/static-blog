/** Create Tag Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, tags, postTags, eq } from '../../utils/db.ts';
import { promptTagName } from '../../utils/inquirer.ts';
import { CliError } from '../../utils/errors.ts';

const command: Command = {
  name: 'tag-create',
  description: 'Create a tag',
  usage: '[--name <text>]',
  examples: [
    'blog tag-create --name "typescript"',
    'blog tag-create',
  ],
  async execute(args) {
    await ensureTables();
    let { name } = args;
    if (!name) {
      name = await promptTagName();
    }

    try {
      const result = await db.insert(tags).values({ name: name! }).returning({ id: tags.id }).execute();
      console.log(`✅ Created tag #${result[0].id}: "${name}"`);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.error(`Tag "${name}" already exists.`);
      } else {
        console.error('Error:', err.message);
      }
    }
  },
};

registry.register(command);
export default command;