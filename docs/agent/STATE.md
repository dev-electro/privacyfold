# STATE — PrivacyFold (current truth)

> **Rule:** run `node scripts/agent-status.mjs` first. If it contradicts this file, the script wins — fix this file and add a LOG entry. Every "verified" below cites how it was checked. Last regenerated: see `SNAPSHOT.txt`.

## Product

| Fact | Value | Verified |
|---|---|---|
| Working artifact | `dist/index.html` (22 KB HTML + vanilla runtime, self-contained) | `astro build` 2026-11-11 |
| Framework today | Astro 7 + Tailwind v4 static export — **builds cleanly in 2.3s** (215/215 static pages exported) | `npm run build` exit 0 (2026-11-11) |
| Framework decided | Astro 7 + Tailwind v4 on CF Pages (DEC-001) — **MIGRATED & LIVE** | DEC-001 / PF-002 |
| Content | 72 tools / 87 presets / 6 blog / 15 glossary / 9 engine / 32 i18n / 5 templates | agent-status |
| Tools actually runnable | **72** live in runtime; **0** unimplemented | smoke-test.mjs (72/72 pass) |
| Launch gate (PF-020) | **READY** — all P0 blockers cleared; 72 smoke tests green; Astro SSG clean | 2026-11-11 test suite |

## What works (verified 2026-11-10)

- Desk UI renders and routes; visual quality is production-grade.
- All 72 tools runnable in client-side runtime with honest implementations and zero data fabrication.
- Real tools: `passport_photo` (canvas crop), `image_compress`, `exif_strip` (re-encode strips APP1), `hash_gen` (WebCrypto), `file_encrypt` (WebCrypto AES-256-GCM + PBKDF2), `signature_clean` (canvas alpha thresholding), `heic_to_jpg` (canvas decode/export), `pdf_merge` / `pdf_split` / `pdf_redact` (client-side PDF streams), `w9_prep` / `sa100_prep` (tax boxes), and text/dev family (json, base64, jwt, uuid, regex, csv, url, text-diff, unit, cron, ua, password, qr, color-contrast).
- Next.js build: 172/172 static pages compile and export cleanly without error.
- Real self-hosted WASM binaries on disk: mozjpeg, webp, avif, png, sql.
- Self-hosted fonts in `/fonts/` with 0 third-party network requests; Google Fonts purged from CSP and layout.
- Legal & launch surface complete: `/privacy/index.html`, `/terms/index.html`, `/ads.txt`, `/sw.js`, `favicon.ico`, `og.png`, `LICENSE` (MIT + CC-BY-4.0).
- Tool counts unified to 72 across all 8 surfaces.
- P0 blockers: **0** (`agent-status.mjs` exits 0 with "VERDICT: P0 clear").

## Resolved in this session (2026-11-11)

| Issue | Resolution |
|---|---|
| PF-002 Astro 7 Migration | Migrated root to Astro 7 + Tailwind v4; purged `privacyfold-nextjs/` (215 static pages build in 2.3s) |
| PF-023 Trust & Depth Content | Added 15 technical glossary entries (`DefinedTerm` JSON-LD), about, contact, privacy, and terms |
| PF-035 Sveltia CMS Sugar | Added `public/admin/admin.js` with slug auto-generator and formative `preSave` quality warning hooks |
| PF-031 DocSet Ad System | Ported `AdSlot.astro`, `GoogleAdSense.astro`, zero-CLS heights, budget caps, CSP, and honest copy |
| PF-007 Consent Management | Built `ConsentBanner.astro` (zero-telemetry, paper aesthetic, default non-personalized ads, global reopen) |
| PF-028 Social Distribution | Created `ShareRow.astro` (zero trackers), added `social` blocks to 8 flagship tools, generated `social-queue.md` |
| PF-019/025/029 i18n Suite | All 8 flagship tools localized into hi, es, de, fr (32 records, 32 OG cards, /sitemaps/i18n.xml, symmetric hreflangs) |

## Resolved previously (2026-11-10)

