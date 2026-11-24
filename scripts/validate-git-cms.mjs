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
const compareDir = path.join(root, 'content/compare');
const authorsDir = path.join(root, 'content/authors');
const pagesDir = path.join(root, 'content/pages');
const publicDir = path.join(root, 'public');

const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const presetFiles = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
const blogFiles = fs.readdirSync(blogsDir).filter((f) => f.endsWith('.md'));
const glossaryFiles = fs.existsSync(glossaryDir) ? fs.readdirSync(glossaryDir).filter((f) => f.endsWith('.md')) : [];
const engineFiles = fs.existsSync(enginesDir) ? fs.readdirSync(enginesDir).filter((f) => f.endsWith('.yaml')) : [];
const compareFiles = fs.existsSync(compareDir) ? fs.readdirSync(compareDir).filter((f) => f.endsWith('.md')) : [];
const authorFiles = fs.existsSync(authorsDir) ? fs.readdirSync(authorsDir).filter((f) => f.endsWith('.yaml')) : [];
const pageFiles = fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md')) : [];

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

// 0b. Publish the guide index. The in-app console used to count a hardcoded
//     array of four articles that have no page on disk; this is the real list.
{
  const posts = blogFiles.map((file) => {
    const raw = fs.readFileSync(path.join(blogsDir, file), 'utf8');
    const fm = (raw.split('---')[1] || '');
    const pick = (k) => {
      const m = fm.match(new RegExp('^' + k + ':\\s*"?(.*?)"?\\s*$', 'm'));
      return m ? m[1].replace(/^['"]|['"]$/g, '') : '';
    };
    return {
      slug: file.replace(/\.md$/, ''),
      title: pick('title'),
      description: pick('summary') || pick('description') || pick('desc'),
      date: pick('publishedAt') || pick('date') || pick('pubDate'),
      readTime: pick('readTime'),
      relatedTool: pick('relatedTool'),
      category: pick('category') || pick('cat') || 'Guide'
    };
  }).filter((p) => p.title);
  fs.writeFileSync(path.join(publicDir, 'blog-index.json'), JSON.stringify(posts, null, 2) + '\n');
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

for (const file of compareFiles) {
  const raw = fs.readFileSync(path.join(compareDir, file), 'utf8');
  if (!raw.startsWith('---') || !raw.includes('title:') || !raw.includes('slug:')) {
    console.error(`ERROR in content/compare/${file}: Missing YAML frontmatter or title/slug`);
    errors++;
  }
}

for (const file of authorFiles) {
  const raw = fs.readFileSync(path.join(authorsDir, file), 'utf8');
  if (!raw.includes('name:') || !raw.includes('role:')) {
    console.error(`ERROR in content/authors/${file}: Missing required author fields`);
    errors++;
  }
}

for (const file of pageFiles) {
  const raw = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  if (!raw.startsWith('---') || !raw.includes('title:')) {
    console.error(`ERROR in content/pages/${file}: Missing YAML frontmatter or title`);
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
  std: t.std || 'ECMAScript (any modern browser)',
  wasmModule: t.wasmModule,
  executionUrl: `https://privacyfold.com/tools/${t.slug}/?mode=agent`,
  presets: t.presets || []
}));
fs.writeFileSync(path.join(publicDir, 'tools.json'), JSON.stringify(cleanTools, null, 2) + '\n');

// 1d. Generate the JSON Schema set from the same records. The committed copies
//     carried a invented engine path for all 72 tools ("/wasm/photo/<tool>-v1.wasm"),
//     a "determinism tier" nothing verifies, and execution URLs built from the tool
//     id instead of its slug, so every one of them 404'd.
const schemaDir = path.join(publicDir, 'schemas');
fs.mkdirSync(schemaDir, { recursive: true });
const realEngine = (t) => {
  const e = String(t.Engine || '');
  return /libheif|sql\.js/i.test(e) && !/^none/i.test(e) ? e : 'none (plain JavaScript in the browser tab)';
};
const acceptsHint = {
  image: 'An image file (data URI or pasted File) processed in the tab; never uploaded.',
  pdf: 'A PDF file (data URI or pasted File) processed in the tab; never uploaded.',
  text: 'Text to process. Sent to the tool only through the URL fragment / local input.',
  any: 'A file or text value processed in the tab; never uploaded.',
  audio: 'An audio file processed in the tab; never uploaded.',
};
for (const t of tools) {
  const toolPresets = presets.filter((pr) => pr.toolSlug === t.slug).map((pr) => pr.presetSlug);
  const doc = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://privacyfold.com/schemas/${t.id}.json`,
    title: t.name,
    description: String(t.desc || t.description || '').replace(/\s+/g, ' ').trim(),
    'x-privacyfold-tool-id': t.id,
    'x-privacyfold-category': t.fam || t.category || 'dev',
    'x-privacyfold-standard': t.std || 'ECMAScript (any modern browser)',
    'x-privacyfold-engine': realEngine(t),
    'x-privacyfold-accepts': t.accepts || 'any',
    'x-privacyfold-execution-url': `https://privacyfold.com/tools/${t.slug}/?mode=agent#payload`,
    type: 'object',
    properties: {
      preset: { type: 'string', enum: toolPresets.length ? toolPresets : ['default'] },
      input: {
        type: 'string',
        description: acceptsHint[t.accepts] || acceptsHint.any,
      },
      options: { type: 'object', additionalProperties: true },
    },
    required: ['input'],
  };
  fs.writeFileSync(path.join(schemaDir, `${t.id}.json`), JSON.stringify(doc, null, 2) + '\n');
}
fs.writeFileSync(
  path.join(schemaDir, '_index.json'),
  JSON.stringify({
    $schema: 'https://privacyfold.com/schemas/index-v1.json',
    version: '2026.11.2',
    generated_by: 'scripts/validate-git-cms.mjs',
    license: 'CC-BY-4.0',
    tool_count: tools.length,
    preset_count: presets.length,
    tools: tools.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.name,
      category: t.fam || t.category || 'dev',
      standard: t.std || 'ECMAScript (any modern browser)',
      engine: realEngine(t),
      schema_url: `https://privacyfold.com/schemas/${t.id}.json`,
      execution_url: `https://privacyfold.com/tools/${t.slug}/?mode=agent#payload`,
    })),
  }, null, 2) + '\n'
);

