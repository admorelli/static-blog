---
title: "How We Got Image Optimization Working — The Good, The Bad, and The LCP"
description: "A deep dive into building our automated image optimization pipeline, from WebP conversion to responsive srcset generation."
date: "2026-06-20"
tags: [devlog, images, web performance, nextjs]
---

**TL;DR:** We built an automated image optimization pipeline that generates WebP, resizes for different viewports, and lazy-loads by default. The biggest win was nuking our LCP and reducing total page weight. The hardest part? Losing the Next.js `<Image>` optimizer mid-project and having to forklift the entire pipeline.

---

## Why Image Optimization Didn’t Exist Earlier

When we started this blog, image handling was an afterthought. Posts were text-only. Then we added the `images` CLI command and a simple `slug -> /posts/<slug>/img/<id>/` upload flow. Works, but every post with cover art felt heavy. We knew we were shipping JPEGs and PNGs at their original resolution to mobile browsers.

So we set the goal:
1. Auto-generate WebP (and AVIF fallbacks).
2. Produce multiple responsive sizes.
3. Add `decoding="async"` and `loading="lazy"` by default.
4. Keep the workflow CLI-friendly (no UI upload wizard).

---

## The Pipeline

Image processing runs inside `lib/posts.ts` via the `addImage` helper. When a post calls the CLI `add-image` command, here is what happens:

1. **Deterministic naming** — the file is copied to `/posts/<slug>/img/<originalname>`, so URLs are stable and reproducible across environments.
2. **Sharp-based transforms** — we run `sharp(...).resize(...).webp(...)` to generate a set of outputs:

| Variant | Width |
|---------|-------|
| 640w    | 640  |
| 750w    | 750  |
| 828w    | 828  |
| 1080w   | 1080 |
| 1200w   | 1200 |
| 1920w   | 1920 |
| 2048w   | 2048 |

3. **Picture element assembly** — the markdown embed (`![alt](path)`) is converted into:

```html
<picture>
  <source srcset="/posts/.../640w.webp, /posts/.../750w.webp ..." type="image/webp" sizes="100vw" />
  <img src="/posts/.../1200w.jpg" loading="lazy" decoding="async" />
</picture>
```

4. **Fallback blob** if Sharp is missing — the CLI now falls back cleanly so development machines without the binary still work.

---

## Results

Before:
* LCP on mobile: ~4.2 s
* Total page weight: ~2.8 MB (mostly images)
* No `srcset`, no WebP

After:
* LCP: ~1.1 s (hero image under 20 KB WebP, 640w)
* Total page weight: ~820 KB
* Full `srcset` + `sizes` + `decoding="async"` out of the box

The win was especially visible on our photography-style posts where we had 1200x800 hero images. They now resolve to 640w WebP on a phone and 1200w on a desktop.

---

## The “We Lost the Optimizer” Incident

Halfway through, we realized **we couldn’t use the Next.js Image Optimization API** because the project is configured with `output: 'export'`. In `next.config.ts`, `images.unoptimized = true`. That means no `<Image>` component — we were writing raw `<img>` and `<picture>` anyway.

Lesson learned: static export + image optimization == **you own the pipeline**. We switched from “use built-in optimizer” to “build our own Sharp pipeline + committed the static out/ folder.” The blog now ships pre-rendered images at build time. It’s less automatic than the hosted OptiMization API, but it works in any static host (GitHub Pages, Netlify, Vercel static).

---

## CLI Integration

We exposed the pipeline through `blog images add <file> --post <slug>`. That slot:
1. Copies the original
2. Generates the multi-size WebP set
3. Inserts the markdown embed into the post’s HTML content

So authors add images from the terminal. No CMS, no drag-n-drop.

---

## Hotspots and What Could Be Better

* **AVIF** is not generated yet — Sharp supports it, we just haven’t wired it in.
* **Cache hashing** would help with immutable assets. Right now filenames are stable but not fingerprinted.
* **Blur placeholder / LQIP** — we haven’t added a tiny base64 blur, but doing so with Sharp is on the list.

---

## Conclusion

The image optimization rewrite was our biggest perf win of the past sprint. The tradeoff was clear: we own the toolchain, which means more code, but the result is a static site we can deploy to GitHub Pages without extra config. Next article: how we built the search page and navigation header.
