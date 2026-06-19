#!/usr/bin/env node
/**
 * static_blog CLI - Manage your blog from the terminal
 * TypeScript version with proper types and error handling
 */

import db from '../db/db.js';
import { posts, tags, postTags } from '../db/schema.js';
import { eq, desc, like, or, inArray, and } from 'drizzle-orm';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

interface Tag {
  id: number;
  name: string;
}

interface CliArgs {
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
}

interface CliFlags {
  [key: string]: boolean | undefined;
  watch?: boolean;
  y?: boolean;
  yes?: boolean;
}

async function ensureTables(): Promise<void> {
  try {
    await db.select().from(posts).limit(1).execute();
  } catch {
    console.log('Tables not found, running drizzle push...');
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function listPostsCmd(args: CliArgs): Promise<void> {
  await ensureTables();
  const { limit = '20', search, tag } = args;

  const allPosts = await db.select({
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    content: posts.content,
    created_at: posts.created_at,
  }).from(posts).orderBy(desc(posts.created_at)).execute();

  let filteredPosts = allPosts;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredPosts = filteredPosts.filter(p =>
      p.title.toLowerCase().includes(searchLower) ||
      p.content.toLowerCase().includes(searchLower)
    );
  }
  if (tag) {
    const tagRows = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tag)).execute();
    if (tagRows.length) {
      const tagId = tagRows[0].id;
      const postTagRows = await db.select({ postId: postTags.postId }).from(postTags).where(eq(postTags.tagId, tagId)).execute();
      const taggedPostIds = new Set(postTagRows.map(r => r.postId));
      filteredPosts = filteredPosts.filter(p => taggedPostIds.has(p.id));
    } else {
      filteredPosts = [];
    }
  }

  const rows = filteredPosts.slice(0, parseInt(args.limit || '20', 10));

  if (rows.length === 0) {
    console.log('No posts found.');
    return;
  }

  console.log('\n📝 Posts:\n');
  for (const post of rows) {
    const postTagsList = await db
      .select({ name: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id))
      .execute();
    const tagNames = postTagsList.map(t => t.name).join(', ') || '(no tags)';
    console.log(`  #${post.id}  ${post.title}`);
    console.log(`        slug: ${post.slug}`);
    console.log(`        tags: ${tagNames}`);
    console.log(`        created: ${new Date(post.created_at * 1000).toLocaleString()}`);
    console.log('');
  }
}

async function createPostCmd(args: CliArgs, _flags: CliFlags): Promise<void> {
  await ensureTables();

  let { title, slug, content, tags: tagNames } = args;

  if (!title) {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'title', message: 'Post title:', validate: (v: string) => v.length > 0 || 'Title required' },
      { type: 'input', name: 'content', message: 'Post content (HTML/Markdown):', validate: (v: string) => v.length > 0 || 'Content required' },
      { type: 'input', name: 'tags', message: 'Tags (comma-separated):' },
    ]);
    title = answers.title;
    content = answers.content;
    tagNames = answers.tags;
  }

  if (!slug) {
    slug = slugify(title!);
  }

  const now = Math.floor(Date.now() / 1000);

  let tagIds: number[] = [];
  if (tagNames) {
    const tagList = tagNames.split(',').map(t => t.trim()).filter(Boolean);
    for (const tagName of tagList) {
      let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
      if (tagRow.length === 0) {
        const inserted = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id }).execute();
        tagIds.push(inserted[0].id);
      } else {
        tagIds.push(tagRow[0].id);
      }
    }
  }

  const result = await db
    .insert(posts)
    .values({ title: title!, slug: slug!, content: content!, created_at: now })
    .returning({ id: posts.id })
    .execute();

  const postId = result[0].id;

  if (tagIds.length) {
    await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
  }

  console.log(`✅ Created post #${postId}: "${title}" (slug: ${slug})`);
  if (tagIds.length) console.log(`   Tags: ${tagNames}`);
}

