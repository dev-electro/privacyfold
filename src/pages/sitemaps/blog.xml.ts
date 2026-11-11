import type { APIRoute } from 'astro';
import { getAllBlogsFromGit } from '../../lib/cms';
import { getGitLastMod } from '../../lib/git-dates';

export const GET: APIRoute = async () => {
  const blogs = getAllBlogsFromGit();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogs
  .map((b) => {
    const lastmod = b.publishedAt || getGitLastMod(`content/blog/${b.slug}.md`);
    return `  <url>
    <loc>https://privacyfold.com/blog/${b.slug}/</loc>
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

