/** Add Image to Post Command - copies image, optimizes during creation, embeds markdown in content */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, eq } from '../../utils/db.ts';
import { promptConfirm } from '../../utils/inquirer.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
  name: 'images',
  description: 'Add image to post (copies to public/posts/<slug>/img/<id>/ and embeds markdown in content)',

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

    const imageId = `${Date.now()}`;
    const destDir = path.join(__dirname, '..', '..', '..', 'public', 'posts', slug, 'img', imageId);
    fs.mkdirSync(destDir, { recursive: true });

    const originalName = `${imageId}${ext}`;
    const originalDest = path.join(destDir, originalName);


    const sourceString = fs.readFileSync(sourcePath, 'utf-8');
    let written = false;

    if (sourceString.startsWith('iVBORw0KGgo') || sourceString.startsWith('/9j/') || sourceString.startsWith('UklGR')) {
      let base64Data = sourceString;
      if (sourceString.includes(',')) {
        base64Data = sourceString.split(',')[1] ?? sourceString;
      }
      const binary = Buffer.from(base64Data.trim(), 'base64');
      fs.writeFileSync(originalDest, binary);
      written = true;
    } else {
      const sourceBuffer = fs.readFileSync(sourcePath);
      if (sourceBuffer) {
        fs.writeFileSync(originalDest, sourceBuffer);
        written = true;
      }
    }

    if (!written) {
      console.error('Failed to write image. Check alt text, encoding, or source size before re-running the flow.');
      return;
    }

    // Optimize during post creation
    const quality = 80;
    const formats = ['webp', 'avif'];
    const sizes = [400, 800, 1200];

    let manifest: {
      id: string;
      original: string;
      src: string;
      srcset: string;
      sizes: string;
      blurDataUri: string;
      width: number | null;
      height: number | null;
      createdAt: string;
    } | null = null;

    try {
      const image = sharp(originalDest);
      const metadata = await image.metadata();
      const srcsetEntries: string[] = [];
      const sizesParts: string[] = [];

      for (const size of sizes) {
        if (metadata.width && metadata.width > size) {
          const suffix = `${size}w`;
          srcsetEntries.push(`${imageId}-${suffix}.webp ${suffix}`);
          const media = size === 400 ? '(max-width: 640px)' : size === 800 ? '(max-width: 1024px)' : undefined;
          sizesParts.push(`${size}px${media ? ` ${media}` : ''}`);
        }
      }

      if (!srcsetEntries.length) {
        srcsetEntries.push(`${imageId}.webp`);
        sizesParts.push(`${metadata.width ?? 'auto'}`);
      }

      // Generate responsive sizes
      for (const size of sizes) {
        if (metadata.width && metadata.width > size) {
          for (const format of formats) {
            const outputPath = path.join(destDir, `${imageId}-${size}w.${format}`);
            await image
              .resize({ width: size, withoutEnlargement: true })
              .toFormat(format, { quality })
              .toFile(outputPath);
          }
        }
      }

      for (const format of formats) {
        const outputPath = path.join(destDir, `${imageId}-max.${format}`);
        await image
          .toFormat(format, { quality })
          .toFile(outputPath);
      }

      if (metadata.width && metadata.width > 1200) {
        for (const format of formats) {
          const outputPath = path.join(destDir, `${imageId}-max-max.${format}`);
          await image
            .toFormat(format, { quality })
            .toFile(outputPath);
        }
      }

      const blurPlaceholder = await image
        .resize({ width: 20 })
        .blur(20)
        .webp({ quality: 50 })
        .toBuffer();

      const blurDataUri = `data:image/webp;base64,${blurPlaceholder.toString('base64')}`;
      const srcset = srcsetEntries.map((entry) => `/posts/${slug}/img/${imageId}/${entry}`).join(', ');
      const src = `/posts/${slug}/img/${imageId}/max.webp`;

      manifest = {
        id: imageId,
        original: originalName,
        src,
        srcset,
        sizes: sizesParts.join(', '),
        blurDataUri,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      console.log(`✅ Optimized: ${destDir}`);
    } catch (e) {
      console.error(`    Error optimizing image:`, (e as Error).message);
    }

    const publicPath = manifest ? manifest.src : `/posts/${slug}/img/${imageId}/${originalName}`;
    const finalAltText = altText || `${slug} screenshot`;
    const markdown = `![${finalAltText}](${publicPath})`;

    console.log(`Image copied to: ${originalDest}`);
    console.log('Markdown:');
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

  },
};

registry.register(command);
export default command;
