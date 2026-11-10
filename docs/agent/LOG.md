# LOG — session journal (newest on top)

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
