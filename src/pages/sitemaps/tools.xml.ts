import type { APIRoute } from 'astro';
import { getAllToolsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const tools = getAllToolsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tools
  .map((t) => {
    const lastmod = getGitLastMod(`content/tools/${t.id}.json`);
    return `  <url>
    <loc>https://privacyfold.com/tools/${t.slug}/</loc>
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

