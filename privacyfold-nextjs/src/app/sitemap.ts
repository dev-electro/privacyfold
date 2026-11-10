import type { MetadataRoute } from 'next';
import { getAllToolsFromGit, getAllPresetsFromGit, getAllBlogsFromGit } from '@/lib/git-cms';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://privacyfold.com';
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/blog/`, changeFrequency: 'weekly', priority: 0.8 },
  ];
  const toolPages: MetadataRoute.Sitemap = getAllToolsFromGit().map((t) => ({
    url: `${base}/tools/${t.slug}/`,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));
  const presetPages: MetadataRoute.Sitemap = getAllPresetsFromGit().map((p) => ({
    url: `${base}/tools/${p.toolSlug}/${p.presetSlug}/`,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));
  const blogPages: MetadataRoute.Sitemap = getAllBlogsFromGit().map((b) => ({
    url: `${base}/blog/${b.slug}/`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
  return [...staticPages, ...toolPages, ...presetPages, ...blogPages];
}
