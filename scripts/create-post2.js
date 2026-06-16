// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('../db/db.ts').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { posts, tags, postTags } = require('../db/schema.ts');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { eq, inArray } = require('drizzle-orm');

async function main() {
  const content = `---
title: "From Quantized Chaos to Pi Agent: Why Switching Agents Saved My Sanity"
date: "2025-06-15"
tags: ["llm", "local-llm", "pi-agent", "opencode", "quantization", "agent-comparison", "development"]
---

After documenting the chaos of building with a heavily quantized Qwen 3.5, I made a switch that changed everything: I moved from opencode + quantized local Qwen to **Pi agent** with a better model.

The difference was night and day.

## The Switch

**Before:** opencode + Qwen 3.5 30B (4-bit quantized, 8GB VRAM on RX 7600)  
**After:** Pi agent + better model (hosted, full precision)  
**Tool change:** opencode → Pi agent (fewer, sharper tools)

## What Changed Immediately

### 1. Tool Call Quality

**Before (opencode + quantized Qwen):**
- Hallucinated tool parameters \`mode: "append"\` on \`write_file\`
- Invented \`background: true\` on commands that don't support it
- Forgot required parameters mid-call
- JSON formatting broke constantly

**After (Pi agent):**
- Tool calls are clean, valid, and complete
- Parameters match the schema exactly
- No hallucinated options or missing required fields
- First-try success rate jumped from ~30% to ~95%

### 2. Loop Elimination

**Before:** The quantized model would:
- Apply a fix → revert it → apply again → revert → loop infinitely
- Forget it already fixed something 3 turns ago
- Re-introduce bugs it just fixed

**After (Pi agent):**
- Remembers what it did 20 turns ago
- Applies fixes once, correctly
- No infinite revert loops
- Maintains consistent direction

### 3. Context Retention

**Before:** After 3-4 turns:
- Forgot project structure
- Re-read same files repeatedly
- Lost track of fixes applied

**After (Pi agent):**
- Maintains coherent context for 50+ turns
- Remembers file contents from 30 turns ago
- Tracks dependency chains across files

### 4. Fewer Tools = Less Confusion

**opencode toolset (15+ tools):**
- \`read_file\`, \`write_file\`, \`patch\`, \`bash\`, \`search_files\`, \`terminal\`, \`grep\`, \`find\`, \`ls\`, \`cat\`, \`sed\`, \`awk\`, \`git\`, \`npm\`, \`python\`...
- Too many overlapping tools
- Model paralyzed by choice
- Picked wrong tool for the job

**Pi agent toolset (6 focused tools):**
- \`read\`, \`write\`, \`edit\`, \`bash\`, \`glob\`, \`grep\`
- Each tool has singular, clear purpose
- No overlap, no confusion
- Model picks right tool instantly

## The "Lower Tools" Insight

This was the biggest revelation: **tool count inversely correlates with agent competence** for quantized models.

With 15+ tools, a quantized model spends its limited cognitive capacity on:
- "Which tool do I use?"
- "What parameters does this tool take?"
- "Did I use the right tool?"

With 6 focused tools, it spends capacity on:
- "What change do I make?"
- "Is this correct?"

The tool *interface* became a cognitive load the quantized model couldn't handle. Pi agent's minimal toolset removed that load entirely.

## Reasoning Quality

**Before:** "Try random fix A, if fails try B, if fails try C..."  
**After:** "The issue is X because Y, so I'll fix Z which resolves it"

Pi agent shows genuine multi-step reasoning:
- Identifies root cause
- Plans multi-file changes
- Executes coherently
- Verifies own work

## A Concrete Example

**Task:** "Fix the dark mode hydration mismatch"

**opencode + quantized Qwen (4 attempts):**
1. "Add suppressHydrationWarning to html" → broke SSR
2. "Remove suppressHydrationWarning, use useEffect" → broke client
3. "Use dynamic import" → broke build
4. "Revert everything" → back to start

**Pi agent (1 attempt):**
1. Analyzed: "ThemeProvider uses localStorage in render, causing hydration mismatch. Fix: defer localStorage read to useEffect."
2. Fixed ThemeProvider: moved localStorage read to useEffect, returns default during SSR
3. Fixed Header: made useTheme optional, graceful fallback
3. Verified: lint → test:unit → build → all pass

## The Trade-offs

**What I lost:**
- Fully local execution (now using hosted model)
- Complete privacy (data leaves machine)
- Zero marginal cost per request

**What I gained:**
- Working code on first try
- 10x fewer turns per task
- No prompt loops, no tool hallucinations
- Actual reasoning, not pattern matching
- Sanity

## The Verdict

**Quantization artifacts are real.** A 4-bit quantized 30B model is not "close enough" to full precision for agentic coding. The attention degradation, context collapse, and schema adherence failures are fundamental.

**Tool count matters more than model size.** A good model with 6 focused tools beats a great model with 20 overlapping tools.

**Agent architecture > raw model capability.** Pi agent's design (minimal tools, structured prompts, context management) extracts more capability from the model than opencode's kitchen-sink approach.

## The Result

Now:
- Tasks complete in 1-3 turns instead of 15-30
- Zero prompt loops
- Zero tool hallucinations
- First-try success on complex refactors
- Actual architectural discussions possible

---

*Switched from opencode + quantized Qwen 3.5 (4-bit, 8GB VRAM) to Pi agent + hosted model. The agent architecture constrains what the model can express. Pi agent + good model > quantized model + kitchen-sink agent every time.*`;

  const now = Math.floor(Date.now() / 1000);
  
  // Get existing tags or create missing ones
  const tagNames = ['llm', 'local-llm', 'pi-agent', 'opencode', 'quantization', 'agent-comparison', 'development'];
  
  const existingTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, tagNames))
    .execute();
  
  const tagNameToId = {};
  existingTags.forEach(t => { tagNameToId[t.name] = t.id; });
  
  const missingTags = tagNames.filter(name => !tagNameToId[name]);
  if (missingTags.length) {
    const newTagRows = await db
      .insert(tags)
      .values(missingTags.map(name => ({ name })))
      .returning({ id: tags.id, name: tags.name })
      .execute();
    newTagRows.forEach(t => { tagNameToId[t.name] = t.id; });
  }
  
  // Create post
  const postRows = await db
    .insert(posts)
    .values({
      title: "From Quantized Chaos to Pi Agent: Why Switching Agents Saved My Sanity",
      slug: "from-quantized-chaos-to-pi-agent",
      content: content,
      created_at: now,
    })
    .returning({ id: posts.id, slug: posts.slug })
    .execute();
    
  const postId = postRows[0].id;
  
  // Link tags
  for (const tagName of Object.keys(tagNameToId)) {
    const existing = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, postId))
      .where(eq(postTags.tagId, tagNameToId[tagName]))
      .execute();
    
    if (existing.length === 0) {
      await db.insert(postTags).values({ postId, tagId: tagNameToId[tagName] }).execute();
    }
  }
  
  console.log('Post created with tags!');
}

main().catch(e => console.error(e));