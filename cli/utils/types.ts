/** CLI Types - Shared type definitions */

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface CliArgs {
  limit?: string;
  search?: string;
  tag?: string;
  title?: string;
  slug?: string;
  content?: string;
  tags?: string;
  id?: string;
  file?: string;
  '<file>'?: string;
  '<slug>'?: string;
  '<path>'?: string;
  path?: string;
  date?: string;
  description?: string;
  series?: string;
  seriesOrder?: string;
  yes?: boolean;
  name?: string;
  postId?: string;
  'post-id'?: string;
  tagName?: string;
  [key: string]: string | boolean | undefined;
  commandParts?: string[];
}

export interface CliFlags {
  [key: string]: boolean | undefined;
  watch?: boolean;
  y?: boolean;
  yes?: boolean;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  execute(args: CliArgs, flags: CliFlags): Promise<void>;
}

export interface CommandModule {
  default: Command;
}