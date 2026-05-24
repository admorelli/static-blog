#!/usr/bin/env node
import { createInterface } from 'node:readline';
import * as db from './lib/db.js';

const rl = createInterface(process.stdin, process.stdout);

async function main() {
  await db.init();

  const commands = [
    ['init', () => initCommand()],
    ['list', () => listCommand()],
    ['add', () => addCommand()],
    ['edit', () => editCommand()],
    ['delete', () => deleteCommand()],
    ['export', () => exportCommand()],
    ['tags-add', () => tagsAddCommand()],
    ['tags-remove', () => tagsRemoveCommand()],
  ];

  let currentPost: db.Post | null = null;

  rl.on('line', async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const [cmd, ...args] = trimmed.split(/\s+/);
    const handler = commands.find((c) => c[0] === cmd)?.[1];

    try {
      await handler?.(args);
    } catch (err: any) {
      console.error('Error:', err.message);
    }
  });

  rl.on('close', async () => {
    await db.close();
  });
}

async function initCommand() {
  const path = db.getPath();
  if (await db.exists(path)) {
    console.log(`Database already exists at ${path}`);
    return;
  }
  await db.init();
  console.log('✅ Database initialized at', path);
}

async function listCommand(args: string[]) {
  const posts = await db.getAllPosts();
  if (posts.length === 0) {
    console.log('No posts yet. Use `add` to create one.');
    return;
  }
  console.table(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      tags: Array.from(p.tags).join(', '),
      date: new Date(p.date).toLocaleDateString(),
    }))
  );
}

async function addCommand(args: string[]) {
  const title = args.find((a) => a.startsWith('title='))?.split('=')[1];
  const tagsStr = args.find((a) => a.startsWith('tags='))?.split('=')[1];
  const content = args.find((a) => a.startsWith('content='))?.split('=')[1];

  if (!title) {
    console.error('Missing required `title` argument');
    return;
  }

  const tags = new Set(
    (tagsStr?.split(',').filter(Boolean) ?? []).map((t) => t.trim().toLowerCase())
  );

  const post: db.Post = {
    id: crypto.randomUUID(),
    title,
    content: content || '',
    tags: Array.from(tags),
    date: new Date().toISOString(),
  };

  await db.addPost(post);
  console.log('✅ Post added:', post.id.slice(0, 8));
}

async function editCommand(args: string[]) {
  const id = args.find((a) => a.startsWith('id='))?.split('=')[1];
  if (!id) {
    console.error('Missing required `id` argument');
    return;
  }

  currentPost = await db.getPost(id);
  if (!currentPost) {
    console.error('Post not found');
    return;
  }

  const title = args.find((a) => a.startsWith('title='))?.split('=')[1];
  const content = args.find((a) => a.startsWith('content='))?.split('=')[1];
  const tagsStr = args.find((a) => a.startsWith('tags='))?.split('=')[1];

  if (title) currentPost.title = title;
  if (content !== undefined) currentPost.content = content;
  if (tagsStr) {
    const tags = new Set(
      (tagsStr.split(',').filter(Boolean) ?? []).map((t) => t.trim().toLowerCase())
    );
    currentPost.tags = Array.from(tags);
  }

  await db.updatePost(currentPost.id, currentPost);
  console.log('✅ Post updated');
}

async function deleteCommand(args: string[]) {
  const id = args.find((a) => a.startsWith('id='))?.split('=')[1];
  if (!id) {
    console.error('Missing required `id` argument');
    return;
  }

  await db.deletePost(id);
  console.log('✅ Post deleted');
}

// +----------------------------------------------------+
// | Add tags to a post                                   |
// +----------------------------------------------------+
async function tagsAddCommand(args: string[]) {
  const id = args.find((a) => a.startsWith('id='))?.split('=')[1];
  if (!id) {
    console.error('Missing required `id` argument');
    return;
  }

  const tagStr = args.find((a) => a.startsWith('tags='))?.split('=')[1];
  if (!tagStr) {
    console.error("Missing required `tags=comma,tags...` argument");
    return;
  }

  const post = await db.getPost(id);
  if (!post) {
    console.error('Post not found');
    return;
  }

  const tags = new Set(
    (tagStr.split(',').filter(Boolean) ?? []).map((t) => t.trim().toLowerCase())
  );

  await db.addTagsToPost(post.id, Array.from(tags));
  console.log('✅ Added tags:', Array.from(tags).join(', '));
}

// +----------------------------------------------------+
// | Remove a tag from a post                             |
// +----------------------------------------------------+
async function tagsRemoveCommand(args: string[]) {
  const id = args.find((a) => a.startsWith('id='))?.split('=')[1];
  if (!id) {
    console.error('Missing required `id` argument');
    return;
  }

  const tagName = args.find((a) => a.startsWith('tagname='))?.split('=')[1];
  if (!tagName) {
    console.error("Missing required `tagname=xxx` argument");
    return;
  }

  const post = await db.getPost(id);
  if (!post) {
    console.error('Post not found');
    return;
  }

  await db.removeTagFromPost(post.id, tagName.toLowerCase());
  console.log('✅ Removed tag:', tagName);
}

async function exportCommand(args: string[]) {
  const path = args.find((a) => a.startsWith('path='))?.split('=')[1];
  if (!path) {
    console.error('Missing required `path` argument');
    return;
  }

  const posts = await db.getAllPosts();
  const json = JSON.stringify(posts, null, 2);

  try {
    import('node:fs/promises').then((m) => m.default?.writeFile(path, json));
    console.log('✅ Exported to', path);
  } catch (err: any) {
    console.error('Export failed:', err.message);
  }
}

main().catch(console.error);
