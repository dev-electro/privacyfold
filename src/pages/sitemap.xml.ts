import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().split('T')[0];

  const sitemaps = [
    { loc: 'https://privacyfold.com/sitemaps/tools.xml', lastmod: today },
    { loc: 'https://privacyfold.com/sitemaps/presets.xml', lastmod: today },
    { loc: 'https://privacyfold.com/sitemaps/blog.xml', lastmod: today },
    { loc: 'https://privacyfold.com/sitemaps/glossary.xml', lastmod: today },
    { loc: 'https://privacyfold.com/sitemaps/pages.xml', lastmod: today },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
