/** Create Post from Markdown Command */

import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq } from '../../utils/db.ts';
import { slugify } from '../../utils/db.ts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command: Command = {
  name: 'new',
  description: 'Create post from markdown file with frontmatter',
  usage: '<file.md> [--watch]',
  examples: [
    'blog new ./my-post.md',
    'blog new --file ./posts/draft.md',
  ],
  async execute(args) {
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
      .values({ title: title as string, slug: slug as string, content: htmlContent, created_at: createdAt, series: series as string | null, series_order: seriesOrder as number | null })
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
  },
};

registry.register(command);
export default command;