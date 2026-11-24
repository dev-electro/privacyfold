#!/usr/bin/env node
/**
 * fix-wasm-claims.mjs — make every engine claim match what actually ships.
 *
 * The tool copy advertised a per-tool WebAssembly engine at
 * /wasm/<family>/<slug>-v1.wasm. Those files never existed: the runtime is
 * JavaScript under /vendor/ (pdf-lib, pdfjs-dist, canvas, ...) plus two real
 * WebAssembly engines — libheif (inlined in /vendor/libheif.js) and sql.js
 * (/vendor/sql-wasm.wasm).
 *
 * This rewrites the sentence templates, the Engine field and wasmModule, and
 * the Engine column in public/llms.txt. Idempotent: a second run is a no-op.
 *
 *   node scripts/fix-wasm-claims.mjs          # apply
 *   node scripts/fix-wasm-claims.mjs --check  # exit 1 if anything would change
 */
import fs from 'node:fs';
import path from 'node:path';

const CHECK = process.argv.includes('--check');

const REAL_WASM = {
  heic_to_jpg: {
    engine: 'libheif WebAssembly (inlined in /vendor/libheif.js)',
    module: 'libheif wasm, inlined in /vendor/libheif.js',
  },
  sqlite_viewer: {
    engine: 'sql.js WebAssembly (/vendor/sql-wasm.wasm)',
    module: '/vendor/sql-wasm.wasm',
  },
};
const JS_ENGINE = 'Plain JavaScript in your browser (no engine binary)';

/* Every tool used to declare std = "W3C WebAssembly Core 2.0", including base64
   and uuid_gen. Map each family to the spec its code actually targets; overrides
   name the real engine where one exists. */
const STD_BY_FAMILY = {
  pdf: 'ISO 32000-1 (PDF 1.7) via pdf-lib',
  photo: 'W3C HTML Canvas 2D + EXIF 2.32',
  image: 'W3C HTML Canvas 2D + File API',
  crypto: null, /* decided per tool: SubtleCrypto, getRandomValues, or plain JS */
  dev: 'ECMAScript (any modern browser)',
  forms: 'ECMAScript (any modern browser)',
};
/* Derive each tool's standard from what its implementation actually calls, so a
   base64 tool stops claiming WebAssembly conformance. Falls back to the family. */
