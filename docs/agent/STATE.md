# STATE — PrivacyFold (current truth)

> **Rule:** run `node scripts/agent-status.mjs` first. If it contradicts this file, the script wins — fix this file and add a LOG entry. Every "verified" below cites how it was checked. Last regenerated: see `SNAPSHOT.txt`.

## Product

| Fact | Value | Verified |
|---|---|---|
| Working artifact | `privacyfold-nextjs/dist/index.html` (438,854 B, self-contained) | loaded on localhost 2026-11-10 |
| Framework today | Next 15 static export — **does not build** (audit §1) | `npm run build` exit 1 |
| Framework decided | Astro 7 + Tailwind v4 on CF Pages (DEC-001); migration not started | DEC-001 |
| Content | 72 tools / 87 presets / 6 blog / 5 templates (Git JSON) | agent-status |
| Tools actually runnable | **64** live in runtime; **8** sold but unimplemented (`pdf-merge`, `pdf-split`, `pdf-redact`, `w9-prep`, `sa100-prep`, `heic-to-jpg`, `signature-clean`, `file-encrypt`) | regex scan of app-runtime |

## What works (verified in browser 2026-11-10)

- Desk UI renders and routes; visual quality is production-grade (screenshot review).
- Real tools: `passport_photo` (canvas crop), `image_compress`, `exif_strip` (re-encode strips APP1), `hash_gen` (WebCrypto), and the text/dev family (json, base64, jwt, uuid, regex, csv, url, text-diff, unit, cron, ua, password, qr, color-contrast).
- SDK: `window.privacyfold.run('image_compress', …)` returns real canvas-encoded blobs.

## What is broken or fake (verified 2026-11-10)

| Issue | Evidence |
|---|---|
| `pdf_compress` returns a 431-B stub PDF containing a printed note, ignoring the uploaded document | live probe: `run('pdf_compress',…)` output recorded in audit §4 |
| `ocr_scan` fabricates "Acme Global Ltd." / "$6,050.00" / fallback dates for scans that contain neither | live probe: source said "GBP 1,250.00", output printed different values |
| `voice_transcribe` invents a transcript from a hardcoded sentence; `bg_remove`, `chat_pdf`, `ai_writer` are heuristics labelled as ONNX/WebGPU/window.ai models | code read of `run:` bodies, audit §4 |
| 0 `.wasm` binaries exist; 13 `/wasm/*.wasm` paths are quoted by llms.txt/_index.json/schemas/JSON-LD | `find -name "*.wasm"` empty |
| `wasm-sri.json` hashes are sha256("") and sha256("abc") | match against empty-string digest |
| `_index.json.sig` and `PINNED_ED25519_PUBKEY` are fake literals; MCP reports `signature_verified: true` without verification | audit §5 |
| Tool count stated as 40 / 42 / 72 / 64 in four surfaces | agent-status §5 |
| Next tree: dead route imports `@/lib/cms`; duplicate `[slug]`/`[toolSlug]`; 72 tool JSONs lack `fam/task/…`+`seo.steps` → prerender TypeError | audit §1 |
| No privacy policy / terms / ads.txt / favicon / 404 / LICENSE / CI / lockfile / tests | agent-status §1, §6 |
| Google Fonts CDN is the app's only third-party request | `performance.getEntriesByType('resource')` probe |

## Architecture (stable facts)

- Runtime contract for agents: `input[type=file][data-pf="input"]`, `[data-pf="run"]`, `[data-pf="download"]`, `window.__PRIVACYFOLD_READY__`, `window.__PRIVACYFOLD_RESULT__` (DoS from `docs/privacyfold-agent-surface.md` §6).
- Content model decided in DEC-001 migration: Astro Content Collections with a **schema is the single source of truth**; `llms.txt`, `_index.json`, `.well-known/mcp.json` and JSON-LD are **generated** from it, never hand-edited.
- No server, no Workers, no DB. Cloudflare Pages static only.

## Open questions (do not silently decide)

1. Are the 8 unimplemented tools built with real WASM, or removed from all surfaces until then? → owner: Gaurav
2. AdSense: integrate with consent, or park monetisation? → owner: Gaurav
3. Which 25 locales ship in phase 1? → owner: Gaurav
