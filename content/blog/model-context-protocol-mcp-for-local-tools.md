---
title: "Building for Humans and AI Agents: Model Context Protocol (@privacyfold/mcp) & Deterministic Schemas"
slug: "model-context-protocol-mcp-for-local-tools"
category: "AI Agents & MCP"
readTime: "6 min read"
publishedAt: "2026-11-06"
summary: "How a single JSON tool manifest powers both an accessible human interface and deterministic tool-calling for Claude Desktop, Cursor, and autonomous agents."
relatedTool: "json-format"
---

PrivacyFold uses a single declarative tool manifest in Git (`content/tools/*.json`) to drive both its human UI controls and its Model Context Protocol (`@privacyfold/mcp`) server.

- **Flip the Page:** Peel the top-right corner of the Settings card on any tool to inspect the exact URL API link, JSON-RPC `tools/call` payload, and structured output.
- **Visible Co-Worker Agent:** Click **Watch an agent do this** to see an agent operate the real UI controls with **Pause** and **Take over** buttons.
