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
