"use client";

import { useTheme } from "./theme-provider";

const DEFAULT_THEME = "light";

export function SocialFloatingFooter() {
  const hrefs = {
    github: "https://github.com/admribeiro",
    kofi: "https://ko-fi.com/admribeiro",
    linkedin: "https://linkedin.com/in/admribeiro",
  };

  return (
    <footer
      aria-label="Social"
      className="SocialFloatingFooter fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 rounded-full border border-neutral-200 bg-neutral-50/90 shadow-md backdrop-blur dark:border-neutral-700/80 dark:bg-neutral-900/90"
    >
      <a
        href={hrefs.github}
        className="inline-flex p-2 rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        aria-label="GitHub"
        target="_blank"
        rel="noreferrer"
      >
        <span aria-hidden="true" className="SocialFloatingFooter__icon">GH</span>
      </a>
      <a
        href={hrefs.kofi}
        className="inline-flex p-2 rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        aria-label="Ko-fi"
        target="_blank"
        rel="noreferrer"
      >
        <span aria-hidden="true" className="SocialFloatingFooter__icon">K</span>
      </a>
      <a
        href={hrefs.linkedin}
        className="inline-flex p-2 rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        aria-label="LinkedIn"
        target="_blank"
        rel="noreferrer"
      >
        <span aria-hidden="true" className="SocialFloatingFooter__icon">IN</span>
      </a>
    </footer>
  );
}

export function SocialFloatingFooterClient() {
  const { theme } = useTheme();

  if (typeof window !== "undefined") {
    if (theme === "dark") {
      // no-op placeholder for future client-side icon swap
    }
  }
  return null;
}
