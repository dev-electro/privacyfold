# CLAIMS ledger — PrivacyFold

Every promise that reaches a user (or an agent) must have a row here: where it appears, whether it is true, and what proves it. **Project law (AGENTS.md #2): an untrue claim is removed, not explained.** Agents check this table before touching marketing copy, `ToolSeoArticle`, JSON-LD, or registry files.

Status: `true` · `partial` · `false` · `future`

| Claim | Where it appears | Status | Evidence / what would make it true |
|---|---|---|---|
| "File tools that never see your files / 0 uploads" | hero, status bar, all SEO copy | **true** | CSP `connect-src 'self'`; only 3rd-party call is Google Fonts (probe 2026-11-10) — self-host fonts to keep it pure (PF-008) |
| "Runs 100% locally via WebAssembly" | llms.txt ×72, `_index.json`, JSON-LD, tool pages | **false** (64 canvases/webcrypto tools are local but not wasm) | build real `.wasm` per tool, or rewrite copy to "runs on your device" |
| "Works offline (PWA Service Worker)" | ToolSeoArticle table, JSON-LD featureList | **false** | no `sw.js` in tree (PF-014) |
| Passport photo tool (crop, country formats, guides, print sheets) | runtime, presets | **true** | verified via SDK probe; canvas path |
| Image compressor ("make it fit" under size limits) | runtime, 7 preset pages | **true** | canvas binary-search encode |
| EXIF strip removes GPS/camera/serial | runtime | **true** | canvas re-encode drops APP1 |
| "PDF compressor for USCIS/VFS/HMRC limits" | runtime live tool, 7 preset pages, templates | **false** | probe: returns 431-B stub PDF ignoring input (audit §4). Fix (PF-005) or de-market |
| "OCR: fill W-9/SA100 from scan" | runtime live tool, blog | **false** | probe: hardcoded "Acme Global Ltd." etc. Fix (PF-005) |
| "Speech-to-text via Moonshine/Whisper" | runtime, .well-known (voice-notes) | **false** | no model, no audio decode; hardcoded output |
| "AI bg remove via BEN v2/MODNet WebGPU" | runtime, .well-known | **false** | flood-fill colour distance only |
| "Chat with PDF via bge-micro embeddings" | runtime | **false** | keyword scoring |
| "window.ai 0-MB AI writer" | runtime, blog | **partial** | rule-based fallback; `window.ai` path present but Chromium-only & untested → label Tier B honestly |
| `pdf_merge/split/redact`, `w9_prep`, `sa100_prep`, `heic_to_jpg`, `signature_clean`, `file_encrypt` work | llms.txt, .well-known/mcp.json, _index.json, SEO pages | **false** | `live:false` in runtime, "Coming soon" in UI (PF-004) |
| "40 tools" / "42 tools" / "72 tools" | layout.tsx / MCP server / llms.txt & _index | **false ×3** (canonical is `count(content/tools)`) | generate; PF-010 |
| Signed registry (Ed25519, `_index.json.sig`, pinned key) | agent surface doc, mcp-server, `.sig` file | **false** | literal hex strings; no verify code (PF-009) |
| "CC-BY-4.0 licensed registry" | _index.json, llms.txt, mcp-server | **partial** | no LICENSE file exists (PF-018) |
| Ad slots are live AdSense units | site.json `adsense.enabled:true`, AdSenseUnit | **false** | fake static card, no adsbygoogle, `connect-src 'self'` blocks ads anyway (PF-013) |
| Determinism tiers D / M / B | runtime receipts, _index.json | **partial** | D is honest where compute is real; M tools have no models (see fake rows); label honestly |
| Preset requirements (mm/px/kb per portal) | 87 preset pages + JSON | **unverified** | each carries `source_url`+`last_verified`; QA pass = PF-017 |
