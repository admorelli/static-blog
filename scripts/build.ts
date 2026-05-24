#!/usr/bin/env tsx
import * as db from '../lib/db.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

async function main() {
  await db.init();

  const posts = await db.getAllPosts();
  if (posts.length === 0) {
    console.log('No posts to build.');
    return;
  }

  // Ensure output directory exists
  const outDir = join(process.cwd(), 'out');
  mkdirSync(outDir, { recursive: true });

  for (const post of posts) {
    const slug = post.id.slice(0, 12);
    const contentMd = `
# ${post.title}

${post.content || 'No content yet.'}

---

**Tags:** ${Array.from(post.tags).join(', ') || 'None'}

**Date:** ${new Date(post.date).toLocaleDateString()}
`;};
    const mdPath = join(outDir, `${slug}.md`);
    writeFileSync(mdPath, contentMd.trim());
  }

  // Generate index.html (simple static landing page)
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Static Blog</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    h1 { color: #3b82f6; }
    a { color: #3b82f6; text-decoration: none; }
    .post { border-bottom: 1px solid #e5e7eb; padding: 1rem 0; }
    .tag { display: inline-block; background: #e5e7eb; padding: 0.25em 0.5em; font-size: 0.85em; border-radius: 4px; margin-right: 0.5em; }
  </style>
</head>
<body>
  <h1>Static Blog</h1>
  ${posts.map((p) => `
  <div class="post">
    <a href="${p.id.slice(0, 12)}.md">${p.title}</a>
    <span>${Array.from(p.tags).map((t) => `<span class="tag">${t}</span>`).join('')}</span>
  </div>
`).join('')}
</body>
</html>
`;

  writeFileSync(join(outDir, 'index.html'), indexHtml);

  console.log(
    `✅ Built ${posts.length} posts into ./out/ (run "npm run build")`
  );
}

main().catch(console.error);
