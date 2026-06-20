import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { processMarkdownImages, enhanceImages } = await import('@/lib/enhance-images');

const createPostImgDir = (slug: string, basename: string) => {
  const dir = path.join(__dirname, '..', 'public', 'images', 'posts', slug);
  fs.mkdirSync(dir, { recursive: true });

  const webpBase = path.join(dir, `${basename}-800w.webp`);
  fs.writeFileSync(webpBase, Buffer.from('WEBP'));

  const blur = path.join(dir, `${basename}-blur.txt`);
  fs.writeFileSync(blur, 'data:image/webp;base64,BLUR');
};

describe('enhance-images', () => {
  beforeEach(() => {
    //
  });

  it('processMarkdownImages is callable on server', () => {
    expect(typeof processMarkdownImages).toBe('function');
  });

  it('enhanceImages adds srcset for webp files', () => {
    const slug = 'enhance-img-a';
    const base = 'photo';
    createPostImgDir(slug, base);

    const input = `<p><img src="/images/posts/${slug}/${base}.png" alt="hero"></p>`;
    const out = enhanceImages(input);

    expect(out).toContain('srcset="/images/posts/enhance-img-a/photo-800w.webp 800w"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('decoding="async"');
    expect(out).toContain(`alt="hero"`);
  });

  it('enhanceImages preserves out-of-scope images', () => {
    const input = `<p><img src="/og-image.png" alt="site"></p>`;
    const out = enhanceImages(input);

    expect(out).toContain('src="/og-image.png"');
    expect(out).not.toContain('srcset');
  });

  it('does not enhance images outside posts dir', () => {
    const input = '<img src="/a.png">';
    const out = enhanceImages(input);

    expect(out).toBe('<img src="/a.png">');
  });

  it('enhanceImages leaves image untouched when no optimized files exist', () => {
    const input = '<img src="/images/posts/unknown-slug/abc.jpg">';
    const out = enhanceImages(input);

    expect(out).toBe(input);
  });
});
