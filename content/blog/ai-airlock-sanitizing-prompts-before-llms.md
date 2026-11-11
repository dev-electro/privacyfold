---
title: "The AI Airlock Pattern: Stripping PII and Secrets Locally Before Prompting Cloud LLMs"
slug: "ai-airlock-sanitizing-prompts-before-llms"
category: "AI Security"
readTime: "5 min read"
publishedAt: "2026-11-09"
summary: "How to debug production logs and contracts with ChatGPT, Claude, or Gemini without leaking customer emails, IP addresses, or bearer tokens."
relatedTool: "ai-airlock"
---

Before pasting logs, configs, or contracts into a cloud LLM, run them through `privacyfold.ai_airlock`. It replaces emails, API keys (`sk-...`, `ghp_...`), JWTs, phone numbers, and IPv4 addresses with reversible local tokens (`[EMAIL_1]`, `[SECRET_1]`) while keeping the mapping table strictly inside your browser tab.
