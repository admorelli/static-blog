/** Newsletter Remove Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, subscribers, eq } from '../../utils/db.ts';

const command: Command = {
  name: 'newsletter-remove',
  description: 'Remove a newsletter subscriber by email',
  usage: '<--email <text>|--id <number>>',
  examples: [
    'blog newsletter-remove --email user@example.com',
    'blog newsletter-remove --id 1',
  ],
  async execute(args, flags) {
    await ensureTables();
    const { email, id } = args;

    if (!email && !id) {
      console.error('Missing required argument. Provide --email <text> or --id <number>.');
      process.exit(1);
    }

    let target: { id: number; email: string } | undefined;

    if (email) {
      target = await db
        .select({ id: subscribers.id, email: subscribers.email })
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1)
        .execute()
        .then(rows => rows[0]);
    } else if (id) {
      target = await db
        .select({ id: subscribers.id, email: subscribers.email })
        .from(subscribers)
        .where(eq(subscribers.id, Number(id)))
        .limit(1)
        .execute()
        .then(rows => rows[0]);
    }

    if (!target) {
      console.error('Subscriber not found.');
      process.exit(1);
    }

    await db.delete(subscribers).where(eq(subscribers.id, target.id)).execute();
    console.log(`🗑 Removed subscriber #${target.id}: ${target.email}`);
  },
};

registry.register(command);
export default command;
