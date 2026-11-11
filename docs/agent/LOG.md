# LOG — session journal (newest on top)

---

## 2026-11-12 — Fix Stale PWA Service Worker Caching & Double Menu Collision

**Tasks:** Root cause and fix "double type of menu" glitch where stale offline PWA service worker served legacy HTML colliding with new CSS.
**Did:**
1. Diagnosed root cause: `public/sw.js` had cache-first HTML interception on `localhost`, serving pre-megamenu HTML (`.links` row) which loaded newly styled elements simultaneously.
2. Updated `public/sw.js`:
   - Auto-unregisters and wipes all caches when accessed from `localhost` / `127.0.0.1`.
   - Changed HTML caching strategy to network-first for production.
   - Bumped cache version to `privacyfold-v2.0.0` to flush all client caches.
3. Updated `src/layouts/Base.astro` to bypass Service Worker registration in local dev and actively unregister existing workers on localhost.
4. Hardened `src/styles/global.css`: applied `display: none !important` to legacy `.links` and `.atelier-bar` to prevent any cached markup from ever rendering.
5. Rebuilt static export and restarted preview server (PID 19683).
**Proved by:** `npm test && npm run build && curl -I http://localhost:4321/` (330 pages exported clean, HTTP 200).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-12 — Header Cleanliness: Remove Redundant Top Bar Above Navigation

**Tasks:** Purged redundant `.atelier-bar` above `<header>` to give PrivacyFold a clean, single, modern sticky header.
**Did:**
1. Removed `.atelier-bar` that sat above `<header class="nav">` displaying duplicated links and telemetry.
2. Moved runtime telemetry elements (`#wirePill`, `#wireReqN`, `#openPleatTop`, `#pleatCountB`, `#runAirgapBtn`, `#openQrTop`) into a hidden compatibility bridge so `app-runtime.js` remains 100% error-free.
3. Added Admin CMS and Architecture links to the footer (`<footer>`) for convenient access.
4. Header (`<header class="nav">`) is now the true top of the viewport, matching `reference-ui.html`.
**Proved by:** `npm test && npm run build && node scripts/build.mjs --check` (330 pages built, 0 broken links across 335 files).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-12 — PF-036: Desktop Mega Menu Navigation & Navbar Streamlining

**Tasks:** Replaced cluttered 15-button navbar with an accessible 5-column tools mega menu, Architecture and Resources dropdowns, and clean atelier bar.
**Did:**
1. Designed and integrated structured desktop mega menu in `src/components/ToolDesk.astro`:
   - 5-column Tools panel (Photo & ID, PDF & Docs, Security & Crypto, Image & Media, Dev & Forms) with direct links, tool summaries, and preset pointers.
   - Architecture dropdown (Client-Side vs Server-Side comparison, Zero-Network Privacy Ledger, WebGPU AI Airlock).
   - Resources dropdown (Engineering Guides, Technical Glossary, MCP Agent Protocol).
   - Direct smooth-scroll to `#how`.
2. Streamlined `.atelier-bar` and removed duplicated flat navbar items while strictly preserving runtime IDs (`#brand`, `#palBtn`, `#trayBtn`, `#soundBtn`, `#themeBtn`, `#playBtn`, `#mobMenuBtn`, `#mobDrawer`).
3. Added tactile hover/focus-within styling and outside-click toggle handlers in `src/styles/global.css`.
4. Handled mobile viewports: collapsed cleanly on `<=` 960px to `.mob-menu-btn` and drawer.
**Proved by:** `npm test && npm run build && node -e '<crawler script>'` (330 pages built clean, 0 broken links across 335 static HTML files).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-11 — PF-023: Compare Collection, Author Profile & CMS Markdown Trust Pages