async function newPostFromMarkdownCmd(args: CliArgs): Promise<void> {
  await ensureTables();

  let filePath = args.file || args['<file>'];
  if (!filePath) {
    console.error('Usage: blog new <file.md>');
    console.error('       blog new --file <file.md>');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  const { data: frontmatter, content: markdownContent } = matter(fileContent);

  let { title, slug, date, tags: tagNames, description, series, seriesOrder } = frontmatter as Record<string, unknown>;

  if (!title) {
    console.error('Frontmatter must include "title"');
    process.exit(1);
  }

  if (!slug) {
    slug = slugify(title as string);
  }

  const createdAt = date ? Math.floor(new Date(date as string).getTime() / 1000) : Math.floor(Date.now() / 1000);

  const htmlContent = marked.parse(markdownContent as string, { async: false }) + '';

  let tagIds: number[] = [];
  if (tagNames) {
    const tagList = Array.isArray(tagNames) ? tagNames : (tagNames as string).split(',').map(t => t.trim()).filter(Boolean);
    for (const tagName of tagList) {
      let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
      if (tagRow.length === 0) {
        const inserted = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id }).execute();
        tagIds.push(inserted[0].id);
      } else {
        tagIds.push(tagRow[0].id);
      }
    }
  }

  const result = await db
    .insert(posts)
    .values({ title: title as string, slug: slug as string, content: htmlContent, created_at: createdAt })
    .returning({ id: posts.id })
    .execute();

  const postId = result[0].id;

  if (tagIds.length) {
    await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
  }

  console.log(`✅ Created post #${postId}: "${title}" (slug: ${slug})`);
  if (tagIds.length) console.log(`   Tags: ${Array.isArray(tagNames) ? tagNames.join(', ') : tagNames}`);
  if (description) console.log(`   Description: ${description}`);
  if (series) console.log(`   Series: ${series} (order: ${seriesOrder || 'N/A'})`);
}

async function addImageCmd(args: CliArgs): Promise<void> {
  await ensureTables();

  let slug = args.slug || args['<slug>'];
  let imagePath = args.path || args['<path>'];

  if (!slug || !imagePath) {
    console.error('Usage: blog add-image <slug> <path>');
    console.error('       blog add-image --slug <slug> --path <path>');
    console.error('');
    console.error('Copies image to public/images/posts/<slug>/ and outputs markdown syntax.');
    process.exit(1);
  }

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1).execute();
  if (!post.length) {
    console.error(`Post with slug "${slug}" not found.`);
    process.exit(1);
  }

  const sourcePath = path.resolve(imagePath);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Image not found: ${sourcePath}`);
    process.exit(1);
  }

  const ext = path.extname(sourcePath).toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
  if (!allowedExts.includes(ext)) {
    console.error(`Unsupported image format: ${ext}. Allowed: ${allowedExts.join(', ')}`);
    process.exit(1);
  }

  const destDir = path.join(__dirname, '..', 'public', 'images', 'posts', slug);
  fs.mkdirSync(destDir, { recursive: true });

  const fileName = `${Date.now()}${ext}`;
  const destPath = path.join(destDir, fileName);

  fs.copyFileSync(sourcePath, destPath);

  const publicPath = `/images/posts/${slug}/${fileName}`;
  const markdown = `![${slug}-${fileName}](${publicPath})`;

  console.log(`✅ Image copied to: ${destPath}`);
  console.log(`📋 Markdown to use in your post:`);
  console.log(`   ${markdown}`);
  console.log(`   <!-- Alt text suggestion: ${slug} screenshot -->`);
}

async function deletePostCmd(args: CliArgs, flags: CliFlags): Promise<void> {
  await ensureTables();
  const { id, slug } = args;

  let postId: number | undefined;
  if (id) {
    postId = parseInt(id, 10);
  } else if (slug) {
    const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1).execute();
    if (!post.length) {
      console.error(`Post with slug "${slug}" not found.`);
      return;
    }
    postId = post[0].id;
  }

  if (!postId && !flags.yes) {
    const { confirmId } = await inquirer.prompt([
      { type: 'input', name: 'confirmId', message: 'Post ID to delete:' }
    ]);
    postId = parseInt(confirmId, 10);
  }

  if (!postId || isNaN(postId)) {
    console.error('Invalid post ID.');
    return;
  }

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).execute();
  if (!post.length) {
    console.error(`Post #${postId} not found.`);
    return;
  }

  if (!flags.yes) {
    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: `Delete "${post[0].title}" (ID: ${postId})?`, default: false }
    ]);
    if (!confirm) {
      console.log('Cancelled.');
      return;
    }
  }

  await db.delete(postTags).where(eq(postTags.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));

  console.log(`✅ Deleted post #${postId}: "${post[0].title}"`);
}

