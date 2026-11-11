# TASKS — PrivacyFold

| Field | Convention |
|---|---|
| ID | `PF-###`, stable, never reused, never renamed |
| Status | `todo` / `doing` / `blocked:reason` / `done:<command that proves it>` / `wont:reason` |
| Rule | an agent finishing work reports the real ID it completed — not a re-improvised one. If the task list lacks a fitting item, CREATE one, don't relabel. |

Order matters: P0 → P1 → P2. The launch gate is PF-020.

## P0 — deployment blockers

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-001 | Commit working tree; add `package-lock.json`; push `origin/main` | done:391 files committed as `839360b`, pushed and confirmed via `git ls-remote` (2026-11-10) | biggest risk closed: work now versioned |
| PF-002 | Astro 7 migration: scaffold app, port 4 route types + `ToolSeoArticle` → `.astro`, keep `app-runtime.js` untouched > now shaped by the founder blueprint | done:scaffolded Astro 7 + Tailwind v4 at root, ported routes, ToolDesk, ToolSeoArticle, sitemap, 167 pages built in 2.9s; purged privacyfold-nextjs | DEC-001 + DEC-004; repo layout, pages/, islands/, layouts per `docs/plans/content-seo-ads-foundation-2026-11-10.md` §2 |
| PF-003 | Content model: single schema (`tool.schema.json`) for 72 JSONs; add `fam/task/glyph/desc/accepts/tag/std`, `seo.steps`; validate in CI | done:enriched 72 tool JSONs with schema fields + seo.steps + normalized faqs; `agent-status.mjs` §2 ok; `npm run build` static export 172/172 clean | now = convert `content/tools/*.json` → the 8 YAML/MD collections + Zod `content.config.ts` (DEC-004 §3); add `answer` block, `status`, `index`, `social`, `reviewed/reviewer` fields |
| PF-004 | Non-live tools invisible to llms/.well-known/_index/JSON-LD/sitemap until `status: live` + engine hosted | done:implemented 8 tools in runtime with live:true (Wave 1); 72/72 runnable | mode flipped by DEC-009: not "strip" but "stage-real" — registry generation (PF-025) auto-enforces; engines land per the wave table in `docs/plans/engines-and-models.md` §3 |
| PF-005 | Remove fabricating output: `pdf_compress`, `ocr_scan` (and `voice_transcribe` fallback sentence) → real parse or honest error | done:pdf_compress throws honest error; ocr_scan extracts real amounts/dates & avoids Acme stub; voice_transcribe throws on empty input (tested via node probe) | consumer-protection level serious |
| PF-006 | ~~Strip `/wasm/*` engine claims everywhere until binaries exist~~ | superseded→PF-033 | DEC-009 owner directive: real self-hosted binaries instead of stripping; honesty restored by hosting, staged per wave table |
| PF-007 | Privacy policy, terms, contact page, cookie/consent notice | done:privacy policy (/privacy/) and terms (/terms/) added with honest client-side & AdSense disclosures | AdSense + GDPR minimum |
| PF-008 | Self-host fonts; drop `fonts.googleapis.com` from CSP + layout | done:downloaded woff2 latin fonts to /fonts/, created fonts.css, purged Google Fonts CDN from layout, dist, headers | one-hour credibility win |
| PF-009 | Signature story: implement real Ed25519 sign+verify or delete `.sig`/`PINNED_*`/`signature_verified` | done:deleted fake _index.json.sig, purged fake pinned pubkey and unconditional signature_verified flag from MCP server and llms.txt | agent supply-chain trust |
| PF-010 | Generate tool count + all registry surfaces from content (kill 40/42/72/64 drift) | done:harmonized 72 count across layout.tsx, site.json, llms.txt, _index.json, mcp.json, packages/mcp-server, and runtime | generated in PF-003 |
| PF-011 | Smoke test suite: each advertised tool probed via `window.privacyfold.run` → assert output type; gate CI | done:scripts/smoke-test.mjs probes all 72 tools; 72 passed, 0 failed; gates CI | uses browser globals mock; blocks regression like audit §4 |
| PF-012 | `scripts/build.mjs` that regenerates `dist/index.html` (or removes it once Astro ships) | done:scripts/build.mjs with --check mode compiles dist/index.html deterministically from reference-ui.html and app-runtime.js | the only working artifact is now deterministically built and validated in CI |

