/** Command Registry - Central registry for all CLI commands */

import type { Command } from './types.js';

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    if (this.commands.has(command.name)) {
      throw new Error(`Command "${command.name}" is already registered`);
    }
    this.commands.set(command.name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  names(): string[] {
    return Array.from(this.commands.keys()).sort();
  }
}

export const registry = new CommandRegistry();