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
import './commands/posts/list.ts';
import './commands/posts/create.ts';
import './commands/posts/create-from-markdown.ts';
import './commands/posts/update.ts';
import './commands/posts/delete.ts';
import './commands/tags/list.ts';
import './commands/tags/create.ts';
import './commands/tags/delete.ts';
import './commands/tags/tag-post.ts';
import './commands/tags/untag-post.ts';
import './commands/images/add.ts';
import './commands/series/list.ts';
import './commands/series/create.ts';
import './commands/series/add.ts';
import './commands/series/reorder.ts';
import './commands/newsletter/list.ts';
import './commands/newsletter/add.ts';
import './commands/newsletter/remove.ts';

async function main(): Promise<void> {
  const { args, flags } = parseArgs(process.argv);

  if ((args['help'] || flags.h || flags.help)) {
    showCommandHelp(args['<file>'] || '');
    return;
  }

  const commandParts = args.commandParts || [];
  const input = commandParts.join(' ');
  if (!commandParts.length || input === 'help') {
    showHelp();
    return;
  }

  const command = registry.tryCommandLookup(input);

  if (!command) {
    console.error(`Unknown command: ${input}`);
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
