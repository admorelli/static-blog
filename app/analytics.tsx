"use client";

const getDoNotTrack = (): boolean => {
  if (typeof navigator !== "undefined") {
    const nav = navigator as Navigator & { doNotTrack?: string };
    return nav.doNotTrack === "1";
  }
  return false;
};

const DNT = getDoNotTrack();

export function loadAnalytics() {
  if (typeof window === "undefined" || DNT) {
    return;
  }

  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  if (!provider) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("data-site-id", process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID || "");
  script.defer = true;

  const lowerProvider = (provider || "").toLowerCase();

  if (lowerProvider === "plausible") {
    const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT || "https://plausible.io/js/script.js";
    script.setAttribute("data-domain", window.location.hostname);
    script.src = src;
  } else if (lowerProvider === "umami") {
    const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT || "https://analytics.example.com/script.js";
    script.setAttribute("data-website-id", process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID || "");
    script.src = src;
  } else if (lowerProvider === "off" || lowerProvider === "disabled" || lowerProvider === "none") {
    return;
  } else {
    return;
  }

  if (script.src) {
    document.head.appendChild(script);
  }
}
