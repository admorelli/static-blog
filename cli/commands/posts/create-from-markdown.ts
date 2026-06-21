import type { Command } from '../../utils/types.ts';
import { registry } from '../../utils/registry.ts';
import { ensureTables, db, posts, tags, postTags, eq } from '../../utils/db.ts';
import { slugify } from '../../utils/db.ts';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { CliError } from '../../utils/errors.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_FRONTMATTER_FIELDS = ['title'] as const;
const SLUG_MAX_LENGTH = 180;

function assertFrontmatter(
  data: Record<string, unknown>,
  filePath: string,
): asserts data is {
  title: string;
  slug?: string;
  date?: string;
  tags?: string[] | string;
  description?: string;
  series?: string;
  seriesOrder?: string | number;
  [key: string]: unknown;
} {
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      console.error(`Frontmatter must include a non-empty "${field}" field. File: ${filePath}`);
      process.exit(1);
    }
  }
}

function normalizeDateInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    console.error(`Invalid frontmatter date: "${trimmed}". Expected ISO-8601 format.`);
    process.exit(1);
  }
  return trimmed;
}

function normalizeTagNames(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSlug(raw: unknown, fallback: string): string {
  const value = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
  const slug = slugify(value);
  if (!slug) {
    return slugify(fallback);
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/u, '');
  }
  return slug;
}

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
    const { data: frontmatter, content: markdownContent } = matter(fileContent);

    assertFrontmatter(frontmatter as Record<string, unknown>, fullPath);

    let { title, slug, date, tags: tagNames, description, series, seriesOrder } =
      frontmatter as Record<string, unknown>;

    const trimmedTitle = title.trim();
    const normalizedSlug = normalizeSlug(slug, trimmedTitle);
    const normalizedMarkdown = typeof markdownContent === 'string' ? markdownContent : '';
    const normalizedDate = normalizeDateInput(date);
    const createdAt = normalizedDate
      ? Math.floor(new Date(normalizedDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const htmlContent = marked.parse(normalizedMarkdown, { async: false }) + '';

    let tagIds: number[] = [];
    const normalizedTags = normalizeTagNames(tagNames);
    for (const tagName of normalizedTags) {
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

    const normalizedSeries = typeof series === 'string' && series.trim() ? series.trim() : null;
    const normalizedSeriesOrder =
      typeof seriesOrder === 'number' && Number.isFinite(seriesOrder) ? seriesOrder : null;

    const result = await db
      .insert(posts)
      .values({
        title: trimmedTitle,
        slug: normalizedSlug,
        content: htmlContent,
        created_at: createdAt,
        series: normalizedSeries,
        series_order: normalizedSeriesOrder,
      })
      .returning({ id: posts.id })
      .execute();

    const postId = result[0].id;

    if (tagIds.length) {
      await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId }))).execute();
    }

    console.log(`✅ Created post #${postId}: "${trimmedTitle}" (slug: ${normalizedSlug})`);
    if (tagIds.length)
      console.log(
        `   Tags: ${normalizedTags.length ? normalizedTags.join(', ') : '(none)'}`,
      );
    if (description && typeof description === 'string')
      console.log(`   Description: ${description.trim()}`);
    if (normalizedSeries)
      console.log(`   Series: ${normalizedSeries} (order: ${normalizedSeriesOrder ?? 'N/A'})`);
  },
};

registry.register(markdownCommand);
export default markdownCommand;