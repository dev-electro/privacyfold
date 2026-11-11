---
term: "AES-256-GCM"
definition: "Advanced Encryption Standard in Galois/Counter Mode (AES-256-GCM) is an authenticated symmetric cipher providing confidentiality and cryptographic tamper-proofing in a single primitive."
aliases:
  - "AES-GCM"
  - "Galois/Counter Mode"
related_tools:
  - "file-encrypt"
reviewed: "2026-11-10"
---

## Authenticated Symmetric Encryption

AES-256-GCM is the modern gold standard for symmetric encryption recommended by NIST (SP 800-38D).

### Dual Protection: Secrecy + Integrity

Unlike unauthenticated encryption modes (such as AES-CBC without HMAC), AES-GCM calculates a 128-bit authentication tag over the ciphertext. If any byte of the encrypted file is modified, tampered with, or corrupted, decryption fails automatically, preventing chosen-ciphertext attacks.
