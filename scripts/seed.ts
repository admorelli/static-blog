import fs from 'fs';
import path from 'path';
import db from '../db/db.ts';
import { posts, tags, postTags } from '../db/schema.ts';

async function main() {
  const existing = await db.select().from(posts).limit(1);
  if (existing.length) {
    console.log('Posts already exist, skipping seed');
    return;
  }

  // Read posts from the generated static data
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'posts-index.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Create tags
  const allTags = [
    { name: 'llm' },
    { name: 'local-llm' },
    { name: 'qwen' },
    { name: 'quantization' },
    { name: 'prompt-engineering' },
    { name: 'development' },
    { name: 'retrospective' },
    { name: 'pi-agent' },
    { name: 'opencode' },
    { name: 'quantization' },
    { name: 'agent-comparison' },
    { name: 'nemotron' },
    { name: 'openrouter' },
    { name: 'free-tier' },
    { name: 'nemotron-3-ultra' },
    { name: 'project-completion' },
    { name: 'hermes' },
    { name: 'local-llm' },
    { name: 'mellum' },
    { name: 'tools' },
    { name: 'agent-architecture' },
    { name: 'openrouter' },
    { name: 'free-tier' },
    { name: 'nemotron-3-ultra' },
    { name: 'project-completion' },
    { name: 'development' },
  ];

  // Deduplicate tags
  const uniqueTags = [...new Map(allTags.map(t => [t.name, t])).values()];

  const tagRows = await db
    .insert(tags)
    .values(uniqueTags)
    .returning({ id: tags.id, name: tags.name })
    .execute();

  const tagMap = new Map(tagRows.map(t => [t.name, t.id]));

  // Insert posts from the static data
  const postRows = await db
    .insert(posts)
    .values(data.posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      content: p.content,
      created_at: p.created_at || Math.floor(Date.now() / 1000),
    })))
    .returning({ id: posts.id, slug: posts.slug })
    .execute();

  // Link posts to tags based on the posts-index.json tags if available
  // For simplicity, assign tags based on slug
  const slugToTags = {
    'from-quantized-chaos-to-working-code': ['llm', 'local-llm', 'qwen', 'quantization', 'prompt-engineering', 'development', 'retrospective'],
    'from-quantized-chaos-to-pi-agent': ['llm', 'local-llm', 'pi-agent', 'opencode', 'quantization', 'agent-comparison', 'development'],
    'from-pi-agent-to-openrouter-free': ['llm', 'nemotron', 'openrouter', 'free-tier', 'nemotron-3-ultra', 'pi-agent', 'free-tier-experiment', 'development'],
    'hermes-local-llm-tool-trap': ['llm', 'hermes', 'local-llm', 'mellum', 'tools', 'agent-architecture', 'development'],
    'nemotron-3-ultra-free-project-complete': ['llm', 'nemotron', 'openrouter', 'free-tier', 'nemotron-3-ultra', 'project-completion', 'development'],
  };

  for (const postRow of postRows) {
    const tagNames = slugToTags[postRow.slug] || ['tech'];
    for (const tagName of tagNames) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await db.insert(postTags).values({ postId: postRow.id, tagId }).execute();
      }
    }
  }

  console.log('Seeded posts with tags');
}

main().catch((e) => console.error(e));