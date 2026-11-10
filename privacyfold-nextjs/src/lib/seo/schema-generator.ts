import type { GitCmsTool } from '../git-cms';
import { FAMILIES } from '../tools/registry';

export function generateToolJsonLdGraph(tool: GitCmsTool, canonicalUrl: string) {
  const famName = FAMILIES[tool.fam]?.name || 'Utility';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonicalUrl}#app`,
        name: `${tool.name} — PrivacyFold`,
        url: canonicalUrl,
        applicationCategory: `${famName}Application`,
        operatingSystem: 'Web Browser (Windows, macOS, Linux, iOS, Android)',
        description: tool.desc,
        offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'USD' },
        featureList: [
          '100% client-side execution in browser RAM (0 server uploads)',
          `Complies with ${tool.std}`,
          `Powered by ${tool.wasmModule}`,
          'Works offline via Progressive Web App Service Worker',
          'Deterministic Model Context Protocol (MCP) JSON-RPC support',
        ],
      },
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: `How to ${tool.task.toLowerCase()} privately in your browser`,
        step: tool.seo.steps.map((text, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: `Step ${idx + 1}`,
          text,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: tool.seo.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PrivacyFold', item: 'https://privacyfold.com/' },
          { '@type': 'ListItem', position: 2, name: famName, item: 'https://privacyfold.com/#tools' },
          { '@type': 'ListItem', position: 3, name: tool.name, item: canonicalUrl },
        ],
      },
    ],
  };
}
