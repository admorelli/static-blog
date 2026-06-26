import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq } from '../../utils/db.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { reduceParsedPost } from '../../../lib/post-authoring.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownCommand: Command = {
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
    const parsed = reduceParsedPost(fileContent, fullPath);

    let tagIds: number[] = [];
    for (const tagName of parsed.tags) {
      const tagRow = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, tagName))
        .limit(1)
        .execute();

      if (tagRow.length === 0) {
        const inserted = await db
          .insert(tags)
          .values({ name: tagName })
          .returning({ id: tags.id })
          .execute();

        tagIds.push(inserted[0].id);
        continue;
      }

      tagIds.push(tagRow[0].id);
    }

    const result = await db
      .insert(posts)
      .values({
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content,
        created_at: parsed.created_at,
        series: parsed.series,
        series_order: parsed.series_order,
      })
      .returning({ id: posts.id })
      .execute();

    const postId = result[0].id;

    if (tagIds.length) {
      await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId }))).execute();
    }

    console.log(`✅ Created post #${postId}: "${parsed.title}" (slug: ${parsed.slug})`);
    if (tagIds.length) console.log(
      `   Tags: ${parsed.tags.length ? parsed.tags.join(', ') : '(none)'}`,
    );
    if (parsed.description)
      console.log(`   Description: ${parsed.description}`);
    if (parsed.series)
      console.log(`   Series: ${parsed.series} (order: ${parsed.series_order ?? 'N/A'})`);
  },
};

registry.register(markdownCommand);
export default markdownCommand;
