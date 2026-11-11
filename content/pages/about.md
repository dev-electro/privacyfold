---
slug: about
title: "About PrivacyFold — File Tools That Never See Your Files"
reviewed: "2026-11-11"
---

# About PrivacyFold

*File tools that never see your files.*

PrivacyFold is an open, client-side utility suite designed to process sensitive documents, images, and credentials entirely inside the user's web browser.

---

## Technical Philosophy

Most online file converters and document processors operate as cloud data brokers: they require users to upload confidential contracts, medical scans, tax forms, and passport photos to remote server farms.

PrivacyFold was built on a single uncompromising invariant: **computation belongs on the client**.

By leveraging standard modern web primitives—including **WebAssembly (WASM)**, **WebCrypto API**, and **Canvas**—PrivacyFold performs heavy media and document processing inside your device's browser memory. Zero bytes of your files are ever transmitted across the internet.

---

## Core Guarantees

1. **Zero Server Uploads:** Your files are read into local browser RAM using the HTML5 File API and processed by client-side WebAssembly binaries. No cloud buckets, workers, or server databases exist.
2. **Honest Output:** Our tools never fabricate output or simulate operations. If an engine cannot process an input, it surfaces a transparent error rather than mock results.
3. **Open Architecture:** We document our standards compliance (ICAO 9303, CIPA DC-008, NIST SP 800-38D, ISO 32000-1) and provide deterministic Model Context Protocol (MCP) tool schemas for developer and AI agent interoperability.
4. **Zero-Tracking Monetization:** To keep PrivacyFold permanently free and independent without accounts, subscriptions, or paywalls, non-personalized contextual advertisements are served with strict privacy gating and zero third-party telemetry.
