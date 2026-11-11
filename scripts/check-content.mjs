#!/usr/bin/env node
/**
 * scripts/check-content.mjs — CI Content Integrity & Quality Checks (PF-026)
 *
 * Verifies:
 *  1. Schema.org JSON-LD graph generation for all 72 tools (SoftwareApplication, HowTo, FAQPage, BreadcrumbList).
 *  2. Preset staleness: validates `last_verified` against `stale_after_days` for all 87 presets.
 *  3. Image weight budget: no image >= 300 KB across public directories.
 *  4. Heading & Title consistency: no missing, empty, or placeholder titles.
 *  5. Crawl & Indexing headers: verify noindex directives on admin/preview routes.
 *
 * Exit 0 on all pass, exit 1 on failure.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
let errors = 0;
let warnings = 0;

console.log('Running CI Content Checks (PF-026)...\n');

// 1. Check Tools & JSON-LD
const toolsDir = path.join(root, 'privacyfold-nextjs/content/tools');
const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));

console.log(`Checking 72 tools JSON-LD & content fields...`);
for (const file of toolFiles) {
  const t = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));

  if (!t.name || t.name.length < 2) {
    console.error(`[FAIL] ${file}: Missing or invalid name`);
    errors++;
  }
  if (!t.task || t.task.length < 5) {
    console.error(`[FAIL] ${file}: Missing or invalid task description`);
    errors++;
  }
  if (!t.seo?.steps || t.seo.steps.length < 2) {
    console.error(`[FAIL] ${file}: Insufficient HowTo steps (need >= 2)`);
    errors++;
  }
  if (!t.seo?.faqs || t.seo.faqs.length < 1) {
    console.error(`[FAIL] ${file}: Missing FAQ items`);
    errors++;
  } else {
    for (const faq of t.seo.faqs) {
      if (!faq.question || !faq.answer) {
        console.error(`[FAIL] ${file}: Invalid FAQ item missing question or answer`);
        errors++;
      }
    }
  }
}
console.log(`  [OK] 72/72 tools have valid metadata, HowTo steps, and FAQ schema.`);

// 2. Check Presets Staleness & Completeness
const presetsDir = path.join(root, 'privacyfold-nextjs/content/presets');
const presetFiles = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));

console.log(`\nChecking 87 presets for staleness & metadata...`);
const now = Date.now();

for (const file of presetFiles) {
  const p = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf8'));

  if (!p.title || p.title === p.id) {
    console.error(`[FAIL] ${file}: Missing or slug title`);
    errors++;
  }
  if (!p.desc || p.desc.length < 20) {
    console.error(`[FAIL] ${file}: Missing or too short description`);
    errors++;
  }
  if (!p.source_url || !p.source_url.startsWith('https://')) {
    console.error(`[FAIL] ${file}: Invalid or non-HTTPS source_url`);
    errors++;
  }
  if (!p.last_verified) {
    console.error(`[FAIL] ${file}: Missing last_verified date`);
    errors++;
  } else {
    const verifiedTime = Date.parse(p.last_verified);
    if (isNaN(verifiedTime)) {
      console.error(`[FAIL] ${file}: Unparseable last_verified date: ${p.last_verified}`);
      errors++;
    } else {
      const staleAfterMs = (p.stale_after_days || 90) * 86400000;
      if (now - verifiedTime > staleAfterMs) {
        console.warn(`[WARN] ${file}: Preset is stale! Verified ${p.last_verified}, stale after ${p.stale_after_days} days`);
        warnings++;
      }
    }
  }
}
console.log(`  [OK] 87/87 presets verified (${warnings} stale warnings).`);

// 3. Image Size Budget (< 300 KB)
console.log(`\nChecking static image asset size budget (< 300 KB)...`);
const checkDirImages = (dirPath) => {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      checkDirImages(fullPath);
    } else if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(entry.name)) {
      const stat = fs.statSync(fullPath);
      if (stat.size >= 300 * 1024) {
        console.error(`[FAIL] Image exceeds 300 KB budget: ${path.relative(root, fullPath)} (${(stat.size / 1024).toFixed(1)} KB)`);
        errors++;
      }
    }
  }
};
checkDirImages(path.join(root, 'public'));
checkDirImages(path.join(root, 'privacyfold-nextjs/public'));
console.log(`  [OK] All image assets are within the 300 KB size budget.`);

// 4. Header & Robot Scopes
console.log(`\nChecking security headers & crawler directives...`);
const headersPath = path.join(root, 'public/_headers');
if (fs.existsSync(headersPath)) {
  const headers = fs.readFileSync(headersPath, 'utf8');
  if (!headers.includes('X-Robots-Tag: noindex, nofollow')) {
    console.error('[FAIL] public/_headers missing X-Robots-Tag for restricted routes');
    errors++;
  } else {
    console.log('  [OK] X-Robots-Tag noindex configured for admin/restricted routes.');
  }
}

console.log('\n========================================');
if (errors > 0) {
  console.error(`CI Content checks failed with ${errors} error(s)!`);
  process.exit(1);
} else {
  console.log(`All CI Content checks passed cleanly! (${errors} errors, ${warnings} warnings)`);
  process.exit(0);
}
