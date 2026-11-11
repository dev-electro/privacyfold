#!/usr/bin/env node
/**
 * scripts/build.mjs — PrivacyFold Standalone Dist Builder
 *
 * Regenerates `privacyfold-nextjs/dist/index.html` by combining the static
 * HTML template shell with the canonical `privacyfold-nextjs/public/app-runtime.js`.
 *
 * Usage:
 *   node scripts/build.mjs          # Rebuilds dist/index.html
 *   node scripts/build.mjs --check  # Verifies dist/index.html is in sync (exit 1 if drift)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const r = (p) => path.join(root, p);

const distPath = r('privacyfold-nextjs/dist/index.html');
const runtimePath = r('privacyfold-nextjs/public/app-runtime.js');

if (!fs.existsSync(distPath)) {
  console.error('Error: dist/index.html not found');
  process.exit(1);
}
if (!fs.existsSync(runtimePath)) {
  console.error('Error: app-runtime.js not found');
  process.exit(1);
}

const currentDist = fs.readFileSync(distPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8').trim();

const scriptMarker = '<script id="app">';
const endMarker = '</script>';

const scriptStart = currentDist.indexOf(scriptMarker);
const scriptEnd = currentDist.lastIndexOf(endMarker);

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Error: Could not locate <script id="app"> tags in dist/index.html');
  process.exit(1);
}

const headAndMarkup = currentDist.slice(0, scriptStart + scriptMarker.length);
const footer = currentDist.slice(scriptEnd);

const newDist = `${headAndMarkup}\n${runtime}\n${footer}`;

const isCheck = process.argv.includes('--check');

if (isCheck) {
  if (currentDist.trim() === newDist.trim()) {
    console.log('✓ dist/index.html is perfectly in sync with app-runtime.js');
    process.exit(0);
  } else {
    console.error('✗ dist/index.html is out of sync with app-runtime.js! Run `node scripts/build.mjs` to update.');
    process.exit(1);
  }
}

fs.writeFileSync(distPath, newDist, 'utf8');
console.log(`✓ Rebuilt privacyfold-nextjs/dist/index.html (${newDist.length.toLocaleString()} bytes)`);

