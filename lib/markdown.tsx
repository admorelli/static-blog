// +----------------------------------------------------+
// | Render markdown as safe HTML (h1-h6, p, ul/ol, link)  |
// +----------------------------------------------------+
export function renderMarkdown(content: string): React.ReactNode {
  if (!content.trim()) return null;

  // Simple regex-based parser for headers, paragraphs, lists, and links
  const lines = content.split(/\r?\n/);

  let output: React.ReactNode[] = [];
  let buffer: (string | null)[] = [];
  let listType: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^#{1,6}\s/.test(line)) {
      // Header — flush any pending list/paragraph first
      if (listType || buffer.length > 0) {
        output.push(renderBuffer(buffer));
        buffer = [];
      }

      const match = line.match(/^#(\d+)\s+(.+)$/);
      if (!match) continue; // malformed, skip
      const level = parseInt(match[1], 10); // 1..6
      const text = match[2].trim();

      // Convert inline markdown to HTML for header text (basic: **bold**, *italic*, [link])
      const renderedText = renderInline(text);

      if (level === 1) {
        output.push(<h1 key={i} className="text-4xl font-bold tracking-tight mb-6">{renderedText}</h1>); // app/post/page.tsx uses h2, adjust as needed — this is generic
      } else if (level === 2) {
        output.push(<h2 key={i} className="text-3xl font-semibold leading-tight mt-8 mb-4">{renderedText}</h2>);
      } else if (level === 3) {
        output.push(<h3 key={i} className="text-2xl font-semibold leading-snug mt-6 mb-3">{renderedText}</h3>);
      } else if (level <= 4) {
        output.push(<h4 key={i} className="font-semibold mt-5 mb-2">{renderedText}</h4>);
      } else {
        output.push(<h5 key={i} className="text-sm font-medium mt-4 mb-2 text-muted-foreground">{renderedText}</h5>);
      }

      listType = null; // headers terminate lists
    } else if (/^\s*[*]\s*$/.test(line.trim())) {
      // Empty bullet — end the current list
      if (listType) {
        output.push(renderBuffer([" "]));
        buffer = [];
      }
      listType = null;
    } else if (/^[\*+|]\s/.test(line)) {
      // List item
      if (!listType) {
        listType = line.startsWith("-") ? "ul" : "ol";
      }

      const text = line.replace(/^[\*+|-]\s?/, "").trim();
      buffer.push(text);
    } else {
      // Paragraph — flush any pending list first, then start new paragraph
      if (listType) {
        output.push(renderBuffer(buffer));
        buffer = [];
      }

      buffer.push(line.trimEnd());
    }
  }

  // Flush any remaining buffer/list at the end
  if (listType || buffer.length > 0) {
    output.push(renderBuffer(buffer));
  }

  return <div>{output}</div>;
}

// +----------------------------------------------------+
// | Render inline markdown: **bold**, *italic*, [link]     |
// +----------------------------------------------------+
function renderInline(text: string): React.ReactNode {
  if (!text.trim()) return text;

  // Bold/italic — greedy nesting, simple left-to-right matching
  let result = "";
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === "*") {
      // Find closing *
      let j = i + 1;
      let depth = 1;
      while (j < text.length && text[j] !== "*") {
        depth += text[j] === "*" ? 1 : -1; // just count, not caring about nested formatting
        j++;
      }
      if (text[j] === "*" && depth === 0) {
        const inner = text.slice(i + 1, j);
        result += <span key={i} className="italic">{renderInline(inner)}</span>;
        i = j + 1;
      } else if (text[j] === "*" && depth === 1) {
        // **bold** — find second *
        let k = i + 2;
        while (k < text.length && text[k] !== "*") {
          k++;
        }
        if (k < text.length && text[k] === "*" && text.slice(i, k+1) === "**") {
          const inner = text.slice(i + 2, k);
          result += <span key={i} className="font-semibold">{renderInline(inner)}</span>;
          i = k + 1;
        }
      } else {
        result += c;
        i++;
      }
    } else if (c === "[") {
      // Find closing ](link)
      let j = text.indexOf("]", i);
      if (j !== -1 && text[j + 1] === "(") {
        const linkEnd = text.indexOf(")", j + 2);
        if (linkEnd !== -1) {
          const label = text.slice(i + 1, j);
          const href = text.slice(j + 2, linkEnd);
          result += <a key={i} href={href} className="text-primary underline hover:underline-offset-2">{renderInline(label)}</a>;
          i = linkEnd + 1;
        } else {
          result += c;
          i++;
        }
      } else {
        result += c;
        i++;
      }
    } else {
      // Escape &, <, >
      let escaped = "";
      for (let ch of text[i]) {
        const esc = { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch];
        result += esc ? <span key={i} className="text-foreground">{esc}</span> : ch;
        i++;
      }
    }
  }

  return result;
}
