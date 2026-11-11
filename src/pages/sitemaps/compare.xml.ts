import type { APIRoute } from 'astro';
import { getAllComparisonsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const comparisons = getAllComparisonsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://privacyfold.com/compare/</loc>
    <lastmod>${getGitLastMod('src/pages/compare/index.astro')}</lastmod>
  </url>
${comparisons
  .map(
    (c) => `  <url>
    <loc>https://privacyfold.com/compare/${c.slug}/</loc>
    <lastmod>${c.reviewed || getGitLastMod(`content/compare/${c.slug}.md`)}</lastmod>
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