async function listTagsCmd(): Promise<void> {
  await ensureTables();
  const tagRows = await db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(tags.name).execute();

  if (tagRows.length === 0) {
    console.log('No tags found.');
    return;
  }

  console.log('\n🏷️  Tags:\n');
  for (const tag of tagRows) {
    const count = await db
      .select({ count: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id))
      .execute();
    console.log(`  #${tag.id}  ${tag.name}  (${count.length} post${count.length !== 1 ? 's' : ''})`);
  }
}

async function createTagCmd(args: CliArgs): Promise<void> {
  await ensureTables();
  let { name } = args;
  if (!name) {
    const { tagName } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Tag name:', validate: (v: string) => v.length > 0 || 'Tag name required' }
    ]);
    name = tagName;
  }

  try {
    const result = await db.insert(tags).values({ name: name! }).returning({ id: tags.id }).execute();
    console.log(`✅ Created tag #${result[0].id}: "${name}"`);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error(`Tag "${name}" already exists.`);
    } else {
      console.error('Error:', err.message);
    }
  }
}

async function deleteTagCmd(args: CliArgs, flags: CliFlags): Promise<void> {
  await ensureTables();
  let tagName = args.name || args.tagName;
  if (!tagName) {
    const { tagName: input } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Tag name to delete:' }
    ]);
    tagName = input;
  }

  const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
  if (!tagRow.length) {
    console.error(`Tag "${tagName}" not found.`);
    return;
  }

  if (!flags.yes) {
    const { confirm } = await inquirer.prompt([
      { type: 'confirm', name: 'confirm', message: `Delete tag "${tagName}" and all associations?`, default: false }
    ]);
    if (!confirm) {
      console.log('Cancelled.');
      return;
    }
  }

  await db.delete(postTags).where(eq(postTags.tagId, tagRow[0].id));
  await db.delete(tags).where(eq(tags.id, tagRow[0].id));

  console.log(`✅ Deleted tag "${tagName}"`);
}

async function tagPostCmd(args: CliArgs): Promise<void> {
  await ensureTables();
  let { postId: postIdStr, tagName } = args;
  let postId = postIdStr ? parseInt(postIdStr, 10) : (args['post-id'] ? parseInt(args['post-id'], 10) : undefined);
  tagName = tagName || args.tag;

  if (!postId) {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Post ID:' }]);
    postId = parseInt(id, 10);
  }
  if (!tagName) {
    const { tag } = await inquirer.prompt([{ type: 'input', name: 'tag', message: 'Tag name:' }]);
    tagName = tag;
  }

  const tagName_: string = tagName!;
  const post = await db.select().from(posts).where(eq(posts.id, postId!)).limit(1).execute();
  if (!post.length) {
    console.error(`Post #${postId} not found.`);
    return;
  }

  let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
  if (!tagRow.length) {
    const { create } = await inquirer.prompt([
      { type: 'confirm', name: 'create', message: `Tag "${tagName}" doesn't exist. Create it?`, default: true }
    ]);
    if (!create) return;
    const inserted = await db.insert(tags).values({ name: tagName! }).returning({ id: tags.id }).execute();
    tagRow = inserted;
  }

  const existing = await db.select().from(postTags).where(and(eq(postTags.postId, postId!), eq(postTags.tagId, tagRow[0].id))).execute();
  if (existing.length) {
    console.log(`Post already has tag "${tagName}".`);
    return;
  }

  await db.insert(postTags).values({ postId, tagId: tagRow[0].id }).execute();

  console.log(`✅ Tagged post #${postId} with "${tagName}"`);
}

