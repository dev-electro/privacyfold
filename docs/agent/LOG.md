# LOG — session journal (newest on top)

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
