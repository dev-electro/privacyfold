import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllToolsFromGit, getToolFromGit } from '@/lib/git-cms';
import { FAMILIES } from '@/lib/tools/registry';
import { PrivacyFoldApp } from '@/components/PrivacyFoldApp';
import { ToolSeoArticle } from '@/components/ToolSeoArticle';

export function generateStaticParams() {
  return getAllToolsFromGit().map((t) => ({ toolSlug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ toolSlug: string }> }): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = getToolFromGit(toolSlug);
  if (!tool) return {};
  const fam = FAMILIES[tool.fam]?.name || 'Tool';
  return {
    title: tool.seo.metaTitle,
    description: tool.seo.metaDescription,
    alternates: { canonical: `https://privacyfold.com/tools/${tool.slug}/` },
    openGraph: {
      title: `${tool.name} — PrivacyFold (${fam})`,
      description: tool.seo.metaDescription,
      url: `https://privacyfold.com/tools/${tool.slug}/`,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;
  const tool = getToolFromGit(toolSlug);
  if (!tool) notFound();

  return (
    <>
      <PrivacyFoldApp initialToolSlug={tool.slug} />
      <div className="wrap" style={{ paddingBottom: '64px' }}>
        <ToolSeoArticle tool={tool} />
      </div>
    </>
  );
}
