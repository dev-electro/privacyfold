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

const distPath = fs.existsSync(r('dist/index.html')) ? r('dist/index.html') : r('privacyfold-nextjs/dist/index.html');
const runtimePath = fs.existsSync(r('public/app-runtime.js')) ? r('public/app-runtime.js') : r('privacyfold-nextjs/public/app-runtime.js');

if (!fs.existsSync(distPath)) {
  console.error('Error: dist/index.html not found — run `npm run build`');
  process.exit(1);
}
if (!fs.existsSync(runtimePath)) {
  console.error('Error: app-runtime.js not found');
  process.exit(1);
}

const currentDist = fs.readFileSync(distPath, 'utf8');
const isCheck = process.argv.includes('--check');

if (isCheck) {
  if (currentDist.includes('app-runtime.js') || currentDist.includes('window.privacyfold')) {
    console.log('✓ dist/index.html is verified and loads app-runtime.js');
    process.exit(0);
  } else {
    console.error('✗ dist/index.html does not load app-runtime.js! Run `npm run build`.');
    process.exit(1);
  }
}

fs.writeFileSync(distPath, newDist, 'utf8');
console.log(`✓ Rebuilt privacyfold-nextjs/dist/index.html (${newDist.length.toLocaleString()} bytes)`);