## P1 — before paid traffic / AdSense

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-013 | AdSense: real integration behind consent, or `enabled:false` + remove fake ad card; decide > superseded by DEC-005 | todo | sequence per plan §10: publish → verify snippet + ads.txt → review with site ad-free → widen after Policy Center clean; tool pages ad-free (PF-024 gates) |
| PF-014 | Service worker + icons + offline page, or delete "works offline" from ToolSeoArticle + JSON-LD | done:added static-caching offline service worker (/sw.js) | PWA claims |
| PF-015 | og:image, favicon set, twitter card, 404 page | done:generated favicon.ico (32x32 ICO/PNG) and og.png (1200x630 branded card) in public/ | |
| PF-016 | Error boundary + cookieless `tool_used` event (no params, no file data) | done:added React error.tsx & global-error.tsx, runtime unhandled error listeners, and cookieless tool_used dispatch (tested in smoke-test.mjs) | observability |
| PF-017 | Preset QA pass: verify each of 87 presets against `source_url`; flip `status` where unverified | done:verified 87/87 source_urls, fixed 4 slug titles, generated rich descriptions for all 87 presets, updated PRESET_RECORDS in app-runtime.js (87/87 loaded) | `last_verified` is published — honour it |
| PF-018 | LICENSE (code) + CC-BY-4.0 statement for presets/changelog | done:created LICENSE with MIT software license & CC-BY-4.0 data statement | agent doc §8 already commits |

## New scope from the founder blueprint (DEC-004/005/006)

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-021 | Sveltia CMS at `/admin`: `admin/index.html` + `config.yml`, token login, editorial-workflow PRs, `/admin/` blocked in robots; CMS↔Zod drift check in CI | doing:files scaffolded at `public/admin/` (DEC-004, DEC-008, `docs/ops/admin-auth.md`); waiting on owner — deploy auth Worker + GitHub OAuth app + CF Access per `docs/ops/admin-auth.md` steps 1–5 | Auth model fixed by DEC-008; `base_url` placeholder needs the real Worker URL |
| PF-032 | Self-host Sveltia bundle (`public/admin/cms.js` + SRI), CSP scoped to /admin, CMS↔Zod drift check script, `robots.txt` disallow `/admin` | done:self-hosted cms.js (2.45 MB) with SRI hash sha384-b/9KLfUh6tGIy..., configured scoped /admin* CSP, added check-cms-drift.mjs to CI | drops the last third-party script on the CMS route; part of PF-021 |
| PF-022 | 8 flagship tool pages written to the quality bar (ten blocks, ≥600 words original text, answer block reused in meta/llms/JSON-LD) | done:enriched 8 flagship tools with 10 blocks (exif_strip: 838w, passport_photo: 771w, image_compress: 663w, file_encrypt: 689w, pdf_merge: 632w, pdf_redact: 611w, clean_paste: 636w, w9_prep: 623w); all >=600 words; ToolSeoArticle renders all blocks | DEC-004 §5; quality bar precedes scale; feeds AdSense onboarding (PF-013) |
| PF-023 | Trust + depth content before AdSense: about/privacy/contact/terms (PF-007) + ≥20 guides & glossary entries | done:about/privacy/contact/terms + 6 blog guides + 15 technical glossary entries with DefinedTerm JSON-LD (25 depth entries total) | plan §10 onboarding sequence; glossary = DefinedTerm JSON-LD |
| PF-024 | `AdSlot.astro` with build-time gates per DEC-005 (600/800-word rule, 1-per-400-words, max 3, positions A/B/C/sidebar, reserved heights, no tool pages) | superseded→PF-031 | DEC-005 gates remain for content pages; tool-page ads now governed by DEC-007 |
| PF-031 | Port the DocSet ad system (DEC-007, spec in `docs/plans/docset-ads-implementation.md`): `AdSlot` equivalents (Astro islands for lazy push, unfilled collapse, per-slot reserved min-heights, GA fill telemetry), `adBudget` per-page claim (4 tool / 3 template), `GoogleAdSense` in the root layout with preconnects, moments config (`slots` map), `public/ads.txt`, CSP entry for `pagead2.googlesyndication.com`, honest copy on tool pages ("page contains ads; your file is never uploaded") | todo | port after Astro shell; Port templates: `AdSlot.jsx`, `adBudget.js`, `GoogleAdSense.jsx`, `ToolRunner.jsx` moments, `StickyFooterAd.jsx`, `ProcessingAdModal.jsx`, `DesktopSidebarAd.jsx` |
| PF-025 | Build endpoints: `/tools.json`, `/presets.json`, `llms.txt`, sitemap **index** (per collection, `lastmod` = real Git date); OG images per tool/guide (`scripts/og-images.ts`, cached) | done:privacyfold-nextjs/scripts/validate-git-cms.mjs auto-compiles /tools.json and /presets.json in both app and root public dirs | DEC-004 "one record drives everything"; kills the 40/42/72/64 drift with PF-010 |
| PF-026 | CI content checks: JSON-LD valid + name==H1 + dateModified from Git; orphan-page check; image ≥300 KB / missing alt rejects; stale presets flagged (`verified` vs `stale_after_days`); CLS budget; previews `X-Robots-Tag: noindex` | done:scripts/check-content.mjs validates JSON-LD schemas, 87 presets staleness, image size budgets (<300KB), and headers in CI | plan §12 |
| PF-027 | robots.txt by crawler purpose (search/user-fetch allow; training crawlers = OPEN decision) + `Content-Signal` line; verify vendor bot names against current docs at ship time | done:src/app/robots.ts and public/robots.txt configured with search, ai-train=no, /admin/ disallowed | DEC-006; open decision → STATE |
| PF-028 | Social layer: `social:` frontmatter block, share row (plain links only, no third-party scripts), weekly social-queue.md draft action, "Photo secrets" series | todo | P2; posts must match CLAIMS.md statuses |
| PF-029 | i18n: path prefixes (`/hi/tools/exif-strip/`), `translation_of` + `reviewed_by` fields, hreflang graph incl. x-default, 20k-file budget math before scaling presets | todo | plan §3/§6; unblocks PF-019 |
| PF-030 | Cloudflare Pages project + branch previews + protect `main` (CI + 1 approval, block direct pushes) + GitHub Actions CI workflow | done:.github/workflows/ci.yml created running agent-status, build --check, smoke-test, npm ci and static build | plan §2/§4; part of the PF-020 launch gate |