**Tasks:** Scaffolded architectural comparison collection, author profile with Person JSON-LD, and markdown trust pages.
**Did:**
1. Created `content/compare/privacyfold-vs-cloud-compressors.md` and `content/compare/client-side-vs-server-side-file-tools.md` with in-depth technical analysis.
2. Created `content/authors/gaurav.yaml` and `content/pages/{about,privacy,terms,contact}.md` for Sveltia CMS Git editing.
3. Registered `compare`, `authors`, and `pages` collections in `src/content.config.ts`, added routes `/compare/` and `/compare/[slug]`, and wired `/sitemaps/compare.xml`.
4. Extended CI validation in `scripts/validate-git-cms.mjs`, `scripts/check-content.mjs`, and `scripts/agent-status.mjs`.
**Proved by:** `npm test && npm run build && node scripts/build.mjs --check` (314 pages exported cleanly, 0 broken links).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-11 — PF-019/PF-029: Tactile UI Language Switcher & Multi-Lingual Internal Navigation

**Tasks:** Adding visible language selector pill strip and locale-aware related tool navigation.
**Did:**
1. Added visible, tactile Language Switcher pill strip to `<ToolSeoArticle />` displaying native labels (`日本語`, `Español`, `Português`, `हिन्दी`, etc.) and active language highlighting.
2. Updated related tools navigation to maintain visitor's active locale across tool transitions.
3. Updated social `ShareRow` canonical sharing link to match active locale.
4. Documented live 16-locale production inventory in `docs/architecture/i18n-budget-and-structure.md`.
**Proved by:** `npm test && npm run build && node scripts/build.mjs --check` (0 broken links across 316 HTML outputs).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-11 — PF-019/PF-025/PF-029: Scaled 8 Flagships Across 16 Top International Languages

**Tasks:** Expanding Phase 1 i18n flagship localization from 4 pilot locales to 16 top international languages.
**Did:**
1. Expanded all 8 flagship tools across 16 top international languages (`hi`, `es`, `de`, `fr`, `ja`, `pt`, `it`, `zh`, `ar`, `ko`, `ru`, `nl`, `id`, `tr`, `pl`, `vi` = 128 localized records).
2. Generated 128 localized Open Graph 1200x630 branded SVG cards in `public/og/` (206 total cards).
3. Verified symmetric hreflang links across all 16 languages + `x-default` + English with zero orphan links.
4. Compiled 311 static pages clean via Astro 7 static export; verified 0 broken links across all 316 HTML outputs.
**Proved by:** `npm test && npm run build && node scripts/build.mjs --check` (exit 0 across all suites).
**Next:** All tasks in `TASKS.md` done except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-11 — Verification, Link Integrity & Repo Synchronization

**Tasks:** Internal link audit across all generated pages, test suite re-verification, and branch synchronization.
**Did:**
1. Pushed commit `733758a` (CI build resiliency & pipeline ordering) to `origin/main`.
2. Verified internal link graph across all 220 static HTML pages in `dist/` (0 broken links found).
3. Refreshed and committed `docs/agent/SNAPSHOT.txt`.
4. Verified `npm test` clean pass across all 4 suites (agent-status, smoke-test, check-cms-drift, check-content).
**Proved by:** `node scripts/build.mjs --check && npm test && git push origin main` (exit 0).
**Next:** All tasks in `TASKS.md` complete except PF-021 awaiting owner Cloudflare Worker OAuth deployment.

---

## 2026-11-11 — PF-012/PF-030: Resilient CI Build Verification & Pipeline Ordering

**Tasks:** Hardening CI pipeline and `build.mjs` check for clean fresh checkouts.
**Did:**
1. Updated `scripts/build.mjs` to dynamically trigger `npm run build` when `dist/` is absent, preventing false negative check failures on clean checkouts.
2. Reordered `.github/workflows/ci.yml` execution sequence so `build.mjs --check` validates `dist/index.html` immediately after `npm run build`.
**Proved by:** `node scripts/build.mjs --check && npm test` (exit 0 across all checks).
**Next:** All tasks in `TASKS.md` complete except PF-021 awaiting owner auth Worker deploy.

---

## 2026-11-11 — PF-019/PF-025/PF-026: Complete 8-Flagship i18n Suite, 32 Localized OG Cards, and COOP/COEP Headers

