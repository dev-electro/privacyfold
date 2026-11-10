# Engines & models — the compute architecture (self-hosted, per owner decision 10 Nov 2026)

Owner directives: **(1)** WASM with full capabilities, we host the binaries; **(2)** we host small models, compare Transformers.js vs wllama vs window.ai; **(3)** maximise live tools; **(4)** CMS must make future collections additive, not redesigns.
This file is the arbitration record; DEC-009/010/011 in `docs/agent/DECISIONS.md` point here.

## 1. On-device runtime comparison → DEC-010: Transformers.js is the primary runtime

| | **Transformers.js v3/v4** (`@huggingface/transformers`) | **wllama** (llama.cpp→WASM) | **window.ai / Prompt API (Chromium)** |
|---|---|---|---|
| Model format | **ONNX** (Optimum-converted, quantised q8/fp16/q4f16) | GGUF | built-in (Gemini Nano) |
| Backends | WebGPU (GPU) with **automatic WASM/CPU fallback** — never fails on an old browser | CPU/SIMD (WebGPU exists upstream but immature) | browser-provided (fast, 0 MB) |
| Task coverage | **embeddings, ASR, NER/PII, segmentation/matting, classification, text-gen** — the whole AI toolset lives here | text-generation only | chat/summarise/rewriter-style tasks |
| Measured sizes (HF API, not estimates) | Moonshine-tiny **27–55 MB**, Whisper-tiny 39–73 MB, bge-micro/small **~22–33 MB**, MiniLM 22–29 MB | GGUF often smaller for equal-text-quality LLMs | 0 MB |
| Download/caching | OPFS + HF cache; **self-hosting keeps it on our domain** | OPFS; needs COOP/COEP for threads | nothing |
| Fit for PrivacyFold | ✅ covers 100% of the catalogued AI tools (ASR, RAG, PII, matting, writer) | ❌ nothing in the catalog needs GGUF chat today | ⚠️ Tier-B opportunistic path on Chromium desktop |
| Evidence | localmodel.run (sizes measured from HF API), localmode.dev backend guide, pinggy.io write-up — all checked 2026-11-10; LlamaWeb paper confirms Transformers.js decode is slower for *chat LLMs*, which is not our workload | same paper | Chromium-only, API moving |

**Decision 010:** primary runtime = Transformers.js (WebGPU device when available, WASM fallback automatic); `window.ai` = opportunistic Tier B for writer/summariser (registry: `window.ai` engine, Chromium-gated, 0 MB); **wllama deferred** (revisit only if a GGUF chat/LLM tool is ever added — it needs COOP/COEP sitewide vs our per-path scoping). Impact: `wllama`/LlamaWeb research applies to no current tool.

## 2. Hosting architecture → DEC-009 (self-hosted binaries AND models)

Everything compute-downloading lives on our origins; no HF/CDN fetches at runtime, so `connect-src 'self'` remains the true header and the "your data never leaves your device" claim never contradicts the stack.

| Asset kind | Path | Cache | Registry |
|---|---|---|---|
| WASM engines | `/wasm/<family>/<name>.wasm` (canonicalised to the **existing referenced paths** — no link rot) | immutable + sha256 SRI | `content/engine/<name>.yaml` type `wasm` |
| ONNX model packs | `/models/<name>/<file>.onnx(+quantised variant)` | immutable + sha256 + ETag | `content/engine/<name>.yaml` type `onnx` |
| JS engines | `/js/lib/*.mjs` (pdf-lib etc.) | same | type `js` |
| Runtime adapter | islands `ToolShell` load-path, OPUFS-based cache-first loader (`src/lib/ai/opfs-loader.ts` is already a stub) | — | receipt records engine + hash |

**Engine record (forward-compatible schema, additive)**

```yaml
id: mozjpeg_enc
type: wasm               # wasm | onnx | js | host   (+ new types are additive by design)
family: image
path: /wasm/image/mozjpeg_enc.wasm
sha256: <real-hash>      # SRI-verified at load; printed into every result receipt
version: 1.3.1
source_repository: https://github.com/jmprdi/jsquash
license: MIT
size_kb: 78
tasks: [image_compress]           # tool slugs it powers
```

