#!/usr/bin/env node
/**
 * agent-status.mjs — the cheap way for an agent to learn the truth about this repo.
 *
 * WHY: a full re-read of this tree costs ~120k tokens and still misses drift.
 * This script re-derives the facts that actually change, in <1s, and prints a
 * compact report. Run it FIRST every session. If it disagrees with STATE.md,
 * the script wins and STATE.md gets fixed.
 *
 * Usage: node scripts/agent-status.mjs [--write]
 *   --write   also writes docs/agent/SNAPSHOT.txt (the file LOG entries cite)
 *
 * Exit 1 when a P0 blocker is present, so CI can gate on it.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const r = (p) => path.join(root, p);
const exists = (p) => fs.existsSync(r(p));
const read = (p) => (exists(p) ? fs.readFileSync(r(p), 'utf8') : '');
const lines = [];
const out = (s = '') => lines.push(s);

let blockers = 0;
const blocker = (s) => { blockers++; out(`  [BLOCKER] ${s}`); };
const warn = (s) => out(`  [warn]    ${s}`);
const ok = (s) => out(`  [ok]      ${s}`);

/* ---------- content inventory ---------- */
const contentBase = exists('content/tools') ? 'content' : 'privacyfold-nextjs/content';
const publicBase = exists('public/schemas') ? 'public' : 'privacyfold-nextjs/public';
const listJson = (dir) => (exists(dir) ? fs.readdirSync(r(dir)).filter((f) => f.endsWith('.json')) : []);
const tools = listJson(`${contentBase}/tools`).map((f) => JSON.parse(read(`${contentBase}/tools/${f}`)));
const presets = listJson(`${contentBase}/presets`).map((f) => JSON.parse(read(`${contentBase}/presets/${f}`)));
const blogs = exists(`${contentBase}/blog`) ? fs.readdirSync(r(`${contentBase}/blog`)).filter((f) => f.endsWith('.md')) : [];
const glossaries = exists(`${contentBase}/glossary`) ? fs.readdirSync(r(`${contentBase}/glossary`)).filter((f) => f.endsWith('.md')) : [];
const engines = exists(`${contentBase}/engine`) ? fs.readdirSync(r(`${contentBase}/engine`)).filter((f) => f.endsWith('.yaml')) : [];
const schemas = listJson(`${publicBase}/schemas`).filter((f) => f !== '_index.json');

/* ---------- runtime truth ---------- */
const runtime = read('public/app-runtime.js') || read('privacyfold-nextjs/public/app-runtime.js');
const toolObjs = [...runtime.matchAll(/\{id:'([a-z0-9_]+)',fam:'(\w+)'/g)].map((m) => m[1]);
const liveIds = [...runtime.matchAll(/\{id:'([a-z0-9_]+)',fam:'\w+'[^\n]*?live:true/g)].map((m) => m[1]);
const soonIds = [...runtime.matchAll(/\{id:'([a-z0-9_]+)',fam:'\w+'[^\n]*?live:false/g)].map((m) => m[1]);
const slug = (id) => id.replace(/_/g, '-');
const contentSlugs = new Set(tools.map((t) => t.slug));
const liveSlugs = new Set(liveIds.map(slug));

/* ---------- 1. build ---------- */
out('1. BUILD');
const buildMarker = read('.agent-build-status').trim();
if (buildMarker.startsWith('PASS')) ok(`last recorded build: ${buildMarker}`);
else if (buildMarker.startsWith('FAIL')) blocker(`last recorded build: ${buildMarker}`);
else warn('no .agent-build-status — run `npm run build` and record it');
if (!exists('node_modules') && !exists('privacyfold-nextjs/node_modules')) warn('node_modules absent — `npm ci` needed');
if (!exists('package-lock.json') && !exists('privacyfold-nextjs/package-lock.json')) blocker('no package-lock.json — installs are not reproducible');

/* ---------- 2. content <-> code schema ---------- */
out('');
out('2. CONTENT MODEL');
const required = ['fam', 'task', 'glyph', 'desc', 'accepts', 'tag', 'wasmModule', 'std'];
const missing = required.filter((k) => tools.every((t) => t[k] === undefined));
if (missing.length) blocker(`content/tools/*.json is missing fields the TS loader reads: ${missing.join(', ')} (${tools.length}/${tools.length} files)`);
else ok('tool JSON matches GitCmsTool');
const noSteps = tools.filter((t) => !t.seo?.steps).length;
if (noSteps) blocker(`seo.steps missing in ${noSteps}/${tools.length} tool JSONs — ToolSeoArticle.map() throws at prerender`);
else ok('seo.steps present');

/* ---------- 3. catalog honesty ---------- */
out('');
out('3. CATALOG ≈ REALITY');
out(`  content tools: ${tools.length} · schemas: ${schemas.length} · presets: ${presets.length} · blog: ${blogs.length}${glossaries.length ? ` · glossary: ${glossaries.length}` : ''}${engines.length ? ` · engines: ${engines.length}` : ''}`);
out(`  runtime: ${toolObjs.length} defined · ${liveIds.length} live · ${soonIds.length} "coming soon"`);
const advertisedOnly = [...contentSlugs].filter((s) => !liveSlugs.has(s));
if (advertisedOnly.length) blocker(`${advertisedOnly.length} tools have a page/schema but no working implementation: ${advertisedOnly.join(', ')}`);
const orphanLive = [...liveSlugs].filter((s) => !contentSlugs.has(s));
if (orphanLive.length) warn(`runnable but undocumented (no SEO page): ${orphanLive.join(', ')}`);

/* ---------- 4. wasm / deps claims ---------- */
out('');
out('4. ENGINE CLAIMS');
const wasmFiles = [];
const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|\.git|\.next|dist/.test(e.name)) walk(p); } else if (e.name.endsWith('.wasm')) wasmFiles.push(p); } };
walk(root);
const wasmRefs = (runtime.match(/\/wasm\/[a-z0-9/._-]+\.wasm/gi) || []).length;
if (wasmRefs && !wasmFiles.length) blocker(`${wasmRefs} distinct /wasm/*.wasm paths referenced, 0 .wasm files on disk`);
else if (wasmFiles.length) ok(`${wasmFiles.length} wasm binaries on disk`);
const pkg = JSON.parse(read('package.json') || read('privacyfold-nextjs/package.json'));
const src = ['src', 'scripts', 'packages'].flatMap((d) => walkFiles(path.join(root, d))).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const unused = Object.keys(pkg.dependencies || {}).filter((d) => !src.includes(d));
if (unused.length) warn(`${unused.length} declared deps imported 0 times: ${unused.slice(0, 6).join(', ')}${unused.length > 6 ? '…' : ''}`);