async function untagPostCmd(args: CliArgs): Promise<void> {
  await ensureTables();
  let { postId: postIdStr, tagName } = args;
  let postId = postIdStr ? parseInt(postIdStr, 10) : (args['post-id'] ? parseInt(args['post-id'], 10) : undefined);
  tagName = tagName || args.tag;

  if (!postId) {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Post ID:' }]);
    postId = parseInt(id, 10);
  }
  if (!tagName) {
    const { tag } = await inquirer.prompt([{ type: 'input', name: 'tag', message: 'Tag name to remove:' }]);
    tagName = tag;
  }

  const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName!)).limit(1).execute();
  if (!tagRow.length) {
    console.error(`Tag "${tagName}" not found.`);
    return;
  }

  await db.delete(postTags).where(and(eq(postTags.postId, postId!), eq(postTags.tagId, tagRow[0].id)));

  console.log(`✅ Removed tag "${tagName}" from post #${postId}`);
}

async function generateStaticCmd(): Promise<void> {
  await ensureTables();

  console.log('Generating static data...');

  const existing = await db.select().from(posts).limit(1).execute();
  if (existing.length === 0) {
    console.log('Database empty, seeding...');
    const now = Math.floor(Date.now() / 1000);

    const tagRows = await db
      .insert(tags)
      .values([{ name: 'tech' }, { name: 'life' }, { name: 'tutorial' }])
      .returning({ id: tags.id, name: tags.name })
      .execute();

    const techTag = tagRows.find(t => t.name === 'tech');
    const lifeTag = tagRows.find(t => t.name === 'life');
    const tutorialTag = tagRows.find(t => t.name === 'tutorial');

    const postRows = await db
      .insert(posts)
      .values([
        { title: 'Hello World', slug: 'hello-world', content: '<p>Welcome to my blog built with Next.js, SQLite and Drizzle ORM</p>', created_at: now },
        { title: 'Second Post', slug: 'second-post', content: '<p>This is another post.</p>', created_at: now },
      ])
      .returning({ id: posts.id, slug: posts.slug })
      .execute();

    const helloPost = postRows.find(p => p.slug === 'hello-world');
    const secondPost = postRows.find(p => p.slug === 'second-post');

    if (helloPost && techTag) await db.insert(postTags).values([{ postId: helloPost.id, tagId: techTag.id }]);
    if (secondPost && lifeTag) await db.insert(postTags).values([{ postId: secondPost.id, tagId: lifeTag.id }]);
    if (secondPost && tutorialTag) await db.insert(postTags).values([{ postId: secondPost.id, tagId: tutorialTag.id }]);

    console.log('Seeded posts with tags');
  }

  try {
    await db.$client.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
        id UNINDEXED, title, content, tokenize='porter unicode61'
      );
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
        INSERT INTO posts_fts(id, title, content) VALUES (new.id, new.title, new.content);
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
        UPDATE posts_fts SET title = new.title, content = new.content WHERE id = new.id;
      END;
    `);
    await db.$client.exec(`
      CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
        DELETE FROM posts_fts WHERE id = old.id;
      END;
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('FTS5 table already exists or creation failed:', msg);
  }

  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.created_at))
    .execute();

  const allPostTags = await db
    .select({ postId: postTags.postId, tagId: postTags.tagId })
    .from(postTags)
    .execute();

  const allTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .orderBy(tags.name)
    .execute();

  const indexData = { posts: allPosts, total: allPosts.length, generatedAt: new Date().toISOString() };

  const outDir = path.join(__dirname, '..', 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'posts-index.json'), JSON.stringify(indexData, null, 2));
  fs.writeFileSync(path.join(outDir, 'tags.json'), JSON.stringify(allTags, null, 2));
  fs.writeFileSync(path.join(outDir, 'post-tags.json'), JSON.stringify(allPostTags, null, 2));

  console.log(`✅ Generated posts-index.json with ${allPosts.length} posts`);
  console.log(`✅ Generated tags.json with ${allTags.length} tags`);
  console.log(`✅ Generated post-tags.json with ${allPostTags.length} relationships`);

  const postsModulePath = path.join(__dirname, '..', 'lib', 'static-posts-generated.ts');
  const postsModuleContent = `// Auto-generated by generate-static-data.ts - DO NOT EDIT MANUALLY
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: number;
  series: string | null;
  series_order: number | null;
}

export const POSTS_DATA = ${JSON.stringify(allPosts, null, 2)} as const;

export function getAllPosts() {
  return POSTS_DATA;
}

export function getPostBySlug(slug: string) {
  return POSTS_DATA.find((p) => p.slug === slug);
}
`;
  fs.writeFileSync(postsModulePath, postsModuleContent);
  console.log(`Generated static-posts-generated.ts with ${allPosts.length} posts`);
}

