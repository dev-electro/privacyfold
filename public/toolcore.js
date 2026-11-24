/* PrivacyFold core engine — real client-side implementations.
   Exposes window.PFCore. Nothing here touches the network except loading
   vendored engines from /vendor/ (same origin, bundled with the site). */
(function () {
  'use strict';

  var C = {};

  /* ------------------------------------------------------------- utils */
  var U = C.util = {};

  U.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  U.canvasOf = function (w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  };

  U.toBlob = function (canvas, mime, q) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, mime || 'image/png', q); });
  };

  U.bytesOf = function (blob) {
    return blob instanceof Blob ? blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(new Uint8Array(blob));
  };

  U.hex = function (bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += ('0' + bytes[i].toString(16)).slice(-2);
    return s;
  };

  U.sha256Hex = async function (bytes) {
    var buf = await crypto.subtle.digest('SHA-256', bytes);
    return U.hex(new Uint8Array(buf));
  };

  U.b64 = function (bytes) {
    var s = '';
    var b = new Uint8Array(bytes);
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  };

  U.unb64 = function (s) {
    var t = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    while (t.length % 4) t += '=';
    var bin = atob(t), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  /* ---------- CSV ---------- */
  U.parseCSV = function (text, delim) {
    var d = delim || ',';
    var rows = [], row = [], cur = '', q = false, i = 0;
    var t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    while (i < t.length) {
      var ch = t[i];
      if (q) {
        if (ch === '"') {
          if (t[i + 1] === '"') { cur += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        cur += ch; i++; continue;
      }
      if (ch === '"' && cur === '') { q = true; i++; continue; }
      if (ch === d) { row.push(cur); cur = ''; i++; continue; }
      if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
      cur += ch; i++;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return !(r.length === 1 && r[0] === ''); });
  };

  U.csvToObjects = function (text) {
    var rows = U.parseCSV(text);
    if (!rows.length) return [];
    var head = rows[0].map(function (h, i) { return (h || 'column' + (i + 1)).trim(); });
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = r[i] === undefined ? '' : r[i]; });
      return o;
    });
  };

  U.objectsToCSV = function (arr) {
    if (!arr.length) return '';
    var cols = [];
    arr.forEach(function (o) { Object.keys(o).forEach(function (k) { if (cols.indexOf(k) < 0) cols.push(k); }); });
    var q = function (v) {
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') v = JSON.stringify(v);
      v = String(v);
      return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var out = [cols.map(q).join(',')];
    arr.forEach(function (o) { out.push(cols.map(function (c) { return q(o[c]); }).join(',')); });
    return out.join('\n');
  };

  /* ---------- colour ---------- */
  U.hexToRgb = function (s) {
    if (!s) return null;
    var m = String(s).trim();
    var named = { white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff', grey: '#808080', gray: '#808080', silver: '#c0c0c0', navy: '#000080', teal: '#008080', maroon: '#800000', olive: '#808000', purple: '#800080', yellow: '#ffff00', orange: '#ffa500', pink: '#ffc0cb', lime: '#00ff00', aqua: '#00ffff', fuchsia: '#ff00ff' };
    if (named[m.toLowerCase()]) m = named[m.toLowerCase()];
    if (/^#?[0-9a-f]{3}$/i.test(m)) { m = m.replace('#', ''); m = '#' + m[0] + m[0] + m[1] + m[1] + m[2] + m[2]; }
    var h = /^#?([0-9a-f]{6})$/i.exec(m);
    if (h) { var n = parseInt(h[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    var rgba = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(m);
    if (rgba) return [+rgba[1], +rgba[2], +rgba[3]];
    return null;
  };

  U.rgbToHex = function (c) {
    return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  };

  U.lum = function (c) {
    var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };

  U.contrast = function (a, b) {
    var l1 = U.lum(a), l2 = U.lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* ---------- unit conversion ---------- */
  var UNITS = {
    /* length → metres */
    mm: ['length', 0.001], cm: ['length', 0.01], m: ['length', 1], km: ['length', 1000], metre: ['length', 1], meter: ['length', 1], metres: ['length', 1], meters: ['length', 1],
    in: ['length', 0.0254], inch: ['length', 0.0254], inches: ['length', 0.0254], ft: ['length', 0.3048], foot: ['length', 0.3048], feet: ['length', 0.3048], yd: ['length', 0.9144], yard: ['length', 0.9144], yards: ['length', 0.9144],
    mi: ['length', 1609.344], mile: ['length', 1609.344], miles: ['length', 1609.344], nmi: ['length', 1852],
    /* mass → grams */
    mg: ['mass', 0.001], g: ['mass', 1], gram: ['mass', 1], grams: ['mass', 1], kg: ['mass', 1000], kilo: ['mass', 1000], kilos: ['mass', 1000], t: ['mass', 1000000], tonne: ['mass', 1000000], tonnes: ['mass', 1000000],
    oz: ['mass', 28.349523125], ounce: ['mass', 28.349523125], ounces: ['mass', 28.349523125], lb: ['mass', 453.59237], lbs: ['mass', 453.59237], pound: ['mass', 453.59237], pounds: ['mass', 453.59237], st: ['mass', 6350.29318], stone: ['mass', 6350.29318],
    /* volume → litres */
    ml: ['volume', 0.001], l: ['volume', 1], litre: ['volume', 1], liter: ['volume', 1], litres: ['volume', 1], liters: ['volume', 1], cup: ['volume', 0.2365882365], cups: ['volume', 0.2365882365],
    pt: ['volume', 0.473176473], pint: ['volume', 0.473176473], pints: ['volume', 0.473176473], qt: ['volume', 0.946352946], quart: ['volume', 0.946352946], gal: ['volume', 3.785411784], gallon: ['volume', 3.785411784], gallons: ['volume', 3.785411784],
    floz: ['volume', 0.0295735295625],
    /* area → m² */
    sqm: ['area', 1], 'm2': ['area', 1], sqft: ['area', 0.09290304], 'ft2': ['area', 0.09290304], acre: ['area', 4046.8564224], acres: ['area', 4046.8564224], hectare: ['area', 10000], hectares: ['area', 10000], ha: ['area', 10000],
    /* speed → m/s */
    mph: ['speed', 0.44704], kph: ['speed', 0.2777778], kmh: ['speed', 0.2777778], 'km/h': ['speed', 0.2777778], 'm/s': ['speed', 1], knot: ['speed', 0.514444], knots: ['speed', 0.514444],
    /* data → bytes */
    b: ['data', 1], byte: ['data', 1], bytes: ['data', 1], kb: ['data', 1024], mb: ['data', 1048576], gb: ['data', 1073741824], tb: ['data', 1099511627776],
    kbit: ['data', 128], mbit: ['data', 131072],
    /* time → seconds */
    ms: ['time', 0.001], s: ['time', 1], sec: ['time', 1], secs: ['time', 1], second: ['time', 1], seconds: ['time', 1], min: ['time', 60], mins: ['time', 60], minute: ['time', 60], minutes: ['time', 60], h: ['time', 3600], hr: ['time', 3600], hrs: ['time', 3600], hour: ['time', 3600], hours: ['time', 3600], day: ['time', 86400], days: ['time', 86400], week: ['time', 604800], weeks: ['time', 604800], year: ['time', 31557600], years: ['time', 31557600]
  };
  var TEMP = { c: 1, celsius: 1, centigrade: 1, f: 1, fahrenheit: 1, k: 1, kelvin: 1 };

  U.convertUnits = function (line) {
    var m = /^\s*(-?[\d.,]+)\s*([a-zA-Z°\/²]+)\s*(?:to|in|into|=|->|→)\s*([a-zA-Z°\/²]+)\s*$/i.exec(line);
    if (!m) throw new Error('Write it like "10 km to miles".');
    var v = parseFloat(m[1].replace(/,/g, ''));
    if (isNaN(v)) throw new Error('The number could not be read.');
    var from = m[2].toLowerCase().replace(/°/, ''), to = m[3].toLowerCase().replace(/°/, '');
    if (TEMP[from] && TEMP[to]) {
      var k = from[0] === 'c' ? v + 273.15 : from[0] === 'f' ? (v - 32) * 5 / 9 + 273.15 : v;
      var out = to[0] === 'c' ? k - 273.15 : to[0] === 'f' ? (k - 273.15) * 9 / 5 + 32 : k;
      return { value: out, from: from, to: to };
    }
    var A = UNITS[from], B = UNITS[to];
    if (!A || !B) throw new Error('I do not know "' + (A ? to : from) + '" — try km, mi, kg, lb, C, F, mb, kb, min, h.');
    if (A[0] !== B[0]) throw new Error('Cannot convert ' + A[0] + ' to ' + B[0] + '.');
    return { value: v * A[1] / B[1], from: from, to: to };
  };

  /* ---------- markdown ---------- */
  U.mdToHtml = function (src) {
    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var lines = String(src).replace(/\r\n/g, '\n').split('\n');
    var html = [], inCode = false, codeBuf = [], listType = null, inQuote = false, inTable = false;
    function inline(s) {
      s = esc(s);
      s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
      s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
      s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
      s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<img src="$2" alt="$1" title="$3">');
      s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<a href="$2" title="$3" rel="noopener">$1</a>');
      s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" rel="noopener">$2</a>');
      return s;
    }
    function closeList() { if (listType) { html.push('</' + listType + '>'); listType = null; } }
    function closeTable() { if (inTable) { html.push('</tbody></table>'); inTable = false; } }
    function closeQuote() { if (inQuote) { html.push('</blockquote>'); inQuote = false; } }

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\s*```/.test(ln)) {
        if (inCode) { html.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
        else { closeList(); closeTable(); closeQuote(); inCode = true; }
        continue;
      }
      if (inCode) { codeBuf.push(ln); continue; }
      if (!ln.trim()) { closeList(); closeTable(); closeQuote(); continue; }

      var h = /^(#{1,6})\s+(.*)$/.exec(ln);
      if (h) { closeList(); closeTable(); closeQuote(); html.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); continue; }
      if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(ln)) { closeList(); closeTable(); closeQuote(); html.push('<hr>'); continue; }
      if (/^\s*>/.test(ln)) {
        closeList(); closeTable();
        if (!inQuote) { html.push('<blockquote>'); inQuote = true; }
        html.push('<p>' + inline(ln.replace(/^\s*>\s?/, '')) + '</p>');
        continue;
      }
      closeQuote();
      if (/^\s*\|.*\|\s*$/.test(ln)) {
        var cells = ln.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
        if (/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
          closeList();
          html.push('<table><thead><tr>' + cells.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>');
          inTable = true; i++; continue;
        }
        if (inTable) { html.push('<tr>' + cells.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'); continue; }
      }
      closeTable();
      var ul = /^\s*[-*+]\s+(.*)$/.exec(ln), ol = /^\s*(\d+)[.)]\s+(.*)$/.exec(ln);
      if (ul || ol) {
        var want = ul ? 'ul' : 'ol';
        if (listType && listType !== want) closeList();
        if (!listType) { html.push('<' + want + '>'); listType = want; }
        html.push('<li>' + inline((ul || ol)[ul ? 1 : 2]) + '</li>');
        continue;
      }
      closeList();
      html.push('<p>' + inline(ln) + '</p>');
    }
    if (inCode) html.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
    closeList(); closeTable(); closeQuote();
    return html.join('\n');
  };

  /* ---------- receipts / notes / invoices ---------- */
  U.parseReceipt = function (text) {
    var lines = String(text).split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var cur = /£/.test(text) ? '£' : /€/.test(text) ? '€' : /₹/.test(text) ? '₹' : '$';
    var amountAtEnd = /^(.*?)[\s.·|-]*([£$€₹]?)\s?(\d+[.,]\d{2})\s*[A-Z]?$/;
    /* A vendor is the first line that is neither a date nor an amount. Taking line 1
       blindly made the vendor the first purchased item on receipts that lead with one. */
    var vendor = '';
    for (var v = 0; v < lines.length && v < 4; v++) {
      if (amountAtEnd.test(lines[v])) continue;
      if (/^\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}$/.test(lines[v])) continue;
      vendor = lines[v].replace(/^[|·\-\s]+|[|·\-\s]+$/g, '');
      break;
    }
    var date = (/\b(\d{4}-\d{2}-\d{2})\b/.exec(text) || [])[1]
      || (/\b(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\b/.exec(text) || [])[1] || '';
    var items = [], tax = 0, total = 0;
    lines.forEach(function (l, n) {
      var m = amountAtEnd.exec(l);
      if (!m) return;
      var label = m[1].replace(/[.\s·|-]+$/, '').trim();
      if (/^\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}$/.test(label)) label = '';
      var amt = parseFloat(m[3].replace(',', '.'));
      if (/^(total|amount due|balance|grand total|to pay)/i.test(label)) { total = amt; return; }
      if (/^(tax|vat|gst|sales tax|service)/i.test(label)) { tax = amt; return; }
      if (/^(subtotal|sub total|net)/i.test(label)) return;
      if (!label) return;
      items.push({ label: label, amount: amt });
    });
    if (!total) total = items.reduce(function (s, i) { return s + i.amount; }, 0) + tax;
    return { vendor: vendor, date: date, items: items, tax: tax, total: total, currency: cur };
  };

  U.parseMeetingNotes = function (text) {
    var lines = String(text).split(/\n/).map(function (l) { return l.replace(/^\s*[-*•]\s*/, '').trim(); }).filter(Boolean);
    var decisions = [], actions = [], topics = [];
    lines.forEach(function (l) {
      var owner = (/^([A-Z][a-z]+)\s*[:\-—]\s*(.+)$/.test(l) ? RegExp.$1 : (/^@(\w+)\s+(.+)$/.test(l) ? RegExp.$1 : ''));
      var body = l.replace(/^[A-Z][a-z]+\s*[:\-—]\s*/, '').replace(/^@\w+\s+/, '');
      if (/\b(decision|decided|agreed|approved|signed off)\b/i.test(l)) decisions.push({ owner: owner, text: body });
      else if (/\b(will|to do|todo|action|need to|needs to|follow up|blocked|by (monday|tuesday|wednesday|thursday|friday|next week|end of))\b/i.test(l)) actions.push({ owner: owner, text: body });
      else topics.push({ owner: owner, text: body });
    });
    return { decisions: decisions, actions: actions, topics: topics };
  };

  U.parseInvoiceItems = function (text) {
    var out = [];
    String(text).split(/\n/).forEach(function (line) {
      var l = line.trim();
      if (!l) return;
      var p = /^(.+?)\s*\|\s*(\d+(?:[.,]\d+)?)\s*\|\s*([\d.,]+)\s*$/.exec(l);
      if (p) { out.push({ desc: p[1].trim(), qty: parseFloat(String(p[2]).replace(',', '.')), rate: parseFloat(String(p[3]).replace(/,/g, '')) }); return; }
      var p1 = /^(.+?)\s*\|\s*([\d.,]+)\s*$/.exec(l);
      if (p1) { out.push({ desc: p1[1].trim(), qty: 1, rate: parseFloat(String(p1[2]).replace(/,/g, '')) }); return; }
      var m = /^(.+?)[,;]?\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*([\d.,]+)\s*$/i.exec(l);
      if (m) { out.push({ desc: m[1].replace(/[,;]$/, '').trim(), qty: parseFloat(m[2]), rate: parseFloat(m[3].replace(',', '.')) }); return; }
      var d = /^(.+?)\s*(?:—|–|-|:)\s*([\d.,]+)\s*$/.exec(l);
      if (d) { out.push({ desc: d[1].trim(), qty: 1, rate: parseFloat(d[2].replace(',', '.')) }); return; }
      var q = /^(.+?)[,;]\s*(\d+(?:[.,]\d+)?)\s*$/.exec(l);
      if (q) { out.push({ desc: q[1].trim(), qty: parseFloat(q[2]), rate: 0 }); return; }
      var a = /^(.+?)\s+([\d.,]+)$/.exec(l);
      if (a) out.push({ desc: a[1].trim(), qty: 1, rate: parseFloat(a[2].replace(',', '.')) });
    });
    return out;
  };

  /* ---------- PII ---------- */
  U.luhn = function (num) {
    var s = String(num).replace(/\D/g, '');
    if (s.length < 13 || s.length > 19) return false;
    var sum = 0, dbl = false;
    for (var i = s.length - 1; i >= 0; i--) {
      var d = +s[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  };

  /* Remove comments and indentation without touching string contents.
     Newlines are kept on purpose: joining lines can change JavaScript meaning
     through automatic semicolon insertion. */
  U.minifyJs = function (src) {
    var out = '', i = 0, n = src.length, q = null;
    while (i < n) {
      var c = src[i], d = src[i + 1];
      if (q) {
        out += c;
        if (c === '\\') { out += (src[i + 1] || ''); i += 2; continue; }
        if (c === q) q = null;
        i++; continue;
      }
      if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
      if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2; continue;
      }
      out += c; i++;
    }
    return out.split('\n').map(function (l) { return l.replace(/\s+$/, '').replace(/^[ \t]+/, ''); })
      .filter(function (l) { return l.length; }).join('\n');
  };

  var PII = [
    ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
    ['iban', /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g],
    ['card', /\b(?:\d[ -]?){13,19}\b/g],
    ['ni', /\b(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PQ-RTW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi],
    ['ssn', /\b\d{3}-\d{2}-\d{4}\b/g],
    ['ipv4', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
    ['postcode', /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi],
    ['date', /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}-\d{2})\b/g]
  ];

  U.redactPII = function (text, opts) {
    opts = opts || {};
    var only = opts.only;
    var found = [], out = String(text);
    var counts = {};
    var take = function (type, value, raw) {
      counts[type] = (counts[type] || 0) + 1;
      var token = '[' + type.toUpperCase() + '_' + counts[type] + ']';
      found.push({ type: type, value: value, token: token, raw: raw });
      return token;
    };
    var types = only || PII.map(function (p) { return p[0]; }).concat(['phone']);
    /* order matters: cards before plain numbers */
    var order = ['email', 'iban', 'card', 'ni', 'ssn', 'ipv4', 'postcode', 'date'].filter(function (t) { return types.indexOf(t) > -1; });
    order.forEach(function (type) {
      var def = PII.filter(function (p) { return p[0] === type; })[0];
      if (!def) return;
      out = out.replace(new RegExp(def[1].source, def[1].flags), function (m) {
        if (type === 'card' && !U.luhn(m)) return m;
        if (type === 'ipv4' && m.split('.').some(function (n) { return +n > 255; })) return m;
        return take(type, m, m);
      });
    });
    /* Phones need digit counting, not one clever regex: a run is a phone when it has
       9–15 digits and either a country code, a separator or a leading zero. Plain
       digit strings (order numbers, tracking ids) are left alone. */
    if (types.indexOf('phone') > -1) {
      out = out.replace(/(\+?\d[\d ().-]{7,18}\d)/g, function (m) {
        var digits = m.replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) return m;
        if (!/^\+/.test(m) && !/^0/.test(digits) && !/[ ().-]/.test(m)) return m;
        if (/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(m.trim())) return m;
        return take('phone', m, m);
      });
    }
    return { text: out, found: found };
  };

  U.restorePII = function (text, map) {
    var out = String(text);
    map.forEach(function (f) { out = out.split(f.token).join(f.value); });
    return out;
  };

  /* ---------- QR ---------- */
  U.ensureQr = function () {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!U._qrP) {
      U._qrP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = '/vendor/qrcode.js';
        s.onload = function () { res(window.qrcode); };
        s.onerror = function () { rej(new Error('QR library failed to load.')); };
        document.head.appendChild(s);
      });
    }
    return U._qrP;
  };

  /* ---------- HEIC (ISO-BMFF stills from iPhone) ---------- */
  U.ensureHeif = function () {
    if (window.libheif) return Promise.resolve(window.libheif);
    if (!U._heifP) {
      U._heifP = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = '/vendor/libheif.js';
        s.onload = function () { window.libheif ? res(window.libheif) : rej(new Error('HEIC decoder loaded but did not initialise.')); };
        s.onerror = function () { rej(new Error('The HEIC decoder could not be loaded. Check your connection to this site and try again.')); };
        document.head.appendChild(s);
      });
    }
    return U._heifP;
  };

  U.heicToCanvas = async function (buffer) {
    var lib = await U.ensureHeif();
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var decoder = new lib.HeifDecoder();
    var images = decoder.decode(bytes);
    if (!images || !images.length) throw new Error('That file could not be read as a HEIC image.');
    var img = images[0];
    var w = img.get_width(), h = img.get_height();
    var data = await new Promise(function (res) { img.display(res, null); });
    var cv = U.canvasOf(w, h), g = cv.getContext('2d');
    var out = g.createImageData(w, h);
    out.data.set(data.data || data);
    g.putImageData(out, 0, 0);
    if (img.free) { try { img.free(); } catch (e) { } }
    return cv;
  };

  U.makeQr = function (text, opts) {
    opts = opts || {};
    if (!window.qrcode) throw new Error('QR library is still loading — try again in a second.');
    var qr = window.qrcode(0, opts.ec || 'M');
    qr.addData(String(text));
    qr.make();
    var n = qr.getModuleCount(), scale = Math.max(2, opts.scale || 8), quiet = 4;
    var size = (n + quiet * 2) * scale;
    var cv = U.canvasOf(size, size), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, size, size);
    g.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    return { canvas: cv, modules: n, size: size };
  };

  /* ---------- barcodes ---------- */
  var C128 = ('212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112').split(' ');

  U.barcodeModules = function (sym, text) {
    var t = String(text).trim();
    if (sym === 'ean13') {
      var digits = t.replace(/\D/g, '');
      if (digits.length === 12) {
        var sum = 0;
        for (var i = 0; i < 12; i++) sum += (+digits[i]) * (i % 2 ? 3 : 1);
        var chk = (10 - (sum % 10)) % 10;
        digits += chk;
      }
      if (digits.length !== 13) throw new Error('EAN-13 needs 12 digits (or 13 with the check digit).');
      var s2 = 0;
      for (var j = 0; j < 12; j++) s2 += (+digits[j]) * (j % 2 ? 3 : 1);
      if ((10 - (s2 % 10)) % 10 !== +digits[12]) throw new Error('EAN-13 check digit should be ' + ((10 - (s2 % 10)) % 10) + ', not ' + digits[12] + '.');
      var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
      var G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
      var R = L.map(function (p) { return p.replace(/0/g, 'x').replace(/1/g, '0').replace(/x/g, '1'); });
      var PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
      var par = PAR[+digits[0]], bits = '101';
      for (var k = 1; k <= 6; k++) bits += (par[k - 1] === 'L' ? L : G)[+digits[k]];
      bits += '01010';
      for (var q = 7; q <= 12; q++) bits += R[+digits[q]];
      bits += '101';
      return { bits: bits, text: digits };
    }
    /* Code 128 B */
    var vals = [], sum = 104;
    for (var n = 0; n < t.length; n++) {
      var code = t.charCodeAt(n);
      if (code < 32 || code > 126) throw new Error('Code 128 here supports printable ASCII only (character "' + t[n] + '" is out of range).');
      var v = code - 32;
      vals.push(v); sum += v * (n + 1);
    }
    vals.push(sum % 103); vals.push(106);
    var bits2 = C128[104];
    vals.forEach(function (v) { bits2 += C128[v]; });
    var out = '';
    for (var b = 0; b < bits2.length; b++) out += (b % 2 ? '0' : '1').repeat(+bits2[b]);
    return { bits: out, text: t };
  };

  /* ------------------------------------------------------------- images */
  var IMG = C.img = {};

  IMG.canvasOf = U.canvasOf;

  IMG.loadImageFromBlob = function (blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ img: im, url: url }); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That image could not be opened.')); };
      im.src = url;
    });
  };

  IMG.blobFrom = function (canvas, mime, q) { return U.toBlob(canvas, mime, q); };

  IMG.drawTo = function (img, w, h) {
    var cv = U.canvasOf(w, h), g = cv.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    return cv;
  };

  IMG.embedCanary = function (canvas, text) {
    var g = canvas.getContext('2d');
    var data = g.getImageData(0, 0, canvas.width, canvas.height);
    var payload = 'pf:' + String(text);
    var bytes = [];
    for (var i = 0; i < payload.length; i++) bytes.push(payload.charCodeAt(i) & 255);
    bytes.push(0);
    var bits = [];
    bytes.forEach(function (b) { for (var k = 7; k >= 0; k--) bits.push((b >> k) & 1); });
    var d = data.data, idx = 0;
    for (var n = 0; n < bits.length && idx < d.length; n++) {
      d[idx] = (d[idx] & 0xFE) | bits[n];
      idx += 4;
    }
    g.putImageData(data, 0, 0);
    /* read back from the canvas we just wrote */
    var back = g.getImageData(0, 0, canvas.width, canvas.height).data;
    var outBytes = [], cur = 0, cnt = 0;
    for (var j = 0; j < back.length; j += 4) {
      cur = (cur << 1) | (back[j] & 1); cnt++;
      if (cnt === 8) { outBytes.push(cur); cur = 0; cnt = 0; if (outBytes.length >= bytes.length) break; }
    }
    var decoded = outBytes.map(function (b) { return String.fromCharCode(b); }).join('').replace(/\0.*$/, '');
    return { canvas: canvas, bits: bits.length, decoded: decoded, verified: decoded === payload };
  };

  IMG.diffImages = function (a, b, opts) {
    opts = opts || {};
    var w = Math.min(a.naturalWidth, b.naturalWidth), h = Math.min(a.naturalHeight, b.naturalHeight);
    var ca = IMG.drawTo(a, w, h), cb = IMG.drawTo(b, w, h);
    var da = ca.getContext('2d').getImageData(0, 0, w, h).data;
    var db = cb.getContext('2d').getImageData(0, 0, w, h).data;
    var out = U.canvasOf(w, h), og = out.getContext('2d');
    og.drawImage(cb, 0, 0);
    var od = og.getImageData(0, 0, w, h), o = od.data;
    var thr = opts.threshold || 48, changed = 0;
    var cell = Math.max(8, Math.round(Math.min(w, h) / 24));
    var gridW = Math.ceil(w / cell), gridH = Math.ceil(h / cell);
    var grid = new Uint32Array(gridW * gridH);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        if (d > thr) {
          changed++;
          o[i] = 201; o[i + 1] = 58; o[i + 2] = 27;
          grid[Math.floor(y / cell) * gridW + Math.floor(x / cell)]++;
        }
      }
    }
    og.putImageData(od, 0, 0);
    var boxes = [];
    for (var gy = 0; gy < gridH; gy++) for (var gx = 0; gx < gridW; gx++) {
      if (grid[gy * gridW + gx] > cell * cell * 0.15) boxes.push([gx * cell, gy * cell, cell, cell]);
    }
    /* merge neighbouring cells into rectangles */
    var merged = [];
    boxes.forEach(function (bx) {
      var hit = null;
      for (var m = 0; m < merged.length; m++) {
        var r = merged[m];
        if (bx[0] < r[0] + r[2] + cell && bx[0] + bx[2] + cell > r[0] && bx[1] < r[1] + r[3] + cell && bx[1] + bx[3] + cell > r[1]) { hit = r; break; }
      }
      if (hit) {
        var x1 = Math.min(hit[0], bx[0]), y1 = Math.min(hit[1], bx[1]);
        var x2 = Math.max(hit[0] + hit[2], bx[0] + bx[2]), y2 = Math.max(hit[1] + hit[3], bx[1] + bx[3]);
        hit[0] = x1; hit[1] = y1; hit[2] = x2 - x1; hit[3] = y2 - y1;
      } else merged.push(bx.slice());
    });
    og.strokeStyle = '#C93A1B'; og.lineWidth = Math.max(2, Math.round(w / 300));
    merged.forEach(function (r) { og.strokeRect(r[0], r[1], r[2], r[3]); });
    return { canvas: out, changed: changed, total: w * h, pct: (changed / (w * h)) * 100, boxes: merged };
  };

  IMG.removeBackground = function (img, opts) {
    opts = opts || {};
    var w = img.naturalWidth, h = img.naturalHeight;
    var cv = IMG.drawTo(img, w, h), g = cv.getContext('2d');
    var id = g.getImageData(0, 0, w, h), d = id.data;
    var tol = opts.tolerance || 32, tol2 = tol * tol * 3;
    /* Leak guard: a pixel may only join the background if it is also close to
       the border colour as a whole. Without this, a gradient sky walks into the
       subject one neighbourhood at a time. */
    var leak2 = (tol * 2.4) * (tol * 2.4) * 3;
    var px = function (x, y) { return (y * w + x) * 4; };
    var corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
    var base = corners.reduce(function (acc, i) { return [acc[0] + d[i] / 4, acc[1] + d[i + 1] / 4, acc[2] + d[i + 2] / 4]; }, [0, 0, 0]);
    var seen = new Uint8Array(w * h);
    /* Each stack entry carries the colour it grew from, so the fill follows a
       gradient (studio backdrop, paper) instead of stopping at the first shade
       that differs from one averaged corner colour. */
    var stack = [];
    for (var x = 0; x < w; x++) { stack.push(x, 0, -1); stack.push(x, h - 1, -1); }
    for (var y = 0; y < h; y++) { stack.push(0, y, -1); stack.push(w - 1, y, -1); }
    var near = function (i, r, gg, b) {
      var dr = d[i] - r, dg = d[i + 1] - gg, db = d[i + 2] - b;
      return dr * dr + dg * dg + db * db <= tol2;
    };
    while (stack.length) {
      var src = stack.pop(), yy = stack.pop(), xx = stack.pop();
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      var key = yy * w + xx;
      if (seen[key]) continue;
      seen[key] = 1;
      var i = key * 4;
      var r0 = src === -1 ? base[0] : d[src], g0 = src === -1 ? base[1] : d[src + 1], b0 = src === -1 ? base[2] : d[src + 2];
      if (!near(i, r0, g0, b0)) continue;
      var dr = d[i] - base[0], dg = d[i + 1] - base[1], db = d[i + 2] - base[2];
      if (dr * dr + dg * dg + db * db > leak2) continue;
      d[i + 3] = 0;
      var me = i;
      stack.push(xx + 1, yy, me); stack.push(xx - 1, yy, me); stack.push(xx, yy + 1, me); stack.push(xx, yy - 1, me);
    }
    /* One-pixel feather: edge pixels that survived but sit next to removed
       pixels get partial alpha, which kills the hard colour fringe. */
    var soft = new Uint8ClampedArray(w * h);
    for (var y2 = 0; y2 < h; y2++) for (var x2 = 0; x2 < w; x2++) {
      var k = y2 * w + x2; if (d[k * 4 + 3] === 0) continue;
      var neighbours = 0, removed = 0;
      if (x2 > 0) { neighbours++; if (d[(k - 1) * 4 + 3] === 0) removed++; }
      if (x2 < w - 1) { neighbours++; if (d[(k + 1) * 4 + 3] === 0) removed++; }
      if (y2 > 0) { neighbours++; if (d[(k - w) * 4 + 3] === 0) removed++; }
      if (y2 < h - 1) { neighbours++; if (d[(k + w) * 4 + 3] === 0) removed++; }
      if (removed) soft[k] = Math.round(255 * (1 - (removed / (neighbours || 1)) * 0.55));
    }
    for (var q = 0; q < w * h; q++) if (soft[q]) d[q * 4 + 3] = soft[q];
    g.putImageData(id, 0, 0);
    return { canvas: cv, bg: U.rgbToHex(base) };
  };

  IMG.inpaint = function (img, mask, opts) {
    opts = opts || {};
    var w = img.naturalWidth, h = img.naturalHeight;
    var cv = IMG.drawTo(img, w, h), g = cv.getContext('2d');
    var id = g.getImageData(0, 0, w, h), d = id.data;
    var mc = IMG.drawTo(mask, w, h).getContext('2d').getImageData(0, 0, w, h).data;
    var inMask = new Uint8Array(w * h), edge = [];
    for (var k = 0; k < w * h; k++) if (mc[k * 4 + 3] > 128) inMask[k] = 1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var key = y * w + x;
      if (!inMask[key]) continue;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !inMask[key - 1] || !inMask[key + 1] || !inMask[key - w] || !inMask[key + w]) edge.push(key);
    }
    var work = new Float32Array(w * h * 3);
    for (var q = 0; q < w * h; q++) { work[q * 3] = d[q * 4]; work[q * 3 + 1] = d[q * 4 + 1]; work[q * 3 + 2] = d[q * 4 + 2]; }
    var known = new Uint8Array(w * h);
    for (var r = 0; r < w * h; r++) known[r] = inMask[r] ? 0 : 1;
    var iters = opts.iterations || 40;
    for (var it = 0; it < iters; it++) {
      var next = new Uint8Array(known), changed = 0;
      for (var m = 0; m < w * h; m++) {
        if (known[m]) continue;
        var xx = m % w, yy = (m - xx) / w, n = 0, sr = 0, sg = 0, sb = 0;
        var neigh = [];
        if (xx > 0) neigh.push(m - 1); if (xx < w - 1) neigh.push(m + 1);
        if (yy > 0) neigh.push(m - w); if (yy < h - 1) neigh.push(m + w);
        neigh.forEach(function (nb) { if (known[nb]) { sr += work[nb * 3]; sg += work[nb * 3 + 1]; sb += work[nb * 3 + 2]; n++; } });
        if (n) { work[m * 3] = sr / n; work[m * 3 + 1] = sg / n; work[m * 3 + 2] = sb / n; next[m] = 1; changed++; }
      }
      known = next;
      if (!changed) break;
    }
    for (var z = 0; z < w * h; z++) { d[z * 4] = work[z * 3]; d[z * 4 + 1] = work[z * 3 + 1]; d[z * 4 + 2] = work[z * 3 + 2]; }
    g.putImageData(id, 0, 0);
    return cv;
  };

  IMG.upscale = function (img, factor, opts) {
    opts = opts || {};
    var w = img.naturalWidth, h = img.naturalHeight, cv = IMG.drawTo(img, w * factor, h * factor);
    var amt = opts.amount || 0;
    if (amt > 0) {
      var g = cv.getContext('2d'), id = g.getImageData(0, 0, cv.width, cv.height), d = id.data;
      var src = new Uint8ClampedArray(d);
      var W = cv.width, H = cv.height, k = 1 + amt * 1.6;
      for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
        var i = (y * W + x) * 4;
        for (var c = 0; c < 3; c++) {
          var blur = (src[i - 4 + c] + src[i + 4 + c] + src[i - W * 4 + c] + src[i + W * 4 + c]) / 4;
          d[i + c] = Math.max(0, Math.min(255, src[i + c] + (src[i + c] - blur) * k));
        }
      }
      g.putImageData(id, 0, 0);
    }
    return cv;
  };

  /* ---------------------------------------------------------------- PDF */
  var PDF = C.pdf = {};
  var pdfLibP = null, pdfJsP = null;

  PDF.library = function () {
    if (!pdfLibP) pdfLibP = import('/vendor/pdf-lib.esm.min.js');
    return pdfLibP;
  };

  PDF.viewer = async function () {
    if (!pdfJsP) {
      pdfJsP = import('/vendor/pdfjs/pdf.min.mjs').then(function (m) {
        var lib = m.default || m;
        try { lib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs'; } catch (e) { }
        return lib;
      });
    }
    return pdfJsP;
  };

  PDF.open = async function (bytes) {
    var L = await PDF.library();
    return L.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  };

  PDF.view = async function (bytes) {
    var lib = await PDF.viewer();
    return lib.getDocument({
      data: new Uint8Array(bytes).slice(0),
      cMapUrl: '/vendor/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/vendor/pdfjs/standard_fonts/',
      isEvalSupported: false
    }).promise;
  };

  PDF.merge = async function (bufs) {
    var L = await PDF.library();
    var out = await L.PDFDocument.create();
    var pages = 0;
    for (var i = 0; i < bufs.length; i++) {
      var src = await L.PDFDocument.load(bufs[i], { ignoreEncryption: true });
      var idx = src.getPageIndices();
      var copied = await out.copyPages(src, idx);
      copied.forEach(function (p) { out.addPage(p); });
      pages += idx.length;
    }
    var bytes = await out.save();
    return { bytes: bytes, pages: pages };
  };

  PDF.parseRanges = function (spec, total) {
    var groups = String(spec || '1-').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return groups.map(function (g) {
      var m = /^(\d+)?\s*(?:-\s*(\d+)?)?$/.exec(g);
      if (!m) throw new Error('"' + g + '" is not a page range. Use 1-3, 5, 8-.');
      var a = m[1] ? +m[1] : 1;
      var b = m[2] ? +m[2] : (m[1] && !/[-]/.test(g) ? +m[1] : total);
      if (a < 1 || b > total || a > b) throw new Error('Pages ' + g + " do not exist — this PDF has " + total + ' page(s).');
      var list = [];
      for (var p = a; p <= b; p++) list.push(p - 1);
      return list;
    });
  };

  PDF.split = async function (bytes, spec) {
    var L = await PDF.library();
    var src = await L.PDFDocument.load(bytes, { ignoreEncryption: true });
    var total = src.getPageCount();
    var groups = PDF.parseRanges(spec, total);
    var files = [];
    for (var i = 0; i < groups.length; i++) {
      var out = await L.PDFDocument.create();
      var copied = await out.copyPages(src, groups[i]);
      copied.forEach(function (p) { out.addPage(p); });
      files.push({ bytes: await out.save(), pages: groups[i].map(function (n) { return n + 1; }) });
    }
    return { files: files, total: total };
  };

  PDF.stripMeta = async function (bytes) {
    var L = await PDF.library();
    var doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true });
    var before = {
      title: doc.getTitle() || '', author: doc.getAuthor() || '', subject: doc.getSubject() || '',
      keywords: (doc.getKeywords() || ''), creator: doc.getCreator() || '', producer: doc.getProducer() || '',
      created: doc.getCreationDate() ? doc.getCreationDate().toISOString() : '',
      modified: doc.getModificationDate() ? doc.getModificationDate().toISOString() : ''
    };
    doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]);
    doc.setCreator(''); doc.setProducer(''); doc.setLanguage('en-GB');
    try { doc.catalog.delete(L.PDFName.of('Metadata')); } catch (e) { }
    return { bytes: await doc.save({ useObjectStreams: true }), before: before };
  };

  PDF.flatten = async function (bytes) {
    var L = await PDF.library();
    var doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true });
    var names = [];
    try {
      var form = doc.getForm();
      var fields = form.getFields();
      fields.forEach(function (f) { names.push(f.getName() + (f.getText && f.getText() !== undefined ? '' : '')); });
      if (names.length) form.flatten();
    } catch (e) { names = []; }
    return { bytes: await doc.save(), fields: names };
  };

  PDF.renderPages = async function (bytes, opts) {
    var pdf = await PDF.view(bytes);
    var scale = (opts.dpi || 150) / 72;
    var max = Math.min(opts.max || 20, pdf.numPages);
    var pages = [];
    for (var p = 1; p <= max; p++) {
      var page = await pdf.getPage(p);
      var vp = page.getViewport({ scale: scale });
      var area = vp.width * vp.height;
      if (area > 26e6) { var s = Math.sqrt(26e6 / area); vp = page.getViewport({ scale: scale * s }); }
      var cv = U.canvasOf(vp.width, vp.height), g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: g, viewport: vp }).promise;
      var blob = await U.toBlob(cv, opts.mode === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
      pages.push({ page: p, blob: blob, w: cv.width, h: cv.height });
      page.cleanup();
    }
    return { pages: pages, total: pdf.numPages };
  };

  PDF.text = async function (bytes) {
    var pdf = await PDF.view(bytes);
    var pages = [], chars = 0;
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var tc = await page.getTextContent();
      var last = null, buf = '';
      tc.items.forEach(function (it) {
        if (it.str === undefined) return;
        if (last && Math.abs(last[5] - it.transform[5]) > 2) buf += '\n';
        else if (last && it.transform[4] - (last[4] + (last.width || 0)) > 2) buf += ' ';
        buf += it.str;
        last = [it.transform[4], it.transform[5], 0, 0, it.transform[4], it.transform[5]];
        last.width = it.width || 0;
        chars += it.str.length;
      });
      pages.push(buf.replace(/\n{3,}/g, '\n\n').trim());
      page.cleanup();
    }
    return { pages: pages, chars: chars };
  };

  PDF.compress = async function (bytes, opts) {
    opts = opts || {};
    var L = await PDF.library();
    var pdf = await PDF.view(bytes);
    var target = opts.target || 0;
    var quality = opts.quality || 0.72;
    var scale = 1.4;

    var build = async function (sc, q) {
      var out = await L.PDFDocument.create();
      for (var p = 1; p <= pdf.numPages; p++) {
        var page = await pdf.getPage(p);
        var base = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: sc * 1.4 });
        var cv = U.canvasOf(vp.width, vp.height), g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
        await page.render({ canvasContext: g, viewport: vp }).promise;
        var blob = await U.toBlob(cv, 'image/jpeg', q);
        var emb = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        var pg = out.addPage([base.width, base.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: base.width, height: base.height });
        page.cleanup();
      }
      var b = await out.save({ useObjectStreams: true });
      return b;
    };

    var best = await build(scale, quality);
    if (target && best.byteLength > target) {
      /* walk down scale and quality until it fits or we run out of room */
      for (var attempt = 0; attempt < 7 && best.byteLength > target; attempt++) {
        scale *= 0.78;
        if (scale < 0.25) { scale = 0.25; quality = Math.max(0.3, quality - 0.12); }
        best = await build(scale, quality);
      }
    }
    return { bytes: best, scale: scale, quality: quality, pages: pdf.numPages };
  };

  PDF.headings = async function (bytes) {
    var lib = await PDF.viewer();
    var pdf = await PDF.view(bytes);
    var OPS = lib.OPS || null;
    var meta = {};
    try { meta = await pdf.getMetadata(); } catch (e) { }
    var info = (meta && meta.info) || {};
    var raw = new TextDecoder('latin1').decode(new Uint8Array(bytes).slice(0, Math.min(400000, bytes.byteLength || bytes.length)));
    var langM = /\/Lang\s*\(([^)]+)\)/.exec(raw);
    var lines = [], images = 0;
    for (var p = 1; p <= Math.min(pdf.numPages, 20); p++) {
      var page = await pdf.getPage(p);
      var ops = await page.getOperatorList();
      ops.fnArray.forEach(function (fn) {
        if (OPS && (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject)) images++;
      });
      var tc = await page.getTextContent();
      tc.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        lines.push({ str: it.str, h: Math.round(it.transform[3]), w: Math.round(it.width || 0) });
      });
      page.cleanup();
    }
    return { pages: pdf.numPages, title: info.Title || '', lang: langM ? langM[1] : '', lines: lines, images: images };
  };

  PDF.safe = function (s) {
    return String(s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-').replace(/\u2026/g, '...').replace(/\u00a0/g, ' ')
      .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '?');
  };

  PDF.textToPdf = async function (text, opts) {
    var L = await PDF.library();
    var doc = await L.PDFDocument.create();
    var font = await doc.embedFont(opts.mono ? L.StandardFonts.Courier : L.StandardFonts.Helvetica);
    var bold = await doc.embedFont(opts.mono ? L.StandardFonts.CourierBold : L.StandardFonts.HelveticaBold);
    var size = opts.size || 11;
    var A4 = [595.28, 841.89], LETTER = [612, 792];
    var dim = opts.size_paper === 'letter' ? LETTER : A4;
    var margin = opts.size_paper === 'letter' ? 60 : 56;
    var maxW = dim[0] - margin * 2;
    var lineH = size * 1.45;
    var lines = [];
    PDF.safe(text).replace(/\r\n/g, '\n').split('\n').forEach(function (para) {
      var heading = /^\s{0,3}#{1,3}\s+/.test(para);
      var body = heading ? para.replace(/^\s{0,3}#{1,3}\s+/, '') : para;
      if (!body) { lines.push({ text: '', heading: false }); return; }
      var words = body.split(/\s+/), line = '';
      words.forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        var f = heading ? bold : font;
        if (f.widthOfTextAtSize(test, heading ? size + 3 : size) > maxW && line) { lines.push({ text: line, heading: heading }); line = w; }
        else line = test;
      });
      if (line) lines.push({ text: line, heading: heading });
    });
    var page = null, y = 0, pages = 1;
    var newPage = function () {
      page = doc.addPage(dim); y = dim[1] - margin; pages = doc.getPageCount();
    };
    newPage();
    lines.forEach(function (ln) {
      var lh = ln.heading ? (size + 3) * 1.6 : lineH;
      if (y - lh < margin) newPage();
      if (ln.text) page.drawText(ln.text, { x: margin, y: y - lh + 4, size: ln.heading ? size + 3 : size, font: ln.heading ? bold : font, color: L.rgb(0.09, 0.09, 0.06), maxWidth: maxW });
      y -= lh;
    });
    return { bytes: await doc.save(), pages: doc.getPageCount() };
  };

  PDF.imagesToPdf = async function (imgs, opts) {
    var L = await PDF.library();
    var doc = await L.PDFDocument.create();
    var sizes = { a4: [595.28, 841.89], letter: [612, 792] };
    var margin = opts.margin === undefined ? 24 : opts.margin;
    for (var i = 0; i < imgs.length; i++) {
      var bytes = new Uint8Array(imgs[i].bytes);
      var emb;
      try { emb = imgs[i].mime === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes); }
      catch (e) { emb = await doc.embedPng(bytes); }
      if (opts.page === 'fit') {
        var pg = doc.addPage([emb.width + margin * 2, emb.height + margin * 2]);
        pg.drawImage(emb, { x: margin, y: margin, width: emb.width, height: emb.height });
      } else {
        var dim = sizes[opts.page] || sizes.a4;
        var pg2 = doc.addPage(dim);
        var availW = dim[0] - margin * 2, availH = dim[1] - margin * 2;
        var s = Math.min(availW / emb.width, availH / emb.height, 1);
        var w = emb.width * s, h = emb.height * s;
        pg2.drawImage(emb, { x: (dim[0] - w) / 2, y: (dim[1] - h) / 2, width: w, height: h });
      }
    }
    return { bytes: await doc.save(), pages: doc.getPageCount() };
  };

  PDF.redactRaster = async function (bytes, terms) {
    var L = await PDF.library();
    var pdf = await PDF.view(bytes);
    var out = await L.PDFDocument.create();
    var lower = terms.map(function (t) { return t.toLowerCase(); });
    var hits = 0;
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var vp = page.getViewport({ scale: 2 });
      var cv = U.canvasOf(vp.width, vp.height), g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: g, viewport: vp }).promise;
      var tc = await page.getTextContent();
      g.fillStyle = '#000';
      tc.items.forEach(function (it) {
        if (!it.str) return;
        var s = it.str.toLowerCase();
        var hit = lower.some(function (t) { return s.indexOf(t) > -1; });
        if (!hit) return;
        hits++;
        var tr = it.transform, h = Math.abs(it.height || tr[3] || 10) * 2;
        var x = tr[4] * 2, y = cv.height - tr[5] * 2 - h;
        var wpx = (it.width || (it.str.length * (it.height || 8) * 0.5)) * 2;
        g.fillRect(x - 1, y - 1, wpx + 2, h + 2);
      });
      var jpg = await U.toBlob(cv, 'image/jpeg', 0.9);
      var emb = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      var base = page.getViewport({ scale: 1 });
      var pg = out.addPage([base.width, base.height]);
      pg.drawImage(emb, { x: 0, y: 0, width: base.width, height: base.height });
      page.cleanup();
    }
    return { bytes: await out.save(), hits: hits, pages: pdf.numPages };
  };

  C.can = function () { return true; };
  C.unique = function (a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); };
  C.loadPdfLib = PDF.library;
  C.loadPdfJs = PDF.viewer;

  window.PFCore = C;
})();
