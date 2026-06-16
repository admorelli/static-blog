const { posts, tags, postTags } = require('../db/schema.ts');
const { eq, desc } = require('drizzle-orm');
const db = require('../db/db.ts').default;
const path = require('path');
const fs = require('fs');

const content = fs.readFileSync('/home/allfa/git-projects/static_blog/post-content-full.md', 'utf8');
const title = "Fixing a Static Blog: From Broken URLs to Working Markdown";
const slug = "fixing-static-blog-broken-urls-markdown";
const tagNames = "nextjs,github-pages,static-site,debugging,markdown,deployment,urls,basepath,gray-matter,marked";

async function main() {
  try {
    const now = Math.floor(Date.now() / 1000);

    let tagIds = [];
    if (tagNames) {
      const tagList = tagNames.split(',').map(t => t.trim()).filter(Boolean);
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
      .values({ title, slug, content, created_at: now })
      .returning({ id: posts.id })
      .execute();

    const postId = result[0].id;

    if (tagIds.length) {
      await db.insert(postTags).values(tagIds.map(tagId => ({ postId, tagId }))).execute();
    }

    console.log(`Created post #${postId}: "${title}" (slug: ${slug})`);
    if (tagIds.length) console.log(`   Tags: ${tagNames}`);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();