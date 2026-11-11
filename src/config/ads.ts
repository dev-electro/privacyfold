/**
 * PrivacyFold Monetization & AdSense Configuration (DEC-005, DEC-007)
 * Implements the DocSet ad system architecture:
 * 1. Single publisher config with per-slot min-heights (zero CLS)
 * 2. Per-page budget caps (4 tool / 3 template)
 * 3. Manual units only (auto ads permanently disabled)
 * 4. Site launches ad-free during initial AdSense review (enabled: false)
 */

export interface AdSlotConfig {
  id: string;
  name: string;
  format: 'auto' | 'banner' | 'in-article' | 'sidebar' | 'rectangle';
  minHeightPx: number;
}

export const ADS_CONFIG = {
  enabled: false, // AdSense review starts ad-free; toggled to true once verified
  publisherId: 'ca-pub-2707121635941418',
  limits: {
    maxToolPage: 4,
    maxTemplatePage: 3,
    maxGuidePage: 3,
  },
  slots: {
    'tool-top': { id: 'slot-tool-top', name: 'Above Tool Workspace', format: 'banner', minHeightPx: 90 },
    'tool-mid': { id: 'slot-tool-mid', name: 'Mid Article', format: 'in-article', minHeightPx: 120 },
    'tool-bottom': { id: 'slot-tool-bottom', name: 'Below Article', format: 'banner', minHeightPx: 250 },
    'tool-sidebar': { id: 'slot-tool-sidebar', name: 'Desktop Sidebar Rail', format: 'sidebar', minHeightPx: 600 },
    'blog-top': { id: 'slot-blog-top', name: 'Blog Leaderboard', format: 'banner', minHeightPx: 90 },
    'blog-in-article': { id: 'slot-blog-in-article', name: 'Blog In-Article Unit', format: 'in-article', minHeightPx: 120 },
    'glossary-top': { id: 'slot-glossary-top', name: 'Glossary Leaderboard', format: 'banner', minHeightPx: 90 },
    'glossary-in-article': { id: 'slot-glossary-in-article', name: 'Glossary In-Article Unit', format: 'in-article', minHeightPx: 120 },
  } as Record<string, AdSlotConfig>,
};
