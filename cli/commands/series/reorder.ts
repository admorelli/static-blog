/** Reorder Series Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq, sql } from '../../utils/db.ts';
import { promptConfirm } from '../../utils/inquirer.ts';
import inquirer from 'inquirer';

const command: Command = {
  name: 'series-reorder',
  description: 'Reorder posts within a series',
  usage: '[--series <name>]',
  examples: [
    'blog series-reorder --series "Getting Started"',
    'blog series-reorder',
  ],
  async execute(args) {
    await ensureTables();
    let { series } = args;

    if (!series) {
      const seriesRows = await db
        .select({ series: posts.series })
        .from(posts)
        .where(sql`${posts.series} IS NOT NULL`)
        .groupBy(posts.series)
        .execute();
      if (seriesRows.length === 0) {
        console.error('No series found.');
        return;
      }
      console.log('Available series:');
      for (const s of seriesRows) console.log(`  - ${s.series}`);
      const { series: chosen } = await inquirer.prompt([
        { type: 'input', name: 'series', message: 'Series name:', validate: (v: string) => v.length > 0 || 'Required' }
      ]);
      series = chosen;
    }

    const seriesPosts = await db
      .select({ id: posts.id, title: posts.title, series_order: posts.series_order })
      .from(posts)
      .where(eq(posts.series, series!))
      .orderBy(posts.series_order)
      .execute();

    if (seriesPosts.length === 0) {
      console.log(`No posts in series "${series}".`);
      return;
    }

    console.log(`\nCurrent order for "${series}":`);
    for (const p of seriesPosts) {
      console.log(`  #${p.series_order}  ${p.title} (ID: ${p.id})`);
    }

    const { reorder } = await inquirer.prompt([
      { type: 'confirm', name: 'reorder', message: 'Reorder interactively?', default: true }
    ]);

    if (!reorder) return;

    for (let i = 0; i < seriesPosts.length; i++) {
      const post = seriesPosts[i];
      const { newOrder } = await inquirer.prompt([
        { 
          type: 'input', 
          name: 'newOrder', 
          message: `New order for "${post.title}" (current: ${post.series_order}):`,
          default: String(post.series_order),
          validate: (v: string) => /^\d+$/.test(v) && parseInt(v, 10) > 0 || 'Must be a positive number'
        }
      ]);
      const order = parseInt(newOrder, 10);
      if (order !== post.series_order) {
        await db.update(posts).set({ series_order: order }).where(eq(posts.id, post.id));
        console.log(`  Updated "${post.title}" to #${order}`);
      }
    }

    console.log(`✅ Series "${series}" reordered.`);
  },
};

registry.register(command);
export default command;