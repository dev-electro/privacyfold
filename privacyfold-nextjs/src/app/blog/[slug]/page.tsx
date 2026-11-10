import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBlogsFromGit, getBlogFromGit } from '@/lib/git-cms';
import { AdSenseUnit } from '@/components/AdSenseUnit';

export function generateStaticParams() {
  return getAllBlogsFromGit().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogFromGit(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `https://privacyfold.com/blog/${post.slug}/` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
      url: `https://privacyfold.com/blog/${post.slug}/`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogFromGit(slug);
  if (!post) notFound();

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'PrivacyFold Engineering' },
    publisher: { '@type': 'Organization', name: 'PrivacyFold', url: 'https://privacyfold.com' },
    mainEntityOfPage: `https://privacyfold.com/blog/${post.slug}/`,
  };

  return (
    <main className="wrap pg">
      <article className="blog-art">
        <div className="kick">
          {post.category} · {post.readTime} · {post.publishedAt}
        </div>
        <h1>{post.title}</h1>
        <div className="aeo-box">
          <span className="aeo-k">Key Takeaway</span>
          <p>{post.summary}</p>
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: 1.7 }}>
          {post.body}
        </pre>
        <div style={{ margin: '24px 0' }}>
          <AdSenseUnit slotId={`pf-blog-${post.slug}`} format="in-article" />
        </div>
        <div className="row">
          <a href={`/tools/${post.relatedTool}/`} className="btn primary">
            Open Related Tool →
          </a>
          <a href="/blog/" className="btn ghost">
            ← All Guides
          </a>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
    </main>
  );
}
