# DECISIONS — PrivacyFold

Append-only. One entry per decision. Newest last. Never rewrite history — if a decision turns out wrong, add a new id that **supersedes** the old one.

Format:

```
DEC-### | date | title
Decision: ...
Why: ...
Rejected: ...
Evidence/Links: ...
```

---

DEC-001 | 2026-11-10 | Site framework: Astro 7 + Tailwind v4, or stay Next.js
Decision: **Astro 7 (+ Tailwind v4) on Cloudflare Pages.** Next 16 (16.4.6 stable) rejected.
Why:
- Astro was acquired by Cloudflare (Jan 2026); zero-config Pages deploy, native edge adapter. The product's infra doc (`docs/privacyfold-infrastructure.md`) originally specified Astro + Content Collections + Git engine — the Next 15 codebase is a detour that added a second half-built CMS.
- 167 of the launch pages are content (72 tool, 87 preset, 6 blog): Astro ships 0 KB JS on them; Next ships a React bootstrap per page regardless of `output: 'export'`.
- Built-in i18n routing covers the 25-locale roadmap without hand-rolled `[locale]` machinery.
- The interactive runtime (`public/app-runtime.js`) is vanilla and framework-agnostic; only `ToolSeoArticle`, sitemap/robots and 4 route files re-port. Migration does not touch tool logic.
Rejected (Next 16): its advantages (RSC, PPR, Cache Components) are incompatible with a pure static export; heavier pages; manual `fs` loader to maintain; and the existing Next tree does not compile (schema mismatch, dup routes) — so it is not a sunk cost worth defending.
Evidence: `docs/agent/AUDIT-2026-11-10.md` §1–2; `npm view next version` → 16.4.6; `npm view astro version` → 7.4.8 on 2026-11-10; newstack.dev Astro 7 / Next 16 comparison.

DEC-002 | 2026-11-10 | Interactive runtime: vanilla JS retained; framework islands only per-tool, on evidence
Decision: The desk (workspace UI) stays vanilla JS (`app-runtime.js`). Preact/Svelte islands are allowed **per tool** when a tool's client state is too complex to maintain by hand (candidates: resume-builder, invoice-generator, w9-prep). Never for SEO pages.
Why: 62/72 tools are "read input, emit output"; the agent contract (`[data-pf=run]`, `window.__PRIVACYFOLD_RESULT__`) is DOM-based and easier to keep deterministic without hydration; the desk is already built and verified working in `dist/index.html`.
Rejected (React everywhere): framework tax on every page; agent-oriented DOM timing; the 4,478-line vanilla runtime is a working asset.
Rule: adding any island framework requires a DEC entry with the concrete tool and reason.

DEC-003 | 2026-11-10 | Deployment gate: no public launch before P0 clears
Decision: Ship gate = `node scripts/agent-status.mjs` exits 0 (no [BLOCKER]) and `npm run build` in the chosen framework produces every sitemap URL. CI must gate on both.
Why: 2026-11-10 audit found the build failing, fabricating tools (`pdf_compress`, `ocr_scan`), 8 tools sold but unimplemented, and fake registry signatures. Full report: `docs/agent/AUDIT-2026-11-10.md`.
Consequence: task IDs PF-001…PF-020 in `docs/agent/TASKS.md` are the ordered path to the gate.

---

DEC-004 | 2026-11-10 | Editorial platform: one repo, Astro content collections + Sveltia CMS, one record drives everything
Decision: Adopt the founder plan `docs/plans/content-seo-ads-foundation-2026-11-10.md` as the build blueprint. One Astro site, one repo: `content/` (Markdown/YAML, editors touch only this) beside `src/`; 8 typed collections (tools, presets, guides, glossary, compare, authors, pages, i18n) validated by Zod `content.config.ts`; Sveltia CMS at `/admin` (fine-grained GitHub token login until PKCE/OAuth client is decided); every PR goes through CI checks + a Cloudflare Pages preview with `X-Robots-Tag: noindex`; main protected (CI + 1 approval, no direct pushes).
Rule adopted: **one tool record drives everything** — page, JSON-LD, sitemap entry, llms.txt, static JSON API (`/tools.json`, `/presets.json`), MCP manifest, social cards and ad eligibility are all generated from a single `<slug>.yaml`, so a claim can never be typed twice or disagree with itself. This generalises DEC-001's "schema is the single source of truth" into the concrete collection design, and it means `llms.txt`, `_index.json` and `.well-known/mcp.json` must become **build endpoints**, never hand-edited files (supersedes how those three files currently exist in the tree).
Why: the audit's biggest content finding (4 different tool counts, hand-maintained registries) is exactly the failure this prevents structurally rather than by discipline.
Evidence: pasted plan §1–4 (author: Gaurav Suthar, 10 Nov 2026); audit §5.

