import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'], allow: ['/tools/', '/blog/', '/llms.txt', '/.well-known/mcp.json'] },
    ],
    sitemap: 'https://privacyfold.com/sitemap.xml',
  };
}
