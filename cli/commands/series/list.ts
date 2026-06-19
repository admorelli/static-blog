/** List Series Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, desc, sql } from '../../utils/db.ts';

const command: Command = {
  name: 'series',
  description: 'List all post series',
  usage: '[list]',
  examples: [
    'blog series',
    'blog series list',
  ],
  async execute() {
    await ensureTables();

    // Get all unique series with post counts and order info
    const seriesRows = await db
      .select({
        series: posts.series,
        count: sql<number>`count(*)`.as('count'),
        firstPost: sql<number>`min(${posts.created_at})`.as('firstPost'),
        lastPost: sql<number>`max(${posts.created_at})`.as('lastPost'),
      })
      .from(posts)
      .where(sql`${posts.series} IS NOT NULL`)
      .groupBy(posts.series)
      .execute();

    if (seriesRows.length === 0) {
      console.log('No series found.');
      return;
    }

    console.log('\n📚 Series:\n');
    for (const series of seriesRows) {
      console.log(`  ${series.series}`);
      console.log(`    Posts: ${series.count}`);
      console.log(`    First: ${new Date(series.firstPost * 1000).toLocaleDateString()}`);
      console.log(`    Last:  ${new Date(series.lastPost * 1000).toLocaleDateString()}`);
      console.log('');
    }
  },
};

registry.register(command);
export default command;