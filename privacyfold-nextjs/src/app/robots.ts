import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/'],
      },
      {
        userAgent: ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'],
        allow: ['/', '/tools/', '/blog/', '/llms.txt', '/.well-known/mcp.json'],
        disallow: ['/admin/'],
      },
      {
        userAgent: ['ChatGPT-User', 'Claude-User', 'Perplexity-User'],
        allow: '/',
        disallow: ['/admin/'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'],
        allow: ['/tools/', '/blog/', '/llms.txt'],
        disallow: ['/admin/'],
      },
    ],
    sitemap: 'https://privacyfold.com/sitemap.xml',
  };
}
