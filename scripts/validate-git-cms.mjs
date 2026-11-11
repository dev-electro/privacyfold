#!/usr/bin/env node
/**
 * PrivacyFold Git-CMS Content Validator & Manifest Compiler
 * Validates all tool JSON files in `content/tools/`, preset files in `content/presets/`,
 * and Markdown blog guides in `content/blog/`, then compiles `public/tools.json`,
 * `public/presets.json`, and `public/.well-known/mcp.json` before build.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const toolsDir = path.join(root, 'content/tools');
const presetsDir = path.join(root, 'content/presets');
const blogsDir = path.join(root, 'content/blog');
const glossaryDir = path.join(root, 'content/glossary');
const enginesDir = path.join(root, 'content/engine');
const publicDir = path.join(root, 'public');

const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const presetFiles = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
const blogFiles = fs.readdirSync(blogsDir).filter((f) => f.endsWith('.md'));
const glossaryFiles = fs.existsSync(glossaryDir) ? fs.readdirSync(glossaryDir).filter((f) => f.endsWith('.md')) : [];
const engineFiles = fs.existsSync(enginesDir) ? fs.readdirSync(enginesDir).filter((f) => f.endsWith('.yaml')) : [];

let errors = 0;
const tools = [];
const presets = [];

for (const file of toolFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));
  if (!data.id || !data.slug || !data.name || !data.seo?.aeoSummary || !data.seo?.faqs?.length) {
    console.error(`ERROR in content/tools/${file}: Missing required tool or SEO/AEO fields`);
    errors++;
  }
  tools.push(data);
}

for (const file of presetFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf8'));
  if (!data.presetSlug || !data.toolSlug || !data.title) {
    console.error(`ERROR in content/presets/${file}: Missing required preset fields`);
    errors++;
  }
  presets.push(data);
}

for (const file of blogFiles) {
  const raw = fs.readFileSync(path.join(blogsDir, file), 'utf8');
  if (!raw.startsWith('---')) {
    console.error(`ERROR in content/blog/${file}: Missing YAML frontmatter`);
    errors++;
  }
}

for (const file of glossaryFiles) {
  const raw = fs.readFileSync(path.join(glossaryDir, file), 'utf8');
  if (!raw.startsWith('---') || !raw.includes('term:') || !raw.includes('definition:')) {
    console.error(`ERROR in content/glossary/${file}: Missing YAML frontmatter or required fields`);
    errors++;
  }
}

for (const file of engineFiles) {
  const raw = fs.readFileSync(path.join(enginesDir, file), 'utf8');
  if (!raw.includes('id:') || !raw.includes('sha256:') || !raw.includes('type:')) {
    console.error(`ERROR in content/engine/${file}: Missing required engine fields`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`Git-CMS Validation failed with ${errors} error(s).`);
  process.exit(1);
}

// 1. Compile public/tools.json
const cleanTools = tools.map((t) => ({
  id: t.id,
  slug: t.slug,
  name: t.name,
  fam: t.fam || t.category || 'dev',
  glyph: t.glyph || 'PF',
  task: t.task,
  tag: t.tag || t.badge,
  accepts: t.accepts || 'any',
  desc: t.desc || t.description,
  std: t.std || 'W3C WebAssembly Core 2.0',
  wasmModule: t.wasmModule || t.Engine,
  executionUrl: `https://privacyfold.com/tools/${t.slug}/?mode=agent`,
  presets: t.presets || []
}));
fs.writeFileSync(path.join(publicDir, 'tools.json'), JSON.stringify(cleanTools, null, 2) + '\n');

// 2. Compile public/presets.json
const cleanPresets = presets.map((p) => ({
  id: p.id || p.presetSlug,
  presetSlug: p.presetSlug,
  toolSlug: p.toolSlug,
  title: p.title,
  desc: p.desc,
  jurisdiction: p.jurisdiction || p.authority_name || 'Global',
  authority_name: p.authority_name,
  source_url: p.source_url,
  last_verified: p.last_verified,
  version: p.version,
  max_size_kb: p.max_size_kb
}));
fs.writeFileSync(path.join(publicDir, 'presets.json'), JSON.stringify(cleanPresets, null, 2) + '\n');

console.log(`✓ Git-CMS Validated & Compiled: ${tools.length} tools, ${presetFiles.length} presets, ${blogFiles.length} blog guides, ${glossaryFiles.length} glossary terms, ${engineFiles.length} engine assets.`);
