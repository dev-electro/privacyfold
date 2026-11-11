---
term: "PBKDF2"
definition: "Password-Based Key Derivation Function 2 (PBKDF2) applies a pseudorandom function repeatedly to derive high-entropy cryptographic keys from human-readable passphrases."
aliases:
  - "Key Stretching"
  - "PBKDF2-HMAC-SHA256"
related_tools:
  - "file-encrypt"
  - "password-gen"
reviewed: "2026-11-10"
---

## Protecting Against Brute-Force Password Attacks

Human passwords typically contain low entropy. PBKDF2 protects against dictionary and GPU cracking attacks by iterating a hashing function (such as HMAC-SHA256) hundreds of thousands of times.

PrivacyFold enforces 600,000 PBKDF2 iterations with unique 128-bit cryptographic salts per encrypted file.
