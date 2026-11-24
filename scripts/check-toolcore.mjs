// Pure-function tests for the client engine (public/toolcore.js).
// The file is a browser script, so it is evaluated in a VM with the few
// globals it touches at load. No DOM, no network: these are the functions
// that decide what a tool outputs, and they must not drift.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src = fs.readFileSync(new URL('../public/toolcore.js', import.meta.url), 'utf8');

const sandbox = {
  window: {},
  document: { createElement: () => ({ getContext: () => null, appendChild() { } }) },
  console,
  URL,
  Blob,
  Uint8Array,
  crypto: globalThis.crypto,
  performance: { now: () => Date.now() },
  localStorage: { getItem: () => null, setItem() { } },
  setTimeout,
  clearTimeout
};
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'toolcore.js' });

const U = sandbox.window.PFCore.util;
let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.error('FAIL ' + name + ': ' + e.message); }
};

t('luhn accepts a real card', () => assert.equal(U.luhn('4111 1111 1111 1111'), true));
t('luhn rejects a tracking number', () => assert.equal(U.luhn('123456789012'), false));

t('minifier keeps newlines and drops comments', () => {
  const out = U.minifyJs('function add(a, b) {\n  // note\n  return a + b;\n}\n\nconst x = add(1, 2);');
  assert.equal(out, 'function add(a, b) {\nreturn a + b;\n}\nconst x = add(1, 2);');
});
t('minifier leaves string content alone', () => {
  assert.equal(U.minifyJs('var u = "http://x//y";'), 'var u = "http://x//y";');
});

t('redaction catches email, phone, NI and card', () => {
  const r = U.redactPII('Mail jane.doe@example.com or +44 7700 900123, NI QQ123456C, card 4111 1111 1111 1111');
  const types = r.found.map(f => f.type).sort().join(',');
  assert.equal(types, 'card,email,ni,phone');
  assert.ok(!/jane\.doe@example\.com/.test(r.text), 'email still in the text');
  assert.ok(!/4111/.test(r.text), 'card still in the text');
});
t('redaction leaves order numbers alone', () => {
  const r = U.redactPII('order 123456789012 shipped today');
  assert.equal(r.found.length, 0);
  assert.ok(r.text.includes('123456789012'));
});
t('redaction round-trips', () => {
  const r = U.redactPII('Call +44 7700 900123 now');
  assert.equal(U.restorePII(r.text, r.found), 'Call +44 7700 900123 now');
});
t('redaction honours the type filter', () => {
  const r = U.redactPII('jane@example.com 4111 1111 1111 1111', { only: ['email'] });
  assert.equal(r.found.length, 1);
  assert.ok(r.text.includes('4111 1111 1111 1111'));
});

t('receipt: vendor is not the first item line', () => {
  const r = U.parseReceipt('Cloudflare\n2026-11-08 | Domain Registration | $10.00\n2026-11-08 | Tax | $2.00');
  assert.equal(r.vendor, 'Cloudflare');
  assert.equal(r.date, '2026-11-08');
  assert.equal(r.total, 12);
});
t('receipt: total and items come from the text', () => {
  const r = U.parseReceipt('Costa Coffee\n03/03/2026\nFlat White 3.40\nCroissant 2.80\nTOTAL 6.20');
  assert.equal(r.vendor, 'Costa Coffee');
  assert.equal(r.items.length, 2);
  assert.equal(r.total, 6.2);
});

t('invoice: pipe rows keep qty and rate', () => {
  const rows = U.parseInvoiceItems('Design sprint | 2 | 500\nRetainer | 1 | 900');
  assert.equal(rows.length, 2);
  assert.equal(JSON.stringify(rows[0]), JSON.stringify({ desc: 'Design sprint', qty: 2, rate: 500 }));
  assert.equal(JSON.stringify(rows[1]), JSON.stringify({ desc: 'Retainer', qty: 1, rate: 900 }));
});
t('invoice: 2 x 250 computes 500', () => {
  const rows = U.parseInvoiceItems('Consulting 2 x 250');
  assert.equal(rows[0].qty, 2);
  assert.equal(rows[0].rate, 250);
});

console.log('toolcore: ' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
