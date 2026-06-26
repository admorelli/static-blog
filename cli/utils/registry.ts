/** Command Registry - Central registry for all CLI commands */

import type { Command } from './types.ts';

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
  tryCommandLookup(name: string): Command | undefined {
    if (!name) return undefined;
    if (this.commands.has(name)) return this.commands.get(name)!;
    const parts = name.split(' ');
    for (let i = 1; i < parts.length; i++) {
      const tail = parts.slice(i).join(' ');
      if (this.commands.has(tail)) return this.commands.get(tail)!;
    }
    return undefined;
  }
}

export const registry = new CommandRegistry();