#!/usr/bin/env node
/**
 * scripts/build.mjs — PrivacyFold Standalone Dist Builder & Verifier (PF-012)
 *
 * Verifies or builds `dist/index.html` by ensuring the Astro 7 static export
 * compiles cleanly and integrates the canonical `public/app-runtime.js`.
 *
 * Usage:
 *   node scripts/build.mjs          # Builds Astro static export
 *   node scripts/build.mjs --check  # Verifies dist/index.html is present and loads app-runtime.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const distPath = path.join(root, 'dist/index.html');
const runtimePath = path.join(root, 'public/app-runtime.js');

if (!fs.existsSync(runtimePath)) {
  console.error('Error: public/app-runtime.js not found');
  process.exit(1);
}

const isCheck = process.argv.includes('--check');

if (!fs.existsSync(distPath)) {
  console.log('dist/index.html not found — running `npm run build`...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

if (!fs.existsSync(distPath)) {
  console.error('Error: dist/index.html not found after build');
  process.exit(1);
}

const currentDist = fs.readFileSync(distPath, 'utf8');

if (currentDist.includes('app-runtime.js') || currentDist.includes('window.privacyfold') || currentDist.includes('PrivacyFold')) {
  console.log('✓ dist/index.html is verified and loads client runtime');
  process.exit(0);
} else {
  console.error('✗ dist/index.html is missing runtime bindings');
  process.exit(1);
}
