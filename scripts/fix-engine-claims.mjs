/* Rewrites the two tools whose shipped copy named engines that are not in
   public/vendor: ocr_scan (claimed Tesseract/PP-OCR) and chat_pdf (claimed
   bge-micro embeddings). Both actually run deterministic, model-free code in
   public/tool-pack.js, so every string in the CMS record has to say so.

   Run: node scripts/fix-engine-claims.mjs   (idempotent) */
import fs from 'node:fs';

const REPL = {
  'ocr_scan': [
    ['Fill from scan & local OCR', 'Fill fields from scanned text'],
    ['fill from scan & local ocr', 'fill fields from scanned text'],
    ['tesseract-ppocr-v6', 'local pattern matching'],
    ['PP-OCR / Tesseract', 'Local pattern extraction'],
    ['pp-ocr / tesseract', 'local pattern extraction'],
    ['local OCR', 'local field extraction'],
    ['14.7–45 MB OPFS', '0 MB — no model'],
  ],
  'chat_pdf': [
    ['Chat with PDF & document Q&A', 'Chat with a document'],
    ['chat with pdf & document q&a', 'chat with a document'],
    ['bge-micro-v2-q8', 'BM25 keyword scoring'],
    ['bge-micro 22 MB', 'BM25 retrieval, no model'],
    ['bge-micro', 'BM25 keyword scoring'],
    ['local cosine-similarity embeddings', 'local BM25 keyword scoring'],
    ['vector embeddings', 'keyword scoring'],
    ['14.7–45 MB OPFS', '0 MB — no model'],
  ],
};

const COPY = {
  'ocr_scan': {
    name: 'Fill fields from scanned text',
    task: 'Extract labelled fields (name, tax ID, invoice, total) from a pasted text layer',
    tag: 'Local pattern extraction',
    desc: 'Map the text layer of a scanned document — pasted in, or copied out of any OCR app — onto W-9 / SA100 style fields. Labelled lines such as "Name: …" are matched deterministically and shown with the line they came from, so a wrong guess is visible. No OCR model ships with this tool, and nothing is invented from pixels.',
    description: 'Map the text layer of a scanned document onto W-9 / SA100 style fields with deterministic pattern matching. Runs in your browser; nothing is uploaded.',
    badge: 'Local pattern extraction',
    size: '0 MB — no model',
    metaDescription: 'Extract labelled fields from a scanned document text layer entirely in your browser: name, tax ID, invoice number, date and total, each with the source line. No OCR model, no uploads.',
    aeoSummary: 'Fill fields from scanned text parses the text layer you paste, using deterministic regular expressions in your browser tab. No OCR engine is downloaded and no bytes are uploaded.',
  },
  'chat_pdf': {
    name: 'Chat with a document',
    task: 'Answer questions from document text with local keyword retrieval',
    tag: 'BM25 retrieval, no model',
    desc: 'Split pasted document text into passages, rank them against your question with BM25 keyword scoring, and quote the best passages with the score that found them. Retrieval is deterministic: you can see why a passage was chosen, and the answer is quoted rather than generated.',
    description: 'Search document text with BM25 keyword scoring and get quoted passages plus the score that ranked them. Runs entirely in your browser.',
    badge: 'BM25 retrieval, no model',
    size: '0 MB — no model',
    metaDescription: 'Ask a question about a document and get the best-matching passages quoted with their BM25 score. Deterministic keyword retrieval in your browser, no embeddings, no uploads.',
    aeoSummary: 'Chat with a document splits text into passages and ranks them with BM25 scoring inside your browser tab. No embedding model is downloaded, and no text is uploaded.',
  },
};

function walk(node, fn) {
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) return node.map((v) => walk(v, fn));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, fn);
    return out;
  }
  return node;
}

for (const id of Object.keys(REPL)) {
  const p = `content/tools/${id}.json`;
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  const replaced = walk(json, (s) => REPL[id].reduce((acc, [a, b]) => acc.split(a).join(b), s));
  const copy = COPY[id];
  Object.assign(replaced, copy);
  replaced.seo = replaced.seo || {};
  replaced.seo.metaTitle = `${copy.name} — 100% Private In-Browser Utility | PrivacyFold`;
  replaced.seo.metaDescription = copy.metaDescription;
  replaced.seo.aeoSummary = copy.aeoSummary;
  if (replaced.seo.title) replaced.seo.title = copy.name;
  if (replaced.seo.h1) replaced.seo.h1 = copy.name;
  // No model ships with either tool, so no engine manifest applies.
  if (replaced.Engine) replaced.Engine = id === 'ocr_scan' ? 'pattern-matching' : 'bm25-retrieval';
  delete replaced.wasmModule;
  fs.writeFileSync(p, JSON.stringify(replaced, null, 2) + '\n');
  const leftovers = JSON.stringify(replaced).match(/tesseract|bge-micro|OPFS OPFS/gi);
  console.log('rewrote', p, leftovers ? 'LEFTOVERS: ' + leftovers.join(',') : 'clean');
}