function standardsFromCode() {
  const src = fs.readFileSync('public/tool-pack.js', 'utf8');
  const starts = [...src.matchAll(/^\s*T\.([a-z0-9_]+)\s*=\s*\{/gm)].map((m) => ({ id: m[1], i: m.index }));
  const out = {};
  starts.forEach((s0, k) => {
    const seg = src.slice(s0.i, k + 1 < starts.length ? starts[k + 1].i : src.length);
    const has = (re) => re.test(seg);
    let std = null;
    if (has(/libheif|ensureHeif/)) std = 'ISO/IEC 23008-12 (HEIF) via libheif';
    else if (has(/initSqlJs|sql-wasm|execSql/)) std = 'SQLite 3 via sql.js';
    else if (has(/PDFDocument|pdfjs|getDocument\(/)) std = 'ISO 32000-1 (PDF 1.7) via pdf-lib';
    else if (has(/crypto\.subtle/)) std = 'W3C Web Crypto API (SubtleCrypto)';
    else if (has(/qrcode-generator|makeCode\(|qrcode\s*\(/)) std = 'ISO/IEC 18004 (QR Code)';
    else if (has(/getRandomValues/)) std = 'W3C Web Crypto API (getRandomValues)';
    else if (has(/getContext\('2d'\)|createElement\('canvas'\)|U\.toBlob/)) std = 'W3C HTML Canvas 2D';
    out[s0.id] = std;
  });
  return out;
}
const STD_BY_CODE = standardsFromCode();
const STD_OVERRIDE = {
  barcode_gen: 'ISO/IEC 18004 (QR Code) + Code 128 (ISO/IEC 15417)',
};
/* Translated tool files keep the path out but must not get English prose injected */
const JS_ENGINE_I18N = 'JavaScript (no engine binary)';
const JS_MODULE_I18N = 'none (no engine binary)';
const WASM_I18N = {
  heic_to_jpg: 'libheif (WebAssembly)',
  sqlite_viewer: 'sql.js (WebAssembly)',
};
const PATH_RE = /\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm/g;

const SENTENCES = [
  [/\s+via\s+\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm(?=\s)/g, ''],
  [/\s+using\s+\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm(?=\s*\()/g, ''],
  [/\s+using\s+\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm(?=\.)/g, ''],
  [/\s+using\s+\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm(?=\s)/g, ''],
];

function fixText(s) {
  let out = s;
  for (const [re, rep] of SENTENCES) out = out.replace(re, rep);
  // anything left over (odd phrasing) — drop the path, collapse the gap
  out = out.replace(PATH_RE, '').replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,;)])/g, '$1');
  return out;
}

function walk(node, id, i18n, isKeyValue) {
  if (typeof node === 'string') return fixText(node);
  if (Array.isArray(node)) return node.map((v) => walk(v, id, i18n));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'std') {
        out[k] = STD_OVERRIDE[id] || STD_BY_CODE[id] || STD_BY_FAMILY[node.fam] || 'ECMAScript (any modern browser)';
      } else if (k === 'Engine') {
        out[k] = i18n ? WASM_I18N[id] || JS_ENGINE_I18N : REAL_WASM[id]?.engine || JS_ENGINE;
      } else if (k === 'wasmModule') {
        // keep hand-written specifics like "none (pattern matching, no engine binary)"
        if (/^none\s*\(/.test(String(v))) { out[k] = v; continue; }
        out[k] = i18n ? WASM_I18N[id] || JS_MODULE_I18N : REAL_WASM[id]?.module || 'none (JavaScript, no engine binary)';
      } else {
        out[k] = walk(v, id, i18n);
      }
    }
    return out;
  }
  return node;
}

function processDir(dir, i18n) {
  if (!fs.existsSync(dir)) return { n: 0, touched: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  let changed = 0;
  const touched = [];
  for (const f of files) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, 'utf8');
    const id = f.replace(/\.json$/, '');
    const next = JSON.stringify(walk(JSON.parse(raw), id, i18n), null, 2) + '\n';
    if (JSON.stringify(JSON.parse(next)) !== JSON.stringify(JSON.parse(raw))) {
      changed++;
      touched.push(f);
      if (!CHECK) fs.writeFileSync(p, next);
    }
  }
  return { n: changed, total: files.length, touched };
}

const main = processDir('content/tools', false);
const i18nRoot = 'content/i18n';
const i18nDirs = fs.existsSync(i18nRoot)
  ? fs.readdirSync(i18nRoot).filter((l) => fs.existsSync(path.join(i18nRoot, l, 'tools')))
  : [];
let i18nChanged = 0;
let i18nTotal = 0;
for (const l of i18nDirs) {
  const r = processDir(path.join(i18nRoot, l, 'tools'), true);
  i18nChanged += r.n;
  i18nTotal += r.total || 0;
}
const changed = main.n + i18nChanged;
const touched = main.touched;

// public/llms.txt keeps `[Tier: D | Engine: /wasm/...]` per tool
const llmsPath = 'public/llms.txt';
let llmsChanged = false;
if (fs.existsSync(llmsPath)) {
  const raw = fs.readFileSync(llmsPath, 'utf8');
  const next = raw.replace(/(Tier:\s*\w+\s*\|\s*Engine:)\s*\/wasm\/[a-z0-9_]+\/[a-z0-9_-]+\.wasm/g, '$1 JavaScript');
  if (next !== raw) {
    llmsChanged = true;
    if (!CHECK) fs.writeFileSync(llmsPath, next);
  }
}

console.log(
  `${CHECK ? '[check] ' : ''}tools rewritten: ${main.n}/${main.total} · i18n: ${i18nChanged}/${i18nTotal}` +
    (llmsChanged ? ' · llms.txt updated' : ' · llms.txt clean')
);
if (touched.length) console.log('  ' + touched.join(', '));
if (CHECK && (changed || llmsChanged)) process.exit(1);
