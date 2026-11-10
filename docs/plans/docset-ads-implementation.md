# How docset.in implements ads (distilled 2026-11-10 from `~/Projects/Docset v1`)

This is the implementation PrivacyFold will mirror (DEC-007). Source files named so it can be re-read.

## Architecture — 3 moving parts, everything else is placement

1. **`src/components/analytics/GoogleAdSense.jsx`** — the ONLY place the loader exists.
   `next/script strategy="afterInteractive"`, `?client=ca-pub-…`, `crossOrigin=anonymous`; sets `window.__adsenseLoaded` on load/error (drives ad-blocker detection). Preconnects (`pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`) live in the root layout head. Nothing else imports the script.

2. **`src/components/analytics/AdSlot.jsx`** — one component every unit goes through.
   - Variants per format: `auto | banner | in-article | sidebar | interstitial | anchor | multiplex | in-feed` (each maps format+layout key, not ad-hoc markup).
   - **Zero-CLS**: reserved `min-height` per id/variant in CSS (`#ad-slot-above-tool 60px`, `#ad-slot-mid-tool 100px`, `#ad-slot-below-tool 250px`, `#ad-slot-sidebar 250/600px`, `#ad-slot-multiplex 400px`; mobile overrides) — a late ad never shifts content.
   - **Lazy**: IntersectionObserver only pushes `(window.adsbygoogle = window.adsbygoogle || []).push({})` once the unit is near the viewport.
   - **Unfilled collapse**: `MutationObserver` watches `data-ad-status` on the `<ins>`; `unfilled` collapses the unit or swaps a fallback, so no empty reserved boxes.
   - **Fill telemetry**: one GA event per terminal state (`ad_slot_filled` / `ad_slot_unfilled`) with `slot_id, slot_name, slot_variant, page_type, lang` — every placement is measurable.
   - **Dev mode**: renders the placeholder without pushing, so design review sees the layout.

3. **`src/components/monetization/adBudget.js`** — the per-page cap (policy guard, not a suggestion).
   `MAX_ADS_TOOL_PAGE = 4`, `MAX_ADS_TEMPLATE_PAGE = 3` (mass-generated template routes), blog editorial pages uncapped. Every AdSlot **claims a seat before it may request an ad**; over-budget units render nothing (no request, no GA churn). Seats release on unmount, so client-side navigation resets the count. This is the code-level version of "fewer than 1 ad per 400 words".

## Config — one file, real publisher + real slot ids

`src/config/{external.js,monetization.js}`: `adsense.enabled`, `publisherId: ca-pub-2707121635941418`, and **11 named slots** (sidebar vertical, tool-runner auto, dashboard grid, blog in-article ×2, interstitial 300×250, sticky footer, multiplex autorelaxed, in-feed native, display square, banner strip). Site monetisation also mixes Amazon Associates (category-matched hardware cards, `maxCardsPerPage: 3` per Amazon policy) and a lead-gen banner — proof that the AdSlot + budget system sits under every revenue type, not just AdSense.

`public/ads.txt`: `google.com, pub-2707121635941418, DIRECT, f08c47fec0942fa0`.

## Placements ("ad moments") on a tool page — spacing as policy

`ToolRunner.jsx` (the workspace host):

- **`above` / post-result**: `displaySquare`, auto — `mt-10` (≥ 40 px) **after** the workspace, between it and SmartActions. Never before the download button, never beside it. Wrapped so affiliate alternates into the same moment.
- **`mid`**: `dashboardGrid`, auto — after `SmartActions`, so two units can never touch.
- **`below`**: `bannerStrip`, auto, lazy — bottom of the workspace.
- All inside `data-ad-moment="…"` attributes for CSS/GA.

Extra moments, each with its own gating component:

| Component | When it shows | Gates |
|---|---|---|
| `ProcessingAdModal` / `processingAd.js` | 300×250 captive panel **during REAL processing** (`runWithProcessingAd()`) | min-wait + `MAX_WAIT_MS=75000` safety valve; never shown for instant ops |
| `StickyFooterAd` | mobile `anchor` format | `max-width: 767px` only, **1500 ms delay**, `sessionStorage` dismissal for the session, mutex against the processing modal and workspaces |
| `DesktopSidebarAd` | desktop vertical rail, sticky `top-24` | **JS matchMedia ≥1280px — not CSS hiding**; a CSS-hidden `<ins>` would still request an ad and count against the budget |
| `PostResultAd` | below a result card, `mt-10`, lazy | never blocks/gates the download; documented usage contract |

## Where PrivacyFold differs — keep this honest

- DEC-005's "tool pages ad-free" was the founder plan's launch stance (§10 Option A); **DEC-007 supersedes it** with the DocSet system on tool pages too. Consequence noted as decided: the visitor claim must be precise — *your file is never uploaded* stays true; the page itself now makes ad requests to Google on tool pages, so copy and the privacy page must say that explicitly (tool keeps `connect-src` allowlist for pagead2 rather than pretending `'self'`).
- Inherited unchanged from the plan: manual units only (auto ads off — DocSet's slots are all manually wired), certified CMP before EEA/UK/CH personalised ads, `ads.txt` day one, ads.txt-shaped positions that never gate a download.
- DocSet anti-pattern NOT copied: no ad inside the primary header → primary task area (their standing preference: ads must not sit between header and primary task; state the trade-off when moving one).
