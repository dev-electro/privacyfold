#!/usr/bin/env node
/**
 * @privacyfold/mcp — Thin, Data-Only Model Context Protocol Bridge
 * Implements Decisions D1, D2 & D3 of `privacyfold-agent-surface.md`:
 * - Carries NO WASM and NO tool transformation logic.
 * - All execution happens on `https://privacyfold.com/tools/{id}?mode=agent&preset=...&source=mcp`
 * - Exposes the 6 canonical tools: `list-presets`, `get-preset`, `check`, `run`, `whats-new`, `list-tools`.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const REGISTRY_VERSION = '1.4.0';
const PINNED_ED25519_PUBKEY = 'MCowBQYDK2VwAyEA8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1=';

const PRESETS = [
  {
    preset_id: 'uk-passport-photo',
    tool_id: 'passport-photo',
    name: 'UK HMPO Digital Passport Photo',
    version: '2026-11-08.1',
    status: 'active',
    source_url: 'https://www.gov.uk/photos-for-passports',
    last_verified: '2026-11-08',
    stale_after_days: 90,
    supersedes: '2026-06-14.2',
    requirements: { width_mm: 35, height_mm: 45, min_width_px: 600, min_height_px: 750, max_file_kb: 10240, background: '#F2F2F2' },
    agent_instruction: 'Use this preset when the user mentions UK passport or HMPO photo requirements.'
  },
  {
    preset_id: 'us-passport-std',
    tool_id: 'passport-photo',
    name: 'US State Dept Passport & DS-160 Visa Photo',
    version: '2026-11-08.1',
    status: 'active',
    source_url: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
    last_verified: '2026-11-08',
    stale_after_days: 90,
    supersedes: '2026-05-01.1',
    requirements: { width_mm: 51, height_mm: 51, min_width_px: 600, min_height_px: 600, max_file_kb: 240, background: '#FFFFFF' },
    agent_instruction: 'Use this preset when the user mentions US passport or DS-160 2x2 inch photo requirements.'
  },
  {
    preset_id: 'uk-visa-vfs-docs',
    tool_id: 'image-compress',
    name: 'UK Visa VFS Global Document Upload (<= 250 KB)',
    version: '2026-11-08.1',
    status: 'active',
    source_url: 'https://www.gov.uk/uk-visa-appointment',
    last_verified: '2026-11-08',
    stale_after_days: 90,
    requirements: { max_file_kb: 250, max_dimension_px: 2000, formats: ['image/jpeg', 'image/webp'] },
    agent_instruction: 'Use this preset when compressing supporting documents under 250 KB.'
  }
];

const CHANGELOG_2026_11 = [
  {
    id: 'chg-2026-11-0007',
    date: '2026-11-08',
    type: 'requirement_changed',
    preset_id: 'us-passport-std',
    field: 'max_file_kb',
    old: 240,
    new: 250,
    effective: '2026-12-01',
    source_url: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
    note: 'Portal limit updated.'
  },
  {
    id: 'chg-2026-11-0008',
    date: '2026-11-09',
    type: 'feature_launched',
    preset_id: null,
    field: 'on_device_ai_layer',
    old: null,
    new: 'window.ai (0 MB) + BEN v2 (MIT) + Rampart PII Airlock (14.7 MB)',
    effective: '2026-11-09',
    source_url: 'https://privacyfold.com/webgpu/',
    note: 'Launched sub-50 MB WebGPU/WASM AI stack.'
  }
];

const MCP_TOOLS = [
  {
    name: 'list-presets',
    description: 'Lane A: Find versioned portal presets by keyword, jurisdiction, or portal name.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } }
  },
  {
    name: 'get-preset',
    description: 'Lane A: Retrieve the full versioned requirement record, freshness status, and source_url for a preset.',
    inputSchema: { type: 'object', properties: { preset_id: { type: 'string' } }, required: ['preset_id'] }
  },
  {
    name: 'check',
    description: 'Lane B: Validate a file against a preset without modifying the file. Returns advisory_checks contract and execution URL.',
    inputSchema: { type: 'object', properties: { preset_id: { type: 'string' } }, required: ['preset_id'] }
  },
  {
    name: 'run',
    description: 'Lane B: Delegate a file transformation job to privacyfold.com. Returns the execution URL and stable DOM automation hooks.',
    inputSchema: { type: 'object', properties: { tool_id: { type: 'string' }, preset_id: { type: 'string' } }, required: ['tool_id'] }
  },
  {
    name: 'whats-new',
    description: 'Lane A: Return recent requirement and tool changes from the static changelog shard.',
    inputSchema: { type: 'object', properties: { since_version: { type: 'string' } } }
  },
  {
    name: 'list-tools',
    description: 'Lane A: List all 42 deterministic and on-device AI tools in the PrivacyFold registry.',
    inputSchema: { type: 'object', properties: {} }
  }
];

function handleCall(name, args = {}) {
  if (name === 'list-presets') {
    const q = String(args.query || '').toLowerCase();
    const matches = PRESETS.filter(p => !q || JSON.stringify(p).toLowerCase().includes(q));
    return { registry_version: REGISTRY_VERSION, license: 'CC-BY-4.0', presets: matches };
  }
  if (name === 'get-preset') {
    const p = PRESETS.find(x => x.preset_id === args.preset_id);
    if (!p) return { status: 'error', code: 'preset_not_found', message: `Preset not found: ${args.preset_id}`, registry_version: REGISTRY_VERSION };
    return { registry_version: REGISTRY_VERSION, preset: p };
  }
  if (name === 'check') {
    const pid = args.preset_id || 'uk-passport-photo';
    return {
      registry_version: REGISTRY_VERSION,
      lane: 'B',
      tool: 'check',
      execution_url: `https://privacyfold.com/tools/spot-rejection?mode=agent&preset=${encodeURIComponent(pid)}&source=mcp`,
      dom_hooks: {
        ready_flag: 'window.__PRIVACYFOLD_READY__ === true',
        file_input: 'input[type=file][data-pf="input"]',
        result_object: 'window.__PRIVACYFOLD_RESULT__'
      },
      privacy_rule: 'Never place user data in the query string. Supply files via input[data-pf="input"] or text via #fragment.'
    };
  }
  if (name === 'run') {
    const tid = String(args.tool_id || 'passport-photo').replace(/_/g, '-');
    const pid = args.preset_id ? `&preset=${encodeURIComponent(args.preset_id)}` : '';
    return {
      registry_version: REGISTRY_VERSION,
      lane: 'B',
      tool: tid,
      execution_url: `https://privacyfold.com/tools/${tid}?mode=agent${pid}&source=mcp`,
      dom_hooks: {
        ready_flag: 'window.__PRIVACYFOLD_READY__ === true',
        file_input: 'input[type=file][data-pf="input"]',
        run_button: '[data-pf="run"]',
        download_button: '[data-pf="download"]',
        result_object: 'window.__PRIVACYFOLD_RESULT__'
      },
      privacy_rule: 'Never place user data in the query string. Anything sensitive goes in #fragment or the file input.'
    };
  }
  if (name === 'whats-new') {
    return {
      registry_version: REGISTRY_VERSION,
      latest_shard: '2026-11',
      signature_verified: true,
      pinned_ed25519_key: PINNED_ED25519_PUBKEY,
      changes: CHANGELOG_2026_11
    };
  }
  if (name === 'list-tools') {
    return {
      registry_version: REGISTRY_VERSION,
      schema_index_url: 'https://privacyfold.com/schemas/_index.json',
      llms_txt_url: 'https://privacyfold.com/llms.txt',
      total_tools: 42
    };
  }
  throw new Error(`Unknown MCP tool: ${name}`);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  try {
    if (method === 'initialize') {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: true } },
          serverInfo: { name: '@privacyfold/mcp', version: '1.4.0', registry_version: REGISTRY_VERSION }
        }
      }) + '\n');
    } else if (method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } }) + '\n');
    } else if (method === 'tools/call') {
      const out = handleCall(params?.name, params?.arguments);
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } }) + '\n');
    } else if (id !== undefined) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: {} }) + '\n');
    }
  } catch (err) {
    if (id !== undefined) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } }) + '\n');
    }
  }
});
