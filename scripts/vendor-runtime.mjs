// Copies self-hosted runtime engines from node_modules into public/vendor/.
// Runs in prebuild so `dist/` always matches the installed versions.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'public', 'vendor');

const files = [
  ['node_modules/pdfjs-dist/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs'],
  ['node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs'],
  ['node_modules/pdf-lib/dist/pdf-lib.esm.min.js', 'pdf-lib.esm.min.js'],
  ['node_modules/qrcode-generator/qrcode.js', 'qrcode.js'],
  ['node_modules/sql.js/dist/sql-wasm.js', 'sql-wasm.js'],
  ['node_modules/sql.js/dist/sql-wasm.wasm', 'sql-wasm.wasm'],
  ['node_modules/libheif-js/libheif-wasm/libheif-bundle.js', 'libheif.js']
];

const dirs = [
  ['node_modules/pdfjs-dist/cmaps', 'pdfjs/cmaps'],
  ['node_modules/pdfjs-dist/standard_fonts', 'pdfjs/standard_fonts']
];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const src = path.join(from, name);
    const dst = path.join(to, name);
    if (fs.statSync(src).isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

let count = 0;
const manifest = [];
for (const [from, to] of files) {
  if (!fs.existsSync(from)) { console.error('vendor: missing ' + from); process.exitCode = 1; continue; }
  const dst = path.join(out, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(from, dst);
  const buf = fs.readFileSync(dst);
  manifest.push({ path: '/vendor/' + to, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
  count++;
}
for (const [from, to] of dirs) {
  if (!fs.existsSync(from)) continue;
  copyDir(from, path.join(out, to));
  count++;
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ generated: new Date().toISOString(), files: manifest }, null, 2));
console.log('vendor: ' + count + ' entries -> public/vendor');
