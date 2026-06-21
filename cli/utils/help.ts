/** Help Generator - Dynamic help from command registry */

import type { Command } from './types.ts';
import { registry } from './registry.ts';

export function showHelp(): void {
  const commands = registry.getAll();
  
  console.log(`
📖 static_blog CLI - Manage your blog from the terminal

Usage: blog <command> [options]

Commands:`);

  // Group commands by category
  const categories: Record<string, Command[]> = {};
  
  for (const cmd of commands) {
    const category = getCategory(cmd.name);
    if (!categories[category]) categories[category] = [];
    categories[category].push(cmd);
  }

  const categoryOrder = ['Posts', 'Tags', 'Images', 'Series'];
  
  for (const category of categoryOrder) {
    const cmds = categories[category];
    if (!cmds || cmds.length === 0) continue;
    
    console.log(`\n  ${category}:`);
    for (const cmd of cmds) {
      console.log(`    ${cmd.name.padEnd(20)} ${cmd.description}`);
      if (cmd.usage) {
        console.log(`    ${' '.repeat(22)}${cmd.usage}`);
      }
    }
  }

  console.log('\nExamples:');
  for (const cmd of commands) {
    for (const example of cmd.examples) {
      console.log(`  ${example}`);
    }
  }
  console.log('');
}

function getCategory(name: string): string {
  if (['posts', 'create', 'new', 'update', 'delete'].includes(name)) return 'Posts';
  if (['tags', 'tag-create', 'tag-delete', 'tag-post', 'untag-post'].includes(name)) return 'Tags';
  if (['images'].includes(name)) return 'Images';
  if (['series', 'series-create', 'series-add', 'series-reorder', 'series-list'].includes(name)) return 'Series';
  return 'Other';
}

export function showCommandHelp(commandName: string): void {
  const joined = commandName.replace(/ /g, '-');
  const cmd = registry.get(joined) || registry.get(commandName);
  if (!cmd) {
    console.error(`Unknown command: ${commandName}`);
    return;
  }

  console.log(`
📖 ${cmd.name} - ${cmd.description}

Usage: blog ${cmd.name} ${cmd.usage}

Examples:`);
  for (const example of cmd.examples) {
    console.log(`  ${example}`);
  }
  console.log('');
}