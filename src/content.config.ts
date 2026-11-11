import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const toolsCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/tools' }),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    fam: z.enum(['photo', 'pdf', 'forms', 'image', 'dev', 'crypto']),
    task: z.string(),
    desc: z.string(),
    accepts: z.string(),
    tag: z.string(),
    std: z.string(),
    wasmModule: z.string(),
    seo: z.object({
      metaTitle: z.string(),
      metaDescription: z.string(),
      aeoSummary: z.string(),
      steps: z.array(z.string()),
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })),
      keywords: z.array(z.string()).optional(),
    }),
    settingsExplained: z.array(z.object({
      name: z.string(),
      description: z.string(),
      safeDefault: z.string(),
      example: z.string(),
    })).optional(),
    whatToExpect: z.object({
      results: z.string(),
      limits: z.string(),
      benchmarks: z.string(),
    }).optional(),
    privacyProof: z.object({
      howItWorks: z.string(),
      verificationSteps: z.array(z.string()),
      openSourceNotice: z.string(),
    }).optional(),
    byline: z.object({
      author: z.string(),
      reviewer: z.string(),
      reviewedDate: z.string(),
      sources: z.array(z.object({
        name: z.string(),
        url: z.string(),
      })),
    }).optional(),
  }).passthrough(),
});

const presetsCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/presets' }),
  schema: z.object({
    presetSlug: z.string(),
    toolSlug: z.string(),
    title: z.string(),
    desc: z.string(),
  }).passthrough(),
});

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    readTime: z.string().optional(),
    publishedAt: z.string().optional(),
    summary: z.string().optional(),
    relatedTool: z.string().optional(),
  }).passthrough(),
});

const glossaryCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/glossary' }),
  schema: z.object({
    term: z.string(),
    definition: z.string(),
    aliases: z.array(z.string()).optional(),
    related_tools: z.array(z.string()).optional(),
    reviewed: z.string().optional(),
  }).passthrough(),
});

const engineCollection = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './content/engine' }),
  schema: z.object({
    id: z.string(),
    type: z.string(),
  }).passthrough(),
});

const authorsCollection = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './content/authors' }),
  schema: z.object({
    name: z.string(),
    displayName: z.string().optional(),
    role: z.string(),
    bio: z.string(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
  }).passthrough(),
});

const compareCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/compare' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    audience: z.string().optional(),
    reviewed: z.string().optional(),
    summary: z.string().optional(),
  }).passthrough(),
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/pages' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    reviewed: z.string().optional(),
  }).passthrough(),
});

export const collections = {
  tools: toolsCollection,
  presets: presetsCollection,
  blog: blogCollection,
  glossary: glossaryCollection,
  engine: engineCollection,
  authors: authorsCollection,
  compare: compareCollection,
  pages: pagesCollection,
};
