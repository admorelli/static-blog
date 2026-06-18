"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [tocItems, setTocItems] = useState<TocItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const headings: TocItem[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const headingElements = tempDiv.querySelectorAll('h2, h3');
    headingElements.forEach((heading) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
      if (!heading.id) {
        heading.id = id;
      }
      headings.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      });
    });
    return headings;
  });
  const [activeId, setActiveId] = useState<string>('');

  // Scroll spy to highlight active section
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
  }, []);

  if (tocItems.length === 0) return null;

  return (
    <nav className="toc sticky top-24 w-64 hidden lg:block" aria-label="Table of Contents">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">On this page</h3>
      <ul className="space-y-1 text-sm">
        {tocItems.map((item) => (
          <li key={item.id} className={`${item.level === 3 ? "ml-4" : ""}`}>
            <a
              href={`#${item.id}`}
              className={`block py-1 px-2 rounded transition-colors ${
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
    </nav>
  );
}

export default TableOfContents;