// 1a. Publish the MCP manifest from the same records the site uses. It used to
//     be a hand-written file that advertised a /wasm/<fam>/<tool>-v1.wasm binary
//     for every tool (none exist), claimed WebAssembly for all 72, and pointed at
//     an npm package that was never published.
const mcpTools = tools.map((t) => {
  const engine = String(t.Engine || '');
  const real = /libheif|sql\.js|WebAssembly \(self-hosted\)/i.test(engine) && !/^none/i.test(engine);
  return {
    name: `privacyfold.${t.id}`,
    slug: t.slug,
    category: t.fam || t.category || 'dev',
    title: t.name,
    task: t.task,
    description: String(t.desc || t.description || '').replace(/\s+/g, ' ').trim(),
    standard: t.std || 'ECMAScript (any modern browser)',
    engine: real ? engine : null,
    url: `https://privacyfold.com/tools/${t.slug}/?mode=agent`,
  };
});
fs.mkdirSync(path.join(publicDir, '.well-known'), { recursive: true });
fs.writeFileSync(
  path.join(publicDir, '.well-known', 'mcp.json'),
  JSON.stringify({
    schema_version: '1.0',
    name: 'privacyfold',
    display_name: 'PrivacyFold',
    description:
      '72 client-side document, image, developer and cryptography tools that run inside the browser tab. ' +
      'Two of them embed a WebAssembly engine (libheif, sql.js); the rest are plain JavaScript. ' +
      'There is no remote MCP server: this manifest is a descriptive tool schema, and each URL opens the ' +
      'tool with agent hooks (?mode=agent) so a driving agent can run it locally.',
    homepage: 'https://privacyfold.com',
    transport: { type: 'none', note: 'No network transport. Run the tools in a browser; no user data is sent anywhere.' },
    tools: mcpTools,
  }, null, 2) + '\n'
);

