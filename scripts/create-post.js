// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('../db/db.ts').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { posts, tags, postTags } = require('../db/schema.ts');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { eq, inArray } = require('drizzle-orm');

async function main() {
  const content = `---
title: "From Quantized Chaos to Working Code: Building static_blog with a Heavily Quantized Local LLM"
date: "2025-06-15"
tags: ["llm", "local-llm", "qwen", "quantization", "prompt-engineering", "development", "retrospective"]
---

I started this project with a simple goal: build a static blog generator using Next.js, SQLite, and a CLI tool. What I didn't expect was the journey of working with a heavily quantized Qwen 3.5 model running locally on my machine.

## The Setup

**Hardware:** AMD RX 7600 (8GB VRAM) + Ryzen 5 5600G  
**Model:** Qwen 3.5 30B (heavily quantized to fit in 8GB VRAM)  
**Tool:** opencode (local CLI agent)  
**Quantization:** MXFP4 / 4-bit variants to squeeze into 8GB

The premise was attractive: run a capable model locally, no API costs, full privacy. The reality was... messy.

## The Problems Begin

### 1. Prompt Loops

The quantized model would get stuck in repetitive patterns. I'd ask it to "fix the lint error" and it would:
- Apply the fix
- Immediately revert it
- Apply it again
- Revert again
- Loop infinitely until I intervened

This happened because the quantization destroyed the model's ability to maintain consistent reasoning across multiple turns. The attention mechanism couldn't properly track "I already did this" state.

### 2. Tool Call Hallucinations

The model would invent tool calls that didn't exist:
- Calling \`write_file\` with \`mode: "append"\` (doesn't exist)
- Calling \`bash\` with \`background: true\` on commands that don't support it
- Inventing file paths that never existed
- Forgetting required parameters mid-call

The quantization particularly damaged the model's ability to follow structured output schemas. JSON formatting would break, required fields would vanish, and the model would confidently proceed with invalid calls.

### 3. Context Collapse

With heavy quantization, the model's effective context window shrank dramatically. It would:
- Forget the project structure after 3-4 turns
- Re-read the same files repeatedly
- Lose track of what it had already fixed
- Reintroduce bugs it had just fixed

### 4. Reasoning Degradation

Complex multi-step reasoning collapsed. The model couldn't:
- Plan a multi-file refactor
- Understand dependency chains
- Debug systematically (would guess randomly)
- Maintain consistent architectural decisions

## Mitigation Strategies

### Explicit State Management

I started maintaining explicit context files:
- \`DEV_PLAN.md\` - living project plan
- \`AGENTS.md\` - agent instructions
- \`CLAUDE.md\` - context for the agent

Every turn, the agent reads these files first. This external memory compensates for the model's degraded internal memory.

### Explicit Tool Discipline

I added exhaustive eslint-disable comments and type annotations to prevent the model from fighting the linter. I also:
- Removed ambiguous tool options
- Added explicit type hints everywhere
- Used \`any\` casts with eslint-disable comments rather than fighting types

### Smaller, Verifiable Steps

Instead of "refactor the auth system", I broke tasks into:
1. "Fix lint error in theme-provider.tsx line 37"
2. "Run lint, verify only warnings remain"
3. "Run build, verify success"

Each step is verifiable and the model can't easily loop on a single micro-task.

### External Tools for Verification

The agent runs \`npm run lint\`, \`npm run test:unit\`, \`npm run build\` after every change. The model can't hallucinate passing tests - the CI either passes or fails.

## The Turning Point

Around the 3rd session, I switched from "ask the model to do X" to "tell the model exactly how to do X with explicit steps." The prompt shifted from:

> "Fix the dark mode issue"

To:

> "1. Edit app/theme-provider.tsx: remove mounted state, always provide context value
> 2. Edit app/header.tsx: call useTheme unconditionally, no try/catch
> 3. Run npm run lint, verify 0 errors
> 4. Run npm run build, verify success"

The explicit micro-steps bypassed the model's degraded planning ability.

## What Actually Works

Despite the quantization issues, the model excels at:
- **Local edits** with clear before/after context
- **Pattern matching** - applying the same fix across similar files
- **Boilerplate generation** - test files, config files, type definitions
- **Syntax-level fixes** - adding missing imports, fixing types

What it fails at:
- **Architectural decisions**
- **Multi-file coordination**
- **Debugging unknown issues**
- **Maintaining state across turns"

## The Result

Despite the chaotic journey, we built a complete static blog system:

- Next.js 13 static export with SSG
- SQLite + Drizzle ORM
- TanStack Query infinite scroll
- RSS 2.0 + Atom 1.0 + sitemap.xml
- Full CLI tool (Inquirer-based)
- GitHub Actions CI/CD
- Full dark mode with persistence
- 39 unit tests + 3 E2E tests
- MCP server wrapping the CLI

## Lessons Learned

1. **Quantization has real costs** - 4-bit quantization on a 30B model isn't "close enough" to full precision for agentic coding
2. **External memory > internal memory** - Explicit context files beat relying on model memory
3. **Micro-steps > macro-prompts** - Explicit step-by-step instructions beat high-level goals
4. **Verification loops are essential** - Automated lint/test/build catch what the model misses
5. **Know your tool's limits** - Don't ask a quantized model to architect; ask it to implement

## The Result

Despite the chaotic journey, we built a complete static blog system:

- Next.js 13 static export with SSG
- SQLite + Drizzle ORM
- TanStack Query infinite scroll
- RSS 2.0 + Atom 1.0 + sitemap.xml
- Full CLI tool (Inquirer-based)
- GitHub Actions CI/CD
- Full dark mode with persistence
- 39 unit tests + 3 E2E tests
- MCP server wrapping the CLI

## Lessons Learned

1. **Quantization has real costs** - 4-bit quantization on a 30B model isn't "close enough" to full precision for agentic coding
2. **External memory > internal memory** - Explicit context files beat relying on model memory
3. **Micro-steps > macro-prompts** - Explicit step-by-step instructions beat high-level goals
4. **Verification loops are essential** - Automated lint/test/build catch what the model misses
5. **Know your tool's limits** - Don't ask a quantized model to architect; ask it to implement

## Would I Do It Again?

With a less aggressive quantization (8-bit or 6-bit) or more VRAM? Yes. With this level of quantization? Only if I have infinite patience and explicit prompts.

The project works. The code is clean. The tests pass. But the path there was paved with prompt loops, hallucinated tool calls, and a model that forgot what it was doing every 5 minutes.

---

*Built with a heavily quantized Qwen 3.5 on an RX 7600 (8GB VRAM). The quantization artifacts are a feature, not a bug—they forced better prompt engineering and explicit state management.*`;

  const now = Math.floor(Date.now() / 1000);
  
  // Get existing tags or create missing ones
  const tagNames = ['llm', 'local-llm', 'qwen', 'quantization', 'prompt-engineering', 'development', 'retrospective'];
  
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
      title: "From Quantized Chaos to Working Code: Building static_blog with a Heavily Quantized Local LLM",
      slug: "from-quantized-chaos-to-working-code",
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