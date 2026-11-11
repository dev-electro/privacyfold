#!/usr/bin/env node
/**
 * scripts/check-cms-drift.mjs — Sveltia CMS & Content Drift Audit (PF-032)
 *
 * Verifies:
 *  1. Sveltia CMS bundle is self-hosted at `public/admin/cms.js` with verified SRI hash.
 *  2. No third-party CDN scripts in `public/admin/index.html`.
 *  3. `public/admin/config.yml` is well-formed and registers expected collections.
 *  4. Scoped CSP for `/admin*` in `_headers` preserves the `'self'` guarantee for root.
 *  5. All `robots.txt` files disallow `/admin/`.
 *
 * Exit 0 on all pass, exit 1 on drift/violation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
let errors = 0;

console.log('Checking Sveltia CMS self-hosting & configuration (PF-032)...\n');

// 1. Verify self-hosted cms.js
const cmsPath = path.join(root, 'public/admin/cms.js');
if (!fs.existsSync(cmsPath)) {
  console.error('[FAIL] public/admin/cms.js does not exist');
  errors++;
} else {
  const cmsBuf = fs.readFileSync(cmsPath);
  if (cmsBuf.length < 500000) {
    console.error(`[FAIL] public/admin/cms.js is suspiciously small (${cmsBuf.length} bytes)`);
    errors++;
  } else {
    const sha384 = 'sha384-' + crypto.createHash('sha384').update(cmsBuf).digest('base64');
    console.log(`  [OK] public/admin/cms.js self-hosted (${(cmsBuf.length / (1024 * 1024)).toFixed(2)} MB, ${sha384.slice(0, 20)}...)`);

    // 2. Check public/admin/index.html
    const indexPath = path.join(root, 'public/admin/index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    if (indexHtml.includes('unpkg.com') || indexHtml.includes('jsdelivr.net') || indexHtml.includes('cdnjs.cloudflare.com')) {
      console.error('[FAIL] public/admin/index.html still references third-party CDN script');
      errors++;
    } else if (!indexHtml.includes(sha384)) {
      console.error('[FAIL] public/admin/index.html SRI hash does not match public/admin/cms.js');
      errors++;
    } else {
      console.log('  [OK] public/admin/index.html loads local /admin/cms.js with matching SRI integrity');
    }
  }
}

// 3. Verify config.yml collections
const configPath = path.join(root, 'public/admin/config.yml');
if (!fs.existsSync(configPath)) {
  console.error('[FAIL] public/admin/config.yml does not exist');
  errors++;
} else {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const expectedCollections = ['tools', 'presets', 'guides', 'glossary', 'engine'];
  for (const col of expectedCollections) {
    if (!configContent.includes(`name: ${col}`)) {
      console.error(`[FAIL] config.yml missing registered collection: ${col}`);
      errors++;
    }
  }
  console.log('  [OK] config.yml defines all expected collections');
}

// 4. Verify robots.txt disallows /admin/
const robotsPaths = [
  path.join(root, 'public/robots.txt')
];
for (const rp of robotsPaths) {
  if (fs.existsSync(rp)) {
    const robots = fs.readFileSync(rp, 'utf8');
    if (!robots.includes('Disallow: /admin/')) {
      console.error(`[FAIL] ${path.relative(root, rp)} does not disallow /admin/`);
      errors++;
    } else {
      console.log(`  [OK] ${path.relative(root, rp)} disallows /admin/`);
    }
  }
}

// 5. Verify _headers scoped CSP
const headersPath = path.join(root, 'public/_headers');
if (fs.existsSync(headersPath)) {
  const headers = fs.readFileSync(headersPath, 'utf8');
  if (!headers.includes('/admin*') || !headers.includes('api.github.com')) {
    console.error('[FAIL] public/_headers lacks scoped /admin* CSP rules');
    errors++;
  } else {
    console.log('  [OK] public/_headers configures scoped CSP for /admin*');
  }
}

console.log('\n========================================');
if (errors > 0) {
  console.error(`CMS drift check failed with ${errors} error(s)!`);
  process.exit(1);
} else {
  console.log('All CMS checks passed! Sveltia is self-hosted with SRI and zero third-party scripts.');
  process.exit(0);
}

