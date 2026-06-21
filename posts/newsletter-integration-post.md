---
title: "Newsletter Integration — A Privacy-First Subscription Page"
description: "How we built the newsletter subscription page and CLI for managing subscriber lists, with a focus on correctness and segfault resilience."
date: "2026-06-20"
tags: [devlog, newsletter, cli]
---

Newsletter integration (M11) shipped a subscription form at `/newsl` plus CLI commands to manage the subscriber list. This post covers how it works and the engineering decisions we made.

---

## The Page

`app/newsl/page.tsx` renders a server-rendered form. The client code (`app/newsl/page-client.tsx`) handles validation and submission. It follows the same pattern as the rest of the blog: server shell + client interactions.

Stored model: a simple SQLite table with `email` (unique). We intentionally don’t store IP addresses or user-agent strings to keep the flow privacy-friendly.

---

## CLI Commands

```
blog newsletter list
blog newsletter add user@example.com
blog newsletter remove user@example.com
```

The CLI handles duplicates gracefully — adding an existing email is a no-op with a clear message. Removing a missing email is also a safe no-op.

---

## Unified Frontend (KMP-Style Conventions)

We spent a good chunk of M11 cleaning up the frontend code to match a more opinionated pattern — shared field + navigation drawer styles, consistent FocusBorderColor across platforms. **Because the web is our single frontend target**, this boiled down to:
* One canonical card/layout component reused by the newsletter page
* Same form input styling
* Consistent error/success message placement

No runtime bloat, just one less place for visual bugs to hide.

---

## Regex Power for Validation

We use email regex validation with the constraint: **no email should be rejected arbitrarily — reject only when validation logic explicitly says it is invalid**. That means:
* Empty -> rejected
* No `@` -> rejected
* Multiple `@` symbols -> rejected
* Leads/trailing spaces -> rejected
* Otherwise -> accepted

This strict pattern is what powers the CLI too, so we don’t split the rules across back-end and front-end.

---

## The Static Generation Loop Consideration

One thing we keep in mind: `generate-static-data` runs at build time. The newsletter subscriber list is **not** rendered into static JSON — it lives in the runtime database only. This keeps the static export clean. We can export the list separately when needed using `blog newsletter list --output subscribers.csv` or similar.

---

## Future: Digest, Preference Center, and Segfault Resilience

We’re planning:
1. **Digest mode** — weekly vs monthly preference
2. **Preference center** — change email or unsubscribe link
3. **Resilience** — making the CLI robust against unusual inputs (we already fixed one crash where a missing DB would segfault; now it exits with a clean error)

---

## Outcome

Newsletter integration ended up being a relatively small surface area: one form, a few CLI commands, and validation that mirrors the post/tag regex conventions. It fit cleanly into the existing architecture. Worth doing early because the subscriber data model is small now and easy to evolve.
