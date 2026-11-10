import React from 'react';
import { getAllTools, getAllPresets } from '@/lib/cms';

export async function generateStaticParams() {
  const presets = getAllPresets();
  return presets.map((p: any) => ({
    slug: p.tool,
    presetSlug: p.id,
  }));
}

export default function ToolPresetPage({ params }: { params: { slug: string; presetSlug: string } }) {
  const tools = getAllTools();
  const presets = getAllPresets();
  const tool = tools.find((t: any) => t.id === params.slug) || tools[0];
  const preset = presets.find((p: any) => p.id === params.presetSlug) || presets[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <span>Verified Regulatory Preset</span>
          <span>•</span>
          <span>{preset.authority_name}</span>
          <span>•</span>
          <span>v{preset.version}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{preset.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Powered by <strong>{tool?.name}</strong> ({tool?.Engine}) • 100% Client-Side Execution • Official Source:{' '}
          <a href={preset.source_url} target="_blank" rel="noopener noreferrer" className="underline">
            {preset.authority_name} Specification
          </a>
        </p>
      </div>
    </main>
  );
}