**Tasks:** Multi-lingual scaling for all 8 flagship tools, localized OG cards, and CI content check suite.
**Did:**
1. Completed full Phase 1 i18n localization for all 8 flagship tools (`exif_strip`, `passport_photo`, `image_compress`, `file_encrypt`, `pdf_merge`, `pdf_redact`, `clean_paste`, `w9_prep`) across `hi`, `es`, `de`, `fr` (32 localized records).
2. Enhanced `scripts/og-images.mjs` to auto-generate branded localized 1200x630 SVG social cards in `public/og/` (110 cards total).
3. Updated `src/pages/[lang]/tools/[toolSlug].astro` to link each locale to its own localized OG image card (`ogImage = /og/${lang}-${tool.slug}.svg`).
4. Scoped threaded WASM COOP/COEP headers for multi-lingual routes (`/*/tools/*`) in `public/_headers`.
5. Enhanced `scripts/check-content.mjs` to validate all `content/i18n` records for required HowTo steps and FAQ schema in CI.
**Proved by:** `npm test && npm run build` (215 static pages exported clean in 2.32s, 72/72 smoke tests pass, 32/32 i18n records verified, 0 warnings/errors).
**Next:** All tasks in `TASKS.md` done except PF-021 (admin auth Worker deployment pending owner action).

---

## 2026-11-11 — PF-007, PF-013, PF-019: Consent Management Banner & i18n Flagship Scaling

**Tasks:** Consent management component for GDPR/AdSense compliance & expanded multi-lingual coverage.
**Did:**
1. Created `src/components/ConsentBanner.astro`: Lightweight, tactile paper-stock client-side consent dialog with zero tracking telemetry, "Non-Personalized Only" vs "Accept All" modes, `localStorage` persistence, custom event dispatch, and global `window.__pfOpenConsent()` hook.
2. Wired `GoogleAdSense.astro` pre-script check enforcing `requestNonPersonalizedAds = 1` by default until user explicitly grants full consent.
3. Added Cookie & Ad Preferences triggers in `src/components/ToolDesk.astro` footer and `public/privacy/index.html`.
4. Deployed 4 localized flagship records for `passport_photo` in `content/i18n/{hi,es,de,fr}/tools/passport_photo.json` (Hindi, Spanish, German, French) with symmetric hreflang links and XML sitemap entries.
5. Resolved `@tailwindcss/vite` false unused warning in `scripts/agent-status.mjs` by inspecting root config imports.
**Proved by:** `npm test && npm run build` (191 static pages exported in 2.66s, 72/72 smoke tests pass, 0 warnings/errors in agent-status).
**Next:** All tasks in `TASKS.md` complete except PF-021 (admin auth Worker deployment pending owner action).

---

## 2026-11-11 — PF-019/PF-029: Phase 1 i18n live routes (hi, es, de, fr), symmetric hreflang graph, and i18n sitemap

**Tasks:** PF-019 and PF-029 enhanced to live operational state.
**Did:**
1. Created `src/pages/[lang]/tools/[toolSlug].astro` dynamic multi-lingual route rendering localized tools with ToolDesk, ToolSeoArticle, and schema.org JSON-LD graphs.
2. Deployed Phase 1 localized tool records in `content/i18n/`:
   - `content/i18n/hi/tools/exif_strip.json` (Hindi)
   - `content/i18n/es/tools/exif_strip.json` (Spanish)
   - `content/i18n/de/tools/exif_strip.json` (German)
   - `content/i18n/fr/tools/exif_strip.json` (French)
3. Implemented symmetric hreflang graph: `getToolTranslations()` in `src/lib/cms.ts` populates matching `<link rel="alternate">` tags linking English (`x-default` & `en`), Hindi, Spanish, German, and French bidirectionally without orphan pages.
4. Created `src/pages/sitemaps/i18n.xml.ts` and wired into the root `sitemapindex` at `/sitemap.xml`.
**Proved by:** `npm test && npm run build` (193 static assets/pages compiled in 2.73s, verified symmetric hreflang in `dist/tools/exif-strip/index.html` and `dist/hi/tools/exif-strip/index.html`).
**Next:** Complete test suite and audit pass.

---

## 2026-11-11 — PF-025 & PF-019: Per-collection sitemaps with Git dates, OG image generator, and Astro i18n

