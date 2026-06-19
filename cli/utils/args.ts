/** Argument Parser - Parse CLI arguments into structured objects */

import type { CliArgs, CliFlags } from './types.js';

export function parseArgs(argv: string[]): { cmd: string; args: CliArgs; flags: CliFlags } {
  const cmd = argv[2] || 'help';
  const args: CliArgs = {};
  const flags: CliFlags = {};

  // Start from index 3 (skip node, script, command)
  for (let i = 3; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        args[key] = nextArg;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.replace(/^-/, '');
      flags[key] = true;
    } else if (!args['<file>']) {
      args['<file>'] = arg;
    } else if (!args['<slug>']) {
      args['<slug>'] = arg;
    } else if (!args['<path>']) {
      args['<path>'] = arg;
    }
  }

  return { cmd, args, flags };
}