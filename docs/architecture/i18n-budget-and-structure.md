# Internationalization (i18n) Budget Math & Hreflang Architecture (PF-029)

**Status:** Decided & Scaffolded (DEC-004 §3 & §6).
**Reference:** `docs/plans/content-seo-ads-foundation-2026-11-10.md` §3, §6, §11.

---

## 1. Cloudflare Pages 20,000 File Budget Math

Cloudflare Pages imposes a hard ceiling of **20,000 files per deployment** on the free tier. Scaling international routes requires strict accounting before generating multi-locale presets.

### Current Inventory (Single Locale — English)
- Static HTML pages: 183 pages (72 tools, 87 presets, 6 blog guides, 15 glossary terms, 4 trust/legal pages, Desk homepage).
- Public static assets: ~220 files (schemas, wasm binaries, fonts, icons, manifests).
- **Total English baseline:** ~403 files.

### 25 Locales Projection
Phase 1 target: English (default/x-default) + 24 localized language editions (e.g., Hindi `hi`, Spanish `es`, German `de`, French `fr`, Japanese `ja`, Portuguese `pt`, Arabic `ar`, etc.).

| Surface | Per Locale | × 25 Locales | Cloudflare 20k Budget Utilisation |
|---|---|---|---|
| Flagship Tools (72) | 72 | 1,800 | 9.0% |
| Curated Presets (87) | 87 | 2,175 | 10.9% |
| Core Blog & Glossary (21) | 21 | 525 | 2.6% |
| Trust / Legal pages (4) | 4 | 100 | 0.5% |
| Shared Assets (WASM/Fonts/Images) | shared (1x) | 220 | 1.1% |
| **Total Phase 1 Static Export** | **184** | **4,820 files** | **24.1% of 20,000 cap** |

### Safety Margin & Scale Ceiling
- Phase 1 consumes **4,820 files**, leaving **15,180 files of headroom (75.9% free)**.
- Scaling ceiling: PrivacyFold can safely host up to **650 presets per language across 25 locales** before approaching the 20,000 Cloudflare Pages deployment ceiling.

---

## 2. URL Prefix & Directory Convention

- Default language (English): `/tools/[tool-slug]/` (serves as canonical `x-default`).
- Localized language editions: `/[lang]/tools/[tool-slug]/` (e.g., `/hi/tools/exif-strip/`, `/es/tools/exif-strip/`).
- Localized presets: `/[lang]/tools/[tool-slug]/[preset-slug]/`.

---

## 3. Provenance & Translation Schema

Every localized content entry must be anchored to an authoritative source record and verified by a named reviewer:

```yaml
id: exif_strip_hi
slug: exif-strip
translation_of: exif_strip          # canonical tool ID
locale: hi                          # BCP 47 language tag
name: फोटो मेटाडेटा और जीपीएस लोकेटर रिमूवर
task: फोटो से जीपीएस लोकेशन और संवेदनशील EXIF मेटाडेटा हटाएं
reviewed_by: Gaurav Suthar          # Human reviewer accountability
last_reviewed: 2026-11-10
status: live
index: true
```

---

## 4. Hreflang Graph Specification

Every page in the hreflang graph must self-reference and symmetrically reference all alternate translations, including `x-default`:

```html
<link rel="alternate" hreflang="x-default" href="https://privacyfold.com/tools/exif-strip/" />
<link rel="alternate" hreflang="en" href="https://privacyfold.com/tools/exif-strip/" />
<link rel="alternate" hreflang="hi" href="https://privacyfold.com/hi/tools/exif-strip/" />
<link rel="alternate" hreflang="es" href="https://privacyfold.com/es/tools/exif-strip/" />
```

Rules:
1. No orphan translations: if language `A` links to language `B`, language `B` **must** link back to language `A`.
2. Self-reference: every page includes its own URL with its exact `hreflang`.
3. `x-default`: always points to the un-prefixed English canonical route.
