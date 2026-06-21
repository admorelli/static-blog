import { describe, it, expect } from 'vitest';
import { generateJsonLd } from '@/app/posts/[slug]/page';
import { generateSeriesJsonLd } from '@/app/series/[slug]/page';

const fakePost = {
  id: 1,
  title: 'Test Post',
  slug: 'test-post',
  content: '',
  created_at: 1718668800,
  series: null,
  series_order: null,
} as const;

describe('post page JSON-Ld', () => {
  it('returns a valid BlogPosting schema', () => {
    const result = generateJsonLd(fakePost, {
      title: 'Test Post',
      date: '2025-06-15',
      tags: ['rust', 'testing'],
      description: 'A test post.',
      content: 'Body here',
    }, 'https://example.com');

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BlogPosting');
    expect(result.headline).toBe('Test Post');
    expect(result.description).toBe('A test post.');
    expect(result.keywords).toBe('rust, testing');
    expect(result.image).toBe('https://example.com/og-image.png');
    expect(result.datePublished).toBeTruthy();
    expect((result as Record<string, unknown>).author).toEqual({ '@type': 'Person', name: 'Blog Author' });
    expect((result as Record<string, unknown>).publisher).toEqual({
      '@type': 'Organization',
      name: 'Static Blog',
      logo: { '@type': 'ImageObject', url: 'https://example.com/icon.png' },
    });
    expect((result as Record<string, unknown>).mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': 'https://example.com/posts/test-post' });
  });

  it('falls back to title when description is blank', () => {
    const result = generateJsonLd(fakePost, {
      title: 'Test Post',
      date: '2025-06-15',
      tags: ['rust'],
      description: '',
      content: 'Body',
    }, 'https://example.com');

    expect(result.description).toContain('Test Post');
  });
});

describe('series page JSON-Ld', () => {
  it('returns a CollectionPage schema with post count', () => {
    const posts = [
      { id: 1, title: 'P1', slug: 'p1', content: '', created_at: 1, series: null, series_order: null } as const,
      { id: 2, title: 'P2', slug: 'p2', content: '', created_at: 2, series: null, series_order: null } as const,
    ];
    const ld = generateSeriesJsonLd('getting-started', posts, 'https://example.com');

    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.name).toBe('getting-started - Series');
    expect(ld.description).toContain('2 posts');
    expect(ld.url).toBe('https://example.com/series/getting-started');
    expect(ld.isPartOf['@id']).toBe('https://example.com/');
  });
});
