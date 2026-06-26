---
title: "Secure Card Vault — Local-First, Encrypted Sensitive Data Storage"
description: "Concept for a local-only encrypted vault web app for credit cards and other sensitive data, starting with an Android-focused minimum viable implementation."
date: "2026-06-26"
tags: [devlog, project-idea, security, android, encryption]
---

The next project on the table is a local-first, privacy-focused vault built as a web app that stores sensitive information only on the device, encrypted at rest. The first target is Android.

---

## Why a local vault

Standard password managers and wallet apps rely on cloud sync and server-side trust. That is fine for many, but not for everyone. The goal here is a different point in the design space:

* data never leaves the device unless the user explicitly exports it
* encryption happens on-device before anything is written to storage
* unlock is a single secret the user controls: a password, PIN, or biometric gate
* the app stays simple and focused, with room to grow

---

## Minimum viable scope

For the first implementation, the app only needs to manage credit cards. Each record should store:

* masked card number
* full card number
* CVC
* validity
* associated password or note

### Masked display by default

On launch and after any lock or background pause, the app must show only the masked form of the card number:

```
XXXX XX** **** XXXX
```

This keeps screenshots, shoulder surfing, and accidental exposure low-risk while still letting the user identify which card is which.

### Unlock reveals full details

When the user authenticates, the app decrypts the record in memory and shows the complete card data:

* full card number
* CVC
* validity
* password / note

After a timeout or explicit lock, everything is masked again and the in-memory material is cleared.

---

## Future extensions

Two directions stand out after the MVP.

### Card layout recognition

It is tedious to manually type or verify card numbers. A natural next step is to recognize common card layouts from camera input or uploaded images, so users can add cards faster and reduce typos.

### Broader sensitive data support

Credit cards are only the beginning. The same encrypted local store can later hold:

* bank credentials
* document metadata
* recovery codes
* custom notes marked as sensitive

The abstraction is the same: a local record, metadata for identification, and a decrypt-on-unlock model.

---

## Current status

This is still in the concept stage. The plan is to start with a minimal Android implementation and keep the architecture simple enough to port to other platforms later.