/* ---------- 5. canonical counts ---------- */
out('');
out('5. COUNT DRIFT (agents and humans get misled here)');
const layoutContent = read('src/layouts/Base.astro') || read('privacyfold-nextjs/src/app/layout.tsx');
const siteConfig = read('content/config/site.json') || read('privacyfold-nextjs/content/config/site.json');
const llmsContent = read('public/llms.txt') || read('privacyfold-nextjs/public/llms.txt');
const schemaIndex = read('public/schemas/_index.json') || read('privacyfold-nextjs/public/schemas/_index.json');
const mcpContent = read('public/.well-known/mcp.json') || read('privacyfold-nextjs/public/.well-known/mcp.json');
const mcpServer = read('packages/mcp-server/index.mjs') || read('privacyfold-nextjs/packages/mcp-server/index.mjs');

const counts = {
  'src/layouts/Base.astro': (layoutContent.match(/(\d+)\s+client-side/) || [])[1],
  'content/config/site.json': (JSON.parse(siteConfig).description.match(/(\d+)\s+client-side/) || [])[1],
  'public/llms.txt': (llmsContent.match(/Tools Catalog \((\d+) Tools\)/) || [])[1],
  'public/schemas/_index.json': String(JSON.parse(schemaIndex).tool_count ?? '?'),
  'public/.well-known/mcp.json': String((JSON.parse(mcpContent).tools || []).length),
  'packages/mcp-server (total_tools)': (mcpServer.match(/total_tools:\s*(\d+)/) || [])[1],
  'reality (content)': String(tools.length),
  'reality (runnable)': String(liveIds.length),
};
const distinct = new Set(Object.values(counts).filter(Boolean));
for (const [k, v] of Object.entries(counts)) out(`  ${String(v ?? '?').padStart(3)}  ${k}`);
if (distinct.size > 1) blocker(`tool count stated ${distinct.size} different ways — generate all surfaces from content/tools`);

/* ---------- 6. legal / launch surface ---------- */
out('');
out('6. LAUNCH SURFACE');
const mustHave = {
  'public/privacy/index.html': 'privacy policy',
  'public/terms/index.html': 'terms',
  'public/ads.txt': 'ads.txt',
  'public/sw.js': 'service worker (offline claim)',
  'public/favicon.ico': 'favicon',
  'public/og.png': 'og:image',
  'LICENSE': 'LICENSE',
  '.gitignore': '.gitignore (at repo root)',
};
for (const [p, label] of Object.entries(mustHave)) if (!exists(p)) warn(`missing ${label} (${p})`);
const fonts = read('public/index.html') + read('src/layouts/Base.astro');
if (/fonts\.googleapis\.com/.test(fonts)) warn('Google Fonts CDN referenced — third-party request on a privacy product');

/* ---------- 7. git ---------- */
out('');
out('7. GIT');
try {
  const { execSync } = await import('node:child_process');
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root }).toString().trim();
  const dirty = execSync('git status --porcelain', { cwd: root }).toString().trim().split('\n').filter(Boolean).length;
  const commits = execSync('git rev-list --count HEAD', { cwd: root }).toString().trim();
  out(`  branch ${branch} · commits ${commits} · uncommitted paths ${dirty}`);
  if (dirty > 50) warn(`${dirty} uncommitted paths — state is not recoverable from git`);
} catch {
  blocker('no git repository / no commits — the product exists only in this working tree');
}

/* ---------- footer ---------- */
out('');
out(blockers ? `VERDICT: NOT DEPLOYABLE — ${blockers} blocker(s)` : 'VERDICT: P0 clear');
const report = lines.join('\n');
console.log(report);
if (process.argv.includes('--write')) {
  fs.mkdirSync(r('docs/agent'), { recursive: true });
  fs.writeFileSync(r('docs/agent/SNAPSHOT.txt'), `# generated ${new Date().toISOString()} by scripts/agent-status.mjs\n${report}\n`);
  console.error('wrote docs/agent/SNAPSHOT.txt');
}
process.exit(blockers ? 1 : 0);

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return /node_modules|\.next/.test(e.name) ? [] : walkFiles(p);
    return /\.(ts|tsx|mjs|js|css)$/.test(e.name) ? [p] : [];
  });
}
