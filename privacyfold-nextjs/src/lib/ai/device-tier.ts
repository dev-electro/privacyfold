/**
 * PrivacyFold Device Tier & Built-in AI Capability Detector
 * Implements §5.1 of privacyfold-on-device-ai.md and the 0 MB window.ai progressive enhancement layer.
 */
export type DeviceTier = 'light' | 'standard' | 'pro';

export interface DeviceCapabilities {
  tier: DeviceTier;
  webgpu: boolean;
  webnn: boolean;
  opfs: boolean;
  shaderF16: boolean;
  maxBufferMB: number;
  memGB: number | null;
  cores: number;
  crossOriginIsolated: boolean;
  inAppBrowser: boolean;
  builtinAI: {
    prompt: string;
    summarizer: string;
    rewriter: string;
    translator: string;
    detector: string;
  };
}

export async function detectDevice(): Promise<DeviceCapabilities> {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : {};
  const win = typeof self !== 'undefined' ? (self as any) : {};
  const d: DeviceCapabilities = {
    tier: 'light',
    webgpu: false,
    webnn: Boolean(nav.ml),
    opfs: Boolean(nav.storage?.getDirectory),
    shaderF16: false,
    maxBufferMB: 0,
    memGB: nav.deviceMemory ?? null,
    cores: nav.hardwareConcurrency ?? 1,
    crossOriginIsolated: Boolean(win.crossOriginIsolated),
    inAppBrowser: /FBAN|FBAV|Instagram|Line\/|Twitter/i.test(nav.userAgent || ''),
    builtinAI: {
      prompt: 'unavailable',
      summarizer: 'unavailable',
      rewriter: 'unavailable',
      translator: 'unavailable',
      detector: 'unavailable',
    },
  };

  try {
    if (nav.gpu) {
      const adapter = await nav.gpu.requestAdapter();
      if (adapter) {
        d.webgpu = true;
        d.shaderF16 = Boolean(adapter.features?.has('shader-f16'));
        d.maxBufferMB = Math.round((adapter.limits?.maxBufferSize || 0) / 2 ** 20);
      }
    }
  } catch {
    d.webgpu = false;
  }

  const pairs: Array<[keyof DeviceCapabilities['builtinAI'], string]> = [
    ['prompt', 'LanguageModel'],
    ['summarizer', 'Summarizer'],
    ['rewriter', 'Rewriter'],
    ['translator', 'Translator'],
    ['detector', 'LanguageDetector'],
  ];

  for (const [key, globalName] of pairs) {
    try {
      if (globalName in win && typeof win[globalName]?.availability === 'function') {
        d.builtinAI[key] = await win[globalName].availability();
      } else if (win.ai && key in win.ai) {
        d.builtinAI[key] = 'readily';
      }
    } catch {
      d.builtinAI[key] = 'unavailable';
    }
  }

  d.tier = !d.webgpu
    ? 'light'
    : d.shaderF16 && d.maxBufferMB >= 1024 && (d.memGB ?? 8) >= 8
    ? 'pro'
    : 'standard';

  return d;
}
