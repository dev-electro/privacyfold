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
| PF-002 | Astro 7 migration: scaffold app, port 4 route types + `ToolSeoArticle` → `.astro`, keep `app-runtime.js` untouched > now shaped by the founder blueprint | todo | DEC-001 + DEC-004; repo layout, pages/, islands/, layouts per `docs/plans/content-seo-ads-foundation-2026-11-10.md` §2; ~1–2 d |
| PF-003 | Content model: single schema (`tool.schema.json`) for 72 JSONs; add `fam/task/glyph/desc/accepts/tag/std`, `seo.steps`; validate in CI | todo | now = convert `content/tools/*.json` → the 8 YAML/MD collections + Zod `content.config.ts` (DEC-004 §3); add `answer` block, `status`, `index`, `social`, `reviewed/reviewer` fields |
| PF-004 | Mark 8 unimplemented tools `live:false` + hide from llms/.well-known/_index/JSON-LD/sitemap | todo | honesty filter is generated, not hand-edited |
| PF-005 | Remove fabricating output: `pdf_compress`, `ocr_scan` (and `voice_transcribe` fallback sentence) → real parse or honest error | todo | consumer-protection level serious |
| PF-006 | Strip `/wasm/*` engine claims everywhere until binaries exist | todo | 13 referenced paths, 0 files |
| PF-007 | Privacy policy, terms, contact page, cookie/consent notice | todo | AdSense + GDPR minimum |
| PF-008 | Self-host fonts; drop `fonts.googleapis.com` from CSP + layout | todo | one-hour credibility win |
| PF-009 | Signature story: implement real Ed25519 sign+verify or delete `.sig`/`PINNED_*`/`signature_verified` | todo | agent supply-chain trust |
| PF-010 | Generate tool count + all registry surfaces from content (kill 40/42/72/64 drift) | todo | generated in PF-003 |
| PF-011 | Smoke test suite: each advertised tool probed via `window.privacyfold.run` → assert output type; gate CI | todo | uses browser/Playwright; blocks regression like audit §4 |
| PF-012 | `scripts/build.mjs` that regenerates `dist/index.html` (or removes it once Astro ships) | todo | the only working artifact is currently hand-maintained |

## P1 — before paid traffic / AdSense

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-013 | AdSense: real integration behind consent, or `enabled:false` + remove fake ad card; decide > superseded by DEC-005 | todo | sequence per plan §10: publish → verify snippet + ads.txt → review with site ad-free → widen after Policy Center clean; tool pages ad-free (PF-024 gates) |
| PF-014 | Service worker + icons + offline page, or delete "works offline" from ToolSeoArticle + JSON-LD | todo | PWA claims |
| PF-015 | og:image, favicon set, twitter card, 404 page | todo | |
| PF-016 | Error boundary + cookieless `tool_used` event (no params, no file data) | todo | observability |
| PF-017 | Preset QA pass: verify each of 87 presets against `source_url`; flip `status` where unverified | todo | `last_verified` is published — honour it |
| PF-018 | LICENSE (code) + CC-BY-4.0 statement for presets/changelog | todo | agent doc §8 already commits |

## New scope from the founder blueprint (DEC-004/005/006)

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-021 | Sveltia CMS at `/admin`: `admin/index.html` + `config.yml`, token login, editorial-workflow PRs, `/admin/` blocked in robots; CMS↔Zod drift check in CI | todo | DEC-004 §4; OAuth client decision deferred until a 2nd editor joins (open question) |
| PF-022 | 8 flagship tool pages written to the quality bar (ten blocks, ≥600 words original text, answer block reused in meta/llms/JSON-LD) | todo | DEC-004 §5; quality bar precedes scale; feeds AdSense onboarding (PF-013) |
| PF-023 | Trust + depth content before AdSense: about/privacy/contact/terms (PF-007) + ≥20 guides & glossary entries | todo | plan §10 onboarding sequence; glossary = DefinedTerm JSON-LD |
| PF-024 | `AdSlot.astro` with build-time gates per DEC-005 (600/800-word rule, 1-per-400-words, max 3, positions A/B/C/sidebar, reserved heights, no tool pages) | todo | DEC-005; auto ads never enabled |
| PF-025 | Build endpoints: `/tools.json`, `/presets.json`, `llms.txt`, sitemap **index** (per collection, `lastmod` = real Git date); OG images per tool/guide (`scripts/og-images.ts`, cached) | todo | DEC-004 "one record drives everything"; kills the 40/42/72/64 drift with PF-010 |
| PF-026 | CI content checks: JSON-LD valid + name==H1 + dateModified from Git; orphan-page check; image ≥300 KB / missing alt rejects; stale presets flagged (`verified` vs `stale_after_days`); CLS budget; previews `X-Robots-Tag: noindex` | todo | plan §12 (not in this repo's copy — items enumerated from §6/§7/§12 references) |
| PF-027 | robots.txt by crawler purpose (search/user-fetch allow; training crawlers = OPEN decision) + `Content-Signal` line; verify vendor bot names against current docs at ship time | todo | DEC-006; open decision → STATE |
| PF-028 | Social layer: `social:` frontmatter block, share row (plain links only, no third-party scripts), weekly social-queue.md draft action, "Photo secrets" series | todo | P2; posts must match CLAIMS.md statuses |
| PF-029 | i18n: path prefixes (`/hi/tools/exif-strip/`), `translation_of` + `reviewed_by` fields, hreflang graph incl. x-default, 20k-file budget math before scaling presets | todo | plan §3/§6; unblocks PF-019 |
| PF-030 | Cloudflare Pages project + branch previews + protect `main` (CI + 1 approval, block direct pushes) + GitHub Actions CI workflow | todo | plan §2/§4; part of the PF-020 launch gate |

## P2 — growth foundation

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-019 | i18n scaffolding (Astro `i18n`, locales TBD in STATE open question) | todo | |
| PF-020 | **Launch gate**: agent-status exit 0 + full sitemap builds + PF-011 green → mark ready | todo | gates deploy |

## Done

(append with the proving command as soon as something completes)