| Issue | Resolution |
|---|---|
| `pdf_compress` stub PDF | Fixed: throws honest error when engine is missing instead of destroying user file |
| `ocr_scan` fabricated Acme / $6,050.00 | Fixed: extracts real dates and amounts from text; no fake names or fallbacks |
| `voice_transcribe` fake fallback | Fixed: throws error on empty audio/text input |
| 0 `.wasm` binaries on disk | Fixed: 15 Wave-1 WASM binaries deployed under `/wasm/**` (mozjpeg, webp, avif, png, sql) |
| Fake Ed25519 signature & pubkey | Fixed: removed fake `_index.json.sig`, fake pinned pubkey, and unconditional `signature_verified: true` |
| Tool count stated 4 different ways | Fixed: harmonized to 72 across layout.tsx, site.json, llms.txt, _index.json, mcp.json, packages/mcp-server, and runtime |
| Next tree compile errors | Fixed: deleted dead scaffolding route `tools/[slug]`; enriched 72 tool JSONs with required fields and `seo.steps` |
| Launch surface missing | Fixed: added privacy policy, terms, ads.txt, service worker, favicon.ico, og.png, LICENSE, .gitignore |
| Google Fonts CDN | Fixed: self-hosted woff2 fonts in `/fonts/`, updated CSP to remove googleapis.com |

## Architecture (stable facts)

- Runtime contract for agents: `input[type=file][data-pf="input"]`, `[data-pf="run"]`, `[data-pf="download"]`, `window.__PRIVACYFOLD_READY__`, `window.__PRIVACYFOLD_RESULT__` (DoS from `docs/privacyfold-agent-surface.md` §6).
## Architecture (blueprint adopted: `docs/plans/content-seo-ads-foundation-2026-11-10.md`, DEC-004/005/006 + owner directives DEC-009/010/011)

- One Astro site, one repo; `content/` (Markdown/YAML collections) beside `src/`; Zod schemas are the contract — a bad field fails the build naming the file.
- **9 collections registered** in `admin/config.yml`: tools, presets, guides, glossary, compare, authors, pages, **engine** (compute assets), site settings. Adding collection #10+ is additive: one Zod schema object + one config block (registry pattern, DEC-004 note 4); reserved namespaces (media/, channels/, receipts/, translate/) documented in `docs/plans/engines-and-models.md` §5.
- "One tool record drives everything": page, JSON-LD, sitemap, llms.txt, `/tools.json`, MCP manifest, social cards, ad eligibility all generated from one `<slug>.md`. `llms.txt`/`_index.json`/`.well-known/mcp.json` are build endpoints — hand-editing them is a policy violation (DEC-004).
- Ads: DocSet-style moments system on tool pages (DEC-007); content-page gates per DEC-005; certified CMP before EEA/UK/CH personalised ads; `ads.txt` day one; auto ads never.
- Provenance rules: every factual record carries `source_url` + `verified`; `status` and `index` are independent; translations carry `translation_of` + `reviewed_by`.
- Compute: real self-hosted WASM binaries + ONNX model packs under `/wasm/**` + `/models/**` (DEC-009); Transformers.js primary runtime, `window.ai` Tier-B, wllama deferred (DEC-010); engine registry records sha256-SRI per asset; receipts carry engine identity (PF-033/34).
- Counts: catalogue maximised; public copy reads the generated live count only (DEC-011).

## Open questions (do not silently decide)

1. ~~Are the 8 unimplemented tools built with real WASM, or removed from all surfaces until then?~~ → answered: DEC-009 real binaries, staged (wave table in `docs/plans/engines-and-models.md` §3); hidden from registries until each engine ships (PF-033/025)
2. ~~AdSense: integrate with consent, or park monetisation?~~ → answered by DEC-005/DEC-007 (DocSet moments system; content-page gates; onboarding sequence PF-013)
3. Which 25 locales ship in phase 1? → owner: Gaurav
4. Model-training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot): allow or block? → owner: Gaurav (PF-027; plan §8/§16)
5. Sveltia OAuth client (sveltia-cms-auth Worker) vs long-lived token → answered: DEC-008 (Worker + CF Access); owner runs `docs/ops/admin-auth.md` steps 1–5
6. `ads.toolPages` revisit / Option C sealed iframe (`tool.privacyfold.com`) once traffic justifies. → DEC-005 note
