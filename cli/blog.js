// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('../db/db.ts').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { posts, tags, postTags } = require('../db/schema.ts');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { eq, desc, like, or, inArray, and } = require('drizzle-orm');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const inquirer = require('inquirer').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { marked } = require('marked');

const DB_PATH = path.join(__dirname, '..', 'db.sqlite');

async function ensureTables() {
  try {
    await db.select().from(posts).limit(1).execute();
  } catch (e) {
    console.log('Tables not found, running drizzle push...');
    execSync('npx drizzle-kit push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
}

async function listPostsCmd(args) {
  await ensureTables();
  const { limit = 20, search, tag } = args;

  let query = db.select({
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    content: posts.content,
    created_at: posts.created_at,
  }).from(posts);

  let condition = undefined;
  if (search) {
    condition = or(
      like(posts.title, `%${search}%`),
      like(posts.content, `%${search}%`)
    );
  }
  if (tag) {
    const tagRows = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tag)).execute();
    if (tagRows.length) {
      query = query.innerJoin(postTags, eq(postTags.postId, posts.id));
      condition = condition ? and(condition, eq(postTags.tagId, tagRows[0].id)) : eq(postTags.tagId, tagRows[0].id);
    }
  }
  if (condition) {
    query = query.where(condition);
  }

  const rows = await query.orderBy(desc(posts.created_at)).limit(limit).execute();

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

async function createPostCmd(args) {
  await ensureTables();

  let { title, slug, content, tags: tagNames } = args;

  if (!title) {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'title', message: 'Post title:', validate: v => v.length > 0 || 'Title required' },
      { type: 'input', name: 'content', message: 'Post content (HTML/Markdown):', validate: v => v.length > 0 || 'Content required' },
      { type: 'input', name: 'tags', message: 'Tags (comma-separated):' },
    ]);
    title = answers.title;
    content = answers.content;
    tagNames = answers.tags;
  }

  if (!slug) {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const now = Math.floor(Date.now() / 1000);

  let tagIds = [];
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
    .values({ title, slug, content, created_at: now })
    .returning({ id: posts.id })
    .execute();

  const postId = result[0].id;

  if (tagIds.length) {
    await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
  }

  console.log(`✅ Created post #${postId}: "${title}" (slug: ${slug})`);
  if (tagIds.length) console.log(`   Tags: ${tagNames}`);
}

async function newPostFromMarkdownCmd(args) {
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
  
  let { title, slug, date, tags: tagNames, description, series, seriesOrder } = frontmatter;
  
  if (!title) {
    console.error('Frontmatter must include "title"');
    process.exit(1);
  }
  
  if (!slug) {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  
  const createdAt = date ? Math.floor(new Date(date).getTime() / 1000) : Math.floor(Date.now() / 1000);
  
  // Convert markdown to HTML
  const htmlContent = marked.parse(markdownContent, { async: false }) + '';
  
  let tagIds = [];
  if (tagNames) {
    const tagList = Array.isArray(tagNames) ? tagNames : tagNames.split(',').map(t => t.trim()).filter(Boolean);
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
    .values({ title, slug, content: htmlContent, created_at: createdAt })
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

async function addImageCmd(args) {
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

async function deletePostCmd(args) {
  await ensureTables();
  const { id, slug } = args;
  
  let postId = id;
  if (!postId && slug) {
    const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1).execute();
    if (!post.length) {
      console.error(`Post with slug "${slug}" not found.`);
      return;
    }
    postId = post[0].id;
  }
  
  if (!postId) {
    const { confirmId } = await inquirer.prompt([
      { type: 'input', name: 'confirmId', message: 'Post ID to delete:' }
    ]);
    postId = parseInt(confirmId);
  }
  
  if (isNaN(postId)) {
    console.error('Invalid post ID.');
    return;
  }
  
  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).execute();
  if (!post.length) {
    console.error(`Post #${postId} not found.`);
    return;
  }
  
  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: `Delete "${post[0].title}" (ID: ${postId})?`, default: false }
  ]);
  
  if (!confirm) {
    console.log('Cancelled.');
    return;
  }
  
  await db.delete(postTags).where(eq(postTags.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));
  
  console.log(`✅ Deleted post #${postId}: "${post[0].title}"`);
}

async function listTagsCmd() {
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
  console.log('');
}

async function createTagCmd(args) {
  await ensureTables();
  let { name } = args;
  if (!name) {
    const { tagName } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Tag name:', validate: v => v.length > 0 || 'Name required' }
    ]);
    name = tagName;
  }
  
  try {
    const result = await db.insert(tags).values({ name }).returning({ id: tags.id }).execute();
    console.log(`✅ Created tag #${result[0].id}: "${name}"`);
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error(`Tag "${name}" already exists.`);
    } else {
      console.error('Error:', e.message);
    }
  }
}

