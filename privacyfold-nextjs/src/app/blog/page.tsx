import React from 'react';
import type { Metadata } from 'next';
import { getAllBlogsFromGit } from '@/lib/git-cms';
import { AdSenseUnit } from '@/components/AdSenseUnit';

export const metadata: Metadata = {
  title: 'Guides, Biometric Standards & Privacy Architecture Blog',
  description: 'Deep-dive guides on client-side WebAssembly, WebGPU AI models, passport photo standards, EXIF metadata removal, and zero-knowledge cryptography.',
  alternates: { canonical: 'https://privacyfold.com/blog/' },
};

export default function BlogIndexPage() {
  const posts = getAllBlogsFromGit();
  return (
    <main className="wrap pg">
      <div className="pg-h">
        <span className="mono eyebrow">GUIDES, STANDARDS &amp; ARCHITECTURE BLOG</span>
        <h1>Deep-dive guides &amp; documentation</h1>
        <p className="pg-sub">
          Comprehensive tutorials, official biometric and cryptographic specifications, and privacy engineering guides managed in Git.
        </p>
      </div>
      <AdSenseUnit slotId="pf-blog-index-top" format="leaderboard" />
      <div className="blog-grid">
        {posts.map((post) => (
          <a key={post.slug} href={`/blog/${post.slug}/`} className="blog-card" style={{ textDecoration: 'none' }}>
            <span className="bk">
              {post.category} · {post.readTime}
            </span>
            <h2>{post.title}</h2>
            <p>{post.summary}</p>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--ink)' }}>
              Read full guide →
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
