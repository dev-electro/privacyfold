# PrivacyFold — Architecture & Development Blueprint

> **PrivacyFold.com** is a privacy-first, 100% client-side utility platform tailored for Western markets. Built on WebAssembly (WASM), Astro, and Tailwind CSS v4, it processes sensitive documents, images, and data entirely inside the user's browser tab with **zero cloud uploads**.
>
> It features a dual-consumption model: a tactile, physics-based UI for humans, and a thin Model Context Protocol (MCP) bridge for AI agents.

---

## 📚 Master Documentation Index

All foundational strategy, technical specifications, and design system documents are stored in this directory:

### 1. [Market Analysis & Strategy](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-market-analysis.md)
* **Market Landscape & Gap:** Why we don't compete with legacy PDF giants (Smallpdf, iLovePDF), but rather own the "zero-upload privacy utility" category in Western jurisdictions (US, UK, EU, CA, AU).
* **Catalog of 50+ Western Tools:** Full catalog mapping USCIS immigration forms, IRS/HMRC tax prep, passport photo resizers, ADA-compliant document formatters, dev tools, and crypto/privacy utilities.
* **AEO / GEO / AI Citations Strategy:** Tactics to dominate answer engines (Perplexity, ChatGPT, Claude, Google AI Overviews) and secure persistent LLM citations.
* **The Agentic Moat:** Becoming the default tool-calling layer for autonomous coding and desktop agents via machine-readable schemas.

---

### 2. [Zero-Cost Infrastructure Blueprint](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-infrastructure.md)
* **Strict $0 Hosting Model:** Hosted entirely on **Cloudflare Pages** static assets — unlimited requests, unmetered bandwidth, zero server compute.
* **Zero Workers Architecture:** Completely eliminates Cloudflare Workers and dynamic edge databases to prevent hitting request quotas during viral spikes or heavy AI crawler traffic.
* **Thin MCP Bridge (`@privacyfold/mcp`):** The npm package runs on the *agent's* machine via `stdio` and dynamically fetches fresh tool registries from `privacyfold.com` on startup.
* **Per-Tool Micro-WASM:** Individual, highly optimized WASM modules (~15KB to 500KB) loaded on demand per tool rather than a heavy monolithic binary.
* **Astro Content Collections + Git Engine:** Zero-runtime CMS; all tools and presets are managed in Git and statically pre-rendered at build time.

---

### 3. [Deterministic WASM Core & Dual-Mode Engine](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-core-and-ui.md)
* **Single Deterministic Core:** The exact same `.wasm` binary and function executes whether invoked by a human clicking a button or an agent passing URL parameters (`?mode=agent`).
* **Parameter Normalization:** Strict parameter casting ensuring byte-identical outputs across form submissions and query strings.
* **Environment & Ambient Awareness:** Adaptive theming using CSS `light-dark()`, system `prefers-color-scheme`, and optional Ambient Light Sensor APIs.
* **Agent Mode Stripping:** Automated headless mode for Puppeteer and AI browser agents that strips all decorative UI and signals completion via `window.__PRIVACYFOLD_RESULT__`.

---

### 4. [Tactile UI/UX Design System](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-ui-design-system.md)
* **Live Interactive Reference UI:** [reference-ui.html](file:///Users/gauravsuthar/Projects/searches/privacyfold/reference-ui.html) (standalone interactive implementation of the desk board, tool families, origami paper packet, depth ladder, and receipt slip).
* **The Anti-Fragmentation Stack:** Unified Astro + Tailwind CSS v4 + Motion stack to ensure consistent visual language across all 50+ tools.
* **Liquid Glass Spec:** Design tokens for frosted glassmorphism, depth layers, and cursor-reactive spotlight cards.
* **Spring Physics & Kinetic Drag-Drop:** Physics-based drop zones with spring tension, landing impacts, and idle breathing states.
* **Zero-Asset Web Audio Haptics:** 25 lines of native Web Audio API code synthesizing crisp mechanical switch clicks and suction pops with 0KB asset weight.
* **Standardized 2-Column Cockpit Layout:** Universal `<ToolLayout.astro>` component ensuring layout coherence across the entire catalog.

---

### 5. [Long-Tail Keyword × Preset Strategy](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-longtail-preset-strategy.md)
* **83 Presets → 300+ Pages:** Every preset generates a dedicated long-tail SEO landing page at build time (e.g., `/tools/compress-pdf/for/uk-visa-vfs`).
* **Portal-Specific Requirements:** Exact file size, DPI, dimensions, and format requirements for USCIS, HMRC, VFS Global, Amazon, LinkedIn, and 70+ more portals.
* **AI Agent Preset Routing:** Agents call `preset_id: "uk-visa-vfs"` instead of guessing parameters — zero-prompt workflows.
* **Localized Slugs:** Each preset page is generated in up to 25 locales with translated URLs.

---

### 6. [Growth, Expansion & Virality Strategy](file:///Users/gauravsuthar/Projects/searches/privacyfold/docs/privacyfold-growth-strategy.md)
* **Tool Expansion Roadmap:** 30+ new tools prioritized by Google search volume × AdSense CPC.
* **Zero-Cost AI Agent API:** MCP `stdio` bridge architecture where agents run the compute, not us.
* **i18n Implementation:** 25 locales covering all EU countries and Tier 1/2 AdSense geos.
* **Viral Playbook:** Multi-phase strategy across HN, Reddit, Product Hunt, AI citation engines, and open-source.
* **Revenue Optimization:** Dual ad network strategy (Carbon/EthicalAds + AdSense) by tool niche.

---

## 🛠️ Tech Stack Quick Reference

| Layer | Technology | Role |
|---|---|---|
| **Static Framework** | **Astro (SSG)** | Zero-JS static generation, Islands architecture |
| **Styling** | **Tailwind CSS v4** | CSS-first `@theme` design tokens |
| **Physics / Motion** | **Motion One** | Compositor-thread spring animations |
| **Execution Core** | **WebAssembly (Rust / C++)** | 100% client-side deterministic compute |
| **Hosting & CDN** | **Cloudflare Pages** | $0 unmetered static CDN |
| **Agent Protocol** | **Model Context Protocol (MCP)** | Machine-readable tool calling |
| **CMS / Content** | **Astro Content Collections** | Type-safe Git-based content engine |
| **Icons** | **Lucide Icons** | Accessible, consistent iconography |
| **Analytics** | **Cloudflare Web Analytics + PostHog** | Privacy-first, cookieless telemetry |

