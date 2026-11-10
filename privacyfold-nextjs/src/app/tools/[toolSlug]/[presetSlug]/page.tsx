import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPresetsFromGit, getPresetFromGit, getToolFromGit } from '@/lib/git-cms';
import { PrivacyFoldApp } from '@/components/PrivacyFoldApp';
import { ToolSeoArticle } from '@/components/ToolSeoArticle';

export function generateStaticParams() {
  return getAllPresetsFromGit().map((p) => ({
    toolSlug: p.toolSlug,
    presetSlug: p.presetSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolSlug: string; presetSlug: string }>;
}): Promise<Metadata> {
  const { toolSlug, presetSlug } = await params;
  const preset = getPresetFromGit(toolSlug, presetSlug);
  if (!preset) return {};
  return {
    title: `${preset.title} — Free Client-Side Tool (Zero Upload)`,
    description: preset.desc,
    alternates: { canonical: `https://privacyfold.com/tools/${preset.toolSlug}/${preset.presetSlug}/` },
  };
}

export default async function PresetToolPage({
  params,
}: {
  params: Promise<{ toolSlug: string; presetSlug: string }>;
}) {
  const { toolSlug, presetSlug } = await params;
  const preset = getPresetFromGit(toolSlug, presetSlug);
  const tool = getToolFromGit(toolSlug);
  if (!preset || !tool) notFound();

  return (
    <>
      <PrivacyFoldApp initialToolSlug={tool.slug} />
      <div className="wrap" style={{ paddingBottom: '64px' }}>
        <ToolSeoArticle tool={tool} presetTitle={preset.title} presetDesc={preset.desc} />
      </div>
    </>
  );
}
