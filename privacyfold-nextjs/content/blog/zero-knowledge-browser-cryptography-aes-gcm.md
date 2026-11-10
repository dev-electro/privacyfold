---
title: "Zero-Knowledge Browser Cryptography: AES-256-GCM, PBKDF2, and Self-Decrypting HTML Envelopes"
slug: "zero-knowledge-browser-cryptography-aes-gcm"
category: "Cryptography"
readTime: "7 min read"
publishedAt: "2026-11-08"
summary: "How to encrypt confidential notes and recovery keys in your browser so recipients can unlock them offline in any web browser without installing software."
relatedTool: "file-encrypt"
---

PrivacyFold's **Password-protect text** utility uses the W3C `crypto.subtle` API to derive a 256-bit key via **PBKDF2-SHA256 (100,000 iterations)** with a random 128-bit salt, encrypts your cleartext with **AES-256-GCM**, and packages the ciphertext into a standalone, offline-unlockable `.html` file.
