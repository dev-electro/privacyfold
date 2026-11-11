/**
 * PrivacyFold Git-Based CMS Loader (Astro Static Engine)
 * Reads all tool definitions, SEO/AEO/GEO copy, presets, and Markdown blog articles
 * directly from the Git-tracked root `/content` directory at build time.
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

export interface SettingExplanation {
  name: string;
  description: string;
  safeDefault: string;
  example: string;
}

export interface WhatToExpect {
  results: string;
  limits: string;
  benchmarks: string;
}

export interface PrivacyProof {
  howItWorks: string;
  verificationSteps: string[];
  openSourceNotice: string;
}

export interface ToolByline {
  author: string;
  reviewer: string;
  reviewedDate: string;
  sources: Array<{ name: string; url: string }>;
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
  settingsExplained?: SettingExplanation[];
  whatToExpect?: WhatToExpect;
  privacyProof?: PrivacyProof;
  byline?: ToolByline;
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

export interface GitCmsGlossaryTerm {
  slug: string;
  term: string;
  definition: string;
  aliases: string[];
  related_tools: string[];
  reviewed: string;
  body: string;
}

const CONTENT_ROOT = path.join(process.cwd(), 'content');

export const FAMILIES: Record<GitCmsTool['fam'], { name: string; color: string }> = {
  photo: { name: 'Photo & ID', color: '#F5B82E' },
  pdf: { name: 'PDF & Documents', color: '#A33B48' },
  forms: { name: 'Tax & Forms', color: '#F0662B' },
  image: { name: 'Images & Media', color: '#1FAE85' },
  dev: { name: 'Developer & Data', color: '#2E3025' },
  crypto: { name: 'Security & Crypto', color: '#F27AA3' },
};

export function getAllToolsFromGit(): GitCmsTool[] {
  const dir = path.join(CONTENT_ROOT, 'tools');
  if (!fs.existsSync(dir)) return [];
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
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    return JSON.parse(raw) as GitCmsPreset;
  });
}

export function getPresetFromGit(toolSlug: string, presetSlug: string): GitCmsPreset | undefined {
  return getAllPresetsFromGit().find((p) => p.toolSlug === toolSlug && p.presetSlug === presetSlug);
}

export function getAllBlogsFromGit(): GitCmsBlogPost[] {
  const dir = path.join(CONTENT_ROOT, 'blog');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const slug = file.replace(/\.md$/, '');
    const meta: Record<string, string> = {};
    const lines = raw.split('\n');
    let body = raw;

    if (lines[0]?.trim() === '---') {
      const end = lines.indexOf('---', 1);
      if (end !== -1) {
        for (let i = 1; i < end; i++) {
          const colon = lines[i].indexOf(':');
          if (colon !== -1) {
            const k = lines[i].slice(0, colon).trim();
            const v = lines[i].slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
            meta[k] = v;
          }
        }
        body = lines.slice(end + 1).join('\n').trim();
      }
    }

    return {
      slug,
      title: meta.title || slug,
      category: meta.category || 'General',
      readTime: meta.readTime || '5 min',
      publishedAt: meta.publishedAt || '2026-11-10',
      summary: meta.summary || '',
      relatedTool: meta.relatedTool || '',
      body,
    };
  });
}

export function getBlogFromGit(slug: string): GitCmsBlogPost | undefined {
  return getAllBlogsFromGit().find((b) => b.slug === slug);
}

export function getAllGlossaryTermsFromGit(): GitCmsGlossaryTerm[] {
  const dir = path.join(CONTENT_ROOT, 'glossary');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const slug = file.replace(/\.md$/, '');
    const meta: Record<string, any> = {};
    const lines = raw.split('\n');
    let body = raw;

    if (lines[0]?.trim() === '---') {
      const end = lines.indexOf('---', 1);
      if (end !== -1) {
        let currentArrayKey = '';
        for (let i = 1; i < end; i++) {
          const line = lines[i];
          if (line.trim().startsWith('- ') && currentArrayKey) {
            const val = line.trim().slice(2).replace(/^['"]|['"]$/g, '');
            meta[currentArrayKey] = meta[currentArrayKey] || [];
            meta[currentArrayKey].push(val);
          } else {
            const colon = line.indexOf(':');
            if (colon !== -1) {
              const k = line.slice(0, colon).trim();
              const v = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
              if (v === '') {
                currentArrayKey = k;
                meta[k] = [];
              } else {
                currentArrayKey = '';
                meta[k] = v;
              }
            }
          }
        }
        body = lines.slice(end + 1).join('\n').trim();
      }
    }

    return {
      slug,
      term: meta.term || slug,
      definition: meta.definition || '',
      aliases: meta.aliases || [],
      related_tools: meta.related_tools || [],
      reviewed: meta.reviewed || '2026-11-10',
      body,
    };
  });
}

export function getGlossaryTermFromGit(slug: string): GitCmsGlossaryTerm | undefined {
  return getAllGlossaryTermsFromGit().find((g) => g.slug === slug);
}
