#!/usr/bin/env node
/** static_blog CLI - Main Entry Point
 * 
 * Uses registry + factory pattern for extensible command management.
 * Run with: npx tsx cli/index.ts
 * Or install globally: npm link
 */

import { parseArgs } from './utils/args.ts';
import { showHelp, showCommandHelp } from './utils/help.ts';
import { registry } from './utils/registry.ts';

// Import all command modules to register them
import './commands/posts/list.js';
import './commands/posts/create.js';
import './commands/posts/create-from-markdown.js';
import './commands/posts/update.js';
import './commands/posts/delete.js';
import './commands/tags/list.js';
import './commands/tags/create.js';
import './commands/tags/delete.js';
import './commands/tags/tag-post.js';
import './commands/tags/untag-post.js';
import './commands/images/add.ts';
import './commands/series/list.js';
import './commands/series/create.js';
import './commands/series/add.js';
import './commands/series/reorder.js';

async function main(): Promise<void> {
  const { cmd, args, flags } = parseArgs(process.argv);

  let mainCmd = '';
  let subCmd = '';

  if (cmd && cmd !== 'help') {
    const parts = cmd.split(' ');
    mainCmd = parts[0] || '';
    subCmd = parts[1] || '';
  }

  if ((args['help'] || flags.h || flags.help)) {
    const helpTarget = subCmd ? `${mainCmd} ${subCmd}` : mainCmd;
    showCommandHelp(helpTarget);
    return;
  }

  if (cmd === 'help' || cmd === undefined) {
    if (args['<file>']) {
      showCommandHelp(args['<file>']);
    } else {
      showHelp();
    }
    return;
  }

  let command = registry.get(mainCmd);

  if (!command && subCmd) {
    command = registry.get(`${mainCmd}-${subCmd}`);
  }

  if (!command) {
    console.error(`Unknown command: ${cmd}`);
    console.log('Run "blog help" for usage.');
    process.exit(1);
  }

  try {
    await command.execute(args, flags);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Error:', message);
    process.exit(1);
  }
}

main();