import { describe, it, expect, beforeEach } from 'vitest';
import { createPost, getPostBySlug, listPosts } from './test-db';
import { resetDatabase } from '../utils/cleanup';

const markdownSlug = 'markdown-images-backed-by-static-storage';
const markdownImageToken = '/posts/test-markdown-post/img/1781684929043/max.webp';
const inlineSlug = 'inline-images-backed-by-fixture';
const inlineImageToken = '/posts/fixture-backing-inline-images/img/sample/max.webp';

describe('markdown backing static storage', () => {
  beforeEach(async () => {
    const db = (await import('./test-db')).default;
    resetDatabase(db);
  });

  it('retains markdown-formatted images as HTML img tokens', async () => {
    const baseTime = Math.floor(Date.now() / 1000);
    const content = `---\ntitle: Markdown Images\ndate: ${baseTime}\ntags: [images, markdown]\n---\n\nIntro.\n\n![Sample Image](${markdownImageToken})\n\nOutro.\n`;

    const createdId = await createPost({
      title: 'Markdown Images',
      slug: markdownSlug,
      content,
    });

    expect(createdId).toBeGreaterThan(0);

    const post = await getPostBySlug(markdownSlug);
    expect(post).toBeTruthy();
    expect(post!.content).toContain(markdownImageToken);
  });

  it('represents all posts in listPosts', async () => {
    await createPost({ title: 'First', slug: 'first-img', content: 'One' });
    await createPost({ title: 'Second', slug: 'second-img', content: 'Two' });

    const posts = await listPosts();
    expect(posts.map((p) => p.slug).sort()).toEqual(['first-img', 'second-img'].sort());
    expect(posts.length).toBe(2);
  });
});

describe('inline images backed by fixture', () => {
  beforeEach(async () => {
    const db = (await import('./test-db')).default;
    resetDatabase(db);
  });

  it('represents inline images as Markdown-Tokens previews in post body', async () => {
    const baseTime = Math.floor(Date.now() / 1000);
    const content = `---\ntitle: Inline Images\ndate: ${baseTime}\ntags: [images]\n---\n\nBefore image.\n\n![Alt text](${inlineImageToken})\n\nAfter image.\n`;

    await createPost({ title: 'Inline Images', slug: inlineSlug, content });
    const post = await getPostBySlug(inlineSlug);
    expect(post).toBeTruthy();
    expect(post!.content).toContain(inlineImageToken);
  });

  it('promotes loaded fixture images from manifest into OptimizedImage tag', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const baseDir = path.join(process.cwd(), 'public', 'posts');
    const fixtureDir = path.join(baseDir, 'fixture-backing-inline-images', 'img', 'sample');
    fs.mkdirSync(fixtureDir, { recursive: true });

    const manifestPath = path.join(fixtureDir, 'manifest.json');
    const manifest = {
      id: 'sample',
      original: 'sample.png',
      src: '/posts/fixture-backing-inline-images/img/sample/max.webp',
      srcset: '/posts/fixture-backing-inline-images/img/sample/400w.webp 400w',
      sizes: '400px',
      blurDataUri: 'data:image/webp;base64,test',
      width: 400,
      height: 300,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const baseTime = Math.floor(Date.now() / 1000);
    const content = `---\ntitle: Inline Images\ndate: ${baseTime}\ntags: [images]\n---\n\nBefore image.\n\n![Alt text](${inlineImageToken})\n\nAfter image.\n`;

    await createPost({ title: 'Inline Images', slug: inlineSlug, content });
    const post = await getPostBySlug(inlineSlug);
    expect(post).toBeTruthy();
    expect(post!.content).toContain(inlineImageToken);

    const loadedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(loadedManifest.src).toContain('/max.webp');
    expect(loadedManifest.srcset).toContain('/400w.webp 400w');
  });
});
