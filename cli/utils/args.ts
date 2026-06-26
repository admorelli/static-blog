/** Argument Parser - Parse CLI arguments into structured objects */

import type { CliArgs, CliFlags } from './types.ts';

export function parseArgs(argv: string[]): { cmd: string; args: CliArgs; flags: CliFlags } {
  const cmd = argv[2] || 'help';
  const args: CliArgs = {};
  const flags: CliFlags = {};
  const commandParts: string[] = [];

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
    } else {
      commandParts.push(arg);
    }
  }

  args.commandParts = commandParts;
  if (!args['<file>'] && commandParts[0]) {
    args['<file>'] = commandParts[0];
  }
  if (!args['<slug>'] && commandParts[1]) {
    args['<slug>'] = commandParts[1];
  }

  return { cmd, args, flags };
}