**Cross-origin isolation (scoped, sitewide-safe):** threaded WASM needs `SharedArrayBuffer` → `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`. Applied **per path** (`/tools/*` and `/models/*` only, never sitewide) so AdSense frames on content pages are not broken by COPE fair-targeting. Scoped `_headers` matching on Pages handles this; verify at PF-033 with a probe.

## 3. Engine wave table — what "full capabilities" means per family (target: all 72 catalogued tools live)

| Wave | Engines (self-hosted) | Unblocks (real) |
|---|---|---|
| **1 — binaries exist today** | `@jsquash` mozjpeg/jpeg/png/webp/avif wasm, `sql.js` sql-wasm, `tesseract.js` core-simd wasm, `pdfium/pdf.js` wasm builds, `libheif` wasm (heic-to), `md5/sha` JS (WebCrypto) | image_compress (AVIF!), sqlite_viewer, **ocr_scan real**, pdf_to_image/merge/split/flatten (pdfium + pdf-lib), heic_to_jpg real |
| **2 — model packs added** | Moonshine-tiny-en (ASR), bge-micro-v2 (RAG embeddings), GLiNER-base / DeBERTa-NER (ai_airlock, exposure_xray), SelfieSegmenter/BEN-Slim (bg_remove real), SmolLM2-135M-Instruct (writer fallback) | voice_transcribe real, chat_pdf real, ai_airlock PII real, **bg_replace real**, ai_writer Tier-M fallback |
| **3 — compiled from source** (only what doesn't already have a proven binary) | lpdz/mozjpeg-extra variants, qpdf-style reducer (raster-recompress via pdfium+mozjpeg is wave 1/2 work, no new compiler needed), stego/LSB Detector (already JS) | pdf_compress *real* (raster-recompress to ≤ 2/≤ 5/≤ 12 MB portal targets), pdf_redact real (destructive raster burn-in) |
| **4 — optional upgrades once waves 1–3 are live** | quality/latency tightening: quantised colour-contrast LUT, JPEG XL encoder if not covered by @jsquash, WASM-threaded OCR for multi-page batches | perf, not presence |

Waves 1–3 bring the catalog to "every tool's advertised engine is the engine that actually runs" (the CLAIMS ledger flips from false→true per row), with no source compilation unless a gap proves out — that's what keeps the "max tools" target reachable in weeks, not quarters.

## 4. Count policy → DEC-011 ("max tools")

The canonical source is `content/tools` — generated, never hand-edited (DEC-004/005 already mandated). The count surfaces stay honest under three simultaneously true numbers:

```
catalogued: count(content/tools)            = 72        (target ceiling)
live:       count(tools where status=live AND engine exists in content/engine)   ← what people read in hero/meta
gated:      live tools gated by engine wave readiness (0 at start of PF-033, grows as engines land)
```

Hero copy changes from "40 tools" to the **generated live count**, with "N more in the catalogue" when live < catalogued — so marketing never outpaces reality while the catalog still maximises tool inventory. New tools enter via `status: draft` (+ noindex until `live`), which is also how the catalogue reaches 100+ without claiming what isn't runnable.

## 5. CMS forward-compatibility → owner directive (4)

The collection set is **not** frozen at 9. Concretely additive by design:

- `content.config.ts` is a **registry, not a switch-statement**: an `initCollections()` array returns `{name, schema}` per collection; a new collection = one new schema object + one admin `config.yml` block, no edits to templates.
- `admin/config.yml` is generated *or* drift-checked against that registry (PF-026 check fails the build if they disagree) — a collection can be added wherever the schema exists, without touching the CMS app itself.
- Namespaces reserved from day one so adding later never conflicts: `engine/`, `translate/` (i18n), `compare/`, `glossary/`, `media/` (uploads manifest + generated OG‑image registry), `channels/` (future social/publish queue), `receipts/` (if tool receipts ever need a content face).
- `content/engine/` ships **now** (PF-033) as the 9th registered collection — it is dependency #1 for honest SEO copy, the receipt plumbing, and the CLAIMS ledger going true.
