import type { GitCmsTool } from './cms';
import { FAMILIES } from './cms';

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

export function generateHomeJsonLdGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://privacyfold.com/#organization',
        name: 'PrivacyFold',
        url: 'https://privacyfold.com/',
        logo: 'https://privacyfold.com/icon.svg',
        description: 'Client-side file and privacy tools running 100% locally in browser RAM. Zero server uploads.',
        sameAs: [
          'https://github.com/dev-electro/privacyfold',
          'https://x.com/privacyfold',
          'https://www.linkedin.com/company/privacyfold',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://privacyfold.com/#website',
        name: 'PrivacyFold',
        url: 'https://privacyfold.com/',
        description: 'File tools that never see your files. 100% in-browser processing via WebAssembly, WebGPU and WebCrypto.',
        publisher: {
          '@id': 'https://privacyfold.com/#organization',
        },
      },
    ],
  };
}

