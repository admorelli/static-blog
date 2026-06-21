/** Newsletter List Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, subscribers } from '../../utils/db.ts';

const command: Command = {
  name: 'newsletter-list',
  description: 'List all newsletter subscribers',
  usage: '[--status <pending|confirmed>]',
  examples: [
    'blog newsletter-list',
    'blog newsletter-list --status confirmed',
  ],
  async execute(args) {
    await ensureTables();
    const { status } = args;

    const rows = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        status: subscribers.status,
        created_at: subscribers.created_at,
      })
      .from(subscribers)
      .orderBy(subscribers.created_at)
      .execute();

    const filtered = status
      ? rows.filter(r => r.status === status)
      : rows;

    if (filtered.length === 0) {
      console.log('No subscribers found.');
      return;
    }

    console.log(`\n📬 Subscribers (${filtered.length}):\n`);
    for (const sub of filtered) {
      console.log(`  #${sub.id}  ${sub.email} [${sub.status}]`);
      console.log(`        created: ${new Date(sub.created_at * 1000).toLocaleString()}`);
      console.log('');
    }
  },
};

registry.register(command);
export default command;
