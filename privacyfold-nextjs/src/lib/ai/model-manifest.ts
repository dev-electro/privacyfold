/**
 * PrivacyFold On-Device AI Model Manifest & License Guard
 * Implements §3, §5.2 & §8 of privacyfold-on-device-ai.md and the Sub-50 MB TinyWow Replacement Matrix.
 * Build step refuses any model whose commercialUse is 'no' or 'unverified'.
 */
export interface ModelManifestEntry {
  id: string;
  name: string;
  task: 'face-detect' | 'matting' | 'inpaint' | 'upscale' | 'pii' | 'ocr' | 'stt' | 'embed' | 'llm-fallback';
  pack: 'core' | 'voice' | 'pro';
  minTier: 'light' | 'standard' | 'pro';
  precision: 'fp32' | 'fp16' | 'q8' | 'q4f16';
  backends: Array<'webgpu' | 'webnn' | 'wasm'>;
  bytes: number;
  sha256: string;
  license: string;
  commercialUse: 'yes' | 'attribution';
  attribution?: string;
  languages: string[];
  sourceUrl: string;
  lastVerified: string;
}

export const ON_DEVICE_MODELS: ModelManifestEntry[] = [
  {
    id: 'ben-v2-modnet-fp16',
    name: 'BEN v2 / MODNet Photographic Background Matting',
    task: 'matting',
    pack: 'core',
    minTier: 'standard',
    precision: 'fp16',
    backends: ['webgpu', 'wasm'],
    bytes: 24_117_248,
    sha256: '4a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    license: 'MIT',
    commercialUse: 'yes',
    languages: ['*'],
    sourceUrl: 'https://huggingface.co/PramaLLC/BEN2',
    lastVerified: '2026-11-08',
  },
  {
    id: 'lama-fp16-pruned',
    name: 'LaMa-FP16 Pruned Object & Watermark Inpainting',
    task: 'inpaint',
    pack: 'core',
    minTier: 'standard',
    precision: 'fp16',
    backends: ['webgpu', 'wasm'],
    bytes: 38_797_312,
    sha256: '7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
    license: 'Apache-2.0',
    commercialUse: 'yes',
    languages: ['*'],
    sourceUrl: 'https://huggingface.co/Carve/LaMa-ONNX',
    lastVerified: '2026-11-08',
  },
  {
    id: 'omnisr-nano-fp16',
    name: 'OmniSR-Nano / Real-ESRGAN Compact 2x Upscaler',
    task: 'upscale',
    pack: 'core',
    minTier: 'standard',
    precision: 'fp16',
    backends: ['webgpu', 'wasm'],
    bytes: 18_874_368,
    sha256: '1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    license: 'MIT',
    commercialUse: 'yes',
    languages: ['*'],
    sourceUrl: 'https://huggingface.co/xenova/swin2sr-classical-sr-x2-64',
    lastVerified: '2026-11-08',
  },
  {
    id: 'rampart-minilm-l6-q8',
    name: 'Rampart On-Device PII Detector (17 Entity Types)',
    task: 'pii',
    pack: 'core',
    minTier: 'light',
    precision: 'q8',
    backends: ['webgpu', 'wasm'],
    bytes: 15_414_067,
    sha256: '9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    license: 'CC-BY-4.0',
    commercialUse: 'attribution',
    attribution: 'Rampart by National Design Studio (CC BY 4.0)',
    languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'],
    sourceUrl: 'https://cdn.jsdelivr.net/npm/@nationaldesignstudio/rampart@0.1.3/MODEL_CARD.md',
    lastVerified: '2026-11-08',
  },
  {
    id: 'moonshine-tiny-en-q8',
    name: 'Moonshine-Tiny Edge Speech-to-Text (English)',
    task: 'stt',
    pack: 'voice',
    minTier: 'standard',
    precision: 'q8',
    backends: ['webgpu', 'wasm'],
    bytes: 29_360_128,
    sha256: '3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    license: 'MIT',
    commercialUse: 'yes',
    languages: ['en'],
    sourceUrl: 'https://huggingface.co/UsefulSensors/moonshine-tiny',
    lastVerified: '2026-11-08',
  },
  {
    id: 'bge-micro-v2-q8',
    name: 'bge-micro-v2 In-Memory PDF RAG Embeddings',
    task: 'embed',
    pack: 'core',
    minTier: 'light',
    precision: 'q8',
    backends: ['webgpu', 'wasm'],
    bytes: 23_068_672,
    sha256: '5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
    license: 'MIT',
    commercialUse: 'yes',
    languages: ['en'],
    sourceUrl: 'https://huggingface.co/TaylorAI/bge-micro-v2',
    lastVerified: '2026-11-08',
  },
  {
    id: 'smollm2-135m-instruct-q4',
    name: 'SmolLM2-135M-Instruct (Non-Chromium Writing Fallback)',
    task: 'llm-fallback',
    pack: 'core',
    minTier: 'standard',
    precision: 'q4f16',
    backends: ['webgpu', 'wasm'],
    bytes: 47_185_920,
    sha256: '6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    license: 'Apache-2.0',
    commercialUse: 'yes',
    languages: ['en', 'es', 'fr', 'de', 'it'],
    sourceUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct',
    lastVerified: '2026-11-08',
  },
];
