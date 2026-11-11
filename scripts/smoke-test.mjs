#!/usr/bin/env node
/**
 * scripts/smoke-test.mjs — PrivacyFold Tool Runtime Smoke Test Suite
 *
 * Exercises all 72 client-side tools via `window.privacyfold.run(toolId, args, input)`.
 * Asserts:
 *  1. Every tool responds to the public SDK contract.
 *  2. No tool outputs fabricated text ("Acme Global Ltd.", "$6,050.00", stub PDFs).
 *  3. Input-less or missing-engine invocations error honestly instead of corrupting data.
 *
 * Exit 0 on all pass, exit 1 on regression.
 */
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const runtimePath = fs.existsSync(path.join(root, 'public/app-runtime.js'))
  ? path.join(root, 'public/app-runtime.js')
  : path.join(root, 'privacyfold-nextjs/public/app-runtime.js');
const runtimeCode = fs.readFileSync(runtimePath, 'utf8');

// Set up headless browser mock environment
global.window = global;
global.self = global;
let lastDispatchedEvent = null;
global.window.dispatchEvent = (evt) => {
  lastDispatchedEvent = evt;
  return true;
};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;

const canvasCtxProxy = new Proxy({
  getImageData: () => ({ data: new Uint8ClampedArray(800 * 600 * 4) }),
  createImageData: (w, h) => ({ data: new Uint8ClampedArray((w || 800) * (h || 600) * 4) }),
  measureText: () => ({ width: 40 }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createPattern: () => ({ setTransform: () => {} })
}, {
  get: (target, prop) => {
    if (prop in target) return target[prop];
    return () => {};
  }
});

const dummyCanvas = {
  width: 800,
  height: 600,
  naturalWidth: 800,
  naturalHeight: 600,
  getContext: () => canvasCtxProxy,
  toBlob: (cb, mime) => cb(new Blob(['dummy-image-bytes'], { type: mime || 'image/png' }))
};

const dummyEl = {
  addEventListener: () => {},
  removeEventListener: () => {},
  setAttribute: () => {},
  removeAttribute: () => {},
  getAttribute: () => '',
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  style: { setProperty: () => {}, removeProperty: () => {} },
  appendChild: () => {},
  removeChild: () => {},
  innerHTML: '',
  textContent: '',
  clientWidth: 1000,
  clientHeight: 1000,
  getContext: () => dummyCanvas.getContext(),
  parentNode: null
};
dummyEl.parentNode = dummyEl;

global.document = {
  documentElement: dummyEl,
  body: dummyEl,
  hidden: true,
  querySelector: () => dummyEl,
  querySelectorAll: () => [dummyEl],
  getElementById: () => dummyEl,
  createElement: (tag) => (tag === 'canvas' ? dummyCanvas : dummyEl),
  addEventListener: () => {},
  removeEventListener: () => {}
};

Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'HeadlessSmokeTest/1.0', platform: 'MacIntel' },
  configurable: true,
  writable: true
});
global.location = { search: '', hash: '', origin: 'https://privacyfold.com' };
global.matchMedia = () => ({ matches: false, addEventListener: () => {} });
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};

// Evaluate the runtime
new Function(runtimeCode)();

if (!window.privacyfold || typeof window.privacyfold.run !== 'function') {
  console.error('FATAL: window.privacyfold.run is not exposed by runtime!');
  process.exit(1);
}

const allTools = window.privacyfold.listTools();
console.log(`Starting smoke test for ${allTools.length} tools...\n`);

let passed = 0;
let failed = 0;

function sampleFor(t) {
  if (t.accepts === 'image') {
    return {
      kind: 'image',
      img: dummyCanvas,
      getBytes: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])
    };
  }
  if (t.accepts === 'pdf') {
    return '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
  }
  if (t.accepts === 'text') {
    if (t.id === 'json_format' || t.id === 'api_builder' || t.id === 'schema_validator') return '{"name": "Valid Test Record", "test": 123, "valid": true}';
    if (t.id === 'jwt_decode') return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    if (t.id === 'cron_parser') return '0 9 * * 1-5';
    if (t.id === 'regex_tester') return 'hello world';
    if (t.id === 'url_codec') return 'https://example.com/?q=privacy%20tools&lang=en';
    if (t.id === 'csv_json') return 'name,age\nAlice,30\nBob,25';
    if (t.id === 'base64') return 'SGVsbG8gV29ybGQ=';
    if (t.id === 'ocr_scan') return 'Invoice INV-2024-88 dated 3 March 2024 total GBP 1,250.00';
    if (t.id === 'voice_transcribe') return 'This is a genuine voice recording transcript for local processing.';
    return 'Sample document text containing confidential test string #12345.';
  }
  return 'General test payload';
}

