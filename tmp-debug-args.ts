import { parseArgs } from './cli/utils/args.ts';
console.log(JSON.stringify(parseArgs(process.argv), null, 2));
