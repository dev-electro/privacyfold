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
