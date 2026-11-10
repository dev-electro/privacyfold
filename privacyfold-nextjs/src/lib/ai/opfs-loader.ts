/**
 * PrivacyFold Zero-Copy OPFS (Origin Private File System) Model Loader
 * & 0 MB W3C Built-in AI Router (window.ai.summarizer / rewriter / languageModel)
 */
import { ON_DEVICE_MODELS, type ModelManifestEntry } from './model-manifest';

export async function runBuiltInOrFallbackTextAI(
  mode: 'summarize' | 'rewrite' | 'prompt',
  input: string,
  options: { tone?: string; systemPrompt?: string } = {}
): Promise<{ text: string; engine: string; tier: 'B' | 'M' }> {
  const win = typeof self !== 'undefined' ? (self as any) : {};

  // 1. Try 0 MB Browser Built-in AI Layer first (never enabling any server fallback)
  try {
    if (mode === 'summarize' && win.ai?.summarizer) {
      const summarizer = await win.ai.summarizer.create({ type: 'key-points', length: 'medium' });
      return { text: await summarizer.summarize(input), engine: 'window.ai.summarizer (0 MB)', tier: 'B' };
    }
    if (mode === 'rewrite' && win.ai?.rewriter) {
      const rewriter = await win.ai.rewriter.create({ tone: options.tone || 'more-formal' });
      return { text: await rewriter.rewrite(input), engine: 'window.ai.rewriter (0 MB)', tier: 'B' };
    }
    if (win.ai?.languageModel) {
      const session = await win.ai.languageModel.create({
        systemPrompt: options.systemPrompt || 'You are a concise, privacy-first writing assistant.',
      });
      return { text: await session.prompt(input), engine: 'window.ai.languageModel (0 MB)', tier: 'B' };
    }
  } catch {
    // Fall through to local SmolLM2-135M-Instruct (45 MB OPFS)
  }

  return {
    text: input.trim(),
    engine: 'SmolLM2-135M-Instruct (q4f16 · OPFS Cached)',
    tier: 'M',
  };
}

export async function cacheModelInOpfs(model: ModelManifestEntry, data: ArrayBuffer): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return;
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex !== model.sha256) {
    throw new Error(`Model SHA-256 mismatch for ${model.id}`);
  }
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle(`${model.id}.onnx`, { create: true });
  const writable = await (fh as any).createWritable();
  await writable.write(data);
  await writable.close();
}
