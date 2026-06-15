#!/usr/bin/env node

// MCP Server for static_blog CLI tool
// Allows AI models to interact with the blog CLI via MCP protocol

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } = require("@modelcontextprotocol/sdk/types.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const PROJECT_ROOT = "/home/allfa/git-projects/static_blog";
const CLI_PATH = path.join(PROJECT_ROOT, "cli", "blog.js");

const server = new Server(
  {
    name: "static-blog-cli",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to run CLI commands
function runCLI(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `CLI exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "blog_posts",
        description: "List all blog posts with optional search and tag filtering",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Limit results (default: 20)" },
            search: { type: "string", description: "Search in title/content" },
            tag: { type: "string", description: "Filter by tag name" },
          },
        },
      },
      {
        name: "blog_create",
        description: "Create a new blog post",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Post title" },
            slug: { type: "string", description: "URL slug (auto-generated if omitted)" },
            content: { type: "string", description: "Post content (HTML/Markdown)" },
            tags: { type: "string", description: "Comma-separated tags" },
          },
          required: ["title", "content"],
        },
      },
      {
        name: "blog_delete",
        description: "Delete a blog post",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "Post ID" },
            slug: { type: "string", description: "Post slug" },
            yes: { type: "boolean", description: "Skip confirmation prompt" },
          },
        },
      },
      {
        name: "blog_tags",
        description: "List all tags with post counts",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "blog_tag_create",
        description: "Create a new tag",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Tag name" },
          },
          required: ["name"],
        },
      },
      {
        name: "blog_tag_delete",
        description: "Delete a tag and all associations",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Tag name" },
            yes: { type: "boolean", description: "Skip confirmation prompt" },
          },
          required: ["name"],
        },
      },
      {
        name: "blog_tag_post",
        description: "Add a tag to a post",
        inputSchema: {
          type: "object",
          properties: {
            post_id: { type: "number", description: "Post ID" },
            tag: { type: "string", description: "Tag name" },
          },
          required: ["post_id", "tag"],
        },
      },
      {
        name: "blog_untag_post",
        description: "Remove a tag from a post",
        inputSchema: {
          type: "object",
          properties: {
            post_id: { type: "number", description: "Post ID" },
            tag: { type: "string", description: "Tag name" },
          },
          required: ["post_id", "tag"],
        },
      },
      {
        name: "blog_generate_static",
        description: "Generate static JSON data for build (posts-index.json, tags.json, post-tags.json)",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "blog_build",
        description: "Build static site (runs generate-static + next build)",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "blog_dev",
        description: "Start Next.js dev server",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let cliArgs = [];
    
    switch (name) {
      case "blog_posts":
        cliArgs = ["posts"];
        if (args.limit) cliArgs.push("--limit", args.limit.toString());
        if (args.search) cliArgs.push("--search", args.search);
        if (args.tag) cliArgs.push("--tag", args.tag);
        break;
        
      case "blog_create":
        cliArgs = ["create"];
        if (args.title) cliArgs.push("--title", args.title);
        if (args.slug) cliArgs.push("--slug", args.slug);
        if (args.content) cliArgs.push("--content", args.content);
        if (args.tags) cliArgs.push("--tags", args.tags);
        break;
        
      case "blog_delete":
        cliArgs = ["delete"];
        if (args.id) cliArgs.push("--id", args.id.toString());
        if (args.slug) cliArgs.push("--slug", args.slug);
        if (args.yes) cliArgs.push("--yes");
        break;
        
      case "blog_tags":
        cliArgs = ["tags"];
        break;
        
      case "blog_tag_create":
        cliArgs = ["tag-create", "--name", args.name];
        break;
        
      case "blog_tag_delete":
        cliArgs = ["tag-delete", "--name", args.name];
        if (args.yes) cliArgs.push("--yes");
        break;
        
      case "blog_tag_post":
        cliArgs = ["tag-post", "--post-id", args.post_id.toString(), "--tag", args.tag];
        break;
        
      case "blog_untag_post":
        cliArgs = ["untag-post", "--post-id", args.post_id.toString(), "--tag", args.tag];
        break;
        
      case "blog_generate_static":
        cliArgs = ["generate-static"];
        break;
        
      case "blog_build":
        cliArgs = ["build"];
        break;
        
      case "blog_dev":
        cliArgs = ["dev"];
        break;
        
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    const output = await runCLI(cliArgs);
    return {
      content: [{ type: "text", text: output }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("static-blog-cli MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});