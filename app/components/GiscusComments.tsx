"use client";

import { useEffect, useRef } from "react";

interface GiscusProps {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  theme?: "light" | "dark" | "dark_dimmed" | "transparent_dark" | "preferred_color_scheme";
  reactionsEnabled?: "1" | "0";
  emitMetadata?: "1" | "0";
  inputPosition?: "top" | "bottom";
  lang?: string;
  loading?: "eager" | "lazy";
}

export function GiscusComments({
  repo = "admorelli/static-blog",
  repoId = "R_kgDOKQhNvg",
  category = "Announcements",
  categoryId = "DIC_kwDOKQhNvs4CgQ0H",
  mapping = "pathname",
  theme = "preferred_color_scheme",
  reactionsEnabled = "1",
  emitMetadata = "0",
  inputPosition = "bottom",
  lang = "en",
  loading = "lazy",
}: GiscusProps) {
  const scriptRef = useRef<HTMLScriptElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-reactions-enabled", reactionsEnabled);
    script.setAttribute("data-emit-metadata", emitMetadata);
    script.setAttribute("data-input-position", inputPosition);
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-loading", loading);

    const container = document.getElementById("giscus-comments");
    if (container) {
      container.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    theme,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    lang,
    loading,
  ]);

  return <div id="giscus-comments" className="mt-12" />;
}

export default GiscusComments;