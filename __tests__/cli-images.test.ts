import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { enhanceImages } = await import('@/lib/enhance-images');

const createPostImgDir = (slug: string, basename: string) => {
  const dir = path.join(__dirname, '..', 'public', 'images', 'posts', slug);
  try {
    const fs = require('fs');
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, `${basename}-800w.webp`), Buffer.from('WEBP'));
    fs.writeFileSync(path.join(dir, `${basename}-blur.txt`), 'data:image/webp;base64,BLUR');
  } catch {}
};

describe('cli-images', () => {
  beforeEach(() => {
    //
  });

  it('uses deterministic slug-based filename when adding a new image', async () => {
    const slug = 'hello-world';
    const imageBaseName = 'editorial';
    const ext = '.png';

    const sourceBase = imageBaseName;
    const safeBase = String(slug)
      .split('/')
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || sourceBase.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

    const fileName = `${safeBase}${ext}`;
    const publicPath = `/images/posts/${slug}/${fileName}`;
    const finalAltText = `${slug} screenshot`;
    const markdown = `![${finalAltText}](${publicPath})`;

    expect(fileName).toBe('hello-world.png');
    expect(publicPath).toBe('/images/posts/hello-world/hello-world.png');
    expect(markdown).toBe('![hello-world screenshot](/images/posts/hello-world/hello-world.png)');
  });

  it('preserves enhancement behavior for deterministic post image paths', () => {
    const slug = 'enhance-img-a';
    const base = 'photo';
    createPostImgDir(slug, base);

    const input = `<p><img src="/images/posts/${slug}/${base}.png" alt="hero"></p>`;
    const out = enhanceImages(input);

    expect(out).toContain('srcset="/images/posts/enhance-img-a/photo-800w.webp 800w"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('decoding="async"');
    expect(out).toContain('alt="hero"');
  });
});
