import type { APIRoute } from 'astro';
import { GET as getSitemapIndex } from './sitemap.xml';

export const GET: APIRoute = getSitemapIndex;
