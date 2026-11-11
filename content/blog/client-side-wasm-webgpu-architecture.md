---
title: "How Client-Side WebAssembly & WebGPU Replace Cloud File Utilities Without Uploading a Single Byte"
slug: "client-side-wasm-webgpu-architecture"
category: "Architecture & Privacy"
readTime: "7 min read"
publishedAt: "2026-11-01"
summary: "Why uploading passport photos, tax forms, and production JSON/JWTs to free online converters is a critical privacy leak—and how modern browsers execute the same workloads locally."
relatedTool: "image-compress"
---

Every day, millions of people upload sensitive documents—passport photos, signed NDAs, tax forms (W-9, SA100), and production API tokens—to free online converter websites. Even when those services promise to delete files after 24 hours, your document traverses third-party CDNs, load balancers, temporary disk buckets, and server logs.

## 1. The Shift from Cloud Buckets to In-Tab Execution

Modern browsers ship with three hardware-accelerated runtimes that make server-side file utilities unnecessary for everyday document and developer workflows:

- **WebAssembly (WASM) with SIMD:** Compiles C, C++, and Rust codecs (MozJPEG, libwebp, libavif, MuPDF, Tesseract, and SQLite) to execute at near-native CPU speed inside a memory-safe sandbox.
- **WebGPU & ONNX Runtime Web:** Grants direct access to local GPU compute shaders so background matting (`RMBG-1.4`), document OCR, and PII airlock scanning run in milliseconds on your own graphics card.
- **W3C WebCrypto API:** Performs AES-256-GCM encryption, PBKDF2 key derivation, SHA-256/512 hashing, and ECDSA P-256 signing using OS-level cryptographic primitives.

## 2. Verifying Zero Uploads with Content Security Policy

PrivacyFold ships with a strict HTTP `Content-Security-Policy` header setting `connect-src 'self'` and monitors every run with a live `PerformanceObserver`. Even if you turn off Wi-Fi before clicking the action button, every tool completes locally with zero outbound network requests.
