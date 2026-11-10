/**
 * PrivacyFold Git-Based CMS Loader (Next.js Server Component Engine)
 * Reads all tool definitions, SEO/AEO/GEO copy, presets, and Markdown blog articles
 * directly from the Git-tracked `/content` directory at build time.
 * No database or `/admin` runtime route is required: edit any file in `/content` and commit to Git.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface ToolSeoBlock {
  metaTitle: string;
  metaDescription: string;
  aeoSummary: string;
  steps: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export interface GitCmsTool {
  id: string;
  slug: string;
  fam: 'photo' | 'pdf' | 'forms' | 'image' | 'dev' | 'crypto';
  glyph: string;
  name: string;
  task: string;
  tag: string;
  accepts: 'image' | 'pdf' | 'text' | 'any' | 'none';
  desc: string;
  std: string;
  wasmModule: string;
  seo: ToolSeoBlock;
}

export interface GitCmsPreset {
  presetSlug: string;
  toolSlug: string;
  title: string;
  desc: string;
  args: Record<string, string | number | boolean>;
}

export interface GitCmsBlogPost {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  publishedAt: string;
  summary: string;
  relatedTool: string;
  body: string;
}

const CONTENT_ROOT = path.join(process.cwd(), 'content');

export function getAllToolsFromGit(): GitCmsTool[] {
  const dir = path.join(CONTENT_ROOT, 'tools');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    return JSON.parse(raw) as GitCmsTool;
  });
}

export function getToolFromGit(slugOrId: string): GitCmsTool | undefined {
  const directPath = path.join(CONTENT_ROOT, 'tools', `${slugOrId}.json`);
  if (fs.existsSync(directPath)) {
    return JSON.parse(fs.readFileSync(directPath, 'utf8')) as GitCmsTool;
  }
  return getAllToolsFromGit().find((t) => t.slug === slugOrId || t.id === slugOrId);
}

export function getAllPresetsFromGit(): GitCmsPreset[] {
  const dir = path.join(CONTENT_ROOT, 'presets');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as GitCmsPreset);
}

export function getPresetFromGit(toolSlug: string, presetSlug: string): GitCmsPreset | undefined {
  const p = path.join(CONTENT_ROOT, 'presets', `${presetSlug}.json`);
  if (!fs.existsSync(p)) return undefined;
  const data = JSON.parse(fs.readFileSync(p, 'utf8')) as GitCmsPreset;
  return data.toolSlug === toolSlug ? data : undefined;
}

function parseFrontmatterMarkdown(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw.trim());
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      data[k] = v;
    }
  }
  return { data, body: match[2].trim() };
}

export function getAllBlogsFromGit(): GitCmsBlogPost[] {
  const dir = path.join(CONTENT_ROOT, 'blog');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = parseFrontmatterMarkdown(raw);
      return {
        slug: data.slug || file.replace(/\.md$/, ''),
        title: data.title || '',
        category: data.category || 'Guide',
        readTime: data.readTime || '5 min read',
        publishedAt: data.publishedAt || '2026-11-01',
        summary: data.summary || '',
        relatedTool: data.relatedTool || 'passport-photo',
        body,
      };
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getBlogFromGit(slug: string): GitCmsBlogPost | undefined {
  const p = path.join(CONTENT_ROOT, 'blog', `${slug}.md`);
  if (!fs.existsSync(p)) return undefined;
  const { data, body } = parseFrontmatterMarkdown(fs.readFileSync(p, 'utf8'));
  return {
    slug: data.slug || slug,
    title: data.title || '',
    category: data.category || 'Guide',
    readTime: data.readTime || '5 min read',
    publishedAt: data.publishedAt || '2026-11-01',
    summary: data.summary || '',
    relatedTool: data.relatedTool || 'passport-photo',
    body,
  };
}
