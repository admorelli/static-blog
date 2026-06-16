// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('../db/db.ts').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { posts, tags, postTags } = require('../db/schema.ts');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { eq, inArray } = require('drizzle-orm');

async function main() {
  const content = `---
title: "Hermes + Local LLM: When the Tool Trap Returns"
date: "2025-06-22"
tags: ["llm", "hermes", "local-llm", "pi-agent", "openrouter", "tools", "agent-architecture", "development"]
---

After the OpenRouter free tier experiment, life happened. The project sat quiet for weeks. Last weekend, I came back with a fresh idea: **run everything locally again, but this time with Hermes** — a more sophisticated agent framework.

I pointed Hermes at my local LLM (Mellum 2-12B-A2.5B Thinking, IQ4_NL quantized, running on llama.cpp/ROCm on my RX 7600).

It worked. Kind of. Then the familiar trap snapped shut again.

## The Setup

**Agent:** Hermes (my own agent framework, more sophisticated than Pi)  
**Model:** Mellum 2-12B-A2.5B Thinking (IQ4_NL, ~5GB VRAM on RX 7600)  
**Provider:** llama.cpp with ROCm offload on AMD Radeon RX 7600 (8GB VRAM)  
**Context:** 131K tokens (theoretical), ~8K practical with KV cache  
**Quantization:** IQ4_NL (4-bit Neural Network Low)

## What Worked

### Local = Free + Private + Fast

- Zero latency (no network round-trip)
- Zero cost per token
- Full privacy
- Sub-second first token on RX 7600
- Runs while offline, on airplane, in a cave

### Mellum is Actually Good

Mellum 12B (Microsoft's code model) punches above its weight:
- Better code understanding than Llama 3.1 8B
- Solid tool use for its size
- Handles context better than quantized Qwen 3.5 30B
- Thinking mode actually helps with multi-step reasoning

### Hermes Architecture

Hermes has some nice ideas:
- Tool confirmation flow (prevents runaway actions)
- Structured memory blocks
- Built-in reflection/self-correction loops
- Better context management than raw prompting

## The Trap Returns: Tool Explosion

Hermes comes with **25+ tools** out of the box:

\`\`\`
Core (8): read, write, edit, bash, glob, grep, list, cat
Git (4): git_status, git_diff, git_commit, git_log
Web (6): fetch, search, extract, screenshot, pdf, html
Code (4): lint, test, typecheck, build
System (3): ps, kill, env
MCP (4): mcp_list, mcp_call, mcp_resource, mcp_prompt
\`\`\`

**25 tools.** Pi agent had 6. opencode had 15+. We're going backwards.

## The Problems Return

### 1. Tool Paralysis

With 25 tools, the local model spends its limited capacity on:
- "Which of these 4 file-reading tools do I use? \`read\`, \`cat\`, \`glob\`, \`list\`?"
- "Should I \`grep\` or \`search_files\`?"
- "Is this a \`bash\` or \`edit\` task?"

The model spends 40% of its tokens deciding *which tool*, 60% on *what to do*.

### 2. Tool Hallucinations Return

With more tools, more hallucinations:
- \`edit\` with \`mode: "append"\` (doesn't exist)
- \`bash\` with \`background: true\` on non-daemon commands
- \`grep\` with \`context: 10\` on a tool that doesn't support it
- \`git_commit\` with \`amend: true\` on initial commit

### 3. Context Bloat from Tool Definitions

25 tool definitions = ~3000 tokens just for schemas. That's 3000 tokens *not* available for:
- Your actual code
- The problem context
- The solution reasoning

For a local model with 8K practical context, 3K is *lost* to tool schemas.

### 4. Confirmation Flow Friction

Hermes asks for confirmation before each tool use. With 25 tools:
- Model calls \`read\` → Hermes asks "Confirm read?" → User confirms → Model calls \`edit\` → Hermes asks "Confirm edit?" → ...
- 10 tool calls = 20 confirmation prompts
- User becomes "confirmation clicker" not "collaborator"

## The Fix: Brutal Tool Pruning

I did what I should have done day one: **pruned to 7 tools.**

\`\`\`python
# Hermes config - ONLY these tools enabled
ENABLED_TOOLS = [
  "read",       # single source of truth for reading
  "write",      # single source of truth for writing
  "edit",       # only way to modify files
  "bash",       # only way to run commands
  "glob",       # only way to find files
  "grep",       # only way to search content
  "task",       # only way to spawn sub-agents
]
\`\`\`

**7 tools.** Down from 25. Pi agent had 6. Close enough.

## The Results (Immediate)

| Metric | 25 Tools | 7 Tools |
|--------|----------|---------|
| Tool decision tokens | ~40% | ~5% |
| Hallucinated params | ~30% | ~2% |
| Wrong tool choice | ~25% | ~1% |
| Confirmation prompts/task | 20+ | 2-3 |
| Context for schemas | ~3000 tokens | ~800 tokens |
| Context for code | ~5000 tokens | ~7200 tokens |

**Immediate improvements:**
- Model stops asking "which tool?"
- Hallucinated parameters vanish
- Context for actual code doubles
- User confirmations drop 90%

## The "Right Number" of Tools

After three eras, the pattern is clear:

| Agent | Tools | Works for Quantized? |
|-------|-------|---------------------|
| opencode | 15+ | ❌ |
| Pi agent | 6 | ✅ |
| Hermes (default) | 25+ | ❌ |
| Hermes (pruned) | 7 | ✅ |
| Pi agent | 6 | ✅ |

**The sweet spot: 6-8 tools.**

Fewer than 6: missing capability (can't glob, can't grep, can't spawn).
More than 8: cognitive overload for quantized models.

## The "Tool Diet" Framework

When evaluating an agent framework, apply this test:

\`\`\`
For each tool, ask:
1. Is there ALREADY a tool that does this? (deduplicate)
2. Does the model USE this tool correctly >90% of time? (validate)
3. Does this tool add UNIQUE capability not achievable otherwise? (justify)

If any answer is NO → CUT IT.
\`\`\`

Applied to Hermes defaults:
- \`cat\` → duplicates \`read\` → CUT
- \`list\` → duplicates \`glob\` + \`bash ls\` → CUT
- \`search_files\` → duplicates \`glob\` + \`grep\` → CUT
- \`patch\` → duplicates \`edit\` → CUT
- \`git_status\`, \`git_diff\`, \`git_commit\`, \`git_log\` → all \`bash git ...\` → CUT
- \`lint\`, \`typecheck\`, \`build\` → all \`bash npm run ...\` → CUT
- \`mcp_*\` → niche, not core → CUT (add back only if needed)

**Result: 7 tools. Done.**

## The Meta-Lesson: Agent ≠ Tool Count

Three eras, same lesson:

| Era | Agent | Tools | Result |
|-----|-------|-------|--------|
| 1 | opencode | 15+ | Tool chaos, loops, hallucinations |
| 2 | Pi agent | 6 | Clean, fast, reliable |
| 3 | OpenRouter | 6 (Pi) | Works, free, rate-limited |
| 4 | Hermes | 25 | Tool chaos returns |
| 5 | Hermes (pruned) | 7 | Clean again |

**The agent framework is not the tool count.** The framework should let *you* choose the tool count.

Hermes *allows* 25 tools. It doesn't *force* 25. The mistake was accepting defaults.

## The Real Architecture Insight

After 5 eras, the architecture hierarchy is clear:

\`\`\`
1. MODEL QUALITY (foundation)
   └── Full precision > quantized > heavily quantized
   └── Local vs hosted: capability vs privacy trade-off

2. AGENT ARCHITECTURE (structure)
   └── Tool count: 6-8 sweet spot
   └── Tool design: single-purpose, no overlap
   └── Confirmation flow: minimal, not per-action
   └── Context management: explicit, not implicit

3. PROMPT ENGINEERING (operation)
   └── Explicit state files (DEV_PLAN.md, etc.)
   └── Micro-steps, not macro-goals
   └── Verification loops (lint → test → build)

4. TOOLS (instrumentation)
   └── Minimal, focused, non-overlapping
   └── Schemas small, clear, validated
   └── Sub-agents for complexity, not tool count
\`\`\`

**The model is the engine. The agent is the transmission. Tools are the gears.**

If the transmission (agent) has 25 gears but the engine (model) only has torque for 6, you strip gears.

## The Current Stack (Working)

| Layer | Choice | Why |
|-------|--------|-----|
| **Model** | Mellum 12B IQ4_NL (local) | Free, private, decent code |
| **Agent** | Hermes (7 tools) | Sophisticated but pruned |
| **Tools** | read, write, edit, bash, glob, grep, task | 7 focused tools |
| **Context** | Explicit files (DEV_PLAN.md, etc.) | External memory |
| **Verification** | lint → test → build | Automated gates |

The trap was real. The fix was simple. The lesson is permanent.

---

*Running Hermes + Mellum 12B IQ4_NL on RX 7600 (8GB VRAM). 7 tools. No loops. No hallucinations. Local, free, private. The tool diet works.*`;

  const now = Math.floor(Date.now() / 1000);
  
  // Get existing tags or create missing ones
  const tagNames = ['llm', 'hermes', 'local-llm', 'pi-agent', 'openrouter', 'tools', 'agent-architecture', 'development'];
  
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
      title: "Hermes + Local LLM: When the Tool Trap Returns",
      slug: "hermes-local-llm-tool-trap",
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