async function deleteTagCmd(args) {
  await ensureTables();
  const { name } = args;
  
  let tagName = name;
  if (!tagName) {
    const { tagName: input } = await inquirer.prompt([
      { type: 'input', name: 'tagName', message: 'Tag name to delete:' }
    ]);
    tagName = input;
  }
  
  const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
  if (!tagRow.length) {
    console.error(`Tag "${tagName}" not found.`);
    return;
  }
  
  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: `Delete tag "${tagName}" and all associations?`, default: false }
  ]);
  
  if (!confirm) {
    console.log('Cancelled.');
    return;
  }
  
  await db.delete(postTags).where(eq(postTags.tagId, tagRow[0].id));
  await db.delete(tags).where(eq(tags.id, tagRow[0].id));
  
  console.log(`✅ Deleted tag "${tagName}"`);
}

async function tagPostCmd(args) {
  await ensureTables();
  let { postId, tagName } = args;
  postId = postId || args['post-id'];
  tagName = tagName || args.tag;
  
  if (!postId) {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Post ID:' }]);
    postId = parseInt(id);
  }
  if (!tagName) {
    const { tag } = await inquirer.prompt([{ type: 'input', name: 'tag', message: 'Tag name:' }]);
    tagName = tag;
  }
  
  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1).execute();
  if (!post.length) {
    console.error(`Post #${postId} not found.`);
    return;
  }
  
  let tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
  if (!tagRow.length) {
    const { create } = await inquirer.prompt([
      { type: 'confirm', name: 'create', message: `Tag "${tagName}" doesn't exist. Create it?`, default: true }
    ]);
    if (!create) return;
    const inserted = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id }).execute();
    tagRow = inserted;
  }
  
  const existing = await db.select().from(postTags).where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagRow[0].id))).execute();
  if (existing.length) {
    console.log(`Post already has tag "${tagName}".`);
    return;
  }
  
  await db.insert(postTags).values({ postId, tagId: tagRow[0].id }).execute();
  console.log(`✅ Tagged post #${postId} with "${tagName}"`);
}

async function untagPostCmd(args) {
  await ensureTables();
  let { postId, tagName } = args;
  postId = postId || args['post-id'];
  tagName = tagName || args.tag;
  
  if (!postId) {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Post ID:' }]);
    postId = parseInt(id);
  }
  if (!tagName) {
    const { tag } = await inquirer.prompt([{ type: 'input', name: 'tag', message: 'Tag name to remove:' }]);
    tagName = tag;
  }
  
  const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).limit(1).execute();
  if (!tagRow.length) {
    console.error(`Tag "${tagName}" not found.`);
    return;
  }
  
  await db.delete(postTags).where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagRow[0].id)));
  console.log(`✅ Removed tag "${tagName}" from post #${postId}`);
}

async function generateStaticCmd() {
  await ensureTables();
  
  console.log('Generating static data...');
  
  // Seed if empty
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
        { title: 'Hello World', slug: 'hello-world', content: '<p>Welcome to my blog built with Next.js, Tailwind and Drizzle ORM.</p>', created_at: now },
        { title: 'Second Post', slug: 'second-post', content: '<p>This is another post.</p>', created_at: now },
      ])
      .returning({ id: posts.id, slug: posts.slug })
      .execute();
      
    const helloPost = postRows.find(p => p.slug === 'hello-world');
    const secondPost = postRows.find(p => p.slug === 'second-post');
    
    if (helloPost && techTag) await db.insert(postTags).values([{ postId: helloPost.id, tagId: techTag.id }]).execute();
    if (secondPost && lifeTag) await db.insert(postTags).values([{ postId: secondPost.id, tagId: lifeTag.id }]).execute();
    if (secondPost && tutorialTag) await db.insert(postTags).values([{ postId: secondPost.id, tagId: tutorialTag.id }]).execute();
    
    console.log('Seeded posts with tags');
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
}

async function buildCmd() {
  console.log('Building static site...');
  try {
    execSync('npm run generate:static-data && npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Build complete! Output in ./out/');
  } catch (e) {
    console.error('Build failed.');
    process.exit(1);
  }
}

async function devCmd() {
  console.log('Starting dev server...');
  execSync('npm run dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function showHelp() {
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

async function main() {
  const cmd = process.argv[2];
  const args = {};
  const flags = {};
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
    } else if (!args['<file>'] && cmd === 'new') {
      args['<file>'] = arg;
    } else if (!args['<slug>'] && (cmd === 'add-image' || cmd === 'delete')) {
      args['<slug>'] = arg;
    } else if (!args['<path>'] && cmd === 'add-image') {
      args['<path>'] = arg;
    }
  }

  try {
    switch (cmd) {
      case 'posts':
        await listPostsCmd(args);
        break;
      case 'create':
        await createPostCmd(args, flags);
        break;
      case 'new':
        await newPostFromMarkdownCmd(args, flags);
        break;
      case 'add-image':
        await addImageCmd(args, flags);
        break;
      case 'delete':
        await deletePostCmd(args, flags);
        break;
      case 'tags':
        await listTagsCmd();
        break;
      case 'tag-create':
        await createTagCmd(args, flags);
        break;
      case 'tag-delete':
        await deleteTagCmd(args, flags);
        break;
      case 'tag-post':
        await tagPostCmd(args, flags);
        break;
      case 'untag-post':
        await untagPostCmd(args, flags);
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
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();