const FORBIDDEN_FABRICATIONS = [
  'Acme Global Ltd.',
  '$6,050.00',
  'BT /F1 11 Tf 50 740 Td (Compressed for preset:'
];

for (const tool of allTools) {
  try {
    const input = sampleFor(tool);
    const defaults = {};
    if (tool.params) {
      tool.params.forEach(p => {
        defaults[p.k] = typeof p.def === 'function' ? p.def() : p.def;
      });
    }

    let result;
    try {
      result = await window.privacyfold.run(tool.id, defaults, input);
    } catch (runErr) {
      // Honest error for tools requiring offline-compiled WASM or specific hardware
      if (/not loaded|requires.*engine|engine is not loaded|requires.*WebAssembly/i.test(runErr.message)) {
        console.log(`  [OK - HONEST ERROR] ${tool.id}: ${runErr.message}`);
        passed++;
        continue;
      }
      throw runErr;
    }

    if (!result || (typeof result !== 'object')) {
      throw new Error(`Tool returned non-object: ${result}`);
    }

    // Check for fabricated defaults
    const resultStr = JSON.stringify(result);
    for (const forbidden of FORBIDDEN_FABRICATIONS) {
      if (resultStr.includes(forbidden)) {
        throw new Error(`Tool returned forbidden fabricated stub: "${forbidden}"`);
      }
    }

    if (window.__PRIVACYFOLD_RESULT__?.status !== 'pass') {
      throw new Error(`Expected __PRIVACYFOLD_RESULT__.status to be 'pass', got: ${window.__PRIVACYFOLD_RESULT__?.status}`);
    }

    console.log(`  [OK] ${tool.id} (${tool.fam}) -> ${result.note || 'completed'}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${tool.id}: ${err.message}`);
    failed++;
  }
}

// Verification of observability & telemetry contract (PF-016)
console.log('\nTesting observability & error boundary contract (PF-016)...');
try {
  const presets = window.privacyfold.listPresets();
  if (presets.length !== 87) {
    throw new Error(`Expected 87 presets in runtime, got ${presets.length}`);
  }
  console.log(`  [OK] runtime presets: ${presets.length} presets registered in window.privacyfold`);

  await window.privacyfold.run('hash_gen', { algo: 'SHA-256' }, 'test data');
  if (!lastDispatchedEvent || lastDispatchedEvent.type !== 'privacyfold:tool_used' || lastDispatchedEvent.detail?.tool_id !== 'hash_gen') {
    throw new Error('privacyfold:tool_used event was not properly dispatched');
  }
  console.log('  [OK] telemetry: privacyfold:tool_used event dispatched with tool_id');

  try {
    await window.privacyfold.run('non_existent_tool', {}, 'test');
    throw new Error('Unknown tool did not throw');
  } catch (e) {
    if (window.__PRIVACYFOLD_RESULT__?.status !== 'fail') {
      throw new Error(`Expected fail status for unknown tool, got: ${window.__PRIVACYFOLD_RESULT__?.status}`);
    }
    console.log('  [OK] error boundary: __PRIVACYFOLD_RESULT__ records fail status on error');
  }
} catch (obsErr) {
  console.error(`  [FAIL] Observability test failed: ${obsErr.message}`);
  failed++;
}

console.log(`\n========================================`);
console.log(`Smoke Test Results: ${passed} passed, ${failed} failed out of ${allTools.length} tools`);
console.log(`========================================\n`);

if (failed > 0) {
  console.error(`Smoke test failed with ${failed} error(s)!`);
  process.exit(1);
} else {
  console.log(`All ${passed} tools passed smoke test suite cleanly!`);
  process.exit(0);
}
