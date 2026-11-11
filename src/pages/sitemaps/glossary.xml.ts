import type { APIRoute } from 'astro';
import { getAllGlossaryTermsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const glossary = getAllGlossaryTermsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${glossary
  .map((g) => {
    const lastmod = g.reviewed || getGitLastMod(`content/glossary/${g.slug}.md`);
    return `  <url>
    <loc>https://privacyfold.com/glossary/${g.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

