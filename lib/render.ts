import matter from "gray-matter";
import { marked } from "marked";

export function parseContent(rawContent: string): string {
  const { content: markdownBody } = matter(rawContent);
  const trimmed = markdownBody.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<")) return trimmed;
  return marked.parse(trimmed, { async: false }) as string;
}

export function getExcerpt(rawContent: string, maxChars: number = 500): string {
  const htmlContent = parseContent(rawContent);

  if (htmlContent.length <= maxChars) {
    return htmlContent;
  }

  const paragraphs = [...htmlContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  const selected: string[] = [];
  let length = 0;

  for (const [, body] of paragraphs) {
    const paragraph = `<p>${body}</p>`;
    const projected = length + paragraph.length;

    if (projected > maxChars) {
      break;
    }

    selected.push(paragraph);
    length = projected;
  }

  if (!selected.length) {
    const cut = htmlContent.slice(0, maxChars);
    const lastStart = cut.lastIndexOf("<");
    const lastEnd = cut.lastIndexOf(">");
    const safeCut = lastStart > lastEnd ? cut.slice(0, lastStart) : cut;
    return safeCut + "...";
  }

  if (length < htmlContent.length) {
    selected.push("...");
  }

  return selected.join("");
}
