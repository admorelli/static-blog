# CLI Refactor Plan

## Issues to Address

1. **Remove non-CLI commands**: `generate-static`, `build`, `dev` - these are build/dev tasks, should use npm scripts or Makefile
2. **Image support**: Current `add-image` only copies files and outputs markdown - doesn't associate with posts in DB or embed in content
3. **File too large**: 793 lines in single file - needs modular structure
4. **Switch-case pattern**: Replace with registry + factory pattern for extensibility

## Target Architecture

```
cli/
├── index.ts              # Entry point, registry, factory
├── commands/
│   ├── base.ts           # BaseCommand interface, CommandRegistry
│   ├── posts/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── create-from-markdown.ts
│   │   ├── delete.ts
│   │   └── update.ts     # NEW: update post (title, content, slug, series)
│   ├── tags/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── delete.ts
│   │   ├── tag-post.ts
│   │   └── untag-post.ts
│   ├── images/
│   │   └── add.ts        # REFACTORED: associate with post, embed in content
│   └── series/           # NEW: post series management
│       ├── list.ts
│       ├── create.ts
│       ├── add-post.ts
│       └── reorder.ts
├── utils/
│   ├── db.ts             # ensureTables, db connection
│   ├── slugify.ts
│   ├── args.ts           # parseArgs, types
│   └── inquirer.ts       # shared prompts
└── help.ts               # dynamic help from registry
```

## Commands to Keep (Post Management)
- `posts` - list posts (search, filter by tag, limit)
- `create` - create post interactively or via flags
- `new` - create post from markdown file with frontmatter
- `update` - **NEW** update post (title, content, slug, series, series_order)
- `delete` - delete post
- `tags` - list tags with post counts
- `tag-create` - create tag
- `tag-delete` - delete tag
- `tag-post` - add tag to post
- `untag-post` - remove tag from post
- `images add` - **REFACTORED** add image to post (copy + embed markdown in content or track in DB)
- `series` commands - **NEW** for post series management

## Commands to Remove
- `generate-static` → use `npm run generate:static-data` or `make generate-static`
- `build` → use `npm run build` or `make build`
- `dev` → use `npm run dev` or `make dev`

## Image Support Design

Current `add-image` copies to `public/images/posts/<slug>/` and outputs markdown.
**New design**: 
1. Copy image to `public/images/posts/<slug>/`
2. Generate markdown with proper alt text
3. **Option A**: Append markdown to post content (interactive confirmation)
4. **Option B**: Store image references in DB (new table `post_images`) for gallery/featured image support
5. **Option C**: Both - copy file + offer to embed + track in DB

Recommendation: Start with Option A (embed in content) + track in DB for future gallery support.

## Registry + Factory Pattern

```typescript
// commands/base.ts
interface Command {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  execute(args: CliArgs, flags: CliFlags): Promise<void>;
}

class CommandRegistry {
  private commands = new Map<string, Command>();
  
  register(cmd: Command): void;
  get(name: string): Command | undefined;
  getAll(): Command[];
}

// Factory creates command instances with shared dependencies (db, inquirer, etc.)
function createCommandRegistry(): CommandRegistry;
```

## Implementation Steps

1. Create directory structure
2. Create base command infrastructure (registry, factory, types)
3. Extract shared utilities (db, slugify, args, inquirer)
4. Migrate post commands (list, create, new, delete, update)
5. Migrate tag commands (list, create, delete, tag-post, untag-post)
6. Refactor image command (add proper embedding + DB tracking)
7. Add series commands (new requirement)
8. Create dynamic help from registry
9. Update entry point (index.ts)
10. Update package.json scripts
11. Test all commands
12. Run lint/test/build