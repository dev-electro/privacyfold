#!/usr/bin/env node
/**
 * scripts/og-images.mjs — Open Graph Social Image Generator (PF-025)
 *
 * Generates 1200x630 branded social cards per tool and per blog guide
 * adhering to the PrivacyFold origami aesthetic:
 * warm paper stock, subtle grid, geometric origami crane, bold typography,
 * and the unambiguous technical guarantee: "0 BYTES UPLOADED".
 *
 * Caches outputs to ensure instantaneous rebuilds.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ogOutputDir = path.join(root, 'public/og');
const toolsDir = path.join(root, 'content/tools');
const blogDir = path.join(root, 'content/blog');

if (!fs.existsSync(ogOutputDir)) {
  fs.mkdirSync(ogOutputDir, { recursive: true });
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSvgCard({ title, subtitle, tag, category, glyph }) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeTag = escapeXml(tag || 'CLIENT-SIDE UTILITY');
  const safeCategory = escapeXml((category || 'TOOL').toUpperCase());

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Paper Background Texture -->
  <rect width="1200" height="630" fill="#F5F2E9"/>
  
  <!-- Subtle Blueprint Grid Lines -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E6E0D2" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)" />

  <!-- Inner Surface Card -->
  <rect x="48" y="48" width="1104" height="534" rx="16" fill="#FDFCF8" stroke="#DAD5C5" stroke-width="2"/>

  <!-- Top Atelier Bar -->
  <g transform="translate(88, 88)">
    <!-- Origami Crane Logo -->
    <path d="M0 0h24l10.5 10.5v25.5H0z" fill="#FF5A1F" stroke="#17160F" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M24 0v10.5h10.5z" fill="#B7330A" stroke="#17160F" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="46" y="26" font-family="'Helvetica Neue', Arial, sans-serif" font-size="24" font-weight="800" fill="#17160F" letter-spacing="-0.5">PrivacyFold</text>
    <rect x="200" y="4" width="130" height="28" rx="4" fill="#F3F0E6" stroke="#DAD5C5"/>
    <text x="265" y="23" font-family="ui-monospace, monospace" font-size="12" font-weight="600" fill="#5B5A4E" text-anchor="middle" letter-spacing="1">${safeCategory}</text>
  </g>

  <!-- Technical Privacy Seal Pill (Top Right) -->
  <g transform="translate(840, 88)">
    <rect x="0" y="0" width="272" height="36" rx="6" fill="#E8F5E9" stroke="#A5D6A7"/>
    <circle cx="20" cy="18" r="5" fill="#2E7D32"/>
    <text x="36" y="23" font-family="ui-monospace, monospace" font-size="12" font-weight="700" fill="#1B5E20" letter-spacing="0.5">ZERO SERVER UPLOADS</text>
  </g>

  <!-- Tool Category / Tag Badge -->
  <g transform="translate(88, 190)">
    <rect x="0" y="0" width="160" height="32" rx="4" fill="#FF5A1F" opacity="0.1"/>
    <rect x="0" y="0" width="160" height="32" rx="4" stroke="#FF5A1F" stroke-width="1.5"/>
    <text x="80" y="21" font-family="ui-monospace, monospace" font-size="13" font-weight="700" fill="#FF5A1F" text-anchor="middle" letter-spacing="0.5">${safeTag}</text>
  </g>

  <!-- Main Headline Title -->
  <text x="88" y="285" font-family="'Helvetica Neue', Arial, sans-serif" font-size="54" font-weight="800" fill="#17160F" letter-spacing="-1">
    ${safeTitle.length > 36 ? safeTitle.slice(0, 34) + '...' : safeTitle}
  </text>

  <!-- Subtitle Description -->
  <foreignObject x="88" y="325" width="1024" height="120">
    <p xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 24px; line-height: 1.45; color: #5B5A4E; margin: 0;">
      ${safeSubtitle.length > 140 ? safeSubtitle.slice(0, 137) + '...' : safeSubtitle}
    </p>
  </foreignObject>

  <!-- Bottom Divider Line -->
  <line x1="88" y1="480" x2="1112" y2="480" stroke="#DAD5C5" stroke-width="1.5"/>

  <!-- Footer Guarantees -->
  <g transform="translate(88, 515)">
    <text x="0" y="16" font-family="ui-monospace, monospace" font-size="14" font-weight="600" fill="#17160F">
      100% In-Browser Execution · WebAssembly &amp; WebCrypto · No Logins
    </text>
    <text x="1024" y="16" font-family="ui-monospace, monospace" font-size="14" font-weight="600" fill="#FF5A1F" text-anchor="end">
      privacyfold.com
    </text>
  </g>
</svg>`;
}

console.log('Generating Open Graph social cards (PF-025)...');
let toolCount = 0;
let blogCount = 0;

// Generate for tools
const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
for (const file of toolFiles) {
  const t = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));
  const outPath = path.join(ogOutputDir, `${t.slug}.svg`);

  // Cache check
  if (!fs.existsSync(outPath)) {
    const svg = generateSvgCard({
      title: t.name,
      subtitle: t.task || t.desc,
      tag: t.tag || t.badge,
      category: t.fam || 'tool',
      glyph: t.glyph,
    });
    fs.writeFileSync(outPath, svg, 'utf8');
  }
  toolCount++;
}

// Generate for blog guides
const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
for (const file of blogFiles) {
  const slug = file.replace(/\.md$/, '');
  const outPath = path.join(ogOutputDir, `blog-${slug}.svg`);

  if (!fs.existsSync(outPath)) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const titleMatch = raw.match(/title:\s*"([^"]+)"/);
    const summaryMatch = raw.match(/summary:\s*"([^"]+)"/);
    const catMatch = raw.match(/category:\s*"([^"]+)"/);

    const svg = generateSvgCard({
      title: titleMatch ? titleMatch[1] : slug,
      subtitle: summaryMatch ? summaryMatch[1] : 'In-depth engineering guide to client-side privacy architecture.',
      tag: 'GUIDE',
      category: catMatch ? catMatch[1] : 'BLOG',
    });
    fs.writeFileSync(outPath, svg, 'utf8');
  }
  blogCount++;
}

console.log(`✓ Open Graph social cards ready: ${toolCount} tools, ${blogCount} blog guides in public/og/`);
