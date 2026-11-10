# PrivacyFold — Production Next.js + Git-Based CMS + WebAssembly/WebGPU Monorepo

**File tools that never see your files.** Everything runs 100% inside the browser tab via WebAssembly, WebGPU, HTML5 Canvas, and WebCrypto—or locally via `@privacyfold/mcp`—with zero server uploads.

## Git-Based CMS Architecture (`content/`)

All content, tool manifests, SEO/AEO/GEO guides, FAQs, long-tail presets, blog articles, and WASM integrity hashes are managed directly via **Git-tracked files in `content/`** (no `/admin` UI or external database required):

```text
privacyfold-nextjs/
├── content/
│   ├── config/
│   │   ├── site.json               # Global site metadata, CSP & AdSense slot config
│   │   └── wasm-sri.json           # SHA-256 Subresource Integrity hashes for WASM binaries
│   ├── tools/                      # 40 individual Git-tracked JSON files (1 per tool + SEO/AEO/FAQ)
│   ├── presets/                    # 12 long-tail programmatic SEO preset JSON files
│   └── blog/                       # 6 full-length Markdown guides with YAML frontmatter
├── scripts/
│   └── validate-git-cms.mjs        # Validates all Git-CMS schemas before build/commit
├── src/
│   ├── lib/git-cms/index.ts        # Node fs/path build-time loader for content/tools, presets & blog
│   ├── lib/seo/schema-generator.ts # Multi-entity JSON-LD @graph builder (SoftwareApplication, HowTo, FAQPage)
│   ├── components/
│   │   ├── ToolSeoArticle.tsx      # Rich editorial guide & spec table rendered on every tool route
│   │   ├── AdSenseUnit.tsx         # CLS-safe (0.00 shift), non-personalized (npa=1) AdSense component
│   │   └── PrivacyFoldApp.tsx      # Interactive 40-tool Origami workspace & mobile drawer
│   └── app/                        # Next.js static export routes (/, /tools/[toolSlug], /blog/[slug], sitemap.xml)
├── packages/mcp-server/            # @privacyfold/mcp stdio server for Claude Desktop, Cursor & Windsurf
└── dist/index.html                 # Pre-compiled standalone production bundle
```

## Commands

```bash
# Validate all 40 tool JSONs, 12 presets & 6 Markdown blog posts in /content:
npm run cms:validate

# Start local development server:
npm install && npm run dev

# Build static production export:
npm run build
```
