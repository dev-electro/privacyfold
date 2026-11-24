#!/usr/bin/env node
/**
 * record-build.mjs — keep `.agent-build-status` honest.
 *
 * agent-status.mjs reads that one-line marker as "the last build". Nothing used
 * to write it, so it sat at 2026-11-12 / 330 pages while the site shipped 332
 * pages — the probe then reported stale numbers as fact.
 *
 *   node scripts/record-build.mjs --start   # prebuild: FAIL until the build ends
 *   node scripts/record-build.mjs           # postbuild: PASS + real page count
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const start = process.argv.includes('--start');
const marker = '.agent-build-status';
const today = new Date().toISOString().slice(0, 10);

let sha = '';
try {
  sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {}

if (start) {
  fs.writeFileSync(marker, `FAIL astro build in progress — started ${new Date().toISOString()} (previous state not trusted)\n`);
  console.log(`record-build: marked build in progress`);
} else {
  /* No page count here on purpose: dist holds more .html files than Astro
     reports as pages (404, generated endpoints), and a stale copy of either
     number is what misled agents before. The build log carries Astro's count;
     this marker only asserts that a build finished and which commit it built. */
  const engines = fs.existsSync('content/engine')
    ? fs.readdirSync('content/engine').filter((f) => f.endsWith('.yaml')).length
    : 0;
  fs.writeFileSync(
    marker,
    `PASS astro build ${today} at ${new Date().toISOString().slice(11, 19)}Z (${engines} engine records) — commit ${sha || 'unknown'}\n`
  );
  console.log(`record-build: PASS · ${engines} engine records · ${sha || 'no-git'}`);
}
