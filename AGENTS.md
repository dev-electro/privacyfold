# AGENTS.md — PrivacyFold

**Product:** privacyfold.com — client-side file/privacy tools ("file tools that never see your files").
**Stack:** Astro 7 static export + Tailwind v4 + vanilla JS runtime (`public/app-runtime.js`) + Sveltia Git CMS.
**Server:** none, ever. No Workers, no DB, no uploads. Cloudflare Pages static.

Any agent working here — Claude Code, Codex, Cursor, Jules, Hermes, a human new to the repo — starts here.

## First 60 seconds

```bash
node scripts/agent-status.mjs        # <= run this FIRST. ~40 lines of current truth, <1s, exit 1 on blockers
cat docs/agent/STATE.md              # what is real vs. claimed right now
cat docs/agent/TASKS.md              # the board; do work under an existing ID, never relabel one
```

If `agent-status` output contradicts `STATE.md`, **the script wins**: fix `STATE.md` and log what changed.

## Hard rules

1. **Privacy is a technical guarantee, not a slogan.** No network request may carry user file/text data. No new third-party script without a decision record (`docs/agent/DECISIONS.md`). Every dependency added must be imported somewhere or removed.
2. **A claim a user can read must have an implementation a test can check.** If you can't make it true, make the copy false (remove the claim) — never the reverse. This is project law; see `docs/agent/CLAIMS.md`.
3. **Never invent output.** A tool that cannot parse input must return an error, not fabricated fields. (Audited: `pdf_compress` returning a stub PDF and `ocr_scan` printing "Acme Global Ltd." are bugs from violating exactly this.)
4. **Mark work with real IDs.** `docs/agent/TASKS.md` has stable IDs (`PF-xxx`). Report those. Do not create parallel task nomenclature.
5. **No secrets in code**, no `.env` files committed, no credential files read or printed.
6. **Commit discipline:** explicit messages (`PF-xxx: scope`), no `--force` to main, no rebase of published history, never commit `node_modules`, `.next`, `dist/` build outputs unless it *is* the artifact lane.
7. **Re-orient before you build.** `git log` + `agent-status` + `STATE.md` override anything you guessed before the session started.

## Where things live

| Path | What it is |
|---|---|
| `src/` | Astro 7 app (layouts, pages, components, lib, content config) |
| `content/` | Git-tracked CMS: 72 tools, 87 presets, 6 blog, 9 engine, templates, site config |
| `public/` | Static assets: `admin/` (Sveltia CMS), `wasm/`, `fonts/`, `app-runtime.js`, legal, manifests |
| `dist/` | Static build output (167 pages, zero-upload HTML) for Cloudflare Pages deploy |
| `docs/` | Strategy blueprints; aspirational, **not** verified truth |
| `docs/agent/` | The operating memory: STATE, TASKS, CLAIMS, DECISIONS, LOG, cheatsheets |
| `scripts/` | Truth probe, smoke tests, CMS drift and content validation scripts |
| `reference-ui.html` | DESIGN SOURCE OF TRUTH. Do not refactor visually without a decision entry |

## Session end (5 minutes — this is the memory system)

The repo, not chat history, is the memory. Before finishing any session:

1. `docs/agent/LOG.md` — append one dated entry: what you did, what command proves it, blockers, next step. 5–15 lines max, no prose essays.
2. `docs/agent/STATE.md` — update only sections whose truth changed (tool status, build, counts).
3. `docs/agent/TASKS.md` — move started/done tasks to their real ID+status; add discovered work as new IDs.
4. `scripts/agent-status.mjs --write` — refresh `docs/agent/SNAPSHOT.txt`.

**Token discipline:** NEVER re-explore the whole repo to answer "what's the state". Trust, in order: `agent-status` → `STATE.md` → `LOG.md` (last entries) → `DECISIONS.md` for *why*. Explore `src/` only for the task at hand. If you produced knowledge valuable outside this session, it belongs in one of those files, not in a chat you won't re-read.