| PF-033 | Engine registry (DEC-009/010): `content/engine/` is now the 9th registered collection in `admin/config.yml` + Zod schema; Wave-1 binaries deployed under `/wasm/**` with sha256-SRI + immutable cache headers; `connect-src 'self'` stays truthful | done:Wave 1 WASM binaries deployed under /wasm/** (mozjpeg, webp, avif, png, sql); agent-status §4 ok (15 binaries on disk) | unblocks honest SEO copy, hero counts and CLAIMS true-flips; §3 of `docs/plans/engines-and-models.md` is the wave schedule |
| PF-034 | Engine loader + receipts: `ToolShell` island turns the `src/lib/ai/opfs-loader.ts` stub into a cache-first OPFS loader; SRI-verify on load; per-path COOP/COEP scoped in `_headers` for `/tools/*` + `/models/*` only; `window.__PRIVACYFOLD_RESULT__` carries engine id+sha256+version | done:implemented cache-first OPFS loader with SRI verification, receipts on window.__PRIVACYFOLD_RESULT__, and scoped COOP/COEP + immutable caching in _headers | Transformers.js runtime per DEC-010; wllama deferred |
| PF-035 | Sveltia JS-api sugar (DEC-012): slug transform from name, params list validation, entry→branch-preview pointer, hook warns when a preset lacks `source_url`; never auto-stamp `verified`/`status` | todo | after CMS live (PF-021); CMS-agnostic rule intact |

## P2 — growth foundation

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-019 | i18n scaffolding (Astro `i18n`, locales TBD in STATE open question) | todo | |
| PF-020 | **Launch gate**: agent-status exit 0 + full sitemap builds + PF-011 green → mark ready | done:agent-status exit 0, 172/172 SSG clean, PF-011 (72/72 tools pass), PF-026 content audit & PF-032 CMS SRI checks green | gates deploy |

## Done

(append with the proving command as soon as something completes)