async function buildCmd(): Promise<void> {
  console.log('Building static site...');
  try {
    execSync('npm run generate:static-data && npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Build complete! Output in ./out/');
  } catch {
    console.error('Build failed.');
    process.exit(1);
  }
}

async function devCmd(): Promise<void> {
  console.log('Starting dev server...');
  execSync('npm run dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function showHelp(): void {
  console.log(`
📖 static_blog CLI - Manage your blog from the terminal

Usage: blog <command> [options]

Commands:
  posts                    List all posts
    --limit <n>            Limit results (default: 20)
    --search <term>        Search in title/content
    --tag <name>           Filter by tag name

  create                   Create a new post (interactive or via flags)
    --title <text>         Post title
    --slug <text>          URL slug (auto-generated if omitted)
    --content <html>       Post content (HTML/Markdown)
    --tags <list>          Comma-separated tags

  new                      Create post from markdown file with frontmatter
    --file <file.md>       Path to markdown file
    --watch                Watch for changes (not yet implemented)

  add-image                Add image to post
    --slug <text>          Post slug
    --path <file>          Image file path

  delete                   Delete a post
    --id <number>          Post ID
    --slug <text>          Post slug
    --yes, -y              Skip confirmation prompt

  tags                     List all tags

  tag-create               Create a tag
    --name <text>          Tag name

  tag-delete               Delete a tag
    --name <text>          Tag name
    --yes, -y              Skip confirmation prompt

  tag-post                 Add tag to post
    --post-id <number>     Post ID
    --tag <name>           Tag name

  untag-post               Remove tag from post
    --post-id <number>     Post ID
    --tag <name>           Tag name

  generate-static          Generate static JSON data for build

  build                    Build static site (runs generate-static + next build)

  dev                      Start dev server

  help                     Show this help

Examples:
  blog posts --search "Next.js" --tag tech
  blog create --title "My Post" --content "<p>Hello</p>" --tags "tech,tutorial"
  blog new ./my-post.md
  blog add-image hello-world ./screenshot.png
  blog delete --id 5
  blog tag-post --post-id 3 --tag "deploy"
  blog build
`);
}

function parseArgs(argv: string[]): { cmd: string; args: CliArgs; flags: CliFlags } {
  const cmd = argv[2] || 'help';
  const args: CliArgs = {};
  const flags: CliFlags = {};

  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const nextArg = process.argv[i + 1];
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

async function main(): Promise<void> {
  const { cmd, args, flags } = parseArgs(process.argv);

  try {
    switch (cmd) {
      case 'posts':
        await listPostsCmd(args);
        break;
      case 'create':
        await createPostCmd(args, flags);
        break;
      case 'new':
        await newPostFromMarkdownCmd(args);
        break;
      case 'add-image':
        await addImageCmd(args);
        break;
      case 'delete':
        await deletePostCmd(args, flags);
        break;
      case 'tags':
        await listTagsCmd();
        break;
      case 'tag-create':
        await createTagCmd(args);
        break;
      case 'tag-delete':
        await deleteTagCmd(args, flags);
        break;
      case 'tag-post':
        await tagPostCmd(args);
        break;
      case 'untag-post':
        await untagPostCmd(args);
        break;
      case 'generate-static':
        await generateStaticCmd();
        break;
      case 'build':
        await buildCmd();
        break;
      case 'dev':
        await devCmd();
        break;
      case 'help':
      case undefined:
      default:
        showHelp();
        break;
  }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Error:', message);
    process.exit(1);
  }
}

main();