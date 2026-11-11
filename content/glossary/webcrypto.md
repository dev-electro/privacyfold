---
term: "WebCrypto"
definition: "The W3C Web Cryptography API provides standardized, hardware-accelerated cryptographic primitives—including AES-GCM, PBKDF2, and SHA-256—directly within browser execution contexts."
aliases:
  - "Web Cryptography API"
  - "crypto.subtle"
related_tools:
  - "file-encrypt"
  - "hash-gen"
  - "pgp-crypto"
reviewed: "2026-11-10"
---

## What is the Web Cryptography API?

The Web Cryptography API (`window.crypto.subtle`) is a native browser interface providing secure access to the operating system's cryptographic subroutines.

### Cryptographic Operations

- **Symmetric Encryption:** AES-GCM, AES-CBC, and AES-CTR with 128-bit and 256-bit key lengths.
- **Key Derivation:** PBKDF2 and HKDF with configurable iteration counts and salt values.
- **Hashing:** Cryptographic digests including SHA-256, SHA-384, and SHA-512.
- **Digital Signatures:** ECDSA, Ed25519, and RSA-PSS.

PrivacyFold leverages WebCrypto for zero-knowledge file encryption and self-decrypting envelopes.
