import type { APIRoute } from 'astro';
import { getAllToolsFromGit, getAllPresetsFromGit, getAllBlogsFromGit, getAllGlossaryTermsFromGit } from '../lib/cms';

export const GET: APIRoute = async () => {
  const tools = getAllToolsFromGit();
  const presets = getAllPresetsFromGit();
  const blogs = getAllBlogsFromGit();
  const glossary = getAllGlossaryTermsFromGit();

  const staticPages = [
    '',
    'about/',
    'privacy/',
    'terms/',
    'contact/',
    'blog/',
    'glossary/',
  ];

  const toolPages = tools.map((t) => `tools/${t.slug}/`);
  const presetPages = presets.map((p) => `tools/${p.toolSlug}/${p.presetSlug}/`);
  const blogPages = blogs.map((b) => `blog/${b.slug}/`);
  const glossaryPages = glossary.map((g) => `glossary/${g.slug}/`);

  const allPages = [...staticPages, ...toolPages, ...presetPages, ...blogPages, ...glossaryPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>https://privacyfold.com/${p}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