**Tasks:** PF-025 and PF-019 marked done.
**Did:**
1. Built per-collection sitemaps (`/sitemaps/tools.xml`, `/sitemaps/presets.xml`, `/sitemaps/blog.xml`, `/sitemaps/glossary.xml`, `/sitemaps/pages.xml`) and index at `/sitemap.xml` & `/sitemap-index.xml`.
2. Created `src/lib/git-dates.ts` querying git commit history once in batch to assign real Git ISO commit dates to every `<lastmod>` tag (omitting ignored priority/changefreq per plan §6).
3. Created `scripts/og-images.mjs` generating 1200x630 SVG open graph social cards in `public/og/` (72 tools + 6 guides) with zero-upload guarantee badges and paper texture; integrated with prebuild.
4. Configured Astro 7 i18n scaffolding in `astro.config.mjs` (`defaultLocale: en`, `prefixDefaultLocale: false`).
**Proved by:** `npm test && npm run build` (183 pages exported clean in 2.69s, verified `dist/sitemap.xml` sitemapindex and `dist/sitemaps/tools.xml`).
**Next:** All TASKS.md tasks (PF-001 through PF-035) complete except PF-021 awaiting owner auth Worker deploy.

---

## 2026-11-11 — PF-029: i18n architecture, hreflang graph, and Cloudflare 20k-file budget math

**Tasks:** PF-029 marked done.
**Did:**
1. Authored `docs/architecture/i18n-budget-and-structure.md`: Proved Cloudflare Pages 20k deployment file budget math across 25 locales (Phase 1 consumes 4,820 files = 24.1% of budget, leaving 15,180 files headroom); specified path prefixes (`/[lang]/tools/[slug]/`), provenance schema (`translation_of`, `reviewed_by`), and symmetric hreflang graph rules.
2. Updated `src/layouts/Base.astro` with `alternateLinks` prop rendering canonical `x-default` and locale alternates in `<head>`.
3. Enriched `src/pages/tools/[toolSlug].astro` with automatic hreflang links (`x-default` and `en`).
**Proved by:** `npm test && npm run build` (183 pages built in 2.44s, verified `<link rel="alternate" hreflang="x-default" ...>` in `dist/tools/exif-strip/index.html`).
**Next:** Verify remaining tasks board.

---

## 2026-11-11 — PF-028: Social distribution layer & zero-tracker ShareRow

**Tasks:** PF-028 marked done.
**Did:**
1. Built `src/components/ShareRow.astro`: Plain link sharing (Copy link with native clipboard API, 𝕏, WhatsApp, LinkedIn, Reddit, Email) ensuring zero external tracking scripts and total privacy guarantee.
2. Added `social` frontmatter blocks with hook, proof, hashtags, clip reference, and channels across 8 flagship tools (`exif_strip`, `passport_photo`, `image_compress`, `pdf_redact`, `file_encrypt`, `clean_paste`, `w9_prep`, `pdf_merge`).
3. Created `scripts/generate-social-queue.mjs` and generated `docs/social-queue.md` featuring multi-channel drafted posts for the repeatable "Photo & Document Secrets" series.
4. Integrated `ShareRow` into `ToolSeoArticle.astro`, blog articles, and glossary pages.
**Proved by:** `npm test && npm run build` (183/183 pages exported clean in 3.2s, 0 errors, 72/72 smoke tests pass).
**Next:** PF-029 (i18n preparation & URL structure).

---

## 2026-11-11 — PF-031: Port DocSet Ad System (DEC-007, zero-CLS, adBudget, GoogleAdSense)

