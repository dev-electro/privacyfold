import type { APIRoute } from 'astro';
import { getAllPresetsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const presets = getAllPresetsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${presets
  .map((p) => {
    const lastmod = p.last_verified || getGitLastMod(`content/presets/${p.presetSlug}.json`);
    return `  <url>
    <loc>https://privacyfold.com/tools/${p.toolSlug}/${p.presetSlug}/</loc>
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