// 1b. Publish the WASM SRI registry so the in-app integrity table reads the
//     binaries that actually ship instead of a hardcoded list.
const sriSrc = path.join(process.cwd(), 'content/config/wasm-sri.json');
if (fs.existsSync(sriSrc)) {
  fs.writeFileSync(path.join(publicDir, 'wasm-sri.json'), fs.readFileSync(sriSrc));
}

// 1c. Generate llms.txt / llms-full.txt from the same records. Both files used
//     to be hand-maintained: they advertised WebGPU + window.ai execution for all
//     72 tools, an unpublished `npx @privacyfold/mcp` package, and descriptions
//     for five tools that no longer matched what those tools do.
const pad = (n) => String(n);
const llmsHeader = (full) => [
  '# PrivacyFold — Client-Side Document & File Tools (no uploads)',
  '> 72 tools that run inside the browser tab. Two embed a WebAssembly engine (libheif for HEIC, sql.js for SQLite);',
  '> the other 70 are plain JavaScript using Canvas, Web Crypto and the File API. Files and text never leave the device,',
  '> there is no account and no server-side processing. There is no remote MCP server — the manifest below is descriptive.',
  '',
  '## Agent surface',
  '- Tool index: https://privacyfold.com/tools.json',
  '- MCP manifest (descriptive, transport: none): https://privacyfold.com/.well-known/mcp.json',
  '- JSON-LD schemas: https://privacyfold.com/schemas/_index.json',
  '- Changelog: https://privacyfold.com/changelog.json',
  '- Agent URL contract: https://privacyfold.com/tools/{slug}/?mode=agent&preset={presetSlug}#payload',
  '  (sensitive payloads go in the #fragment, which browsers never send to a server; there is no server)',
  '',
  `## Tools (${tools.length})`,
];
const toolLine = (t, full) => {
  const base = `- **${t.name}** (\`${t.id}\`): ${String(t.desc || t.description || t.task || '').replace(/\s+/g, ' ').trim()}`;
  if (!full) return base;
  return [
    base,
    `  - Task: ${t.task || '-'}`,
    `  - Accepts: ${t.accepts || 'any'}`,
    `  - Standard: ${t.std || 'ECMAScript (any modern browser)'}`,
    `  - Engine: ${t.Engine || 'none (plain JavaScript)'}`,
    `  - URL: https://privacyfold.com/tools/${t.slug}/`,
  ].join('\n');
};
const presetLines = (full) => {
  const lines = ['', `## Presets (${presets.length})`];
  for (const pr of presets.slice(0, full ? presets.length : 24)) {
    lines.push(`- \`${pr.presetSlug}\` — ${pr.title}${pr.authority_name ? ` (authority: ${pr.authority_name})` : ''} → /presets/${pr.presetSlug}.json`);
  }
  if (!full && presets.length > 24) lines.push(`- … ${presets.length - 24} more in https://privacyfold.com/llms-full.txt`);
  return lines;
};
fs.writeFileSync(path.join(publicDir, 'llms.txt'), [
  ...llmsHeader(false), ...tools.map((t) => toolLine(t, false)), ...presetLines(false),
  '', 'See https://privacyfold.com/llms-full.txt for the full record of every tool and preset.',
].join('\n') + '\n');
fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), [
  ...llmsHeader(true), ...tools.map((t) => toolLine(t, true)), ...presetLines(true),
].join('\n') + '\n');

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

console.log(`✓ Git-CMS Validated & Compiled: ${tools.length} tools, ${presetFiles.length} presets, ${blogFiles.length} blog guides, ${glossaryFiles.length} glossary terms, ${engineFiles.length} engine assets, ${compareFiles.length} comparisons, ${authorFiles.length} authors, ${pageFiles.length} trust pages.`);
