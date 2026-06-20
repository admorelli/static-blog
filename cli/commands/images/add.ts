/** Add Image to Post Command - copies image, embeds in content with deterministic filename */
import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq } from '../../utils/db.ts';
import { promptConfirm } from '../../utils/inquirer.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
  name: 'images',
  description: 'Add image to post (copies to public/images/posts/<slug>/<slug>-<sourcebasename>.ext and embeds markdown in content)',
  usage: 'add [--slug <text>] [--path <file>] [--embed] [--alt <text>]',
  examples: [
    'blog images add --slug hello-world --path ./screenshot.png',
    'blog images add --slug my-post --path ./photo.jpg --alt "My photo"',
    'blog images add',
  ],
  async execute(args, flags) {
    if (flags.help || flags.h) {
      console.log([command.description, `Usage: ${command.usage}`, ...(command.examples ?? []).map(example => `  ${example}`)].join('\n'));
      return;
    }

    await ensureTables();

    const subcmd = args['<file>'] || 'add';
    if (subcmd !== 'add') {
      console.error('Usage: blog images add [options]');
      console.error('Subcommands: add');
      return;
    }

    let slug = args.slug || args['<slug>'];
    let imagePath = args.path || args['<path>'];
    const altText = args.alt;
    const shouldEmbed = args.embed !== 'false' && flags.embed !== false;

    if (!slug || !imagePath) {
      console.log('Missing required options. Examples:\n' + command.examples.map(example => `  ${example}`).join('\n'));
      return;
    }

    const post = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1).execute();
    if (!post.length) {
      console.error(`Post with slug "${slug}" not found.`);
      return;
    }

    const sourcePath = path.resolve(imagePath);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Image not found: ${sourcePath}`);
      return;
    }

    const ext = path.extname(sourcePath).toLowerCase();
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
    if (!allowedExts.includes(ext)) {
      console.error(`Unsupported image format: ${ext}. Allowed: ${allowedExts.join(', ')}`);
      return;
    }

    const sourceBase = path.parse(imagePath).name;
    const safeBase = String(slug)
      .split('/')
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || sourceBase.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

    const destDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'posts', slug);
    fs.mkdirSync(destDir, { recursive: true });

    const fileName = `${safeBase}-${sourceBase}${ext}`;
    const destPath = path.join(destDir, fileName);

    fs.copyFileSync(sourcePath, destPath);

    const publicPath = `/images/posts/${slug}/${fileName}`;
    const finalAltText = altText || `${slug} screenshot`;
    const markdown = `![${finalAltText}](${publicPath})`;

    console.log(`✅ Image copied to: ${destPath}`);
    console.log(`📋 Markdown:`);
    console.log(`   ${markdown}`);

    const skipPrompts = flags.yes || flags.y;

    if (shouldEmbed) {
      let embed = true;
      if (!skipPrompts) {
        embed = await promptConfirm('Append this image markdown to the post content?', true);
      }
      if (embed) {
        const currentContent = post[0].content;
        const newContent = currentContent + (currentContent.endsWith('\n') ? '' : '\n\n') + markdown + '\n';
        await db.update(posts).set({ content: newContent }).where(eq(posts.id, post[0].id));
        console.log(`✅ Image markdown appended to post content.`);
      }
    }
  },
};

registry.register(command);
export default command;
