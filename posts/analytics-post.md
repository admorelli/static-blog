---
title: "Privacy-Friendly Analytics with Plausible/Umami"
description: "How we shipped privacy-first, DNT-respecting analytics that work with static export and GitHub Pages."
date: "2026-06-20"
tags: [devlog, analytics, privacy]
---

Privacy Analytics (M13) added optional Plausible and Umami support. This article explains the design, what "respects DNT" actually means in our implementation, and how we test it.

---

## The Constraints Up Front

* **Static export** — no server-side middleware, no cloud function to act as a proxy.
* **No tracking cookies** — we don’t want to ship a `_ga` cookie.
* **DNT respected by default** — if the browser says `navigator.doNotTrack === "1"`, we don’t load the analytics script at all.

Under those constraints, using Plausible Cloud (self-hosted or their hosted) or Umami is the right fit. Both accept pageviews via a single script tag.

---

## The Loader

`app/analytics.tsx` is our privacy gate. It:
1. Reads `navigator.doNotTrack`
2. Reads `window.matchMedia('(prefers-reduced-motion: reduce)')` (we skip analytics if user prefers reduced motion — accidental extra sensitivity)
3. Injects a `<script>` tag pointing at the configured domain

```ts
if (dnt === '1') return null;
if (reducedMotion) return null;
```

The script tag is `async` and `defer`. No layout shift.

---

## Configuration

Environment variables drive the integration:

* `NEXT_PUBLIC_ANALYTICS_DOMAIN` — required if analytics is enabled
* `NEXT_PUBLIC_ANALYTICS_URL` — defaults to Plausible-style endpoint
* `NEXT_PUBLIC_ANALYTICS_SELF_HOSTED` — boolean
* `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — switch for Umami

The loader reads these at runtime. No build-time hardcoding needed.

---

## E2E Coverage

In `e2e/` we added tests that assert:
* **DNT enabled:** the script tag is absent
* **DNT disabled:** the script tag is present with the right `src`
* **Comments:** the comment iframe is present (Giscus uses a different, comment-specific script)

This gave us confidence that toggling DNT in the test browser actually flips the script in/out.

---

## What It Doesn’t Do

* It doesn’t track unique visitors across sessions (no cookie).
* It doesn’t set local storage. Funnel events require explicit configuration in Plausible/Umami and a separate `trackEvent` call, which we haven’t implemented yet.
* It doesn’t aggregate server-side. All counts are in the analytics provider dashboard.

---

## Takeaway

You don’t need a JavaScript-heavy “all-in-one” tracker to understand who reads your blog. A single pageview script, gated by DNT, is enough. If we ever outgrow it we can layer on events — but the default is the lightest possible.
