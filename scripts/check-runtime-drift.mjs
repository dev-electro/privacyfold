#!/usr/bin/env node
/**
 * The desk builds its tool list from an inline TOOLS array in public/app-runtime.js
 * (agents and SEO read content/tools/*.json). The two drifted: eleven tools showed
 * one name in the grid and another as the page H1. Fail the build when they diverge.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeFile = path.join(root, 'public', 'app-runtime.js');
const contentDir = path.join(root, 'content', 'tools');

if (!fs.existsSync(runtimeFile)) {
  console.log('[runtime-drift] public/app-runtime.js missing — skipped');
  process.exit(0);
}

const runtime = fs.readFileSync(runtimeFile, 'utf8');
const entries = [];
// Tool entries always carry fam:; paper themes and stamp presets do not.
const re = /\{id:'([a-z0-9_]+)',fam:'[a-z]+'[^\n]*?name:'((?:[^'\\]|\\.)*)'/g;
let m;
while ((m = re.exec(runtime))) entries.push({ id: m[1], name: m[2].replace(/\\'/g, "'") });

const seen = new Set();
const problems = [];
for (const { id, name } of entries) {
  if (seen.has(id)) continue;
  seen.add(id);
  const file = path.join(contentDir, `${id}.json`);
  if (!fs.existsSync(file)) {
    problems.push(`${id}: in app-runtime.js but no content/tools/${id}.json`);
    continue;
  }
  const cms = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cms.name !== name) problems.push(`${id}: runtime "${name}" ≠ content "${cms.name}"`);
}

// Every CMS tool must be reachable in the desk, too.
for (const file of fs.readdirSync(contentDir).filter((f) => f.endsWith('.json'))) {
  const id = file.replace(/\.json$/, '');
  if (!seen.has(id)) problems.push(`${id}: in content/tools but missing from the desk TOOLS array`);
}

if (problems.length) {
  console.error('[runtime-drift] tool metadata diverged between the desk and the CMS:');
  for (const p of problems) console.error('  - ' + p);
  console.error('[runtime-drift] align content/tools/<id>.json "name" with the TOOLS entry in public/app-runtime.js.');
  process.exit(1);
}
console.log(`[runtime-drift] ${seen.size} tools agree between the desk and the CMS`);
