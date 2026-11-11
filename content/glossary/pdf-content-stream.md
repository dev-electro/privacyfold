---
term: "PDF Content Stream"
definition: "The internal sequence of binary instructions and graphical operators within a PDF document that dictate page geometry, font selection, vector paths, and rendered text glyphs."
aliases:
  - "PDF Stream"
  - "PDF Page Dictionary"
related_tools:
  - "pdf-redact"
  - "pdf-merge"
reviewed: "2026-11-10"
---

## Inside a PDF Document

Unlike images, PDFs are composed of structured object streams containing text drawing operators (`Tj`, `TJ`), coordinate transformations (`cm`), and graphics states.

Superficial redaction tools draw black boxes on top of content streams, leaving underlying text accessible to copy-paste. PrivacyFold's destructive redactor excises the text operators from the content stream itself.
