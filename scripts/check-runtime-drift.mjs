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
// Tool entries always carry fam:; paper themes and stamp presets do not.
// Both name and desc are compared: the description is what the page prints,
// and a stale one is how "automatic fallback to SmolLM2" survived in the desk
// long after the record stopped claiming a model.
const entries = [];
const starts = [...runtime.matchAll(/\{id:'([a-z0-9_]+)',fam:'[a-z]+'/g)];
for (let i = 0; i < starts.length; i++) {
  const s0 = starts[i].index;
  const s1 = i + 1 < starts.length ? starts[i + 1].index : runtime.length;
  const seg = runtime.slice(s0, s1);
  const nm = seg.match(/name:'((?:[^'\\]|\\.)*)'/);
  const dm = seg.match(/desc:'((?:[^'\\]|\\.)*)'/);
  entries.push({ id: starts[i][1], name: (nm ? nm[1] : '').replace(/\\'/g, "'"), desc: (dm ? dm[1] : '').replace(/\\'/g, "'") });
}
const norm = (t) => String(t || '').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();

const seen = new Set();
const problems = [];
for (const { id, name, desc } of entries) {
  if (seen.has(id)) continue;
  seen.add(id);
  const file = path.join(contentDir, `${id}.json`);
  if (!fs.existsSync(file)) {
    problems.push(`${id}: in app-runtime.js but no content/tools/${id}.json`);
    continue;
  }
  const cms = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cms.name !== name) problems.push(`${id}: runtime "${name}" ≠ content "${cms.name}"`);
  if (norm(cms.desc) !== norm(desc)) {
    problems.push(`${id}: runtime description drifted from content/tools/${id}.json\n      runtime: ${norm(desc).slice(0, 90)}\n      content: ${norm(cms.desc).slice(0, 90)}`);
  }
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
