import type { APIRoute } from 'astro';
import { getAllLocalizedToolsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const tools = getAllLocalizedToolsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tools
  .map((t) => {
    const lastmod = t.last_reviewed || getGitLastMod(`content/i18n/${t.locale}/tools/${t.translation_of || t.slug}.json`);
    return `  <url>
    <loc>https://privacyfold.com/${t.locale}/tools/${t.slug}/</loc>
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

