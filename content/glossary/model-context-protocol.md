---
term: "Model Context Protocol"
definition: "The Model Context Protocol (MCP) is an open standard developed by Anthropic allowing AI assistants, LLMs, and development tools to securely query and invoke local tools and computational capabilities."
aliases:
  - "MCP"
  - "Model Context Protocol"
related_tools:
  - "api-builder"
  - "json-format"
reviewed: "2026-11-10"
---

## Connecting AI Models to Local Tools

The Model Context Protocol establishes a clean JSON-RPC interface between large language models and local machine capabilities.

PrivacyFold exposes all 72 client-side utilities via standard MCP tool declarations, enabling AI coding assistants to resize images, validate schemas, format code, and strip metadata deterministically on the user's workstation.
