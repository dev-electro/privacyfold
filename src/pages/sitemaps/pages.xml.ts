import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const staticPages = [
    { loc: 'https://privacyfold.com/', lastmod: '2026-11-11' },
    { loc: 'https://privacyfold.com/about/', lastmod: '2026-11-10' },
    { loc: 'https://privacyfold.com/privacy/', lastmod: '2026-11-10' },
    { loc: 'https://privacyfold.com/terms/', lastmod: '2026-11-10' },
    { loc: 'https://privacyfold.com/contact/', lastmod: '2026-11-10' },
    { loc: 'https://privacyfold.com/blog/', lastmod: '2026-11-11' },
    { loc: 'https://privacyfold.com/glossary/', lastmod: '2026-11-11' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

