---
term: "Zero-Width Characters"
definition: "Invisible Unicode characters—such as Zero-Width Space (U+200B) and Zero-Width Joiner (U+200D)—that render with zero width on screen but can be embedded into text to create tracking watermarks."
aliases:
  - "Zero-Width Space"
  - "Invisible Unicode"
  - "Steganographic Watermarking"
related_tools:
  - "clean-paste"
  - "stego-seal"
reviewed: "2026-11-10"
---

## Invisible Fingerprinting in Copied Text

Zero-width characters occupy valid codepoints in the Unicode standard but take up zero pixels when displayed.

Certain platforms encode binary user IDs into copied text using permutations of zero-width characters (e.g. U+200B for 0, U+200C for 1) to track who copied internal documents. PrivacyFold's Clean Paste scrubber identifies and purges all zero-width markers automatically.