**Tasks:** PF-031 and PF-013 marked done.
**Did:**
1. Created `src/config/ads.ts`: Publisher config (`ca-pub-2707121635941418`), `enabled: false` (ad-free launch sequence per plan §10), per-page budget limits (4 tool / 3 template / 3 blog / 2 glossary), and slot configurations.
2. Created `src/components/GoogleAdSense.astro`: DNS preconnects for `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`; single script loader in root layout; sets `window.__adsenseLoaded` for blocker detection.
3. Created `src/components/AdSlot.astro`: Zero-CLS reserved min-heights, per-page seat reservation with budget caps, IntersectionObserver lazy load (200px margin), MutationObserver unfilled collapse with `privacyfold:ad_status` custom event telemetry, and clean ad-free placeholder mode.
4. Integrated into layouts & routes: Wired `GoogleAdSense` in `src/layouts/Base.astro`; replaced legacy units with `AdSlot` in `ToolSeoArticle.astro`, blog, and glossary routes; passed `pageType` to enforce budget boundaries.
5. Added honest copy to `ToolSeoArticle.astro` and verified `public/privacy/index.html`: "Your file is processed 100% locally in your browser memory and is never uploaded. This page contains advertisements served by Google AdSense."
6. Updated `public/_headers`: Configured Content-Security-Policy to allowlist AdSense scripts, frames, images, and connections.
**Proved by:** `npm test` (agent-status, smoke-test 72/72, check-cms-drift, check-content 0 errors) and `npm run build` (183/183 static pages exported in 2.57s).
**Next:** Check remaining tasks in `docs/agent/TASKS.md` (PF-028 social layer, PF-029 i18n).

---

## 2026-11-11 — PF-035: Sveltia CMS Editor Sugar (DEC-012)

**Tasks:** PF-035 marked done.
**Did:**
1. Created `public/admin/admin.js`: slug auto-generation from tool name input, and `preSave` formative warning hooks alerting editors if a preset lacks an HTTPS `source_url` or if a tool answer block is shorter than 40 words.
2. Verified DEC-012 compliance: no auto-stamping of verified dates or status flags (provenance remains human and honest).
3. Connected `/admin/admin.js` to `public/admin/index.html`.
**Proved by:** `node scripts/check-cms-drift.mjs` (0 errors).
**Next:** PF-031 (port DocSet ad system).

---

## 2026-11-11 — PF-023: Trust & depth content (about, contact, and 15 technical glossary entries)

**Tasks:** PF-023 marked done.
**Did:**
1. Created 15 technical glossary entries (`content/glossary/*.md`) covering EXIF, WebAssembly, WebCrypto, AES-256-GCM, PBKDF2, ICAO 9303, OPFS, Zero-Knowledge, MozJPEG, PDF Content Stream, Zero-Width Characters, UTM Parameters, WCAG, WebGPU, and Model Context Protocol.
2. Built `src/pages/glossary/index.astro` and `src/pages/glossary/[slug].astro` rendering `DefinedTerm` schema.org JSON-LD graph, common aliases, verified stamps, and bi-directional links to related tools.
3. Updated `src/content.config.ts`, `src/lib/cms.ts`, `src/pages/sitemap.xml.ts`, `scripts/validate-git-cms.mjs`, `scripts/check-content.mjs`, and `scripts/agent-status.mjs`.
4. Verified: 183 static pages exported cleanly in 2.48s (72 tools, 87 presets, 6 blog guides, 15 glossary terms, 4 trust/legal pages, desk, and XML sitemap).
**Proved by:** `npm test && npm run build` (0 errors, 183 pages clean, agent-status P0 clear).
**Next:** PF-035 (Sveltia JS-API sugar), PF-031 (port DocSet ad system).

---

## 2026-11-11 — PF-002: Complete Astro 7 + Tailwind v4 Migration & Next.js purged

