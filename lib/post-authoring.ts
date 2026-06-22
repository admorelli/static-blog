/**
 * Shared post authoring utilities for CLI + build scripts.
 */

import matter from 'gray-matter';
import { marked } from 'marked';

export const REQUIRED_FRONTMATTER_FIELDS = ['title'] as const;

export interface FrontmatterValidateInput {
  title?: unknown;
  slug?: unknown;
  date?: unknown;
  tags?: unknown;
  description?: unknown;
  series?: unknown;
  seriesOrder?: unknown;
  [key: string]: unknown;
}

export function assertFrontmatter(data: Record<string, unknown>, filePath: string): asserts data is FrontmatterValidateInput {
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`Frontmatter must include a non-empty "${field}" field. File: ${filePath}`);
    }
  }
}

export function normalizeDateInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid frontmatter date: "${trimmed}". Expected ISO-8601 format.`);
  }
  return trimmed;
}

export function normalizeTagNames(raw: unknown): string[] {
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

export function normalizeSlug(raw: unknown, fallback: string): string {
  const value = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    const fb = fallback
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return fb || '';
  }

  if (slug.length > 180) {
    return slug.slice(0, 180).replace(/-+$/u, '');
  }
  return slug;
}

export interface ParsedPost {
  title: string;
  slug: string;
  content: string;
  created_at: number;
  tags: string[];
  description?: string;
  series?: string | null;
  series_order: number | null;
}

export function assertPost(
  obj: Record<string, unknown>,
  filePath: string,
): asserts obj is Record<string, unknown> {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`Invalid parsed post object from ${filePath}`);
  }
}

export function reduceParsedPost(
  rawContent: string,
  filePath: string,
): ParsedPost {
  const matterFile = matter(rawContent);
  const data: Record<string, unknown> = matterFile.data as FrontmatterValidateInput;

  assertFrontmatter(data, filePath);
  assertPost(data, filePath);

  const trimmedTitle = typeof data.title === 'string' ? data.title.trim() : '';
  const normalizedSlug = normalizeSlug(data.slug, trimmedTitle);
  const normalizedMarkdown = typeof matterFile.content === 'string' ? matterFile.content : '';
  const normalizedDate = data.date ? normalizeDateInput(data.date) : null;
  const createdAt = normalizedDate
    ? Math.floor(new Date(normalizedDate).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  const htmlContent = marked.parse(normalizedMarkdown, { async: false }) + '';
  const normalizedTags = normalizeTagNames(data.tags);
  const normalizedSeries =
    typeof data.series === 'string' && data.series.trim()
      ? data.series.trim()
      : null;
  const normalizedSeriesOrder =
    typeof data.seriesOrder === 'number' && Number.isFinite(data.seriesOrder)
      ? data.seriesOrder
      : null;

  return {
    title: trimmedTitle,
    slug: normalizedSlug,
    content: htmlContent,
    created_at: createdAt,
    tags: normalizedTags,
    description:
      typeof data.description === 'string' ? data.description.trim() : undefined,
    series: normalizedSeries,
    series_order: normalizedSeriesOrder,
  };
}
