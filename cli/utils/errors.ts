/** CLI Error handling helper */

export class CliError extends Error {
  constructor(
    message: string,
    public readonly code = 1,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export function handleCommandError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(`Error: ${error.message}`);
    if (error.cause) console.error(`Cause: ${error.cause}`);
    process.exit(error.code);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  console.error('Error: unknown failure');
  process.exit(1);
}