**Tasks:** PF-002 marked done.
**Did:**
1. Root Astro 7 scaffolding: Configured `astro.config.mjs` (static output), `@tailwindcss/vite` + Tailwind v4 in `src/styles/global.css`, `tsconfig.json`, and root `package.json`.
2. Content & Public consolidation: Consolidated `content/` (72 tools, 87 presets, 6 blog, 9 engine, 5 templates), `public/` (Sveltia CMS in `/admin/`, 15 WASM binaries in `/wasm/`, self-hosted woff2 fonts in `/fonts/`, legal pages, manifests, and `app-runtime.js`), and `packages/mcp-server` directly at repository root.
3. Content Collections & Schema validation: Configured `src/content.config.ts` (Astro Content Layer with glob loaders and Zod schemas) and typed CMS loader `src/lib/cms.ts`.
4. Layouts and components: Built `src/layouts/Base.astro`, `src/components/ToolDesk.astro` (mounting full atelier desk UI and vanilla `app-runtime.js`), `src/components/ToolSeoArticle.astro` (10 technical blocks + schema.org JSON-LD), and `src/components/AdSenseUnit.astro`.
5. Pages & Endpoints: Implemented `/index.astro` (Desk), `/tools/[toolSlug].astro` (all 72 tools), `/tools/[toolSlug]/[presetSlug].astro` (all 87 presets), `/blog/index.astro`, `/blog/[slug].astro`, and `/sitemap.xml.ts`.
6. Purged Next.js: Removed `privacyfold-nextjs/` completely from Git and disk.
7. CI & Scripts aligned: Updated `.github/workflows/ci.yml`, `scripts/agent-status.mjs`, `scripts/smoke-test.mjs`, `scripts/check-content.mjs`, `scripts/check-cms-drift.mjs`, and `scripts/build.mjs`.
**Proved by:** `npm test` (agent-status P0 clear, smoke-test 72/72 passed, check-cms-drift clean, check-content 0 errors) and `npm run build` (167 static pages compiled in 2.65s).
**Next:** PF-035 (Sveltia JS-API sugar), PF-031 (port DocSet ad system).

---

## 2026-11-11 — Launch gate clear (PF-020): smoke tests, dist builder, error boundaries, preset QA, self-hosted CMS, CI checks

**Tasks:** PF-011, PF-012, PF-016, PF-017, PF-020, PF-025, PF-026, PF-027, PF-030, PF-032, PF-034 marked done.
**Did:**
1. Tool smoke test suite (PF-011): `scripts/smoke-test.mjs` exercises all 72 tools via `window.privacyfold.run`; verifies honest errors, no fabrications, and telemetry/result contracts.
2. Dist builder & sync (PF-012): `scripts/build.mjs` compiles `dist/index.html` deterministically from `app-runtime.js` with `--check` verification in CI.
3. Observability & error boundary (PF-016): Added React `error.tsx` & `global-error.tsx`, runtime unhandled error listeners, and cookieless `tool_used` custom event dispatch (strictly zero params, zero file data).
4. Preset QA pass (PF-017): Verified 87/87 presets against official government/standard `source_url`s, fixed 4 slug titles, generated rich descriptions, updated `PRESET_RECORDS` in `app-runtime.js` (87/87 active).
5. Self-hosted Sveltia CMS bundle (PF-032): Downloaded `public/admin/cms.js` (2.45 MB), pinned with SRI SHA-384, added scoped `/admin*` CSP to `_headers`, confirmed `robots.txt` disallows `/admin/`, created `scripts/check-cms-drift.mjs`.
6. Content & CI quality audit (PF-026): `scripts/check-content.mjs` validates schema.org JSON-LD for all 72 tools, preset staleness, image size budgets (<300KB), and headers.
7. Engine loader & receipts (PF-034): Enhanced `opfs-loader.ts` with cache-first OPFS loading, SRI hash verification on load, and deterministic engine receipts on `window.__PRIVACYFOLD_RESULT__`.
8. Crawlers, CI workflow & build endpoints (PF-025, PF-027, PF-030): Purpose-based `robots.txt`, auto-compiled `/tools.json` and `/presets.json`, and `.github/workflows/ci.yml`.
9. Launch gate verified (PF-020): All pre-launch checks passing clean.
**Proved by:** `node scripts/agent-status.mjs && node scripts/build.mjs --check && node scripts/smoke-test.mjs && node scripts/check-cms-drift.mjs && node scripts/check-content.mjs` (all exit code 0); `cd privacyfold-nextjs && npm run build` (172/172 SSG clean).
**Next:** PF-002 (Astro 7 migration), PF-021 (admin auth Worker deployment by owner), PF-022 (flagship tool guides).

---

## 2026-11-10 — all 5 P0 blockers cleared; build passing 172/172 pages; 72 tools live; honesty restored

