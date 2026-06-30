"use client";

import { useEffect, useMemo, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("");

  const tocItems = useMemo<TocItem[]>(() => {
    if (typeof window === "undefined") return [];
    const root = document.createElement("div");
    root.innerHTML = content;

    const headingElements = root.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    headingElements.forEach((heading) => {
      const id =
        heading.id || heading.getAttribute("data-toc-id") || "";
      if (!id) return;
      items.push({
        id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1), 10),
      });
    });

    return items;
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%", threshold: 0 }
    );

    const elements = document.querySelectorAll("[id]");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [content]);

  if (tocItems.length === 0) return null;

  return (
    <nav className="toc max-w-[340px] hidden lg:block" aria-label="Table of Contents">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">On this page</h3>
      <div className="w-full rounded-lg border border-card-border bg-background p-3">
        <ul className="space-y-0.5 text-sm">
          {tocItems.map((item) => (
            <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
              <a
                href={`#${item.id}`}
                className={`block py-1.5 px-2.5 rounded transition-colors leading-snug ${
                  activeId === item.id
                    ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                    history.pushState(null, "", `#${item.id}`);
                  }
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default TableOfContents;
