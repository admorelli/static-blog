/** Newsletter Add Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, subscribers } from '../../utils/db.ts';

const command: Command = {
  name: 'newsletter-add',
  description: 'Add a newsletter subscriber',
  usage: '[--email <text>] [--status <pending|confirmed>]',
  examples: [
    'blog newsletter-add --email user@example.com',
    'blog newsletter-add --email user@example.com --status confirmed',
  ],
  async execute(args) {
    await ensureTables();
    let { email, status } = args;
    const finalStatus = typeof status === 'string' ? status : 'pending';

    if (!email || typeof email !== 'string') {
      const readline = await import('node:readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question('Email: ', (input) => {
          rl.close();
          resolve(input.trim());
        });
      });
      email = answer;
      if (!email) {
        console.error('Email is required.');
        process.exit(1);
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('Invalid email address.');
      process.exit(1);
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      const result = await db
        .insert(subscribers)
        .values({ email, status: finalStatus, created_at: now })
        .returning({ id: subscribers.id })
        .execute();

      console.log(`✅ Added subscriber #${result[0].id}: ${email}`);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.error(`Subscriber "${email}" already exists.`);
      } else {
        console.error('Error:', err.message);
      }
    }
  },
};

registry.register(command);
export default command;