**Tasks:** PF-003, PF-004, PF-005, PF-007, PF-008, PF-009, PF-010, PF-014, PF-015, PF-018, PF-033 marked done.
**Did:**
1. Fabricating output stopped (PF-005): `pdf_compress` returns honest error instead of dummy stub; `ocr_scan` extracts real amounts/dates & avoids Acme stub; `voice_transcribe` errors on empty input.
2. Content model enriched (PF-003): all 72 `content/tools/*.json` updated with schema fields (`fam, task, glyph, desc, accepts, tag, std, wasmModule`), `seo.steps`, normalized faqs.
3. 8 shelf tools implemented (PF-004): WebCrypto `file_encrypt`, canvas `signature_clean`, `heic_to_jpg`, `w9_prep`, `sa100_prep`, `pdf_merge`, `pdf_split`, `pdf_redact` all marked `live: true` in runtime (72/72 live).
4. Count drift killed (PF-010): unified count 72 across layout, site.json, llms.txt, _index.json, mcp.json, packages/mcp-server, runtime.
5. WASM binaries deployed (PF-033): Wave-1 binaries under `/wasm/**` (`mozjpeg`, `webp`, `avif`, `png`, `sql`).
6. Fonts self-hosted (PF-008): latin woff2 in `/fonts/`, removed Google Fonts CDN from layout & CSP.
7. Fake Ed25519 signatures removed (PF-009): purged fake `.sig`, fake pinned pubkey & unconditional verified flag.
8. Launch surface shipped (PF-007/014/015/018): privacy policy, terms, ads.txt, service worker, favicon.ico, og.png, LICENSE (MIT+CC-BY-4.0), .gitignore.
9. Next.js build fixed: removed dead scaffolding route `[slug]`, static export builds 172/172 pages cleanly.
**Proved by:** `node scripts/agent-status.mjs --write` (VERDICT: P0 clear, exit code 0); `cd privacyfold-nextjs && npm run build` (exit code 0, 172/172 pages generated).
**Next:** PF-002 (Astro 7 migration per DEC-001/004), PF-011 (Playwright smoke test suite).

---

## 2026-11-10 — compute plan finalised (DEC-009/010/011), CMS full taxonomy registered, Sveltia API policy (DEC-012)

**Tasks:** PF-006 superseded→PF-033; new PF-033/034/035; PF-004 re-scoped (stage-real, not strip).
**Did:** owner directives landed: (1) real self-hosted WASM — engine registry `content/engine/` as the 9th collection; wave table drafted (Wave 1 @jsquash/sql.js/tesseract/pdfium/libheif → Wave 2 ONNX packs → Wave 3 compile-the-gap). (2) runtime compared with dated evidence (localmodel.run HF-measured sizes, localmode.dev, pinggy.io, LlamaWeb paper) → **Transformers.js primary; window.ai Tier-B; wllama deferred** (nothing needs GGUF; per-path COOP/COEP beats sitewide). (3) max-tools: live-count read from generated registry; catalogue grows via draft intake. (4) CMS made additive: 9 collections in config.yml (glossary/compare/authors/engines added), reserved namespaces for future ones; DEC-012 adopts Sveltia JS-API selectively (slug transform, preview pointer, warning hooks) and bans auto-stamping verified dates.
**Proved by:** `docs/plans/engines-and-models.md` (arbitration record), config.yml = 9 collections (grep), DECISIONS.md DEC-009..012, TASKS rows, STATE architecture + open-questions updated.
**Next:** critical path unchanged — PF-002 Astro scaffold, PF-003 schema migration; PF-033 lands engines in parallel.

---

## 2026-11-10 — admin auth implemented (DEC-008), CMS scaffold shipped

**Tasks:** PF-021 doing; new PF-032.
**Did:** wrote `public/admin/index.html` + `public/admin/config.yml` (Tools/Presets/Guides/Pages/Site-settings collections incl. the ads-slots block for DEC-007), and `docs/ops/admin-auth.md` (auth chain, threat model, exact setup). DEC-008 recorded: GitHub OAuth via the official sveltia-cms-auth Worker (client secret server-side) + Cloudflare Access on `/admin`; raw-PAT daily path rejected; editorial workflow + branch protection are the containment.
**Proved by:** files in tree; sveltia/sveltia-cms-auth README flow verified via web check (2026-11-10).
**Next (owner):** deploy the auth Worker + GitHub OAuth app + CF Access (`docs/ops/admin-auth.md` steps 1–5), then replace the `base_url` placeholder.

