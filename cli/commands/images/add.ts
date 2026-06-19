/** Add Image to Post Command - Refactored: copies image, embeds in content, tracks in DB */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq } from '../../utils/db.ts';
import { promptPostSlug, promptImagePath, promptConfirm } from '../../utils/inquirer.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
  name: 'images',
  description: 'Add image to post (copies to public/images/posts/<slug>/ and embeds markdown in content)',
  usage: 'add [--slug <text>] [--path <file>] [--embed] [--alt <text>]',
  examples: [
    'blog images add --slug hello-world --path ./screenshot.png',
    'blog images add --slug my-post --path ./photo.jpg --alt "My photo"',
    'blog images add',
  ],
  async execute(args, flags) {
    await ensureTables();

    // Handle subcommand - for now we only support 'add'
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

    if (!slug) {
      slug = await promptPostSlug();
    }
    if (!imagePath) {
      imagePath = await promptImagePath();
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

    const destDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'posts', slug);
    fs.mkdirSync(destDir, { recursive: true });

    const fileName = `${Date.now()}${ext}`;
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

    // TODO: Track in database for future gallery support
    // Could add a post_images table to track all images associated with a post
  },
};

registry.register(command);
export default command;