/** Inquirer Utilities - Shared interactive prompts */

import inquirer from 'inquirer';

export async function promptPostTitle(): Promise<string> {
  const { title } = await inquirer.prompt([
    { type: 'input', name: 'title', message: 'Post title:', validate: (v: string) => v.length > 0 || 'Title required' }
  ]);
  return title;
}

export async function promptPostContent(): Promise<string> {
  const { content } = await inquirer.prompt([
    { type: 'input', name: 'content', message: 'Post content (HTML/Markdown):', validate: (v: string) => v.length > 0 || 'Content required' }
  ]);
  return content;
}

export async function promptTags(): Promise<string> {
  const { tags } = await inquirer.prompt([
    { type: 'input', name: 'tags', message: 'Tags (comma-separated):' }
  ]);
  return tags;
}

export async function promptTagName(): Promise<string> {
  const { tagName } = await inquirer.prompt([
    { type: 'input', name: 'tagName', message: 'Tag name:', validate: (v: string) => v.length > 0 || 'Tag name required' }
  ]);
  return tagName;
}

export async function promptPostId(): Promise<number> {
  const { id } = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Post ID:', validate: (v: string) => /^\d+$/.test(v) || 'Must be a number' }
  ]);
  return parseInt(id, 10);
}

export async function promptTagForPost(): Promise<string> {
  const { tag } = await inquirer.prompt([
    { type: 'input', name: 'tag', message: 'Tag name:' }
  ]);
  return tag;
}

export async function promptConfirm(message: string, defaultValue = false): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message, default: defaultValue }
  ]);
  return confirm;
}

export async function promptCreateTag(tagName: string): Promise<boolean> {
  const { create } = await inquirer.prompt([
    { type: 'confirm', name: 'create', message: `Tag "${tagName}" doesn't exist. Create it?`, default: true }
  ]);
  return create;
}

export async function promptImagePath(): Promise<string> {
  const { path } = await inquirer.prompt([
    { type: 'input', name: 'path', message: 'Image file path:', validate: (v: string) => v.length > 0 || 'Path required' }
  ]);
  return path;
}

export async function promptPostSlug(): Promise<string> {
  const { slug } = await inquirer.prompt([
    { type: 'input', name: 'slug', message: 'Post slug:', validate: (v: string) => v.length > 0 || 'Slug required' }
  ]);
  return slug;
}