DEC-005 | 2026-11-10 | Ads vs privacy conflict: ads on content pages ONLY at launch (Option A), tool pages ad-free
Decision: `ads.toolPages: false` at launch. AdSlot.astro renders only when: page `status: live` + `index: true` + reviewed ≤ 12 months; ≥ 600 words original text outside the tool (guides 800); ≤ 1 ad per 400 words, ≤ 3 per page; slot in approved positions A/B/C/sidebar with reserved height. Auto ads OFF permanently (manual units only). No ad inside/near the tool, result screen, download buttons, or within 150 px of any button. Certified CMP required before EEA/UK/CH personalized ads; `public/ads.txt` ships from day one.
Why: resolves the direct conflict between "nothing leaves your device" and third-party ad scripts loading on pages where files are handled. Under Option A the network-proof stays clean on every page that touches user files.
Rejected (B: ads below the tool) — revenue but weakens the core claim; (C: sealed iframe `tool.privacyfold.com`) — strongest claim, revisit when traffic justifies the drag-drop/layout cost.
Evidence: pasted plan §10 (authoritative; quotes AdSense inventory policy + 150 px guidance).

DEC-006 | 2026-11-10 | Structured data + AI-visibility policy: honest entity markup, no rating theatre, no GEO tricks
Decision: JSON-LD limited to Organization, WebSite, BreadcrumbList, Article (+Person author), WebApplication (`offers.price: 0`, applicationCategory, operatingSystem). **No aggregateRating/review until genuine, visible reviews exist** — fake ratings risk a manual action. FAQPage/HowTo are nice-to-have (deprioritised). AEO/GEO = quotable 40–60-word answer block + verifiable `source_url`/`verified` dates + consistent entity (sameAs) + HTML-rendered steps/FAQ — no special tricks, per Google's stated position that AI features need no special markup. llms.txt is generated from the tools collection because it is cheap, not because it is proven.
Why: every fabricated-structured-data failure in the audit (fake ratings would have been next) is pre-empted; keeps the brand's credibility budget spent on verified facts.
Evidence: pasted plan §7–8; audit §5 (fake signature finding as the same disease).

---

DEC-007 | 2026-11-10 | Ads system = the DocSet implementation (supersedes DEC-005's "tool pages ad-free")
Decision: PrivacyFold runs the DocSet ad system as its ad architecture, including on tool pages — this amends DEC-005 in one respect: `ads.toolPages` is not locked false at launch; tool pages get the DocSet-style moments (post-result / mid / below, optional processing-interstitial and mobile sticky footer) on their guarded placements. Everything else in DEC-005 stands.
Spec + source map: `docs/plans/docset-ads-implementation.md` (distilled from `~/Projects/Docset v1` on 2026-11-10). Core: ONE `GoogleAdSense` loader; one `AdSlot` component (variants per format, IntersectionObserver lazy push, `data-ad-status` unfilled collapse, reserved min-heights per slot id = 0 CLS, GA `ad_slot_filled/unfilled` telemetry); per-page `adBudget` claim system (4 max on tool pages, 3 on template pages, first-come-first-served, over-budget renders nothing); single config (`slots` map, publisher id) + `public/ads.txt` from day one.
Governance kept from the plan: manual units only (never auto ads), no ad inside/near the tool-result-download zone, certified CMP before EEA/UK/CH personalised ads, unit formats matched per moment.
Honesty consequence accepted by the owner: with ads on tool pages, the page itself makes ad requests to Google — the claim a visitor must read on tool pages is exactly "your file is never uploaded; this page contains ads". `ToolSeoArticle`, the status bar, and the privacy page must state it; CSP needs an explicit `pagead2.googlesyndication.com` allowlist entry rather than a pretend `'self'`.
Evidence: reading of `AdSlot.jsx`, `adBudget.js`, `GoogleAdSense.jsx`, `ToolRunner.jsx`, `ProcessingAdModal.jsx`, `StickyFooterAd.jsx`, `DesktopSidebarAd.jsx`, `public/ads.txt` in Docset v1 (2026-11-10).

---

DEC-008 | 2026-11-10 | Admin CMS authentication: GitHub OAuth via sveltia-cms-auth Worker + Cloudflare Access gate; never a raw PAT
Decision: `/admin` (Sveltia at `public/admin/`, moves with the Astro app) authenticates through the official `sveltia-cms-auth` Cloudflare Worker — GITHUB_CLIENT_SECRET lives only in the Worker; config.yml carries `base_url` + `auth_endpoint`. Cloudflare Access (Zero Trust, self-hosted app on `/admin*`, email one-time-PIN first) gates the route in front of any CMS code. Editorial workflow already produces branch+PR, so a stolen token cannot bypass review; branch protection on `main` is required for the model to hold.
Why: the founder plan's token-login default puts a repo-write token in localStorage with no expiry; the Worker removes the client secret from the client entirely, and Access adds a bouncer before the login page loads. Threat model and residual risk documented: `docs/ops/admin-auth.md`.
Rejected: raw PAT as daily path (sufficient for a first experiment, unacceptable as the standing control); self-hosted bespoke OAuth server (violates no-Workers-for-visitors spirit for marginal gain — this Worker only runs when an editor signs in).
Evidence: sveltia/sveltia-cms-auth official setup (checked 2026-11-10); `docs/ops/admin-auth.md`; `public/admin/{index.html,config.yml}` scaffold + DEC-004.

---

DEC-009 | 2026-11-10 | WASM: real binaries, self-hosted (owner directive) — supersedes the "strip claims" default stance
Decision: Build PrivacyFold's compute on REAL self-hosted engines. WASM binaries + ONNX model packs are first-class content: a new `engine` collection (`content/engine/<name>.yaml`) registers every engine (id, type wasm/onnx/js, path, sha256-SRI, version, source repo, license, size_kb, tasks). All assets live on our origins (`/wasm/**`, `/models/**`, `/js/lib/**`) with immutable caching, so `connect-src 'self'` stays truthful and no runtime fetch ever leaves our domain.
Staged delivery in `docs/plans/engines-and-models.md` §3: Wave 1 hosts proven binaries that already exist (@jsquash mozjpeg/webp/avif/png, sql-wasm, tesseract-simd, pdfium, libheif) → Wave 2 self-hosts ONNX model packs (Moonshine-tiny, bge-micro, GLiNER, matting SmolLM2-135M) → Wave 3 compiles only what lacks a proven binary. Waves 1–3 cover every catalogued tool's advertised engine with no speculative compiler work.
Why: the audit's worst class of finding (advertised engines that don't exist) is closed by delivery, not by deletion; owner wants max tools with honest capability.
Consequences: `PF-006` (strip claims) is superseded by PF-033 (engine registry + binaries); PF-004's "hide the 8 dead tools" becomes "hide until their engine ships, then flip status: live" — registry-generation logic (PF-025) enforces it automatically.
Owner: Gaurav (directive). Evidence: docs/plans/engines-and-models.md §1–4.