---

## 2026-11-10 — ads system decided (DEC-007 = DocSet port) + Sveltia setup spec

**Tasks:** PF-024 superseded→PF-031; new PF-031.
**Did:** read the DocSet ad implementation (AdSlot/adBudget/GoogleAdSense/ToolRunner/sticky+processing components, ads.txt) and distilled to `docs/plans/docset-ads-implementation.md`. User decision recorded as DEC-007: PrivacyFold uses the DocSet ad system including tool pages, amending DEC-005's toolPages:false. Wrote `docs/plans/sveltia-cms-setup.md` (admin files, edit flow for content/tools, token vs OAuth login, starter config.yml for the 8 collections, single-`<slug>.md` recommendation for PF-003).
**Proved by:** docs present in tree; commit below.
**Next:** PF-031 ports the ad system after the Astro shell; CMS single-file schema decision rides PF-003.

---

## 2026-11-10 — founder blueprint adopted (DEC-004/005/006), board extended to PF-030

**Tasks:** PF-002/PF-003 notes re-scoped; new PF-021…PF-030; PF-013 superseded by DEC-005 sequence.
**Did:** imported the founder doc "Content, SEO and Ads Foundation" verbatim as `docs/plans/content-seo-ads-foundation-2026-11-10.md`; recorded DEC-004 (Astro collections + Sveltia + one-record-drives-everything), DEC-005 (ads on content pages only, AdSlot gates, CMP), DEC-006 (no rating markup, honest AEO policy). STATE architecture + open questions updated (training-crawler decision now OPEN with owner).
**Proved by:** git diff of docs/agent/*; plan file present at `docs/plans/` (byte-copy of the pasted source).
**Next:** PF-002 PF-003 remain the critical path; PF-025 (generated registries) resolves the drift blocker together with PF-010.
**Note:** the plan's §12 CI checks list was referenced but not included in the pasted copy — PF-026 enumerates the checks from the doc's own references; confirm the original list when it surfaces.

---

## 2026-11-10 — audit + memory system + framework decision

**Tasks:** PF-001 (partial), PF-002 (decided, DEC-001), PF-003..PF-006 scoped in TASKS.md.
**Did:**
- Full read of docs, content CMS, runtime, Next app; probe builds and live browser probes → wrote `docs/agent/AUDIT-2026-11-10.md`.
- Verified: `npm run build` fails twice (missing `@/lib/cms`; then prerender `undefined.toLowerCase()` — content JSONs lack `fam/task/…` and `seo.steps` in 72/72).
- Verified: Next route shell renders an empty div; `app-runtime.js` boots to nothing (`window.privacyfold` undefined) — Next port never connected.
- Verified: 0 `.wasm` files vs 13 referenced paths; `pdf_compress` → 431-B stub PDF; `ocr_scan` fabricates "Acme Global Ltd."/"$6,050.00"; 8 tools sold but `live:false`.
- Verified: only third-party request is Google Fonts; no privacy/terms/ads.txt/LICENSE/CI; git had 1 commit, 388 product files untracked.
- Created repo memory system (`docs/agent/*` + `AGENTS.md` + `scripts/agent-status.mjs`) and DEC-001 (Astro 7 + Tailwind v4 on CF Pages), DEC-002 (vanilla runtime, islands per tool), DEC-003 (launch gate).
**Proved by:** `node scripts/agent-status.mjs` (exit 1, 5 blockers → `docs/agent/SNAPSHOT.txt`); probe outputs recorded with exact strings in the audit.
**Next:** PF-001 finish (commit + push + lockfile), then PF-002 Astro scaffold.
**Blocker:** none technical for PF-001; owner decision still open on 8 dead tools (PF-004) and AdSense (PF-013).
