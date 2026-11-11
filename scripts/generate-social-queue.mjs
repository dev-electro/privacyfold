#!/usr/bin/env node
/**
 * scripts/generate-social-queue.mjs — Social Distribution Queue Generator (PF-028)
 *
 * Reads tool and blog records with `social` frontmatter blocks and drafts
 * weekly social media posts formatted for X (Twitter), LinkedIn, Reddit, and WhatsApp.
 * Adheres strictly to CLAIMS.md — zero exaggerated claims, zero upload honesty.
 *
 * Usage:
 *   node scripts/generate-social-queue.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const toolsDir = path.join(root, 'content/tools');
const queuePath = path.join(root, 'docs/social-queue.md');

const toolsWithSocial = [];
const toolFiles = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));

for (const file of toolFiles) {
  const t = JSON.parse(fs.readFileSync(path.join(toolsDir, file), 'utf8'));
  if (t.social && t.social.hook) {
    toolsWithSocial.push(t);
  }
}

let queueContent = `# Social Queue — PrivacyFold Distribution Drafts (PF-028)

> **Policy:** Human-in-the-loop review required before publishing.
> Every post must match the technical reality in \`docs/agent/CLAIMS.md\`.
> Tools run 100% locally in browser RAM with zero server uploads.

Generated: ${new Date().toISOString().split('T')[0]} · ${toolsWithSocial.length} active social tool campaigns.

---

## Repeatable Series: "Photo & Document Secrets"

Every week, reveal one hidden data leak (GPS coordinates, author metadata, unredacted text layers, tracking tokens) and how PrivacyFold fixes it with zero network uploads.

`;

for (const t of toolsWithSocial) {
  const s = t.social;
  const canonicalUrl = `https://privacyfold.com/tools/${t.slug}/`;
  const hashtags = (s.hashtags || []).map((h) => `#${h}`).join(' ');

  queueContent += `
### Tool: ${t.name} (\`${t.slug}\`)

- [ ] **Published this week**

#### 𝕏 / Twitter
\`\`\`text
${s.hook}

${s.proof}

100% private in-browser tool (zero server uploads):
${canonicalUrl}?utm_source=x&utm_medium=social&utm_campaign=${t.slug}

${hashtags}
\`\`\`

#### LinkedIn
\`\`\`text
${s.hook}

Most people assume web utilities need to upload your confidential files to their servers. PrivacyFold is built differently: everything runs locally on your device via client-side WebAssembly and WebCrypto.

• ${s.proof}
• Works 100% offline via Service Worker
• 0 bytes uploaded to any remote server

Run it privately:
${canonicalUrl}?utm_source=linkedin&utm_medium=social&utm_campaign=${t.slug}

#Privacy #Infosec #DataProtection #WebAssembly #OpenSource
\`\`\`

#### Reddit (r/privacy, r/cybersecurity, r/webdev)
\`\`\`text
Title: Free client-side tool to ${t.task.toLowerCase()} (runs in-browser with zero uploads)

Body:
Hey everyone,

${s.hook}

I built an in-browser utility for this as part of PrivacyFold:
${canonicalUrl}?utm_source=reddit&utm_medium=social&utm_campaign=${t.slug}

Technical details:
- Runs entirely in client-side memory using ${t.wasmModule || 'WebAssembly & WebCrypto'}.
- Zero server backend: no file uploads, no storage buckets, no logs.
- You can verify zero network requests in your browser DevTools Network tab.

Feedback and suggestions welcome!
\`\`\`

#### WhatsApp & Signal (Private Sharing Snippet)
\`\`\`text
${s.hook} ${s.proof} Runs 100% locally on your phone/computer with zero uploads: ${canonicalUrl}
\`\`\`

---
`;
}

fs.writeFileSync(queuePath, queueContent, 'utf8');
console.log(`Generated social queue at docs/social-queue.md (${toolsWithSocial.length} campaigns drafted).`);

