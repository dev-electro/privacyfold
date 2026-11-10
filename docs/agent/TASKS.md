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
| PF-002 | Astro 7 migration: scaffold app, port 4 route types + `ToolSeoArticle` → `.astro`, keep `app-runtime.js` untouched | todo | DEC-001; ~1–2 d |
| PF-003 | Content model: single schema (`tool.schema.json`) for 72 JSONs; add `fam/task/glyph/desc/accepts/tag/std`, `seo.steps`; validate in CI | todo | unblocks build; required in every stack |
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
| PF-013 | AdSense: real integration behind consent, or `enabled:false` + remove fake ad card; decide | todo | owner: Gaurav |
| PF-014 | Service worker + icons + offline page, or delete "works offline" from ToolSeoArticle + JSON-LD | todo | PWA claims |
| PF-015 | og:image, favicon set, twitter card, 404 page | todo | |
| PF-016 | Error boundary + cookieless `tool_used` event (no params, no file data) | todo | observability |
| PF-017 | Preset QA pass: verify each of 87 presets against `source_url`; flip `status` where unverified | todo | `last_verified` is published — honour it |
| PF-018 | LICENSE (code) + CC-BY-4.0 statement for presets/changelog | todo | agent doc §8 already commits |

## P2 — growth foundation

| ID | Task | Status | Notes |
|---|---|---|---|
| PF-019 | i18n scaffolding (Astro `i18n`, locales TBD in STATE open question) | todo | |
| PF-020 | **Launch gate**: agent-status exit 0 + full sitemap builds + PF-011 green → mark ready | todo | gates deploy |

## Done

(append with the proving command as soon as something completes)
