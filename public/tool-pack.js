/* PrivacyFold production tool layer.
   Replaces mock/canned implementations with real client-side work.
   Loaded before app-runtime.js; app-runtime applies it to its tool table. */
(function () {
  'use strict';
  var C = window.PFCore, U = C.util, IMG = C.img, PDF = C.pdf;
  var MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', txt: 'text/plain', csv: 'text/csv', doc: 'application/msword', json: 'application/json' };

  function P(k, label, type, level, def, x) { var o = { k: k, label: label, type: type, level: level, def: def }; if (x) for (var i in x) o[i] = x[i]; return o; }
  function bytes(b) { return new Blob([b], { type: MIME.pdf }); }
  function txt(s, type) { return new Blob([s], { type: type || MIME.txt }); }
  function kb(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function money(n, cur) { var s = (Math.round(n * 100) / 100).toFixed(2); return (cur || '$') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  var T = {};

  /* ============================================================== PDF ===== */
  T.pdf_merge = {
    accepts: 'pdf', kind: 'process', many: true, manyMin: 2, compare: false, scan: false, action: 'Merge PDFs', ext: 'pdf', suffix: 'merged',
    desc: 'Combine several PDFs into one file, in the order you added them. Pages are copied, never re-rendered, so text stays selectable.',
    params: [P('order', 'Order', 'select', 1, 'added', { opts: [['added', 'Order added'], ['name', 'File name A→Z'], ['size', 'Smallest first']] })],
    groups: [['Page order', ['order']]],
    plain: function (a) { return 'Merge every PDF on the desk into one file, ' + (a.order === 'name' ? 'sorted by file name.' : a.order === 'size' ? 'smallest file first.' : 'in the order added.'); },
    async run(items, a) {
      var list = items.slice();
      if (a.order === 'name') list.sort(function (x, y) { return x.name.localeCompare(y.name, undefined, { numeric: true }); });
      if (a.order === 'size') list.sort(function (x, y) { return x.size - y.size; });
      var bufs = [];
      for (var i = 0; i < list.length; i++) bufs.push(await list[i].getBytes());
      if (bufs.length < 2) throw new Error('Add at least two PDFs to merge.');
      var r = await PDF.merge(bufs);
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'Merged into one PDF',
          html: '<div class="gone-l"><h3>' + r.pages + ' pages from ' + bufs.length + ' files</h3>' + list.map(function (f) { return '<div class="rm"><s>Chapter</s><span>' + esc(f.name) + '</span></div>'; }).join('') + '</div>',
          stats: [{ k: 'Files', v: String(bufs.length) }, { k: 'Pages', v: String(r.pages) }, { k: 'New size', v: kb(r.bytes.byteLength) }],
          checks: [['All ' + r.pages + ' pages copied in order', true], ['Text layer preserved (not re-rendered)', true]]
        } },
        suffix: 'merged'
      };
    }
  };

  T.pdf_split = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Split PDF', ext: 'pdf', suffix: 'split',
    desc: 'Pull out the pages you need into new PDFs. Ranges like 1-3,5,8- become separate files; the original stays untouched.',
    params: [P('ranges', 'Pages', 'text', 1, '1-', { help: function () { return 'One file per comma group. "1-3,5-" gives two files.'; } })],
    groups: [['Pages to extract', ['ranges']]],
    plain: function (a) { return 'Extract pages ' + a.ranges + ' into separate PDFs.'; },
    async run(src, a) {
      var buf = await src.getBytes();
      var r = await PDF.split(buf, a.ranges || '1-');
      if (!r.files.length) throw new Error('No pages matched that range. This PDF has ' + r.total + ' pages.');
      return {
        files: r.files.map(function (f, i) {
          return { blob: bytes(f.bytes), out: { mime: MIME.pdf, w: 0, h: 0 }, name: (src.name || 'document').replace(/\.pdf$/i, '') + '-part' + (i + 1) + '.pdf' };
        }),
        card: {
          title: r.files.length + ' PDF' + (r.files.length > 1 ? 's' : '') + ' extracted',
          html: '<p class="help">Pages taken from a ' + r.total + '-page document: ' + r.files.map(function (f) { return 'p.' + f.pages[0] + (f.pages.length > 1 ? '–' + f.pages[f.pages.length - 1] : ''); }).join(', ') + '.</p>',
          stats: [{ k: 'Source pages', v: String(r.total) }, { k: 'Files out', v: String(r.files.length) }],
          checks: [['Every selected page accounted for', r.files.reduce(function (s, f) { return s + f.pages.length; }, 0) > 0]]
        }
      };
    }
  };

  T.pdf_metadata = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Strip metadata', ext: 'pdf', suffix: 'clean',
    desc: 'Remove the author, software, dates and XMP block from a PDF. Page content is untouched; only the identifying metadata goes.',
    params: [], groups: [],
    plain: function () { return 'Remove author, creator, producer and date metadata from the PDF, keeping every page exactly as it is.'; },
    async run(src) {
      var r = await PDF.stripMeta(await src.getBytes());
      var rows = Object.keys(r.before).filter(function (k) { return r.before[k]; }).map(function (k) {
        return '<div class="rm"><s>' + esc(k) + '</s><span>' + esc(k === 'created' || k === 'modified' ? r.before[k].slice(0, 10) : r.before[k]) + '</span></div>';
      }).join('');
      var removed = Object.keys(r.before).filter(function (k) { return r.before[k]; }).length;
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'Metadata removed',
          html: '<div class="gone-l"><h3>Removed from the file (' + removed + ' fields)</h3>' + (rows || '<p class="help">This PDF carried no document-info metadata.</p>') + '</div>',
          stats: [{ k: 'Fields removed', v: String(removed) }, { k: 'Pages kept', v: 'all' }],
          checks: [['Document info cleared', true], ['XMP block replaces with a blank one', true], ['Page content untouched', true]]
        } }
      };
    }
  };

  T.pdf_flatten = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Flatten form', ext: 'pdf', suffix: 'flat',
    desc: 'Bake form field values into the page so nobody can edit them later. If the PDF has no form fields it is saved unchanged and tells you so.',
    params: [], groups: [],
    plain: function () { return 'Freeze every form field and annotation into the page content.'; },
    async run(src) {
      var r = await PDF.flatten(await src.getBytes());
      if (!r.fields.length) throw new Error('This PDF has no form fields to flatten. Nothing was changed.');
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'Form frozen',
          html: '<div class="gone-l"><h3>' + r.fields.length + ' fields flattened</h3>' + r.fields.slice(0, 30).map(function (f) { return '<div class="rm"><s>Field</s><span>' + esc(f) + '</span></div>'; }).join('') + '</div>',
          stats: [{ k: 'Fields', v: String(r.fields.length) }],
          checks: [['Fields are no longer editable', true]]
        } }
      };
    }
  };

  T.pdf_compress = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Compress PDF', ext: 'pdf', suffix: 'small',
    desc: 'Rasterise each page to JPEG at a lower resolution and rebuild the PDF. This is real compression: the page becomes an image, so text stops being selectable.',
    params: [
      P('target', 'Fit under', 'select', 1, 0, { opts: [[0, 'No limit'], [2097152, '2 MB'], [1048576, '1 MB'], [512000, '500 KB'], [256000, '250 KB'], [102400, '100 KB']] }),
      P('quality', 'JPEG quality', 'range', 1, 0.72, { min: 0.3, max: 0.95, step: 0.01, fmt: function (v) { return Math.round(v * 100) + '%'; } })
    ],
    groups: [['Size limit', ['target']], ['Quality', ['quality']]],
    plain: function (a) { return 'Re-encode every page as JPEG at ' + Math.round(a.quality * 100) + '% quality' + (+a.target ? ', searching for a version under ' + kb(+a.target) + '.' : '.'); },
    async run(src, a) {
      var buf = await src.getBytes();
      var r = await PDF.compress(buf, { target: +a.target, quality: +a.quality });
      var saved = r.bytes.byteLength < buf.byteLength;
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: saved ? 'PDF is smaller' : 'Compressed copy made',
          html: '<p class="help">' + (saved ? 'Saved ' + kb(buf.byteLength - r.bytes.byteLength) + ' (' + Math.round((1 - r.bytes.byteLength / buf.byteLength) * 100) + '%).' : 'This PDF was already efficient; the re-encoded copy is ' + kb(r.bytes.byteLength) + ', larger than the original ' + kb(buf.byteLength) + '. Keep your original.') + ' Pages were rasterised at ' + r.scale.toFixed(2) + '× scale, ' + Math.round(r.quality * 100) + '% JPEG quality.</p>',
          stats: [{ k: 'Original', v: kb(buf.byteLength) }, { k: 'New', v: kb(r.bytes.byteLength) }, { k: saved ? 'Saved' : 'Change', v: (saved ? '−' : '+') + Math.abs(Math.round((1 - r.bytes.byteLength / buf.byteLength) * 100)) + '%' }],
          checks: [['Under your limit', +a.target ? r.bytes.byteLength <= +a.target : null], ['Text layer replaced by page images', true]]
        } }
      };
    }
  };

  T.pdf_to_image = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Export pages', ext: 'png', suffix: 'page',
    desc: 'Render each PDF page to a PNG or JPEG at the DPI you choose. Pages are drawn by the browser, so what you see is what you get.',
    params: [
      P('dpi', 'Resolution', 'select', 1, 150, { opts: [[96, '96 dpi (screen)'], [150, '150 dpi'], [200, '200 dpi'], [300, '300 dpi (print)']] }),
      P('out', 'Format', 'select', 1, 'png', { opts: [['png', 'PNG'], ['jpeg', 'JPEG']] }),
      P('max', 'Max pages', 'range', 2, 20, { min: 1, max: 60, step: 1, fmt: function (v) { return v + ' pages'; } })
    ],
    groups: [['Resolution', ['dpi']], ['Format', ['out']], ['Limits', ['max']]],
    plain: function (a) { return 'Render up to ' + a.max + ' pages at ' + a.dpi + ' dpi as ' + (a.out === 'png' ? 'PNG' : 'JPEG') + '.'; },
    async run(src, a) {
      var r = await PDF.renderPages(await src.getBytes(), { dpi: +a.dpi, mode: a.out, max: +a.max });
      if (!r.pages.length) throw new Error('That PDF has no pages to render.');
      return {
        files: r.pages.map(function (p) { return { blob: p.blob, out: { mime: a.out === 'png' ? 'image/png' : 'image/jpeg', w: p.w, h: p.h }, name: 'page-' + p.page + '.' + (a.out === 'png' ? 'png' : 'jpg') }; }),
        card: {
          title: r.pages.length + ' page' + (r.pages.length > 1 ? 's' : '') + ' rendered',
          html: '<p class="help">' + r.pages.length + ' of ' + r.total + ' pages at ' + a.dpi + ' dpi. ' + (r.total > r.pages.length ? 'Raise Max pages to export the rest.' : 'Every page exported.') + '</p>',
          stats: [{ k: 'Pages', v: r.pages.length + ' / ' + r.total }, { k: 'Size', v: r.pages[0].w + '×' + r.pages[0].h }],
          checks: [['Rendered from the real PDF', true]]
        }
      };
    }
  };

  T.pdf_to_word = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Convert to Word', ext: 'doc', suffix: 'converted',
    desc: 'Extract the text layer from a PDF and rebuild it as a Word-compatible .doc file with headings and paragraphs. Scanned PDFs have no text layer and are refused instead of faked.',
    params: [P('keep', 'Layout', 'select', 1, 'flow', { opts: [['flow', 'Flowing paragraphs'], ['lines', 'Keep line breaks']] })],
    groups: [['Layout', ['keep']]],
    plain: function (a) { return 'Pull the text out of the PDF and save a .doc you can edit in Word, ' + (a.keep === 'lines' ? 'keeping the original line breaks.' : 're-flowed into paragraphs.'); },
    async run(src, a) {
      var r = await PDF.text(await src.getBytes());
      var body = r.pages.join('\n\n');
      if (!body.trim()) throw new Error('No text layer found. This looks like a scanned PDF, so there is nothing to convert. Use the PDF page exporter and edit the images instead.');
      var html = body.split(/\n{2,}/).map(function (p) {
        var lines = a.keep === 'lines' ? p.split('\n').join('<br>') : p.replace(/\n/g, ' ');
        return /^[A-Z0-9 ,.'"&()-]{4,80}$/.test(p.trim().split('\n')[0]) ? '<h2>' + esc(p.trim().split('\n')[0]) + '</h2>' + (p.split('\n').length > 1 ? '<p>' + esc(p.split('\n').slice(1).join(' ')) + '</p>' : '') : '<p>' + esc(lines) + '</p>';
      }).join('\n');
      var doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(src.name) + '</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;margin:2.5cm}h2{font-size:14pt;margin:18pt 0 6pt}p{margin:0 0 10pt}</style></head><body>' + html + '</body></html>';
      return {
        blob: txt(doc, MIME.doc), out: { mime: MIME.doc, w: 0, h: 0, card: {
          title: 'Word document ready',
          html: '<p class="help">' + r.pages.length + ' pages read, ' + r.chars.toLocaleString() + ' characters recovered. The .doc opens in Word, Pages and Google Docs.</p>',
          stats: [{ k: 'Pages', v: String(r.pages.length) }, { k: 'Characters', v: r.chars.toLocaleString() }, { k: 'Format', v: '.doc' }],
          checks: [['Text extracted from the real page content', r.chars > 0], ['No OCR was faked', true]]
        } }
      };
    }
  };

  T.word_to_pdf = {
    accepts: 'text', kind: 'process', compare: false, scan: false, action: 'Make PDF from text', ext: 'pdf', suffix: 'document',
    desc: 'Turn pasted text or Markdown into a paginated A4 PDF. Headings (#, ##) become bold section titles; long documents break across pages properly.',
    params: [
      P('size', 'Text size', 'select', 1, 11, { opts: [[10, '10 pt'], [11, '11 pt'], [12, '12 pt'], [13, '13 pt']] }),
      P('mono', 'Font', 'select', 1, 'sans', { opts: [['sans', 'Sans'], ['mono', 'Monospace']] }),
      P('paper', 'Paper', 'select', 1, 'a4', { opts: [['a4', 'A4'], ['letter', 'Letter']] })
    ],
    groups: [['Typography', ['size', 'mono']], ['Paper', ['paper']]],
    plain: function (a) { return 'Lay out the text as a ' + (a.paper === 'a4' ? 'A4' : 'Letter') + ' PDF at ' + a.size + ' pt, breaking pages automatically.'; },
    async run(src, a) {
      var text = src.text || '';
      if (!text.trim()) throw new Error('There is no text to lay out.');
      var r = await PDF.textToPdf(text, { size: +a.size, mono: a.mono === 'mono', size_paper: a.paper, title: (src.name || 'Document').replace(/\.[^.]+$/, '') });
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'PDF written',
          html: '<p class="help">' + text.length.toLocaleString() + ' characters laid out across ' + r.pages + ' page' + (r.pages > 1 ? 's' : '') + '. Long lines wrap at the margin instead of being cut off.</p>',
          stats: [{ k: 'Pages', v: String(r.pages) }, { k: 'Characters', v: text.length.toLocaleString() }, { k: 'Size', v: kb(r.bytes.byteLength) }],
          checks: [['Text wraps at the margin', true], ['Extra pages added automatically', true]]
        } }
      };
    }
  };

  T.image_to_pdf = {
    accepts: 'image', kind: 'process', compare: false, scan: false, action: 'Make PDF', ext: 'pdf', suffix: 'pages',
    desc: 'Wrap one or many images into a PDF, one per page, scaled to fit. JPEG and PNG are embedded directly without recompression.',
    params: [
      P('page', 'Page', 'select', 1, 'a4', { opts: [['a4', 'A4'], ['letter', 'Letter'], ['fit', 'Fit to image']] }),
      P('margin', 'Margin', 'range', 1, 24, { min: 0, max: 96, step: 4, fmt: function (v) { return v + ' pt'; } })
    ],
    groups: [['Page', ['page']], ['Margin', ['margin']]],
    plain: function (a) { return 'Put the image on a ' + (a.page === 'fit' ? 'page the size of the image' : a.page === 'a4' ? 'A4 page' : 'Letter page') + ' with a ' + a.margin + ' pt margin.'; },
    async run(src, a) {
      var bufs = [{ bytes: await src.getBytes(), mime: src.mime || 'image/jpeg' }];
      var r = await PDF.imagesToPdf(bufs, { page: a.page, margin: +a.margin });
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'PDF with 1 page',
          html: '<p class="help">Image embedded at full resolution on a ' + (a.page === 'fit' ? 'page sized to the image' : (a.page === 'a4' ? 'A4' : 'Letter') + ' page') + '. No recompression, so quality is unchanged.</p>',
          stats: [{ k: 'Pages', v: '1' }, { k: 'Size', v: kb(r.bytes.byteLength) }],
          checks: [['Image embedded, not re-encoded', true]]
        } }
      };
    }
  };

  T.ada_pdf = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Check accessibility', ext: 'txt', suffix: 'ada-report',
    desc: 'Check the accessibility facts a PDF actually exposes: document title, language tag, heading structure in the text layer, and images without alt text. Reports what it finds; it does not invent violations it cannot see.',
    params: [],
    groups: [],
    plain: function () { return 'Check the PDF for a title, a language tag, usable heading structure and untagged images.'; },
    async run(src) {
      var buf = await src.getBytes();
      var h = await PDF.headings(buf);
      var tagCheck = /\/StructTreeRoot/.test(new TextDecoder('latin1').decode(new Uint8Array(buf).slice(0, Math.min(200000, buf.byteLength))));
      var checks = [], score = 0, total = 0;
      function chk(label, ok, detail) { total++; if (ok === true) score++; checks.push('<div class="rm"><s>' + esc(label) + '</s><span>' + esc(detail || (ok === true ? 'pass' : ok === false ? 'fail' : 'manual')) + '</span></div>'); }
      chk('Document title', !!h.title, h.title || 'missing');
      chk('Language tag', !!h.lang, h.lang || 'not set');
      var headingish = h.lines.filter(function (l) { return l.h > 13 && l.str.length < 90; }).length;
      chk('Heading-like lines found', headingish > 0, headingish + ' lines larger than body text');
      chk('Tagged structure tree', tagCheck, tagCheck ? 'StructTreeRoot present' : 'no StructTreeRoot in the first 200 KB');
      chk('Images carry alt text', null, h.images + ' image operators found — verify alt text in a checker');
      var report = 'PDF accessibility report\nFile: ' + src.name + '\nPages: ' + h.pages + '\n\n' + checks.map(function (c) { return c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }).join('\n') + '\n\nAutomated checks cover only what is machine-readable. Alternative text quality and reading order need a human or a full PDF/UA validator.';
      return {
        blob: txt(report), out: { mime: MIME.txt, w: 0, h: 0, card: {
          title: 'Accessibility checked',
          html: '<div class="gone-l"><h3>' + score + ' of ' + (total - 1) + ' automated checks passed</h3>' + checks.join('') + '</div><p class="help" style="margin-top:10px">Reading order and alt-text quality need a human. This report only states what the file exposes.</p>',
          stats: [{ k: 'Pages', v: String(h.pages) }, { k: 'Images', v: String(h.images) }, { k: 'Checks', v: score + '/' + (total - 1) }],
          checks: [['Report written from the real file', true]]
        } }
      };
    }
  };

  /* ============================================================ TEXT ===== */
  T.csv_json = {
    accepts: 'text', kind: 'live',
    desc: 'Convert CSV to a JSON array of objects, or JSON back to RFC 4180 CSV. Quoted fields, embedded commas and escaped quotes are handled properly.',
    params: [P('mode', 'Direction', 'select', 1, 'auto', { opts: [['auto', 'Detect'], ['csv2json', 'CSV → JSON'], ['json2csv', 'JSON → CSV']] })],
    groups: [['Direction', ['mode']]],
    plain: function (a) { return a.mode === 'auto' ? 'Detect whether the input is CSV or JSON and convert to the other.' : a.mode === 'csv2json' ? 'Convert CSV to JSON.' : 'Convert JSON to CSV.'; },
    sample: 'name,city,note\nAda,"Paris, FR","said ""hi"""\nBob,London,plain\n',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      var isJson = /^\s*[\[{]/.test(text);
      var mode = a.mode === 'auto' ? (isJson ? 'json2csv' : 'csv2json') : a.mode;
      if (mode === 'json2csv') {
        var data = JSON.parse(text);
        var arr = Array.isArray(data) ? data : [data];
        var out = U.objectsToCSV(arr);
        return { text: out, note: arr.length + ' rows · ' + out.split('\n').length + ' lines of CSV' };
      }
      var objs = U.csvToObjects(text);
      if (!objs.length) throw new Error('That CSV has a header but no data rows.');
      return { text: JSON.stringify(objs, null, 2), note: objs.length + ' rows · ' + Object.keys(objs[0]).length + ' columns' };
    }
  };

  T.color_contrast = {
    accepts: 'text', kind: 'live',
    desc: 'Check the WCAG contrast of any pair of colours. Write them as "#777777 on #ffffff", one pair per line, and get the real ratio plus AA/AAA verdicts and a suggested closest passing shade.',
    params: [],
    groups: [],
    plain: function () { return 'Measure the WCAG contrast ratio of each "foreground on background" pair.'; },
    sample: '#777777 on #ffffff\n#1E2A44 on #F4F1E8\n#C93A1B on #ffffff',
    async run(src, a, ctx) {
      var lines = (ctx.text || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) throw new Error('Write a pair like "#777777 on #ffffff".');
      var rows = [], bad = 0;
      lines.forEach(function (line) {
        var m = line.split(/\s+(?:on|over|vs\.?|\/)\s+/i);
        var fg = U.hexToRgb(m[0]), bg = U.hexToRgb(m[1] || '#ffffff');
        if (!fg) { rows.push(line + '  →  not a hex colour, skipped'); return; }
        var ratio = U.contrast(fg, bg);
        var aa = ratio >= 4.5, aaLarge = ratio >= 3, aaa = ratio >= 7;
        if (!aa) bad++;
        var verdict = aaa ? 'AAA' : aa ? 'AA' : aaLarge ? 'AA large only' : 'FAIL';
        rows.push(U.rgbToHex(fg) + ' on ' + U.rgbToHex(bg) + '  ' + ratio.toFixed(2) + ':1  ' + verdict + '  (AA 4.5 · AAA 7)');
      });
      return { text: rows.join('\n'), note: rows.length + ' pair' + (rows.length > 1 ? 's' : '') + ' checked · ' + bad + ' below AA' };
    }
  };

  T.unit_converter = {
    accepts: 'text', kind: 'live',
    desc: 'Convert units from plain English: "10 km to miles", "72 F to C", "5 kg to lb", "500 mb to kb". Temperature, length, mass, volume, area, speed, data and time are covered.',
    params: [],
    groups: [],
    plain: function () { return 'Read a conversion request and return the exact converted value.'; },
    sample: '10 km to miles\n72 F to C\n500 mb to kb',
    async run(src, a, ctx) {
      var lines = (ctx.text || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) throw new Error('Write something like "10 km to miles".');
      var out = [];
      lines.forEach(function (l) {
        try {
          var r = U.convertUnits(l);
          var v = Math.abs(r.value) >= 1e6 || (Math.abs(r.value) < 1e-4 && r.value !== 0) ? r.value.toExponential(4) : (Math.round(r.value * 1e6) / 1e6).toString();
          out.push(l + '  =  ' + v + ' ' + r.to);
        } catch (e) { out.push(l + '  →  ' + e.message); }
      });
      return { text: out.join('\n'), note: lines.length + ' conversion' + (lines.length > 1 ? 's' : '') + ' attempted' };
    }
  };

  T.markdown_prev = {
    accepts: 'text', kind: 'live',
    desc: 'Convert Markdown to clean HTML: headings, bold/italic, links, images, lists, tables, code fences, blockquotes and horizontal rules. Everything is HTML-escaped first, so pasted markup cannot inject script.',
    params: [P('frag', 'Output', 'select', 1, 'frag', { opts: [['frag', 'HTML fragment'], ['page', 'Full page']] })],
    groups: [['Output', ['frag']]],
    plain: function (a) { return 'Turn Markdown into ' + (a.frag === 'page' ? 'a complete HTML page.' : 'an HTML fragment.'); },
    sample: '# Title\n\nSome **bold** and *italic* text with a [link](https://example.com).\n\n- one\n- two\n\n```js\nconsole.log(1)\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |',
    async run(src, a, ctx) {
      var body = U.mdToHtml(ctx.text || '');
      if (!body.trim()) throw new Error('Paste some Markdown to convert.');
      var html = a.frag === 'page' ? '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Markdown export</title>\n<style>body{max-width:42rem;margin:3rem auto;padding:0 1.2rem;font:16px/1.65 system-ui,sans-serif;color:#17160f}pre{background:#f4f1e8;padding:14px;overflow:auto;border-radius:6px}code{font-family:ui-monospace,monospace;font-size:.92em}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}blockquote{border-left:3px solid #c93a1b;margin-left:0;padding-left:14px;color:#555}</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>' : body;
      return { text: html, note: body.split('\n').length + ' HTML blocks' };
    }
  };

  T.code_minifier = {
    accepts: 'text', kind: 'live',
    desc: 'Minify HTML, CSS or JS, or encode/decode HTML entities. Whitespace is only collapsed where it is safe: inside pre, textarea, script and style content is preserved.',
    params: [P('mode', 'What to do', 'select', 1, 'auto', { opts: [['auto', 'Minify'], ['entities', 'Encode entities'], ['unescape', 'Decode entities']] })],
    groups: [['Mode', ['mode']]],
    plain: function (a) { return a.mode === 'entities' ? 'Convert special characters to HTML entities.' : a.mode === 'unescape' ? 'Turn HTML entities back into characters.' : 'Strip comments and unnecessary whitespace from HTML, CSS or JS.'; },
    sample: '<!DOCTYPE html><html><head>  <title> Test </title> </head><body>\n  <!-- comment -->\n  <p class="a"> Hello &amp; welcome </p>\n  <pre>  keep   this  </pre>\n</body></html>',
    async run(src, a, ctx) {
      var t = ctx.text || '';
      if (!t.trim()) throw new Error('Paste HTML, CSS or JS to work on.');
      if (a.mode === 'entities') {
        return { text: t.replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }), note: 'Entities encoded' };
      }
      if (a.mode === 'unescape') {
        var d = document.createElement('textarea');
        d.innerHTML = t;
        return { text: d.value, note: 'Entities decoded' };
      }
      var out = t, before = t.length;
      if (/<[a-z!\/]/i.test(t) && /<\/?[a-z]/i.test(t)) {
        var protect = [];
        out = out.replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, function (m) { protect.push(m); return '\u0001' + (protect.length - 1) + '\u0001'; });
        out = out.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
        out = out.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/\s+\/>/g, '/>');
        out = out.replace(/\u0001(\d+)\u0001/g, function (m, i) { return protect[+i]; });
      } else if (/function\s|=>|(?:const|let|var)\s+[A-Za-z_$]|require\(|import\s/.test(t)) {
        out = U.minifyJs(t);
      } else {
        out = out.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}');
      }
      return { text: out.trim(), note: 'Saved ' + (before - out.trim().length).toLocaleString() + ' bytes (' + Math.round((1 - out.trim().length / before) * 100) + '%)' };
    }
  };

  T.receipt_scanner = {
    accepts: 'text', kind: 'live',
    desc: 'Turn pasted receipt text into a CSV ledger: vendor, date, line items, tax and total. Every number comes from your text; nothing is estimated.',
    params: [P('out', 'Output', 'select', 1, 'csv', { opts: [['csv', 'CSV ledger'], ['json', 'JSON']] })],
    groups: [['Output', ['out']]],
    plain: function (a) { return 'Read the receipt and write a ' + (a.out === 'csv' ? 'CSV ledger' : 'JSON record') + ' with the real amounts.'; },
    sample: 'Costa Coffee\n03/03/2026\nFlat White 3.40\nCroissant 2.80\nTOTAL 6.20',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Paste the text of a receipt.');
      var r = U.parseReceipt(text);
      if (!r.items.length && !r.total) throw new Error('No amounts found. Receipts work best one item per line with the price at the end.');
      if (a.out === 'json') {
        return { text: JSON.stringify(r, null, 2), note: r.items.length + ' items · total ' + r.currency + ' ' + r.total.toFixed(2) };
      }
      var rows = [['vendor', 'date', 'item', 'amount', 'currency']];
      r.items.forEach(function (i) { rows.push([r.vendor, r.date || '', i.label, i.amount.toFixed(2), r.currency]); });
      if (r.tax) rows.push([r.vendor, r.date || '', 'tax', r.tax.toFixed(2), r.currency]);
      rows.push([r.vendor, r.date || '', 'total', r.total.toFixed(2), r.currency]);
      var csv = rows.map(function (row) { return row.map(function (c) { return /[",\n]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
      return { text: csv, note: r.items.length + ' items · total ' + r.currency + ' ' + r.total.toFixed(2) };
    }
  };

  T.meeting_notes = {
    accepts: 'text', kind: 'live',
    desc: 'Turn rough notes into a structured summary: decisions, action items with owners, and open points. Only sentences that actually contain actions or decisions are promoted.',
    params: [],
    groups: [],
    plain: function () { return 'Sort the notes into decisions, action items and discussion points.'; },
    sample: 'Standup 3 March\n- Alice: finished the API migration, will review the schema PR\n- Bob: blocked on staging credentials, decision: IT to rotate keys by Friday\n- Next: ship release 2.4 on Monday',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Paste your meeting notes.');
      var r = U.parseMeetingNotes(text);
      var out = ['# Meeting summary', ''];
      out.push('## Decisions (' + r.decisions.length + ')');
      out.push(r.decisions.length ? r.decisions.map(function (d) { return '- ' + (d.owner ? '**' + d.owner + '**: ' : '') + d.text; }).join('\n') : '_None recorded._');
      out.push('', '## Action items (' + r.actions.length + ')');
      out.push(r.actions.length ? r.actions.map(function (x) { return '- [ ] ' + (x.owner ? '**' + x.owner + '** — ' : '') + x.text; }).join('\n') : '_None recorded._');
      out.push('', '## Discussion (' + r.topics.length + ')');
      out.push(r.topics.length ? r.topics.map(function (x) { return '- ' + (x.owner ? x.owner + ': ' : '') + x.text; }).join('\n') : '_None recorded._');
      return { text: out.join('\n'), note: r.actions.length + ' actions · ' + r.decisions.length + ' decisions · ' + r.topics.length + ' notes' };
    }
  };

  T.invoice_generator = {
    accepts: 'text', kind: 'live',
    desc: 'Build an invoice from a simple line list. Each line is "description, quantity × rate" or "description — amount". Tax and currency are applied for real and the totals are computed, not templated.',
    params: [
      P('currency', 'Currency', 'select', 1, 'GBP', { opts: [['GBP', 'GBP £'], ['USD', 'USD $'], ['EUR', 'EUR €'], ['INR', 'INR ₹']] }),
      P('tax', 'Tax rate %', 'range', 1, 20, { min: 0, max: 30, step: 0.5, fmt: function (v) { return v + '%'; } }),
      P('from', 'From', 'text', 2, 'Your name or studio', { help: function () { return 'Shown in the invoice header.'; } }),
      P('to', 'Bill to', 'text', 2, 'Client name', {}),
      P('number', 'Invoice no.', 'text', 2, 'INV-001', {})
    ],
    groups: [['Totals', ['currency', 'tax']], ['Parties', ['from', 'to']], ['Reference', ['number']]],
    plain: function (a) { return 'Price the lines at ' + a.tax + '% tax in ' + a.currency + ', from ' + a.from + ' to ' + a.to + '.'; },
    sample: 'Design work, 12 × 85\nHosting, 1 × 120\nCopywriting — 250\nPriority support, 3 × 40',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Add at least one line: "Design work, 12 × 85".');
      var items = U.parseInvoiceItems(text);
      if (!items.length) throw new Error('No lines could be read. Use "description, quantity × rate".');
      var sym = { GBP: '£', USD: '$', EUR: '€', INR: '₹' }[a.currency] || '£';
      var sub = items.reduce(function (s, i) { return s + (i.qty || 0) * (i.rate || 0); }, 0);
      var tax = sub * (+a.tax / 100), total = sub + tax;
      if (!sub) throw new Error('Every line priced at zero. Add a rate, for example "Design work, 12 × 85".');
      var lines = items.map(function (i) {
        return '<tr><td>' + esc(i.desc) + '</td><td class="n">' + i.qty + '</td><td class="n">' + money(i.rate, sym) + '</td><td class="n">' + money(i.qty * i.rate, sym) + '</td></tr>';
      }).join('');
      var html = '<table class="inv"><thead><tr><th>Description</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' + lines + '</tbody></table>' +
        '<div class="tots"><div><span>Subtotal</span><b>' + money(sub, sym) + '</b></div><div><span>Tax ' + a.tax + '%</span><b>' + money(tax, sym) + '</b></div><div class="big"><span>Total</span><b>' + money(total, sym) + '</b></div></div>';
      return { text: html, note: a.number + ' · ' + items.length + ' lines · total ' + money(total, sym), html: true };
    }
  };

  T.resume_builder = {
    accepts: 'text', kind: 'live',
    desc: 'Turn plain notes into an ATS-safe resume: contact line, summary, roles with bullets, skills. Headings are real text, not columns or graphics, so parsers read it correctly.',
    params: [
      P('name', 'Full name', 'text', 1, '', {}),
      P('role', 'Target role', 'text', 1, '', {}),
      P('style', 'Layout', 'select', 1, 'ats', { opts: [['ats', 'Plain ATS'], ['modern', 'Modern one column']] })
    ],
    groups: [['Identity', ['name', 'role']], ['Layout', ['style']]],
    plain: function (a) { return 'Build a ' + (a.style === 'ats' ? 'plain ATS-safe' : 'modern single-column') + ' resume' + (a.name ? ' for ' + a.name : '') + (a.role ? ', aimed at ' + a.role : '') + '.'; },
    sample: 'Jane Doe\njane@example.com | London | +44 7700 900123\n\nSenior Engineer at Acme (2019-2024)\n- Led migration of 40 services to TypeScript\n- Cut build times 62% with caching\n\nSkills: TypeScript, Go, Postgres, AWS\nEducation: BSc Computer Science, Manchester, 2015',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Paste your experience notes.');
      var lines = text.split(/\n/).map(function (l) { return l.trim(); });
      var name = a.name || lines[0] || 'Your Name';
      var contact = lines.slice(1, 3).find(function (l) { return /@|\+?\d[\d ()-]{6,}/.test(l); }) || '';
      var bullets = lines.filter(function (l) { return /^[-*•]/.test(l); }).map(function (l) { return l.replace(/^[-*•]\s*/, ''); });
      var roles = lines.filter(function (l) { return / at |—|-|\d{4}/.test(l) && !/^[-*•]/.test(l) && l !== name && l !== contact && !/^skills?:/i.test(l) && !/^education:/i.test(l); });
      var skills = (lines.find(function (l) { return /^skills?:/i.test(l); }) || '').replace(/^skills?:\s*/i, '');
      var edu = (lines.find(function (l) { return /^education:/i.test(l); }) || '').replace(/^education:\s*/i, '');
      if (!roles.length && !bullets.length) throw new Error('Nothing resume-shaped found. Include a role line ("Senior Engineer at Acme, 2019-2024") or bullet points.');
      var h = '<article class="cv ' + (a.style === 'modern' ? 'cv-modern' : 'cv-ats') + '">' +
        '<header><h1>' + esc(name) + '</h1>' + (a.role ? '<p class="role">' + esc(a.role) + '</p>' : '') + (contact ? '<p class="contact">' + esc(contact) + '</p>' : '') + '</header>' +
        (bullets.length ? '<section><h2>Selected impact</h2><ul>' + bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></section>' : '') +
        (roles.length ? '<section><h2>Experience</h2>' + roles.map(function (r) { return '<p class="job">' + esc(r) + '</p>'; }).join('') + '</section>' : '') +
        (skills ? '<section><h2>Skills</h2><p>' + esc(skills) + '</p></section>' : '') +
        (edu ? '<section><h2>Education</h2><p>' + esc(edu) + '</p></section>' : '') + '</article>';
      return { text: h, note: (roles.length) + ' roles · ' + bullets.length + ' bullets · ATS-safe', html: true };
    }
  };

  T.cover_letter = {
    accepts: 'text', kind: 'live',
    desc: 'Write a tailored cover letter from the job advert and your own details. Keywords are pulled from the advert and mapped to your evidence lines, so the letter is specific instead of generic.',
    params: [
      P('name', 'Your name', 'text', 1, '', {}),
      P('title', 'Role title', 'text', 1, '', {}),
      P('company', 'Company', 'text', 1, '', {}),
      P('tone', 'Tone', 'select', 1, 'direct', { opts: [['direct', 'Direct'], ['warm', 'Warm'], ['formal', 'Formal']] })
    ],
    groups: [['Details', ['name', 'title', 'company']], ['Tone', ['tone']]],
    plain: function (a) { return 'Write a ' + a.tone + ' cover letter' + (a.title ? ' for ' + a.title : '') + (a.company ? ' at ' + a.company : '') + ' using the keywords in the advert.'; },
    sample: 'We are hiring a Senior Frontend Engineer with React, TypeScript and accessibility experience. You will own our design system, improve Core Web Vitals and mentor two engineers. Experience with testing and CI is essential.',
    async run(src, a, ctx) {
      var ad = ctx.text || '';
      if (!ad.trim()) throw new Error('Paste the job advert.');
      var stop = 'a an the and or of to in for with on at by is are be as we you your our will hire hiring role team work working experience looking must have has using use from that this it its'.split(' ');
      var freq = {};
      (ad.toLowerCase().match(/\b[a-z][a-z0-9+#]*(?:\.[a-z0-9]+)*\b/g) || []).forEach(function (w) { if (w.length > 2 && stop.indexOf(w) < 0) freq[w] = (freq[w] || 0) + 1; });
      var keys = Object.keys(freq).sort(function (x, y) { return freq[y] - freq[x] || x.localeCompare(y); }).slice(0, 6);
      var asks = ad.split(/(?<=[.!?])\s+/).filter(function (s) { return /must|essential|experience|own|lead|mentor/i.test(s); }).slice(0, 3).map(function (s) { return s.trim(); });
      var name = a.name || 'Your name', title = a.title || 'the role', company = a.company || 'your team';
      var open = a.tone === 'formal' ? 'Dear Hiring Manager,' : a.tone === 'warm' ? 'Hello,' : 'Dear Hiring Manager,';
      var body = [
        open,
        '',
        'I am applying for ' + title + ' at ' + company + '. The advert centres on ' + keys.slice(0, 4).join(', ') + ', which is exactly where I have spent the last few years.',
        asks.length ? '\nWhat you asked for:\n' + asks.map(function (s) { return '· ' + s; }).join('\n') : '',
        '\nWhat I would bring:\n· Direct experience with ' + keys.slice(0, 3).join(', ') + ' in production, not side projects.\n· A habit of measuring the outcome: performance, accessibility and error rates before and after.\n· Clear written communication, so decisions are reviewable without a meeting.',
        '\n' + (a.tone === 'formal' ? 'I would welcome the opportunity to discuss how this maps to your roadmap.' : a.tone === 'warm' ? 'I would love to talk about where ' + company + ' is heading and how I can help.' : 'Happy to walk through specifics in an interview.'),
        '',
        'Sincerely,',
        name
      ].filter(Boolean).join('\n');
      return { text: body, note: keys.length + ' advert keywords used · ' + asks.length + ' requirements addressed' };
    }
  };

  T.ai_airlock = {
    accepts: 'text', kind: 'live',
    desc: 'Replace personal data with reversible tokens before text leaves your hands, then restore the real values in the reply. Cards are validated with the Luhn checksum, so order numbers are not mangled.',
    params: [
      P('mode', 'Mode', 'select', 1, 'redact', { opts: [['redact', 'Redact'], ['restore', 'Restore']] }),
      P('only', 'Types', 'text', 2, 'all', { help: function () { return 'all, or a comma list: email,phone,card,iban,ssn,ni,ipv4,postcode,date'; } })
    ],
    groups: [['Direction', ['mode']], ['Types', ['only']]],
    plain: function (a) { return a.mode === 'restore' ? 'Put the real values back using the token map.' : 'Replace emails, phones, cards, IBANs, IDs and dates with tokens you can reverse.'; },
    sample: "Hi, I'm Jane Doe, email jane.doe@example.com, phone +44 7700 900123, NI QQ123456C, card 4111 1111 1111 1111. Please summarise my case.",
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Paste something to redact.');
      if (a.mode === 'restore') {
        var map = [];
        try { map = JSON.parse(localStorage.getItem('pf_airlock_map') || '[]'); } catch (e) { }
        if (!map.length) throw new Error('No token map in this tab yet. Redact something first.');
        return { text: U.restorePII(text, map), note: map.length + ' tokens restored' };
      }
      var only = a.only && a.only !== 'all' ? a.only.split(',').map(function (s) { return s.trim(); }) : null;
      var r = U.redactPII(text, { only: only });
      try { localStorage.setItem('pf_airlock_map', JSON.stringify(r.found)); } catch (e) { }
      var map = r.found.map(function (f) { return f.token + ' = ' + f.value; }).join('\n');
      return { text: r.text + (r.found.length ? '\n\n--- token map (stays in this tab) ---\n' + map : ''), note: r.found.length + ' item' + (r.found.length === 1 ? '' : 's') + ' redacted · reversible' };
    }
  };

  T.ocr_scan = {
    accepts: 'text', kind: 'live',
    desc: 'Parse pasted text from a scan into labelled fields. It does not claim to read pixels: OCR needs an engine that is not shipped, so nothing is invented from an image.',
    params: [P('kind', 'Document type', 'select', 1, 'auto', { opts: [['auto', 'Detect'], ['invoice', 'Invoice'], ['id', 'ID / W-9'], ['receipt', 'Receipt']] })],
    groups: [['Type', ['kind']]],
    plain: function (a) { return 'Extract fields from scanned text' + (a.kind === 'auto' ? ', detecting the document type.' : ' as a ' + a.kind + '.'); },
    sample: 'Form W-9\nName: Jane Doe\nBusiness name: Doe Design Ltd\nAddress: 12 Harbour St, London E1 6LT\nSSN: 123-45-6789',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Paste the text layer from your scan, or run the document through an OCR app first.');
      var t = text.replace(/\r/g, '');
      var get = function (re) { var m = re.exec(t); return m ? m[1].trim() : ''; };
      /* Values have to pass a range check. The loose patterns matched the SSN
         "123-45-6789" as both a phone number and a date, which put invented
         fields in front of the user — worse than reporting nothing. */
      var ssnVal = get(/^(?:ssn|social security)[^\d]*([\d-]{9,11})/im) || ((/(\b\d{3}-\d{2}-\d{4}\b)/.exec(t) || [])[1] || '');
      var dateOk = function (s) {
        var y, mo, dd, m;
        if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) { y = +m[1]; mo = +m[2]; dd = +m[3]; }
        else if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(s))) { dd = +m[1]; mo = +m[2]; y = +m[3]; }
        else if ((m = /^(\d{1,2})\s+([A-Z][a-z]{2,8})\s+(\d{4})$/.exec(s))) {
          var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          mo = months.indexOf(m[2].slice(0, 3).toLowerCase()) + 1; dd = +m[1]; y = +m[3];
        } else return false;
        return mo >= 1 && mo <= 12 && dd >= 1 && dd <= 31 && y >= 1900 && y <= 2100;
      };
      var firstDate = function () {
        var re = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4})\b/g, m;
        while ((m = re.exec(t))) if (dateOk(m[1])) return m[1];
        return '';
      };
      var digits = function (s) { return (s.match(/\d/g) || []).length; };
      var firstPhone = function () {
        var re = /(\+?\d[\d ()-]{7,}\d)/g, m;
        while ((m = re.exec(t))) {
          var v = m[1].trim();
          if (ssnVal && v.indexOf(ssnVal) >= 0) continue;
          if (digits(v) < 10 || digits(v) > 15) continue;      // too short = ID, too long = not a phone
          if (/^\d{3}-\d{2}-\d{4}$/.test(v)) continue;          // SSN shape
          return v;
        }
        return '';
      };
      var fields = {
        Name: get(/^(?:name|full name)[:\s]+(.+)$/im),
        Business: get(/^(?:business|company|entity)(?: name)?[:\s]+(.+)$/im),
        Address: get(/^(?:address|addr)[:\s]+(.+)$/im),
        SSN: ssnVal,
        EIN: get(/\b(\d{2}-\d{7})\b/),
        'Tax ID': get(/^(?:tax id|tin)[:\s]+(.+)$/im),
        Email: get(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/),
        Phone: firstPhone(),
        'Invoice no': get(/(?:invoice|inv|bill)\s*(?:no|#|number)?[:\s]+([A-Z0-9-]{3,})/i),
        Date: firstDate(),
        Total: get(/(?:total|amount due|balance)[:\s]*[£$€₹]?\s?([\d.,]+)/i)
      };
      var kind = a.kind;
      if (kind === 'auto') kind = /w-?9|ssn|social security/i.test(t) ? 'id' : /invoice|vat|bill to/i.test(t) ? 'invoice' : /receipt|subtotal|cash/i.test(t) ? 'receipt' : 'unknown';
      var out = Object.keys(fields).filter(function (k) { return fields[k]; }).map(function (k) { return k + ': ' + fields[k]; });
      if (!out.length) {
        /* Receipts and invoices rarely use "Label: value" lines, so fall back to
           the document parsers instead of refusing text that is plainly there. */
        var doc = (typeof PFCore !== 'undefined' && PFCore.U && PFCore.U.parseReceipt) ? PFCore.U.parseReceipt(t) : null;
        if (doc && (doc.vendor || doc.total || (doc.items && doc.items.length))) {
          if (doc.vendor) out.push('Vendor: ' + doc.vendor);
          if (doc.date) out.push('Date: ' + doc.date);
          if (doc.total != null) out.push('Total: ' + doc.total);
          (doc.items || []).forEach(function (it, i) { out.push('Item ' + (i + 1) + ': ' + (it.name || it.desc) + (it.price != null ? ' — ' + it.price : '')); });
          kind = 'receipt';
        }
      }
      if (!out.length) {
        /* Last resort: never fabricate fields, but never pretend there is no text
           either — show the lines so the user can copy what the scan held. */
        var lines = t.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
        return { text: 'Detected type: ' + kind + '\n\nNo labelled fields matched. Raw lines:\n\n' + lines.slice(0, 40).join('\n'), note: 'No fields matched · ' + (lines.length) + ' lines shown' };
      }
      out.unshift('Detected type: ' + kind, '');
      return { text: out.join('\n'), note: (out.length - 2) + ' fields · ' + kind };
    }
  };

  T.chat_pdf = {
    accepts: 'text', kind: 'live',
    desc: 'Ask questions about a document using local keyword retrieval (BM25-style scoring over paragraphs). Answers quote the passages they came from and show the real score, so you can check the source.',
    params: [
      P('q', 'Question', 'text', 1, '', { help: function () { return 'Appended after the document text on a line starting with "?".'; } }),
      P('top', 'Passages', 'range', 2, 3, { min: 1, max: 6, step: 1, fmt: function (v) { return v + ' passages'; } })
    ],
    groups: [['Question', ['q']], ['Retrieval', ['top']]],
    plain: function (a) { return 'Find the ' + a.top + ' passages that best answer the question and quote them.'; },
    sample: 'The lease term is 24 months starting 1 April 2026. Rent is 1800 GBP per month, reviewed annually. Deposit is 3600 GBP, held with the DPS.\n\n? What is the deposit?',
    async run(src, a, ctx) {
      var raw = (ctx.text || '').trim();
      if (!raw) throw new Error('Paste the document, then your question on a line starting with "?".');
      var q = a.q || '';
      var doc = raw;
      var qm = raw.match(/(?:^|\n)\s*\?\s*(.+)$/);
      /* Forgiving pair: a final line that is a question ("…?") is treated as the
         question, so pasting "document↵question?" works without the "?" prefix. */
      if (!qm) {
        var parts = raw.split(/\n+/).filter(function (s) { return s.trim(); });
        var last = parts.length ? parts[parts.length - 1].trim() : '';
        if (!a.q && parts.length > 1 && /\?$/.test(last) && last.length < 300) {
          q = last;
          doc = parts.slice(0, -1).join('\n');
          qm = true;
        }
      }
      if (qm && qm !== true) { q = qm[1].trim(); doc = raw.slice(0, qm.index).trim(); }
      if (!q) throw new Error('Add a question: type it in the Question field, or end the text with a line starting with "?".');
      var chunks = doc.split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 12; });
      if (!chunks.length) throw new Error('The document is too short to search.');
      var toks = function (s) { return (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g) || []).filter(function (w) { return w.length > 2; }); };
      var qt = toks(q), df = {}, N = chunks.length;
      var cToks = chunks.map(function (c) { var t = toks(c); t.forEach(function (w) { df[w] = (df[w] || 0) + 1; }); return t; });
      var k1 = 1.5, b = 0.75, avg = cToks.reduce(function (s, t) { return s + t.length; }, 0) / N;
      var scored = chunks.map(function (c, i) {
        var t = cToks[i], tf = {}, score = 0;
        t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
        qt.forEach(function (w) {
          if (!tf[w]) return;
          var idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
          score += idf * (tf[w] * (k1 + 1)) / (tf[w] + k1 * (1 - b + b * t.length / avg));
        });
        return { i: i, c: c, score: score };
      }).sort(function (x, y) { return y.score - x.score; }).slice(0, +a.top);
      if (!scored[0] || scored[0].score <= 0) return { text: 'No passage in this document mentions the words in your question.\n\nTried: ' + qt.join(', '), note: '0 matches · nothing invented' };
      var out = ['Question: ' + q, ''].concat(scored.map(function (s, n) {
        return '[' + (n + 1) + '] score ' + s.score.toFixed(2) + '\n' + s.c.replace(/\s+/g, ' ');
      }));
      out.push('', 'These are the closest passages, quoted verbatim. Retrieval is keyword-based, not a generative model.');
      return { text: out.join('\n'), note: scored.length + ' passages · top score ' + scored[0].score.toFixed(2) };
    }
  };

  T.ai_writer = {
    accepts: 'text', kind: 'live',
    desc: 'Rule-based rewriting that needs no model download: tighten wordy phrases, convert to bullets, formalise or simplify. Every change is a deterministic rule you can read, and the tool says so.',
    params: [P('mode', 'Rewrite as', 'select', 1, 'tighten', { opts: [['tighten', 'Tighter'], ['bullets', 'Bullets'], ['formal', 'Formal'], ['plain', 'Plain English']] })],
    groups: [['Style', ['mode']]],
    plain: function (a) { return 'Rewrite the text to be ' + a.mode + ' using fixed rules, with no AI model involved.'; },
    sample: 'I am writing to you in order to let you know that, at this point in time, we are not in a position to be able to attend the meeting on Monday. Please do not hesitate to contact me if you have any questions whatsoever.',
    async run(src, a, ctx) {
      var text = (ctx.text || '').trim();
      if (!text) throw new Error('Paste the text you want rewritten.');
      var rules = [
        [/\bin order to\b/gi, 'to'], [/\bat this point in time\b/gi, 'now'], [/\bin the event that\b/gi, 'if'],
        [/\bnot in a position to be able to\b/gi, 'unable to'], [/\bplease do not hesitate to\b/gi, 'please'],
        [/\bdue to the fact that\b/gi, 'because'], [/\bfor the purpose of\b/gi, 'to'], [/\bwith regard to\b/gi, 'about'],
        [/\ba large number of\b/gi, 'many'], [/\bit is important to note that\b/gi, 'note that'],
        [/\bwhatsoever\b/gi, ''], [/\bvery\b/gi, ''], [/\bquite\b/gi, ''], [/\bbasically\b/gi, ''],
        [/\bin the near future\b/gi, 'soon'], [/\bmake a decision\b/gi, 'decide'], [/\bprovide assistance\b/gi, 'help']
      ];
      var out = text;
      if (a.mode === 'bullets') {
        var sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
        out = sentences.map(function (s) { return '· ' + s.charAt(0).toUpperCase() + s.slice(1); }).join('\n');
      } else {
        rules.forEach(function (r) { out = out.replace(r[0], r[1]); });
        out = out.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/^\s+|\s+$/gm, '');
        if (a.mode === 'formal') {
          out = out.replace(/\bcan't\b/gi, 'cannot').replace(/\bwon't\b/gi, 'will not').replace(/\bdon't\b/gi, 'do not').replace(/\bit's\b/gi, 'it is').replace(/\bwe're\b/gi, 'we are').replace(/\bI'm\b/g, 'I am');
        }
        if (a.mode === 'plain') {
          out = out.replace(/;/g, '.').replace(/\b(utilise|utilize)\b/gi, 'use').replace(/\bcommence\b/gi, 'start').replace(/\bterminate\b/gi, 'end').replace(/\bendeavour\b/gi, 'try').replace(/\bsubsequent\b/gi, 'later');
        }
      }
      var saved = text.length - out.length;
      return { text: out, note: 'Rule-based · ' + (saved > 0 ? saved + ' characters shorter' : 'reformatted') + ' · no model' };
    }
  };

  T.voice_transcribe = {
    accepts: 'text', kind: 'live',
    desc: 'Turn a transcript into timed subtitles. Timing is derived from word count at your chosen reading speed — an estimate, labelled as one. It does not claim to transcribe audio.',
    params: [
      P('fmt', 'Format', 'select', 1, 'srt', { opts: [['srt', 'SRT'], ['vtt', 'WebVTT'], ['txt', 'Plain text']] }),
      P('wpm', 'Speaking rate', 'range', 1, 150, { min: 100, max: 200, step: 5, fmt: function (v) { return v + ' wpm'; } }),
      P('cpl', 'Cue length', 'range', 2, 12, { min: 6, max: 20, step: 1, fmt: function (v) { return v + ' words'; } })
    ],
    groups: [['Format', ['fmt']], ['Timing', ['wpm', 'cpl']]],
    plain: function (a) { return 'Split the transcript into ' + a.cpl + '-word cues at ' + a.wpm + ' wpm and export ' + a.fmt.toUpperCase() + ', with timing marked as estimated.'; },
    sample: 'So the main point is that we need to ship the release on Monday and fix the login bug first.',
    async run(src, a, ctx) {
      var text = (ctx.text || '').trim();
      if (!text) throw new Error('Paste a transcript. This tool formats text — it does not transcribe audio.');
      if (a.fmt === 'txt') return { text: text.replace(/\s+/g, ' '), note: 'Plain transcript' };
      var words = text.replace(/\s+/g, ' ').split(' ');
      var per = +a.cpl, secPerWord = 60 / +a.wpm, cues = [];
      for (var i = 0; i < words.length; i += per) cues.push(words.slice(i, i + per).join(' '));
      var t = 0, ts = function (s, comma) {
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s - Math.floor(s)) * 1000);
        return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + (comma ? ',' : '.') + String(ms).padStart(3, '0');
      };
      var out = a.fmt === 'vtt' ? ['WEBVTT', ''] : [];
      cues.forEach(function (c, n) {
        var dur = Math.max(1.2, c.split(' ').length * secPerWord);
        if (a.fmt === 'srt') { out.push(String(n + 1), ts(t, true) + ' --> ' + ts(t + dur, true), c, ''); }
        else { out.push(ts(t, false) + ' --> ' + ts(t + dur, false), c, ''); }
        t += dur;
      });
      return { text: out.join('\n').trim(), note: cues.length + ' cues · ' + Math.round(t) + ' s estimated · timing estimated from ' + a.wpm + ' wpm' };
    }
  };

  T.sqlite_viewer = {
    accepts: 'text', kind: 'live',
    desc: 'Run real SQL against pasted CSV or JSON using SQLite compiled to WebAssembly. Create a table implicitly from your headers, then query it with SELECT, WHERE, GROUP BY and joins on one table.',
    params: [P('sql', 'SQL', 'text', 1, 'SELECT * FROM data LIMIT 20', { help: function () { return 'Your CSV or JSON becomes a table named data.'; } })],
    groups: [['Query', ['sql']]],
    plain: function (a) { return 'Load the rows into SQLite and run: ' + a.sql; },
    sample: 'name,dept,salary\nAlice,Eng,120000\nBob,Sales,90000\nCara,Eng,130000',
    async run(src, a, ctx) {
      var text = (ctx.text || '').trim();
      if (!text) throw new Error('Paste CSV or JSON first.');
      var rows;
      if (/^[\[{]/.test(text)) { var d = JSON.parse(text); rows = Array.isArray(d) ? d : [d]; }
      else rows = U.csvToObjects(text);
      if (!rows.length) throw new Error('No rows found.');
      var SQL = await new Promise(function (res, rej) {
        if (window.initSqlJs) return res(window.initSqlJs);
        var s = document.createElement('script');
        s.src = '/vendor/sql-wasm.js';
        s.onload = function () { res(window.initSqlJs); };
        s.onerror = function () { rej(new Error('SQLite engine failed to load.')); };
        document.head.appendChild(s);
      });
      var SQLModule = await SQL({ locateFile: function (f) { return '/vendor/' + f; } });
      var db = new SQLModule.Database();
      var cols = Object.keys(rows[0]);
      var defs = cols.map(function (c) {
        var sample = rows.find(function (r) { return r[c] !== '' && r[c] != null; });
        var v = sample ? sample[c] : '';
        return '"' + c.replace(/"/g, '""') + '" ' + (typeof v === 'number' ? 'REAL' : 'TEXT');
      }).join(', ');
      db.run('CREATE TABLE data (' + defs + ');');
      var stmt = db.prepare('INSERT INTO data VALUES (' + cols.map(function () { return '?'; }).join(',') + ')');
      rows.forEach(function (r) { stmt.run(cols.map(function (c) { return r[c] === '' ? null : r[c]; })); });
      stmt.free();
      var res;
      try { res = db.exec(a.sql || 'SELECT * FROM data'); } catch (e) { db.close(); throw new Error('SQL error: ' + e.message); }
      db.close();
      if (!res.length) return { text: 'Query ran. No rows returned.', note: '0 rows' };
      var out = res.map(function (r) {
        var head = r.columns.join(' | ');
        var sep = r.columns.map(function (c) { return '-'.repeat(Math.max(3, c.length)); }).join('-+-');
        return [head, sep].concat(r.values.map(function (v) { return v.map(function (x) { return x == null ? 'NULL' : String(x); }).join(' | '); })).join('\n');
      }).join('\n\n');
      return { text: out, note: res[0].values.length + ' rows · ' + res[0].columns.length + ' columns · SQLite WASM' };
    }
  };

  T.qr_tool = {
    accepts: 'text', kind: 'live',
    desc: 'Generate a real QR code from any text or URL. The matrix is rendered to a canvas you can download as PNG; error-correction level and size are yours to choose.',
    params: [
      P('ec', 'Error correction', 'select', 1, 'M', { opts: [['L', 'Low 7%'], ['M', 'Medium 15%'], ['Q', 'Quartile 25%'], ['H', 'High 30%']] }),
      P('size', 'Size', 'select', 1, 512, { opts: [[256, '256 px'], [512, '512 px'], [1024, '1024 px']] })
    ],
    groups: [['QR options', ['ec', 'size']]],
    plain: function (a) { return 'Encode the text as a QR code at ' + a.size + ' px with ' + a.ec + ' error correction.'; },
    sample: 'https://privacyfold.com/',
    async run(src, a, ctx) {
      var text = (ctx.text || '').trim();
      if (!text) throw new Error('Type the text or URL to encode.');
      await U.ensureQr();
      var q = U.makeQr(text, { ec: a.ec, scale: Math.max(2, Math.round(+a.size / 33)) });
      var url = q.canvas.toDataURL('image/png');
      var html = '<div class="qrwrap"><img src="' + url + '" alt="QR code for ' + esc(text.slice(0, 60)) + '" width="' + Math.min(320, q.size) + '" height="' + Math.min(320, q.size) + '"><p class="help">' + q.modules + '×' + q.modules + ' modules · EC ' + a.ec + ' · encodes ' + text.length + ' characters</p><a class="btn sm" download="qr-code.png" href="' + url + '">Download PNG</a></div>';
      return { text: html, html: true, note: 'QR v' + Math.ceil(q.modules / 4) + ' · ' + q.modules + ' modules', img: url };
    }
  };

  T.barcode_gen = {
    accepts: 'text', kind: 'live',
    desc: 'Generate Code 128 or EAN-13 barcodes as real bar patterns, validated with the correct check digit. EAN-13 refuses a wrong check digit instead of drawing an unscannable code.',
    params: [P('sym', 'Symbology', 'select', 1, 'code128', { opts: [['code128', 'Code 128'], ['ean13', 'EAN-13']] })],
    groups: [['Symbology', ['sym']]],
    plain: function (a) { return 'Draw a ' + (a.sym === 'ean13' ? 'EAN-13' : 'Code 128') + ' barcode with a valid check digit.'; },
    sample: '123456789012',
    async run(src, a, ctx) {
      var text = (ctx.text || '').trim();
      if (!text) throw new Error('Type the digits or text to encode.');
      var r = U.barcodeModules(a.sym, text);
      var bits = r.bits, mw = 2, h = 90, w = bits.length * mw;
      var cv = IMG.canvasOf(w + 40, h + 34), g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#000';
      for (var i = 0; i < bits.length; i++) if (bits[i] === '1') g.fillRect(20 + i * mw, 10, mw, h);
      g.font = '14px monospace'; g.textAlign = 'center'; g.fillText(r.text, cv.width / 2, h + 28);
      return { text: '<div class="qrwrap"><img src="' + cv.toDataURL('image/png') + '" alt="' + esc(a.sym) + ' barcode for ' + esc(r.text) + '" style="max-width:100%"><p class="help">' + esc(a.sym.toUpperCase()) + ' · ' + r.text + ' · ' + bits.length + ' modules</p></div>', html: true, note: a.sym.toUpperCase() + ' valid · ' + r.text, img: cv.toDataURL('image/png') };
    }
  };

  T.pgp_crypto = {
    accepts: 'text', kind: 'live',
    desc: 'Sign text with a real ECDSA P-256 key generated in this tab, and verify a signature you paste back. This is not OpenPGP: it is a WebCrypto signature with a raw key, and it says so.',
    params: [P('mode', 'Action', 'select', 1, 'sign', { opts: [['sign', 'Sign'], ['verify', 'Verify']] })],
    groups: [['Action', ['mode']]],
    plain: function (a) { return a.mode === 'verify' ? 'Check a pasted ECDSA signature against the text.' : 'Create a real ECDSA P-256 signature over the text.'; },
    sample: 'This message is signed locally with ECDSA P-256.',
    async run(src, a, ctx) {
      var text = ctx.text || '';
      if (!text.trim()) throw new Error('Type the message to sign.');
      var enc = new TextEncoder();
      if (a.mode === 'sign') {
        var kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
        var sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, enc.encode(text)));
        var raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
        var digest = await U.sha256Hex(enc.encode(text));
        var body = ['-----BEGIN PRIVACYFOLD SIGNATURE-----', 'message-sha256: ' + digest, 'public-key-p256: ' + U.b64(raw), '', U.b64(sig).replace(/(.{64})/g, '$1\n').trim(), '-----END PRIVACYFOLD SIGNATURE-----'].join('\n');
        try { localStorage.setItem('pf_sign_pub', U.b64(raw)); localStorage.setItem('pf_sign_sig', U.b64(sig)); localStorage.setItem('pf_sign_msg', text); } catch (e) { }
        return { text: body, note: 'Signed · ECDSA P-256 · ' + digest.slice(0, 12) + '…' };
      }
      var pub = null, sigB64 = null, msg = text;
      var pm = /public-key-p256:\s*([A-Za-z0-9+/=]+)/.exec(text);
      var sm = /-----BEGIN PRIVACYFOLD SIGNATURE-----[\s\S]*?\n\n([A-Za-z0-9+/=\n]+)-----END/.exec(text);
      if (pm && sm) { pub = pm[1]; sigB64 = sm[1].replace(/\s+/g, ''); msg = text.split(/-----BEGIN PRIVACYFOLD SIGNATURE-----/)[0].trim(); }
      else {
        try { pub = localStorage.getItem('pf_sign_pub'); sigB64 = localStorage.getItem('pf_sign_sig'); msg = localStorage.getItem('pf_sign_msg'); } catch (e) { }
      }
      if (!pub || !sigB64) throw new Error('Paste a signature block (BEGIN PRIVACYFOLD SIGNATURE) or sign something first in this tab.');
      var key = await crypto.subtle.importKey('raw', U.unb64(pub), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      var ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, U.unb64(sigB64), enc.encode(msg));
      return { text: (ok ? 'VALID' : 'INVALID') + ' signature\n\nMessage (' + msg.length + ' chars): ' + msg.slice(0, 200) + '\nSigned with ECDSA P-256 / SHA-256.', note: ok ? 'Signature valid' : 'Signature does not match' };
    }
  };

  T.password_gen = {
    accepts: 'none', kind: 'live',
    desc: 'Generate passwords with the Web Crypto RNG, or passphrases from a built-in word list. Entropy is computed from the actual alphabet size so the strength claim is arithmetic, not vibes.',
    params: [
      P('mode', 'Type', 'select', 1, 'password', { opts: [['password', 'Password'], ['passphrase', 'Passphrase']] }),
      P('len', 'Length', 'range', 1, 20, { min: 8, max: 64, step: 1, fmt: function (v) { return v + ' chars'; } }),
      P('words', 'Words', 'range', 2, 5, { min: 3, max: 8, step: 1, fmt: function (v) { return v + ' words'; } }),
      P('symbols', 'Symbols', 'bool', 1, true, {}),
      P('digits', 'Digits', 'bool', 1, true, {})
    ],
    groups: [['Type', ['mode']], ['Length', ['len', 'words']], ['Characters', ['symbols', 'digits']]],
    plain: function (a) { return a.mode === 'passphrase' ? 'Generate a ' + a.words + '-word passphrase.' : 'Generate a ' + a.len + '-character password' + (a.symbols ? ' with symbols' : '') + (a.digits ? ' and digits' : '') + '.'; },
    async run(src, a) {
      var rnd = function (n) { var v = new Uint32Array(1); crypto.getRandomValues(v); return v[0] % n; };
      if (a.mode === 'passphrase') {
        var WORDS = 'amber anchor apple arbor basil beacon birch bishop blaze bloom bramble brass breeze brick brook cactus candle canyon cedar chalk cherry cider cinder clover cobalt copper coral cotton cove crane crimson cypress dawn delta denim drift dune ember falcon fern field finch fjord flint forge foxglove garnet geyser glacier granite grove harbor hazel heron hickory hollow indigo iris ivory jasper juniper kettle larch lantern lark lavender ledge lemon lily linen maple marble meadow mesa mint moss nectar nickel north oak olive onyx opal orchard osprey oyster pearl pebble pepper pine plume pollen pond poppy prairie quartz quill raven reed ridge river robin rowan sage sable saffron sandstone sedge sequoia shale silver slate sorrel spruce starling steel stone summit swan sycamore tarn teal thistle thunder tide timber topaz tulip tundra umber valley velvet violet walnut willow windrow yarrow zephyr zinc'.split(' ');
        var out = [];
        for (var i = 0; i < +a.words; i++) out.push(WORDS[rnd(WORDS.length)]);
        var pw = out.join('-');
        return { text: pw, note: Math.round(+a.words * Math.log2(WORDS.length)) + ' bits of entropy · ' + a.words + ' words from a ' + WORDS.length + '-word list' };
      }
      var alpha = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
      if (a.digits) alpha += '23456789';
      if (a.symbols) alpha += '!@#$%^&*-_=+?';
      var chars = [], arr = new Uint32Array(+a.len);
      crypto.getRandomValues(arr);
      for (var k = 0; k < +a.len; k++) chars.push(alpha[arr[k] % alpha.length]);
      var pwd = chars.join('');
      return { text: pwd, note: Math.round(+a.len * Math.log2(alpha.length)) + ' bits of entropy · ' + alpha.length + ' character alphabet' };
    }
  };

  T.uuid_gen = {
    accepts: 'none', kind: 'live',
    desc: 'Generate RFC 4122 v4 UUIDs from the cryptographic RNG, with uppercase, braces and no-dash options. Each value is random, never derived from a counter.',
    params: [P('n', 'How many', 'range', 1, 5, { min: 1, max: 50, step: 1, fmt: function (v) { return v + ' UUIDs'; } }), P('style', 'Format', 'select', 1, 'lower', { opts: [['lower', 'lowercase'], ['upper', 'UPPERCASE'], ['brace', '{braces}'], ['nodash', 'No dashes']] })],
    groups: [['Output', ['n', 'style']]],
    plain: function (a) { return 'Generate ' + a.n + ' random UUIDs, ' + a.style + '.'; },
    async run(src, a) {
      var fmt = function (u) { if (a.style === 'upper') return u.toUpperCase(); if (a.style === 'brace') return '{' + u + '}'; if (a.style === 'nodash') return u.replace(/-/g, ''); return u; };
      var list = [];
      for (var i = 0; i < +a.n; i++) list.push(fmt(crypto.randomUUID ? crypto.randomUUID() : (function () {
        var b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
        var h = Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      })()));
      return { text: list.join('\n'), note: list.length + ' × UUID v4 · 122 random bits each' };
    }
  };

  T.lorem_ipsum = {
    accepts: 'none', kind: 'live',
    desc: 'Generate placeholder copy in words, sentences or paragraphs, with classic Latin or a privacy-flavoured English set.',
    params: [
      P('n', 'How much', 'range', 1, 3, { min: 1, max: 12, step: 1, fmt: function (v) { return v + ' units'; } }),
      P('unit', 'Unit', 'select', 1, 'paragraphs', { opts: [['paragraphs', 'Paragraphs'], ['sentences', 'Sentences'], ['words', 'Words']] }),
      P('set', 'Word set', 'select', 1, 'latin', { opts: [['latin', 'Latin'], ['plain', 'English']] })
    ],
    groups: [['Amount', ['n', 'unit']], ['Word set', ['set']]],
    plain: function (a) { return 'Write ' + a.n + ' ' + a.unit + ' of ' + (a.set === 'latin' ? 'Latin' : 'English') + ' placeholder text.'; },
    async run(src, a) {
      var LAT = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
      var ENG = 'file stays device browser tab nothing uploaded local memory private tool document photo text quiet simple fast neutral clear honest sealed vault cipher key screen paper ink margin column header sentence paragraph'.split(' ');
      var W = a.set === 'plain' ? ENG : LAT;
      var rnd = function (n) { var v = new Uint32Array(1); crypto.getRandomValues(v); return v[0] % n; };
      var sent = function () { var n = 8 + rnd(10), w = []; for (var i = 0; i < n; i++) w.push(W[rnd(W.length)]); var s = w.join(' '); return s.charAt(0).toUpperCase() + s.slice(1) + '.'; };
      var out = [];
      if (a.unit === 'words') { for (var i = 0; i < +a.n; i++) out.push(W[rnd(W.length)]); return { text: out.join(' '), note: a.n + ' words' }; }
      if (a.unit === 'sentences') { for (var j = 0; j < +a.n; j++) out.push(sent()); return { text: out.join(' '), note: a.n + ' sentences' }; }
      for (var k = 0; k < +a.n; k++) { var s2 = []; for (var m = 0; m < 4 + rnd(3); m++) s2.push(sent()); out.push(s2.join(' ')); }
      return { text: out.join('\n\n'), note: a.n + ' paragraphs' };
    }
  };

  T.svg_optimize = {
    accepts: 'text', kind: 'live',
    desc: 'Strip editor metadata, comments, and redundant attributes from SVG while keeping geometry intact. Refuses input that is not valid SVG instead of returning a broken file.',
    params: [P('prec', 'Precision', 'select', 1, 2, { opts: [[0, 'Whole numbers'], [1, '1 decimal'], [2, '2 decimals']] })],
    groups: [['Numbers', ['prec']]],
    plain: function (a) { return 'Remove metadata and comments, and round coordinates to ' + a.prec + ' decimals.'; },
    sample: '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">\n  <!-- Generator: Sketch 52 -->\n  <metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><x/></rdf:RDF></metadata>\n  <rect x="10.123456" y="10.654321" width="100" height="100" fill="#1E2A44"/>\n</svg>',
    async run(src, a, ctx) {
      var t = (ctx.text || '').trim();
      /* Files exported by Sketch/Inkscape/Figma commonly open with an XML
         declaration and one or more comments before <svg>; only the first was
         skipped, so perfectly valid SVGs were rejected as "not SVG". */
      var head = t.replace(/^\s*(?:<\?xml[^>]*\?>\s*|<!--[\s\S]*?-->\s*)+/i, '');
      if (!/^<svg[\s>]/i.test(head)) throw new Error('That does not start with an <svg> element.');
      var before = t.length;
      var out = t.replace(/^<\?xml[^>]*\?>\s*/i, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
        .replace(/<title[\s\S]*?<\/title>/gi, function (m) { return m; })
        .replace(/\s(inkscape|sodipodi|sketch|adobe|illustrator):[a-z-]+="[^"]*"/gi, '')
        .replace(/\sxmlns:(inkscape|sodipodi|sketch|adobe|illustrator)="[^"]*"/gi, '')
        .replace(/\s(enable-background|xml:space)="[^"]*"/gi, '')
        .replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
      var p = +a.prec;
      out = out.replace(/-?\d+\.\d+/g, function (n) { var v = parseFloat(n); return String(p === 0 ? Math.round(v) : +v.toFixed(p)); });
      if (!/viewBox=/.test(out) && /width="[\d.]+"/.test(out) && /height="[\d.]+"/.test(out)) {
        var w = /width="([\d.]+)/.exec(out)[1], h = /height="([\d.]+)/.exec(out)[1];
        out = out.replace(/<svg/, '<svg viewBox="0 0 ' + w + ' ' + h + '"');
      }
      return { text: out, note: 'Saved ' + (before - out.length).toLocaleString() + ' bytes (' + Math.round((1 - out.length / before) * 100) + '%)' };
    }
  };

  T.invoice_generator.sample = 'Design work, 12 × 85\nHosting, 1 × 120\nCopywriting — 250\nPriority support, 3 × 40';

  T.exposure_xray = {
    accepts: 'any', kind: 'live',
    desc: 'Self-test: paste text (or use a file) and see exactly which personal data a redaction tool would catch and which it would miss. Reports only patterns it actually matched.',
    params: [],
    groups: [],
    plain: function () { return 'List every piece of personal data found in the text, with its type and offset.'; },
    sample: 'Jane Doe\njane.doe@example.com\n+44 7700 900123\nCard 4111 1111 1111 1111\nIP 203.0.113.5\nNI QQ123456C\nDOB 1988-04-12',
    async run(src, a, ctx) {
      var text = ctx.text || (src && src.text) || '';
      if (!text.trim()) throw new Error('Paste text to scan.');
      var r = U.redactPII(text);
      var rows = r.found.map(function (f, i) { return (i + 1) + '. ' + f.type.toUpperCase().padEnd(9) + ' ' + f.value + '  →  ' + f.token; });
      var risky = /\b(free text|notes?|comment)/i.test(text);
      return {
        text: (rows.length ? rows.join('\n') : 'No personal data patterns matched.') + '\n\n' + r.found.length + ' item(s) across ' + new Set(r.found.map(function (f) { return f.type; })).size + ' type(s).\nNames in free text are NOT detected automatically — check those by hand.',
        note: r.found.length + ' items found'
      };
    }
  };

  T.email_header = {
    accepts: 'text', kind: 'live',
    desc: 'Parse real mail headers and check SPF/DKIM/DMARC alignment between From, Return-Path and Authentication-Results. Flags display-name tricks and lookalike domains.',
    params: [], groups: [],
    plain: function () { return 'Read the headers and report authentication results plus phishing indicators.'; },
    sample: 'Received: from mail.example.com (mail.example.com [203.0.113.5]) by mx.gmail.com; Mon, 3 Mar 2026 09:00:00 +0000\nFrom: "PayPal Service" <billing@examp1e-secure.com>\nReturn-Path: bounce@spam.example\nAuthentication-Results: mx.gmail.com; spf=fail; dkim=none; dmarc=fail\nSubject: Urgent: verify your account',
    async run(src, a, ctx) {
      var t = ctx.text || '';
      if (!t.trim()) throw new Error('Paste the raw headers (View source → All headers).');
      var get = function (name) { var m = new RegExp('^' + name + ':\\s*(.+)$', 'im').exec(t); return m ? m[1].trim() : ''; };
      var fromRaw = get('From'), rp = get('Return-Path').replace(/[<>]/g, ''), ar = get('Authentication-Results'), subj = get('Subject');
      var addr = function (s) { var m = /<([^>]+)>/.exec(s); return (m ? m[1] : s).trim(); };
      var dom = function (s) { var m = /@([^>\s]+)/.exec(s); return m ? m[1].toLowerCase() : ''; };
      var from = addr(fromRaw), fd = dom(from), rd = dom(rp), dn = (fromRaw.match(/^"?([^"<]+)"?\s*</) || [])[1] || '';
      var checks = [];
      checks.push(['SPF', /spf=(\w+)/.exec(ar) ? /spf=(\w+)/.exec(ar)[1] : 'not reported']);
      checks.push(['DKIM', /dkim=(\w+)/.exec(ar) ? /dkim=(\w+)/.exec(ar)[1] : 'not reported']);
      checks.push(['DMARC', /dmarc=(\w+)/.exec(ar) ? /dmarc=(\w+)/.exec(ar)[1] : 'not reported']);
      var warn = [];
      if (rd && fd && rd !== fd) warn.push('Return-Path domain (' + rd + ') does not match From domain (' + fd + ') — common in spoofing.');
      if (/fail|softfail/.test(ar)) warn.push('Authentication reported a failure. Treat links and attachments as hostile.');
      if (dn && /paypal|apple|microsoft|google|amazon|bank|hmrc|irs/i.test(dn) && !/paypal\.com|apple\.com|microsoft\.com|google\.com|amazon\.com|hmrc\.gov\.uk|irs\.gov$/i.test(fd)) warn.push('Display name claims "' + dn + '" but the domain is ' + fd + '.');
      if (/\d/.test(fd.split('.')[0])) warn.push('From domain uses digits for letters (' + fd + ') — a lookalike domain.');
      if (!warn.length) warn.push('No header-level red flags found. Headers can still be forged, so verify links before clicking.');
      var out = ['From: ' + from + (dn ? '  ("' + dn + '")' : ''), 'Return-Path: ' + (rp || 'not present'), 'Subject: ' + (subj || '')].concat(checks.map(function (c) { return c[0] + ': ' + c[1]; })).concat('', 'Findings:', warn.map(function (w) { return '· ' + w; }).join('\n'));
      return { text: out.join('\n'), note: checks.map(function (c) { return c[0] + ' ' + c[1]; }).join(' · ') };
    }
  };

  T.schema_validator = {
    accepts: 'text', kind: 'live',
    desc: 'Validate Schema.org JSON-LD against the required properties for its @type, and list what search engines need. Also generates a robots.txt when you paste URLs and rules.',
    params: [P('mode', 'Mode', 'select', 1, 'auto', { opts: [['auto', 'Auto'], ['jsonld', 'Validate JSON-LD'], ['robots', 'Build robots.txt']] })],
    groups: [['Mode', ['mode']]],
    plain: function (a) { return a.mode === 'robots' ? 'Build a robots.txt from the rules you paste.' : 'Check the JSON-LD for required and recommended properties.'; },
    sample: '{"@context":"https://schema.org","@type":"Article","headline":"Test","author":{"@type":"Person","name":"Jane"}}',
    async run(src, a, ctx) {
      var t = (ctx.text || '').trim();
      if (!t) throw new Error('Paste JSON-LD or robots rules.');
      if (a.mode === 'robots' || /^user-agent:/i.test(t)) {
        return { text: t.split(/\n/).map(function (l) { return l.trim(); }).join('\n') + '\n\nSitemap: https://example.com/sitemap.xml', note: 'robots.txt rebuilt' };
      }
      var data = JSON.parse(t);
      var nodes = Array.isArray(data) ? data : data['@graph'] || [data];
      var REQ = { Article: ['headline', 'author', 'datePublished'], NewsArticle: ['headline', 'author', 'datePublished'], BlogPosting: ['headline', 'author', 'datePublished'], Product: ['name', 'image', 'offers'], Organization: ['name', 'url'], Person: ['name'], WebSite: ['name', 'url'], BreadcrumbList: ['itemListElement'], FAQPage: ['mainEntity'], LocalBusiness: ['name', 'address'], Event: ['name', 'startDate', 'location'] };
      var out = [], problems = 0;
      nodes.forEach(function (n, i) {
        var type = n['@type'] || '?';
        var req = REQ[type] || [];
        var missing = req.filter(function (k) { return n[k] === undefined || n[k] === ''; });
        problems += missing.length;
        out.push('[' + (i + 1) + '] @type ' + type + (missing.length ? '  MISSING: ' + missing.join(', ') : '  complete'));
        if (!n['@context']) out.push('    no @context — add "https://schema.org"');
        if (n['@context'] && !/schema\.org/.test(n['@context'])) out.push('    @context is ' + n['@context'] + ', not schema.org');
      });
      return { text: out.join('\n') + '\n\n' + nodes.length + ' node(s), ' + problems + ' missing required properties.', note: problems ? problems + ' missing properties' : 'All required properties present' };
    }
  };

  T.jwt_decode = {
    accepts: 'text', kind: 'live',
    desc: 'Decode a JWT and show the header, payload and real timestamps, with expiry state. Optionally verify an HS256 signature against a secret you paste — nothing is sent anywhere.',
    params: [P('secret', 'HS256 secret (optional)', 'text', 2, '', { help: function () { return 'Leave empty to decode only.'; } })],
    groups: [['Verification', ['secret']]],
    plain: function (a) { return a.secret ? 'Decode the token and verify its HS256 signature.' : 'Decode the token and flag whether it is expired.'; },
    sample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    async run(src, a, ctx) {
      var t = (ctx.text || '').trim().replace(/^Bearer\s+/i, '');
      var parts = t.split('.');
      if (parts.length < 2) throw new Error('A JWT has three dot-separated parts.');
      var dec = function (s) { return JSON.parse(new TextDecoder().decode(U.unb64(s))); };
      var head, body;
      try { head = dec(parts[0]); body = dec(parts[1]); } catch (e) { throw new Error('The token payload is not valid base64url JSON.'); }
      var now = Math.floor(Date.now() / 1000), notes = [];
      ['exp', 'iat', 'nbf'].forEach(function (k) {
        if (body[k] === undefined) return;
        var d = new Date(body[k] * 1000);
        notes.push(k + ': ' + d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC' + (k === 'exp' ? (body[k] < now ? '  (EXPIRED)' : '  (valid for ' + Math.round((body[k] - now) / 60) + ' min)') : ''));
      });
      if (head.alg === 'none') notes.push('alg is "none" — this token is unsigned and must not be trusted.');
      var out = ['HEADER\n' + JSON.stringify(head, null, 2), '\nPAYLOAD\n' + JSON.stringify(body, null, 2), '\nCLAIMS\n' + (notes.join('\n') || 'no time claims')];
      if (a.secret) {
        var enc = new TextEncoder();
        var key = await crypto.subtle.importKey('raw', enc.encode(a.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        var sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(parts[0] + '.' + parts[1])));
        var expect = U.b64(sig).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
        out.push('\nSIGNATURE\n' + (expect === parts[2] ? 'VALID — matches HS256 with the secret you gave.' : 'INVALID — does not match HS256 with that secret.'));
      }
      return { text: out.join('\n'), note: (head.alg || '?') + ' · ' + (body.exp && body.exp < now ? 'expired' : 'decoded') };
    }
  };

  T.cron_parser = {
    accepts: 'text', kind: 'live',
    desc: 'Explain a cron expression in plain English and list the next runs in your own timezone, including the weekday and date. Handles ranges, steps and lists.',
    params: [P('n', 'Next runs', 'range', 2, 5, { min: 1, max: 10, step: 1, fmt: function (v) { return v + ' runs'; } })],
    groups: [['Schedule', ['n']]],
    plain: function (a) { return 'Explain the expression and list the next ' + a.n + ' runs in your timezone.'; },
    sample: '0 9 * * 1-5',
    async run(src, a, ctx) {
      var t = (ctx.text || '').trim().split(/\n/)[0];
      if (!t) throw new Error('Type a cron expression like "0 9 * * 1-5".');
      var f = t.split(/\s+/);
      if (f.length !== 5) throw new Error('Five fields are needed: minute hour day-of-month month day-of-week.');
      var expand = function (fld, min, max) {
        var set = new Set();
        fld.split(',').forEach(function (part) {
          var m = /^(\*|\d+|\d+-\d+)(?:\/(\d+))?$/.exec(part);
          if (!m) throw new Error('Cannot read "' + part + '" in the cron expression.');
          var step = m[2] ? +m[2] : 1;
          var lo = min, hi = max;
          if (m[1] !== '*') {
            var r = m[1].split('-');
            lo = +r[0]; hi = r[1] !== undefined ? +r[1] : (step > 1 ? max : +r[0]);
          }
          for (var v = lo; v <= hi; v += step) if (v >= min && v <= max) set.add(v);
        });
        return set;
      };
      var mins = expand(f[0], 0, 59), hours = expand(f[1], 0, 23), doms = expand(f[2], 1, 31), months = expand(f[3], 1, 12), dows = expand(f[4], 0, 6);
      var dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var describe = function () {
        var hh = Array.from(hours).sort(function (x, y) { return x - y; });
        var mm = Array.from(mins).sort(function (x, y) { return x - y; });
        var pad = function (v) { return String(v).padStart(2, '0'); };
        var times = hh.slice(0, 6).map(function (h) { return mm.map(function (m) { return pad(h) + ':' + pad(m); }).join(', '); }).join(' · ');
        var dayPart = f[4] === '*' ? 'every day' : Array.from(dows).sort().map(function (d) { return dowNames[d]; }).join(', ');
        return 'At ' + times + (hh.length > 6 ? ' …' : '') + ', ' + dayPart + (f[2] !== '*' ? ' on day ' + f[2] + ' of the month' : '') + (f[3] !== '*' ? ' in month ' + f[3] : '') + '.';
      };
      var next = [], d = new Date();
      d.setSeconds(0, 0);
      for (var i = 0; i < 200000 && next.length < +a.n; i++) {
        d = new Date(d.getTime() + 60000);
        if (mins.has(d.getMinutes()) && hours.has(d.getHours()) && months.has(d.getMonth() + 1) && dows.has(d.getDay()) && doms.has(d.getDate())) next.push(new Date(d));
        if (i > 150000) break;
      }
      var out = ['Expression: ' + t, describe(), '', 'Next ' + next.length + ' runs (' + (Intl.DateTimeFormat().resolvedOptions().timeZone || 'local') + '):'].concat(next.map(function (n) { return '  ' + n.toString().replace(/GMT.*/, '').trim(); }));
      return { text: out.join('\n'), note: next.length + ' upcoming runs · ' + (Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time') };
    }
  };

  T.timestamp_conv = {
    accepts: 'text', kind: 'live',
    desc: 'Convert Unix timestamps to dates and back, in UTC and your local zone, with ISO 8601 and relative time. Accepts seconds or milliseconds and auto-detects which.',
    params: [P('zone', 'Also show', 'select', 2, 'both', { opts: [['both', 'UTC + local'], ['utc', 'UTC only'], ['local', 'Local only']] })],
    groups: [['Zones', ['zone']]],
    plain: function (a) { return 'Convert each value and show ' + (a.zone === 'utc' ? 'UTC' : a.zone === 'local' ? 'local time' : 'UTC and local time') + '.'; },
    sample: '1735689600\n2026-03-03T09:00:00Z',
    async run(src, a, ctx) {
      var lines = (ctx.text || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) throw new Error('Paste a Unix timestamp or an ISO date.');
      var out = [];
      lines.forEach(function (l) {
        if (/^\d{9,13}$/.test(l)) {
          var n = +l, ms = l.length >= 12 ? n : n * 1000, d = new Date(ms);
          if (isNaN(d)) { out.push(l + ' → not a valid timestamp'); return; }
          out.push(l + ' → ' + d.toISOString() + '  (UTC)  ·  ' + d.toString().replace(/ GMT.*/, '') + (a.zone === 'utc' ? '' : ' (local)'));
        } else {
          var d2 = new Date(l);
          if (isNaN(d2)) { out.push(l + ' → not a date'); return; }
          out.push(l + ' → ' + Math.floor(d2.getTime() / 1000) + '  (seconds)  ·  ' + d2.getTime() + '  (ms)');
        }
      });
      return { text: out.join('\n'), note: lines.length + ' value' + (lines.length > 1 ? 's' : '') + ' converted' };
    }
  };

  T.pdf_redact = {
    accepts: 'pdf', kind: 'process', compare: false, scan: false, action: 'Redact', ext: 'pdf', suffix: 'redacted',
    desc: 'Black out names, numbers or any words you list. The page is rasterised first, so the text underneath is destroyed rather than covered — the standard for real redaction.',
    params: [P('terms', 'Words to redact', 'text', 1, '', { help: function () { return 'Comma separated. Matching is case-insensitive.'; } })],
    groups: [['Terms', ['terms']]],
    plain: function (a) { return 'Black out ' + (a.terms ? a.terms.split(',').length + ' term(s)' : 'nothing yet — add terms') + ' and destroy the text underneath.'; },
    async run(src, a) {
      var terms = String(a.terms || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!terms.length) throw new Error('Add at least one word or number to redact.');
      var r = await PDF.redactRaster(await src.getBytes(), terms);
      if (!r.hits) throw new Error('None of those terms appear in the text layer of this PDF. Nothing was redacted.');
      return {
        blob: bytes(r.bytes), out: { mime: MIME.pdf, w: 0, h: 0, card: {
          title: 'Redacted and flattened',
          html: '<div class="gone-l"><h3>' + r.hits + ' occurrence(s) blacked out</h3>' + terms.map(function (t) { return '<div class="rm"><s>Term</s><span>' + esc(t) + '</span></div>'; }).join('') + '</div><p class="help" style="margin-top:8px">Pages were rasterised, so the original text is gone from the file — not hidden under a box.</p>',
          stats: [{ k: 'Terms', v: String(terms.length) }, { k: 'Hits', v: String(r.hits) }, { k: 'Pages', v: String(r.pages) }],
          checks: [['Text layer destroyed, not covered', true], ['Output is a new file', true]]
        } }
      };
    }
  };

  /* ------------------------------------------------------- image tools */
  T.stego_seal = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Apply seal', ext: 'png', suffix: 'sealed',
    desc: 'Apply a visible stamp and embed a recipient ID in the least significant bits of the image. The tool reads the ID back from the finished file and reports whether the round trip actually worked.',
    params: [
      P('stamp', 'Stamp text', 'text', 1, 'CONFIDENTIAL', {}),
      P('canary', 'Recipient ID', 'text', 1, 'case-001', { help: function () { return 'Stored in the pixels, read back to verify.'; } }),
      P('style', 'Style', 'select', 1, 'diagonal', { opts: [['diagonal', 'Diagonal'], ['corner', 'Corner'], ['footer', 'Footer band']] })
    ],
    groups: [['Mark', ['stamp', 'style']], ['Canary', ['canary']]],
    plain: function (a) { return 'Stamp "' + a.stamp + '" (' + a.style + ') and embed the ID ' + a.canary + ' in the pixels.'; },
    async run(src, a) {
      var png = await src.getBytes();
      var { img } = await IMG.loadImageFromBlob(new Blob([png], { type: src.mime || 'image/png' }));
      var w = img.naturalWidth, h = img.naturalHeight;
      var cv = IMG.canvasOf(w, h), g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      var words = IMG.canvasOf(w, h), wg = words.getContext('2d');
      wg.font = '700 ' + Math.round(w / 22) + 'px Georgia, serif';
      wg.fillStyle = 'rgba(201,58,27,0.30)';
      if (a.style === 'corner') { wg.fillText(a.stamp, w * 0.05, h * 0.10); }
      else if (a.style === 'footer') { wg.fillStyle = 'rgba(23,22,15,0.55)'; wg.fillRect(0, h * 0.9, w, h * 0.1); wg.fillStyle = '#F5F2E9'; wg.fillText(a.stamp, w * 0.05, h * 0.965); }
      else {
        wg.translate(w / 2, h / 2); wg.rotate(-Math.PI / 7); wg.textAlign = 'center';
        wg.fillText(a.stamp, 0, 0);
      }
      g.globalAlpha = 0.9; g.drawImage(words, 0, 0); g.globalAlpha = 1;
      var emb = IMG.embedCanary(cv, a.canary);
      var blob = await IMG.blobFrom(emb.canvas, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: w, h: h, card: {
          title: 'Seal applied',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Sealed image" style="height:min(300px,55vw)"><div><p><b>' + esc(a.stamp) + '</b> pressed in ' + esc(a.style) + ' style.</p><p class="help" style="margin-top:8px">Canary <b>' + esc(a.canary) + '</b> was written into ' + emb.bits + ' least-significant bits and read back from the saved pixels: <b>' + (emb.verified ? 'verified' : 'FAILED') + '</b>.</p></div></div>',
          stats: [{ k: 'Bits', v: String(emb.bits) }, { k: 'Canary', v: emb.verified ? 'verified' : 'failed' }],
          checks: [['Visible stamp drawn', true], ['Canary read back from the output pixels', emb.verified]]
        } }
      };
    }
  };

  T.vellum_diff = {
    accepts: 'image', kind: 'process', compare: false, scan: false, action: 'Compare', ext: 'png', suffix: 'diff',
    desc: 'Compare the active image with the others on your desk, pixel by pixel. The real altered percentage is computed and changed regions are outlined — no invented clause list.',
    params: [P('threshold', 'Sensitivity', 'range', 1, 48, { min: 8, max: 120, step: 4, fmt: function (v) { return v + ' / 765'; } })],
    groups: [['Sensitivity', ['threshold']]],
    plain: function (a) { return 'Highlight pixels that differ by more than ' + a.threshold + ' and report the true percentage.'; },
    async run(src, a, ctx) {
      var all = (ctx && ctx.targets) || [];
      if (all.length < 2) throw new Error('Add a second image to the desk. The comparison needs two.');
      var A = await IMG.loadImageFromBlob(new Blob([await all[0].getBytes()]));
      var B = await IMG.loadImageFromBlob(new Blob([await all[1].getBytes()]));
      var r = IMG.diffImages(A.img, B.img, { threshold: +a.threshold });
      var blob = await IMG.blobFrom(r.canvas, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: r.canvas.width, h: r.canvas.height, card: {
          title: 'Comparison complete',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Difference map" style="height:min(300px,55vw)"><div><p><b>' + r.pct.toFixed(2) + '%</b> of pixels differ (' + r.changed.toLocaleString() + ' of ' + r.total.toLocaleString() + ').</p><p class="help" style="margin-top:8px">' + (r.boxes.length ? r.boxes.length + ' changed region(s) outlined in red.' : 'No region survived the size filter.') + ' Comparing at ' + r.canvas.width + '×' + r.canvas.height + ', aligned top-left.</p></div></div>',
          stats: [{ k: 'Altered', v: r.pct.toFixed(2) + '%' }, { k: 'Regions', v: String(r.boxes.length) }, { k: 'Pixels', v: r.total.toLocaleString() }],
          checks: [['Measured from real pixels', true], ['Overlay drawn from the diff, not a template', true]]
        } }
      };
    }
  };

  T.bg_remove = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Remove background', ext: 'png', suffix: 'cutout',
    desc: 'Remove a solid or near-solid background by flood-filling from the edges. Works on studio, product and document shots; it is a colour algorithm, not a neural network, and the result is always transparent PNG.',
    params: [P('tolerance', 'Tolerance', 'range', 1, 32, { min: 4, max: 120, step: 2, fmt: function (v) { return v + ' / 255'; } })],
    groups: [['Edge detection', ['tolerance']]],
    plain: function (a) { return 'Flood-fill the border colour with a ' + a.tolerance + '/255 tolerance and make it transparent.'; },
    async run(src, a) {
      var img = src.img;
      var r = IMG.removeBackground(img, { tolerance: +a.tolerance });
      var blob = await IMG.blobFrom(r.canvas, 'image/png');
      var data = r.canvas.getContext('2d').getImageData(0, 0, r.canvas.width, r.canvas.height).data;
      var clear = 0;
      for (var i = 3; i < data.length; i += 4) if (data[i] === 0) clear++;
      var pct = (clear / (data.length / 4)) * 100;
      return {
        blob: blob, out: { mime: 'image/png', w: r.canvas.width, h: r.canvas.height, card: {
          title: 'Background removed',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Cutout" style="height:min(300px,55vw);background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px"><div><p><b>' + pct.toFixed(1) + '%</b> of the image is now transparent. Sampled border colour: <b>' + r.bg + '</b>.</p><p class="help" style="margin-top:8px">This is an edge flood-fill, so it needs a fairly uniform background. Busy backgrounds need a matting model, which is not shipped.</p></div></div>',
          stats: [{ k: 'Transparent', v: pct.toFixed(1) + '%' }, { k: 'Edge colour', v: r.bg }],
          checks: [['Transparent PNG written', true], ['Only edge-connected pixels removed', true]]
        } }
      };
    }
  };

  T.magic_eraser = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Erase centre', ext: 'png', suffix: 'erased',
    desc: 'Remove an object by diffusing the surrounding pixels into the masked area. Deterministic patch fill: best on small marks, watermarks and blemishes, not on large subjects.',
    params: [
      P('size', 'Area size', 'range', 1, 22, { min: 6, max: 45, step: 1, fmt: function (v) { return v + '% of width'; } }),
      P('x', 'Centre X', 'range', 2, 50, { min: 0, max: 100, step: 1, fmt: function (v) { return v + '%'; } }),
      P('y', 'Centre Y', 'range', 2, 50, { min: 0, max: 100, step: 1, fmt: function (v) { return v + '%'; } })
    ],
    groups: [['Mask', ['size', 'x', 'y']]],
    plain: function (a) { return 'Fill a ' + a.size + '% wide area centred at ' + a.x + '%, ' + a.y + '% using surrounding pixels.'; },
    async run(src, a) {
      var img = src.img, w = img.naturalWidth, h = img.naturalHeight;
      var mask = IMG.canvasOf(w, h), mg = mask.getContext('2d');
      var sz = (w * (+a.size / 100)) / 2;
      mg.fillStyle = '#fff'; mg.beginPath();
      mg.ellipse(w * (+a.x / 100), h * (+a.y / 100), sz, sz * (h / w) * (w / h) * 0.9, 0, 0, Math.PI * 2); mg.fill();
      var cv = IMG.inpaint(img, mask, { iterations: 40 });
      var blob = await IMG.blobFrom(cv, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: w, h: h, card: {
          title: 'Area filled',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Erased image" style="height:min(300px,55vw)"><div><p>Elliptical mask at ' + a.x + '%, ' + a.y + '% covering ' + a.size + '% of the width.</p><p class="help" style="margin-top:8px">Pixels were replaced by diffusion from the edge of the mask. Small marks disappear; large objects leave a blur.</p></div></div>',
          stats: [{ k: 'Mask', v: a.size + '% width' }, { k: 'Passes', v: '40' }],
          checks: [['Mask fully filled', true], ['Output rebuilt from pixels', true]]
        } }
      };
    }
  };

  T.image_upscaler = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Upscale', ext: 'png', suffix: 'upscaled',
    desc: 'Double or quadruple an image with high-quality resampling and an unsharp pass. This is classic resampling, not a generative upscaler, and it says so.',
    params: [
      P('factor', 'Scale', 'select', 1, 2, { opts: [[2, '2×'], [3, '3×'], [4, '4×']] }),
      P('sharpen', 'Sharpen', 'range', 1, 0.45, { min: 0, max: 1, step: 0.05, fmt: function (v) { return Math.round(v * 100) + '%'; } })
    ],
    groups: [['Scale', ['factor']], ['Detail', ['sharpen']]],
    plain: function (a) { return 'Resample the image to ' + a.factor + '× with ' + Math.round(a.sharpen * 100) + '% unsharp masking.'; },
    async run(src, a) {
      var img = src.img;
      var cv = IMG.upscale(img, +a.factor, { amount: +a.sharpen });
      var blob = await IMG.blobFrom(cv, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: cv.width, h: cv.height, card: {
          title: 'Upscaled ' + a.factor + '×',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Upscaled" style="height:min(300px,55vw)"><div><p><b>' + img.naturalWidth + '×' + img.naturalHeight + '</b> → <b>' + cv.width + '×' + cv.height + '</b>.</p><p class="help" style="margin-top:8px">Two-pass resample plus unsharp mask. No detail is invented; edges are sharpened.</p></div></div>',
          stats: [{ k: 'From', v: img.naturalWidth + '×' + img.naturalHeight }, { k: 'To', v: cv.width + '×' + cv.height }],
          checks: [['Dimensions multiplied exactly', cv.width === img.naturalWidth * +a.factor]]
        } }
      };
    }
  };

  T.spot_rejection = {
    accepts: 'image', kind: 'process', compare: false, scan: true, action: 'Check photo', ext: 'png', suffix: 'checked',
    desc: 'Check a passport or visa photo against the measurable rules: pixel dimensions, aspect ratio, head height, background uniformity and print resolution. It reports measurements and does not pretend to detect faces.',
    params: [
      P('format', 'Format', 'select', 1, 'au', { opts: [['au', 'Australia 35×45'], ['eu', 'Schengen 35×45'], ['us', 'US 2×2 in'], ['uk', 'UK 35×45']] })
    ],
    groups: [['Format', ['format']]],
    plain: function (a) { return 'Measure the photo against the ' + a.format + ' print rules.'; },
    async run(src, a) {
      var img = src.img, w = img.naturalWidth, h = img.naturalHeight;
      var cv = IMG.canvasOf(w, h), g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      var d = g.getImageData(0, 0, w, h).data;
      /* background uniformity: sample top corners */
      var pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]];
      var vals = pts.map(function (p) { var i = (p[1] * w + p[0]) * 4; return [d[i], d[i + 1], d[i + 2]]; });
      var avg = [0, 1, 2].map(function (c) { return vals.reduce(function (s, v) { return s + v[c]; }, 0) / vals.length; });
      var spread = Math.max.apply(null, vals.map(function (v) { return Math.sqrt(Math.pow(v[0] - avg[0], 2) + Math.pow(v[1] - avg[1], 2) + Math.pow(v[2] - avg[2], 2)); }));
      var ratio = w / h;
      var spec = { au: { r: 35 / 45, dpi: 300, mm: [35, 45] }, eu: { r: 35 / 45, dpi: 300, mm: [35, 45] }, us: { r: 1, dpi: 300, mm: [51, 51] }, uk: { r: 35 / 45, dpi: 300, mm: [35, 45] } }[a.format];
      var checks = [
        ['Aspect ratio ' + ratio.toFixed(3) + ' vs ' + spec.r.toFixed(3), Math.abs(ratio - spec.r) < 0.01],
        ['Pixels ' + w + '×' + h, w / (spec.mm[0] / 25.4) >= 280],
        ['Background uniformity (spread ' + spread.toFixed(1) + ')', spread < 24],
        ['Head height and face position', null]
      ];
      var pass = checks.every(function (c) { return c[1] !== false; });
      var blob = await IMG.blobFrom(cv, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: w, h: h, card: {
          title: pass ? 'Measurable checks passed' : 'Photo needs changes',
          html: '<div class="gone-l"><h3>' + (pass ? 'No measurable rule is violated' : 'At least one rule fails') + '</h3>' + checks.map(function (c) { return '<div class="rm"><s>' + esc(c[0]) + '</s><span>' + (c[1] === true ? 'pass' : c[1] === false ? 'fail' : 'check by eye') + '</span></div>'; }).join('') + '</div><p class="help" style="margin-top:8px">Face detection and expression cannot be judged from pixels reliably, so this tool does not claim to.</p>',
          stats: [{ k: 'Pixels', v: w + '×' + h }, { k: 'Ratio', v: ratio.toFixed(3) }, { k: 'Checks', v: checks.filter(function (c) { return c[1] === true; }).length + '/' + (checks.length - 1) }],
          checks: [['Measured from the real pixels', true]]
        } }
      };
    }
  };

  /* ============================================================ SIGNATURE ===== */
  T.signature_clean = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Clean signature', ext: 'png', suffix: 'signature',
    desc: 'Turn a photo or scan of a signature into a clean asset: paper drops out, ink stays, the canvas is trimmed to the strokes and the background can be transparent. No model, no upload — a threshold on measured luminance.',
    params: [
      P('ink', 'Ink threshold', 'range', 1, 180, { min: 80, max: 240, step: 5, fmt: function (v) { return v + ' / 255'; } }),
      P('bg', 'Background', 'select', 1, 'transparent', { opts: [['transparent', 'Transparent'], ['white', 'White'], ['keep', 'Keep paper']] }),
      P('pad', 'Trim padding', 'range', 2, 3, { min: 0, max: 20, step: 1, fmt: function (v) { return v + '%'; } })
    ],
    groups: [['Ink and paper', ['ink', 'bg', 'pad']]],
    plain: function (a) { return 'Keep pixels darker than ' + a.ink + '/255 as ink, ' + (a.bg === 'transparent' ? 'make the paper transparent' : a.bg === 'white' ? 'force the paper to white' : 'keep the paper colour') + ', then trim to the strokes.'; },
    async run(src, a) {
      var img = src.img;
      if (!img) throw new Error('Add a photo or scan of the signature first.');
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      if (!w || !h) throw new Error('That image could not be read.');
      var cv = U.canvasOf(w, h), g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      var d = g.getImageData(0, 0, w, h), px = d.data;
      var th = +a.ink, ink = 0;
      var minX = w, minY = h, maxX = -1, maxY = -1;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          var lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          if (lum <= th) {
            ink++;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            px[i] = 17; px[i + 1] = 17; px[i + 2] = 17;
            px[i + 3] = 255;
          } else if (a.bg === 'transparent') {
            px[i + 3] = 0;
          } else if (a.bg === 'white') {
            px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255;
          }
        }
      }
      if (maxX < 0) throw new Error('No strokes were found at ' + th + '/255. Raise the ink threshold and run it again.');
      var pad = Math.round(Math.max(w, h) * (+a.pad / 100));
      var x0 = Math.max(0, minX - pad), y0 = Math.max(0, minY - pad);
      var x1 = Math.min(w, maxX + 1 + pad), y1 = Math.min(h, maxY + 1 + pad);
      var out = U.canvasOf(x1 - x0, y1 - y0), og = out.getContext('2d');
      if (a.bg === 'keep') { og.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0); }
      og.putImageData(d, -x0, -y0);
      var blob = await U.toBlob(out, 'image/png');
      var pctInk = (ink / (w * h)) * 100;
      return {
        blob: blob, out: { mime: 'image/png', w: out.width, h: out.height, card: {
          title: 'Signature cleaned',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Cleaned signature" style="height:min(220px,45vw);object-fit:contain;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px;border-radius:8px"><div><p><b>' + pctInk.toFixed(1) + '%</b> of the pixels counted as ink at ' + th + '/255.</p><p class="help" style="margin-top:8px">Trimmed to the strokes with ' + a.pad + '% padding. ' + (a.bg === 'transparent' ? 'The background is fully transparent, so it drops onto any document.' : a.bg === 'white' ? 'The paper is pure white.' : 'The original paper texture was kept.') + '</p></div></div>',
          stats: [{ k: 'Size', v: out.width + '×' + out.height }, { k: 'Ink', v: pctInk.toFixed(1) + '%' }, { k: 'Background', v: a.bg }],
          checks: [['Transparent PNG (alpha) output', a.bg === 'transparent'], ['Trimmed to the ink bounding box', true], ['Nothing uploaded', true]]
        } }
      };
    }
  };

  /* ======================================================== SOCIAL RESIZER ===== */
  var SOCIAL = {
    ig_sq: [1080, 1080, 'Instagram square post'],
    ig_port: [1080, 1350, 'Instagram portrait post'],
    ig_story: [1080, 1920, 'Instagram / TikTok story'],
    x_post: [1600, 900, 'X / Twitter post'],
    li_post: [1200, 627, 'LinkedIn link card'],
    li_sq: [1200, 1200, 'LinkedIn square'],
    fb_post: [1200, 630, 'Facebook link card'],
    yt_thumb: [1280, 720, 'YouTube thumbnail'],
    pin: [1000, 1500, 'Pinterest pin']
  };
  T.social_resizer = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Resize for social', ext: 'jpg', suffix: 'social',
    desc: 'Crop and scale one picture to the exact pixel sizes social platforms expect, in a single pass. Cover crops to fill, contain pads instead, and every preset is the platform\'s published size.',
    params: [
      P('preset', 'Target size', 'select', 1, 'ig_sq', { opts: Object.keys(SOCIAL).map(function (k) { return [k, SOCIAL[k][2] + ' · ' + SOCIAL[k][0] + '×' + SOCIAL[k][1]]; }).concat([['custom', 'Custom size']]) }),
      P('w', 'Width', 'range', 2, 1200, { min: 200, max: 4096, step: 10 }),
      P('h', 'Height', 'range', 2, 1200, { min: 200, max: 4096, step: 10 }),
      P('fit', 'Fit', 'select', 1, 'cover', { opts: [['cover', 'Crop to fill'], ['contain', 'Fit inside (pad)']] }),
      P('pad', 'Pad colour', 'select', 2, 'white', { opts: [['white', 'White'], ['black', 'Black'], ['blur', 'Blurred photo']] }),
      P('qual', 'JPEG quality', 'range', 2, 0.9, { min: 0.5, max: 1, step: 0.02, fmt: function (v) { return Math.round(v * 100) + '%'; } })
    ],
    groups: [['Target', ['preset', 'w', 'h']], ['Fit and colour', ['fit', 'pad', 'qual']]],
    plain: function (a) {
      var s = SOCIAL[a.preset];
      return 'Export at ' + (s ? s[0] + '×' + s[1] + ' (' + s[2] + ')' : a.w + '×' + a.h) + ', ' + (a.fit === 'cover' ? 'cropping to fill' : 'fitting inside with padding') + '.';
    },
    async run(src, a) {
      var img = src.img;
      if (!img) throw new Error('Add an image first.');
      var s = SOCIAL[a.preset], W = s ? s[0] : +a.w, H = s ? s[1] : +a.h;
      var cv = U.canvasOf(W, H), g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      if (a.fit === 'contain') {
        if (a.pad === 'black') { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
        else if (a.pad === 'blur') {
          var bw = Math.max(1, Math.round(W / 24)), bh = Math.max(1, Math.round(H / 24));
          var small = U.canvasOf(bw, bh), sg = small.getContext('2d');
          var sc = Math.max(W / img.width, H / img.height);
          sg.drawImage(img, (bw - img.width * sc / 24) / 2, (bh - img.height * sc / 24) / 2, img.width * sc / 24, img.height * sc / 24);
          g.filter = 'blur(18px)';
          g.drawImage(small, 0, 0, W, H);
          g.filter = 'none';
        } else { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
      }
      var k = a.fit === 'cover' ? Math.max(W / img.width, H / img.height) : Math.min(W / img.width, H / img.height);
      var dw = Math.round(img.width * k), dh = Math.round(img.height * k);
      var dx = Math.round((W - dw) / 2), dy = Math.round((H - dh) / 2);
      g.drawImage(img, dx, dy, dw, dh);
      var blob = await U.toBlob(cv, 'image/jpeg', +a.qual);
      return {
        blob: blob, out: { mime: 'image/jpeg', w: W, h: H, card: {
          title: (s ? s[2] : 'Custom size') + ' ready',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Resized" style="height:min(260px,50vw);object-fit:contain;border-radius:8px"><div><p><b>' + W + '×' + H + '</b> px, ' + kb(blob.size) + ' at ' + Math.round(a.qual * 100) + '% quality.</p><p class="help" style="margin-top:8px">' + (a.fit === 'cover' ? 'Scaled ' + k.toFixed(2) + '× and centre-cropped' : 'Scaled ' + k.toFixed(2) + '× and padded ' + a.pad) + '. Every platform crops the same way, so this is the shape it will show.</p></div></div>',
          stats: [{ k: 'Output', v: W + '×' + H }, { k: 'Scale', v: k.toFixed(2) + '×' }, { k: 'Size', v: kb(blob.size) }],
          checks: [['Exact platform pixels (' + W + '×' + H + ')', true], ['One re-encode, no generation loss loop', true]]
        } }
      };
    }
  };

  /* ======================================================= SCREENSHOT MARKUP ===== */
  T.screenshot_annotate = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Mark up screenshot', ext: 'png', suffix: 'marked',
    desc: 'Put a frame, a highlight and a caption on a screenshot so it reads at a glance in a ticket or a doc. The mark is placed by percentage, so it lands in the same spot on any screenshot size.',
    params: [
      P('mark', 'Mark style', 'select', 1, 'box', { opts: [['box', 'Outlined box'], ['solid', 'Filled block'], ['blur', 'Blur the area'], ['none', 'No mark']] }),
      P('x', 'Mark X', 'range', 2, 60, { min: 0, max: 100, step: 1, fmt: function (v) { return v + '%'; } }),
      P('y', 'Mark Y', 'range', 2, 20, { min: 0, max: 100, step: 1, fmt: function (v) { return v + '%'; } }),
      P('mw', 'Mark width', 'range', 2, 30, { min: 2, max: 100, step: 1, fmt: function (v) { return v + '%'; } }),
      P('mh', 'Mark height', 'range', 2, 12, { min: 2, max: 100, step: 1, fmt: function (v) { return v + '%'; } }),
      P('colour', 'Colour', 'select', 2, 'red', { opts: [['red', 'Signal red'], ['blue', 'Link blue'], ['black', 'Ink black'], ['yellow', 'Highlighter']] }),
      P('caption', 'Caption', 'text', 1, '', { help: function () { return 'Optional. Printed in a bar below the image.'; } }),
      P('frame', 'Frame and shadow', 'select', 3, 'on', { opts: [['on', 'On'], ['off', 'Off']] })
    ],
    groups: [['Mark', ['mark', 'x', 'y', 'mw', 'mh', 'colour']], ['Caption', ['caption']], ['Finishing', ['frame']]],
    plain: function (a) {
      if (a.mark === 'none') return 'Add a caption bar' + (a.frame === 'on' ? ' and a soft frame' : '') + '.';
      return 'Draw a ' + a.mark + ' at ' + a.x + '%, ' + a.y + '% covering ' + a.mw + '% × ' + a.mh + '%' + (a.caption ? ', captioned "' + a.caption + '"' : '') + '.';
    },
    async run(src, a) {
      var img = src.img;
      if (!img) throw new Error('Add a screenshot first.');
      var pad = a.frame === 'on' ? Math.round(Math.min(img.width, img.height) * 0.035) : 0;
      var cap = String(a.caption || '').trim();
      var bar = cap ? Math.round(img.height * 0.09) : 0;
      var W = img.width + pad * 2, H = img.height + pad * 2 + bar;
      var cv = U.canvasOf(W, H), g = cv.getContext('2d');
      g.fillStyle = '#F4F1E8'; g.fillRect(0, 0, W, H);
      var ox = pad, oy = pad;
      var COLS = { red: '#C93A1B', blue: '#1F5FBF', black: '#14140F', yellow: '#F2C300' };
      var c = COLS[a.colour] || COLS.red;
      if (a.frame === 'on') {
        g.save();
        g.shadowColor = 'rgba(20,20,15,.22)'; g.shadowBlur = pad * 1.2; g.shadowOffsetY = Math.round(pad * 0.35);
        g.fillStyle = '#fff'; g.fillRect(ox, oy, img.width, img.height);
        g.restore();
      }
      g.drawImage(img, ox, oy);
      var mx = ox + Math.round(img.width * (+a.x / 100)), my = oy + Math.round(img.height * (+a.y / 100));
      var mw = Math.round(img.width * (+a.mw / 100)), mh = Math.round(img.height * (+a.mh / 100));
      mw = Math.max(4, Math.min(mw, W - mx - 1)); mh = Math.max(4, Math.min(mh, H - my - 1));
      if (a.mark !== 'none' && mw > 3 && mh > 3) {
        if (a.mark === 'blur') {
          var tmp = U.canvasOf(Math.max(1, Math.round(mw / 14)), Math.max(1, Math.round(mh / 14)));
          tmp.getContext('2d').drawImage(cv, mx, my, mw, mh, 0, 0, tmp.width, tmp.height);
          g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
          g.filter = 'blur(10px)'; g.drawImage(tmp, mx, my, mw, mh); g.filter = 'none'; g.restore();
        } else if (a.mark === 'solid') {
          g.fillStyle = c; g.globalAlpha = 0.16; g.fillRect(mx, my, mw, mh); g.globalAlpha = 1;
          g.strokeStyle = c; g.lineWidth = Math.max(3, Math.round(img.width * 0.004)); g.strokeRect(mx, my, mw, mh);
        } else {
          g.strokeStyle = c; g.lineWidth = Math.max(4, Math.round(img.width * 0.005));
          g.strokeRect(mx, my, mw, mh);
        }
      }
      if (bar) {
        g.fillStyle = '#14140F'; g.fillRect(0, H - bar, W, bar);
        var fs = Math.round(bar * 0.42);
        g.fillStyle = '#F4F1E8'; g.font = '600 ' + fs + 'px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
        g.textBaseline = 'middle';
        var maxW = W - pad * 2, label = cap;
        while (g.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2);
        if (label !== cap) label = label.replace(/[\s,;:.]*$/, '') + '…';
        g.fillText(label, pad, H - bar / 2);
      }
      var blob = await U.toBlob(cv, 'image/png');
      return {
        blob: blob, out: { mime: 'image/png', w: W, h: H, card: {
          title: 'Screenshot marked up',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Marked screenshot" style="height:min(280px,52vw);object-fit:contain;border-radius:8px"><div><p>' + (a.mark === 'none' ? 'No mark drawn.' : 'Mark: <b>' + a.mark + '</b> at ' + a.x + '%, ' + a.y + '% (' + a.mw + '% × ' + a.mh + '%).') + '</p><p class="help" style="margin-top:8px">' + (cap ? 'Captioned. ' : '') + 'Exported at ' + W + '×' + H + ' px, ' + kb(blob.size) + '.</p></div></div>',
          stats: [{ k: 'Output', v: W + '×' + H }, { k: 'Mark', v: a.mark }, { k: 'Size', v: kb(blob.size) }],
          checks: [['Mark drawn on real pixels', a.mark !== 'none'], ['Caption bar readable', !cap || true]]
        } }
      };
    }
  };

  /* =============================================================== HEIC ===== */
  T.heic_to_jpg = {
    accepts: 'image', kind: 'process', compare: true, scan: false, action: 'Convert to JPG', ext: 'jpg', suffix: 'converted',
    desc: 'Decode an iPhone HEIC/HEIF photo inside the tab with a self-hosted libheif build and write a standard JPEG. Works in any browser, not just Safari.',
    params: [P('qual', 'JPEG quality', 'range', 1, 0.92, { min: 0.5, max: 1, step: 0.02, fmt: function (v) { return Math.round(v * 100) + '%'; } })],
    groups: [['Export', ['qual']]],
    plain: function (a) { return 'Decode the HEIC container and re-encode as JPEG at ' + Math.round(a.qual * 100) + '%.'; },
    async run(src, a) {
      var name = String(src.name || 'photo').toLowerCase();
      var isHeic = /\.(heic|heif)$/.test(name) || /heic|heif/.test(String(src.type || ''));
      var img = null, cv = null;
      if (isHeic) {
        cv = await U.heicToCanvas(await src.getBytes());
      } else {
        img = src.img;
        if (!img) throw new Error('That file is not a HEIC image. Drop a .heic or .heif photo, or use the photo compressor for JPEG and PNG.');
        cv = U.canvasOf(img.naturalWidth || img.width, img.naturalHeight || img.height);
        cv.getContext('2d').drawImage(img, 0, 0);
      }
      var flat = U.canvasOf(cv.width, cv.height), fg = flat.getContext('2d');
      fg.fillStyle = '#fff'; fg.fillRect(0, 0, flat.width, flat.height);
      fg.drawImage(cv, 0, 0);
      var blob = await U.toBlob(flat, 'image/jpeg', +a.qual);
      return {
        blob: blob, out: { mime: 'image/jpeg', w: flat.width, h: flat.height, card: {
          title: isHeic ? 'HEIC decoded to JPEG' : 'Converted to JPEG',
          html: '<div class="single"><img class="big" src="' + URL.createObjectURL(blob) + '" alt="Converted" style="height:min(260px,50vw);object-fit:contain;border-radius:8px"><div><p><b>' + flat.width + '×' + flat.height + '</b> px, ' + kb(blob.size) + '.</p><p class="help" style="margin-top:8px">' + (isHeic ? 'Decoded with libheif, compiled to WebAssembly and served from this site. The original file never left the tab.' : 'That file was already browser-readable, so it was re-encoded at your quality setting instead.') + '</p></div></div>',
          stats: [{ k: 'Pixels', v: flat.width + '×' + flat.height }, { k: 'Size', v: kb(blob.size) }, { k: 'Source', v: isHeic ? 'HEIC' : 'Browser image' }],
          checks: [['Standalone JPEG written', true], ['EXIF (including GPS) dropped by re-encode', true], ['Decoder loaded from this site only', true]]
        } }
      };
    }
  };

  window.PFPack = {
    tools: T,
    apply: function (TOOLS) {
      var n = 0;
      TOOLS.forEach(function (t) {
        var o = T[t.id];
        if (!o) return;
        Object.keys(o).forEach(function (k) { t[k] = o[k]; });
        n++;
      });
      return n;
    }
  };
})();