DEC-010 | 2026-11-10 | On-device AI runtime: Transformers.js primary; window.ai Tier-B; wllama deferred (owner directive: host small models)
Decision: `@huggingface/transformers` (ONNX Runtime Web — WebGPU with automatic WASM fallback) is the runtime for every AI tool: ASR (Moonshine/Whisper), embeddings/RAG (bge-micro), PII NER (GLiNER), matting (SelfieSegmenter/BEN-slim), writer fallback (SmolLM2-135M quantised). `window.ai` is the opportunistic 0-MB Tier-B path for writer/summariser on Chromium desktop. wllama (GGUF/llama.cpp) is deferred — no catalogued tool needs GGUF chat; it would sitewide-require COOP/COEP, which our per-path scoping avoids.
Model sourcing: self-hosted mirrors of the ONNX packs under `/models/**` with sha256 receipts recorded per engine record; download sizes fixed per measured evidence (Moonshine-tiny 27–55 MB, bge-micro ~22 MB, GLiNER ~15 MB class).
Why: task coverage (only Transformers.js covers embeddings+ASR+NER+vision in one runtime), graceful WASM fallback = no browser is locked out, self-hosting keeps the CSP privacy story intact. Chat-LLM decode throughput comparisons (LlamaWeb/WebLLM/wllama) favour wllama but are irrelevant to our tool set.
Evidence: docs/plans/engines-and-models.md §1 (localmodel.run HF-API-measured sizes; localmode.dev device/dtype guide; pinggy.io runtime write-up; LlamaWeb arXiv paper) — checked 2026-11-10.

DEC-011 | 2026-11-10 | Tool-count policy: maximise catalogue; public copy reads only the generated live count (owner directive: max tools)
Decision: Target state = every catalogued tool live (catalogue grows via `status: draft` intakes). Public surfaces (hero, meta, llms.txt, `_index.json`, `.well-known/mcp.json`, ads copy) print ONE count — generated from content: `live = tools where status: live AND engine exists in content/engine`; `catalogued = all tool records`. Layout copy becomes "N live tools (M in catalogue)" and always lags reality, never outruns it. Manual counts in `layout.tsx`/`site.json`/`packages/mcp-server` are removed (PF-025/PF-010).
Why: honours both owner directives (max tools + honesty): inventory can scale past 100 without marketing outpacing shipped engines.
Evidence: docs/plans/engines-and-models.md §4.

DEC-012 | 2026-11-10 | Sveltia JS API: adopt selectively as editor-UX sugar; never as a data gate
Decision: From Sveltia's `api.js` examples (demo "API Examples" collection): use custom field types / editor components / string transformations / event hooks where they prevent editor mistakes; do NOT move any content rule into CMS JS. Preview styles/templates: use plain external preview URLs (Cloudflare Pages branch previews), not in-CMS iframes, for v1.
Adopt now: slug auto-generation from `name` (string transformation); `params` validated as a list widget (existing config); preview pointer linking an entry to its branch-preview URL; event hooks limited to formative warnings (e.g. preset missing `source_url`), never to auto-stamping `last_verified`/`status` — stamps stay human, because an auto-stamped "verified" date would be a fabricated provenance claim (the exact audit-disease class).
Why: CMS-agnostic fallback is part of DEC-004 (swap Sveltia → Decap/Keystatic with zero data change); CI + Zod remain the contract. The CMS JS API is conveniences on top, not the source of truth.
Evidence: Sveltia demo API examples (checked 2026-11-10 via demo.sveltia.cms.app).
