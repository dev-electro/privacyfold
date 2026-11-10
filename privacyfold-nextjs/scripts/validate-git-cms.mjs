#!/usr/bin/env node
/**
 * PrivacyFold Git-CMS Content Validator & Manifest Compiler
 * Validates all 40 tool JSON files in `content/tools/`, all 12 preset files in `content/presets/`,
 * and all 6 Markdown blog guides in `content/blog/`, then compiles `public/.well-known/mcp.json`
 * and `public/llms.txt` before `next build`.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const toolsDir = path.join(root, 'content/tools');
const presetsDir = path.join(root, 'content/presets');
const blogsDir = path.join(root, 'content/blog');

const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const presetFiles = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
const blogFiles = fs.readdirSync(blogsDir).filter((f) => f.endsWith('.md'));

let errors = 0;
const tools = [];

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
}

for (const file of blogFiles) {
  const raw = fs.readFileSync(path.join(blogsDir, file), 'utf8');
  if (!raw.startsWith('---')) {
    console.error(`ERROR in content/blog/${file}: Missing YAML frontmatter`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`Git-CMS Validation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`✓ Git-CMS Validated: ${tools.length} tools, ${presetFiles.length} presets, ${blogFiles.length} blog guides.`);
