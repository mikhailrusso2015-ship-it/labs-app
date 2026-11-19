/* LABS demo · motor: recomendaciones, dinero, estadísticas, alertas de la red, firma y sello */
(function () {
  const D = window.LABSDATA;

  /* ---------- Formato ---------- */
  const nfBs = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfUsd = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfInt = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 });
  function fmtUsd(v) { return '$ ' + nfUsd.format(v); }
  function fmtBs(v) { return 'Bs ' + nfBs.format(v); }
  function fmtInt(v) { return nfInt.format(v); }

  /* ---------- Tasas: cuatro formas de ver un precio ---------- */
  const MODES = [
    { id: 'usd', label: 'Dólares' },
    { id: 'bcv', label: 'Bs · BCV' },
    { id: 'usdt', label: 'Bs · USDT' },
    { id: 'manual', label: 'Bs · tasa propia' }
  ];
  function rateOf(mode, state) { if (mode === 'usd') return 1; if (mode === 'manual') return state.manualRate; return D.RATES[mode].value; }
  function money(usd, mode, state) { return mode === 'usd' ? fmtUsd(usd) : fmtBs(usd * rateOf(mode, state)); }

  /* ---------- Recomendaciones: reglas simples (pendientes de revisión médica) ---------- */
  // Niveles: normal, vigilar, alto, urgente
  const RULES = {
    glu: function (v) {
      if (v < 55) return ['urgente', 'Muy baja', 'Tu azúcar está muy baja. Come algo con azúcar ahora y ve hoy al médico.'];
      if (v < 70) return ['vigilar', 'Un poco baja', 'Tu azúcar está algo baja. Come a tus horas y no te saltes comidas. Coméntalo con tu médico.'];
      if (v < 100) return ['normal', 'Normal', 'Tu azúcar está en el margen normal. Mantén tu rutina de comidas y de movimiento.'];
      if (v < 126) return ['vigilar', 'Un poco alta', 'Baja los dulces y las bebidas azucaradas. Camina 30 minutos casi todos los días y repite el examen en 3 meses.'];
      if (v < 250) return ['alto', 'Alta', 'Tu azúcar está alta. Pide cita con tu médico esta semana y deja los dulces y los refrescos.'];
      return ['urgente', 'Muy alta', 'Tu azúcar está muy alta. Ve hoy al médico.'];
    },
    col: function (v) {
      if (v < 200) return ['normal', 'Normal', 'Tu colesterol está en el margen normal. Sigue comiendo con poca grasa.'];
      if (v < 240) return ['vigilar', 'Un poco alto', 'Come menos frituras, embutidos y quesos grasos. Suma verduras, frutas y avena.'];
      return ['alto', 'Alto', 'Tu colesterol está alto. Evita las frituras y pide cita con tu médico.'];
    },
    hdl: function (v) {
      if (v >= 40) return ['normal', 'Normal', 'Tu colesterol “bueno” está bien. El ejercicio lo ayuda a mantenerse.'];
      return ['vigilar', 'Un poco bajo', 'Tu colesterol “bueno” está bajo. Camina o haz ejercicio a diario y baja las grasas fritas.'];
    },
    ldl: function (v) {
      if (v < 130) return ['normal', 'Normal', 'Tu colesterol “malo” está bien.'];
      if (v < 160) return ['vigilar', 'Un poco alto', 'Tu colesterol “malo” está algo alto. Baja las frituras y las grasas de origen animal.'];
      return ['alto', 'Alto', 'Tu colesterol “malo” está alto. Pide cita con tu médico y evita las frituras.'];
    },
    tri: function (v) {
      if (v < 150) return ['normal', 'Normal', 'Tus grasas en la sangre están en el margen. Cuida los dulces y el alcohol.'];
      if (v < 200) return ['vigilar', 'Un poco altos', 'Baja los dulces, el pan blanco y el alcohol. Camina a diario.'];
      if (v < 500) return ['alto', 'Altos', 'Tus triglicéridos están altos. Evita dulces, alcohol y frituras, y pide cita con tu médico.'];
      return ['urgente', 'Muy altos', 'Tus triglicéridos están muy altos. Ve hoy al médico.'];
    },
    ure: function (v) {
      if (v < 15) return ['vigilar', 'Un poco baja', 'Tu urea está algo baja. Coméntalo con tu médico, sin prisa.'];
      if (v <= 45) return ['normal', 'Normal', 'Tu urea está en el margen normal. Toma suficiente agua.'];
      if (v <= 100) return ['alto', 'Alta', 'Tu urea está alta. Toma agua y pide cita con tu médico esta semana.'];
      return ['urgente', 'Muy alta', 'Tu urea está muy alta. Ve hoy al médico.'];
    },
    cre: function (v) {
      if (v < 0.6) return ['vigilar', 'Un poco baja', 'Tu creatinina está algo baja. Coméntalo con tu médico, sin prisa.'];
      if (v <= 1.3) return ['normal', 'Normal', 'Tu creatinina está en el margen normal. Toma suficiente agua.'];
      if (v <= 3) return ['alto', 'Alta', 'Tu creatinina está alta, y eso puede tener que ver con el riñón. Pide cita con tu médico esta semana y toma agua.'];
      return ['urgente', 'Muy alta', 'Tu creatinina está muy alta. Ve hoy al médico.'];
    },
    hem: function (v) {
      if (v < 7) return ['urgente', 'Muy baja', 'Tu hemoglobina está muy baja. Ve hoy al médico.'];
      if (v < 12) return ['alto', 'Baja', 'Tu hemoglobina está baja. Come carnes, lentejas y verduras verdes, y pide cita con tu médico.'];
      if (v <= 16) return ['normal', 'Normal', 'Tu hemoglobina está en el margen normal.'];
      return ['vigilar', 'Un poco alta', 'Tu hemoglobina está algo alta. Toma agua y coméntalo con tu médico.'];
    },
    plq: function (v) {
      if (v < 50) return ['urgente', 'Muy bajas', 'Tus plaquetas están muy bajas. Ve hoy al médico o a emergencias.'];
      if (v < 100) return ['alto', 'Bajas', 'Tus plaquetas están bajas. Ve hoy a tu médico: con fiebre, puede ser importante.'];
      if (v < 150) return ['vigilar', 'Un poco bajas', 'Tus plaquetas están algo bajas. Coméntalo con tu médico.'];
      if (v <= 450) return ['normal', 'Normales', 'Tus plaquetas están en el margen normal.'];
      return ['vigilar', 'Un poco altas', 'Tus plaquetas están algo altas. Coméntalo con tu médico.'];
    },
    tsh: function (v) {
      if (v < 0.4) return ['vigilar', 'Un poco baja', 'Coméntalo con tu médico. Es mejor que él mire tu tiroides.'];
      if (v <= 4) return ['normal', 'Normal', 'Tu tiroides está en el margen normal.'];
      return ['alto', 'Alta', 'Tu TSH está alta. Pide cita con tu médico.'];
    }
  };
  const LEVEL_ORDER = { normal: 0, vigilar: 1, alto: 2, urgente: 3 };
  function genericRule(c, v) {
    const tip = 'Este valor está fuera del margen normal. Coméntalo con tu médico: solo él puede decir qué significa.';
    const lo = c.kind === 'max' ? null : c.lo, hi = c.kind === 'min' ? null : c.hi;
    if (hi !== null && hi !== undefined && v > hi) { const d = (v - hi) / hi; return d <= 0.15 ? ['vigilar', 'Un poco alto', tip] : d <= 0.6 ? ['alto', 'Alto', tip] : ['urgente', 'Muy alto', 'Este valor está muy fuera del margen. Ve hoy al médico.']; }
    if (lo !== null && lo !== undefined && v < lo) { const d = (lo - v) / lo; return d <= 0.15 ? ['vigilar', 'Un poco bajo', tip] : d <= 0.5 ? ['alto', 'Bajo', tip] : ['urgente', 'Muy bajo', 'Este valor está muy fuera del margen. Ve hoy al médico.']; }
    return ['normal', 'Normal', 'Este valor está en el margen normal.'];
  }
  function judge(item) {
    const c = D.BY_ID[item.id]; const r = RULES[item.id] ? RULES[item.id](item.v) : genericRule(c, item.v);
    return { id: item.id, name: c.name, unit: c.unit, v: item.v, c: c, level: r[0], label: r[1], tip: r[2] };
  }
  function summarize(values) {
    const rows = values.map(judge);
    let worst = 'normal'; rows.forEach(function (r) { if (LEVEL_ORDER[r.level] > LEVEL_ORDER[worst]) worst = r.level; });
    const tips = []; rows.filter(function (r) { return r.level !== 'normal'; }).sort(function (a, b) { return LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]; }).forEach(function (r) { tips.push(r); });
    const lead = worst === 'urgente' ? 'Hay un valor muy fuera del margen. Ve hoy al médico.' : worst === 'alto' ? 'Hay valores altos. Pide cita con tu médico esta semana.' : worst === 'vigilar' ? 'Hay valores para vigilar. Llévale este resultado a tu médico.' : 'Todo está en el margen normal. Sigue cuidándote.';
    return { rows: rows, worst: worst, tips: tips, lead: lead, normal: rows.filter(function (r) { return r.level === 'normal'; }).length, watch: rows.filter(function (r) { return r.level !== 'normal'; }).length };
  }

  /* ---------- Estadísticas del laboratorio ---------- */
  const PERIODS = [
    { id: 'day', label: 'Hoy', days: 1 }, { id: 'week', label: 'Semana', days: 7 }, { id: 'month', label: 'Mes', days: 30 },
    { id: 'quarter', label: 'Trimestre', days: 90 }, { id: 'semester', label: 'Semestre', days: 180 }, { id: 'year', label: 'Año', days: 365 }
  ];
  function inWindow(o, fromBack, toBack) { const back = Math.round((D.TODAY - o.date) / 864e5); return back >= fromBack && back < toBack; }
  function periodStats(days, offset) {
    offset = offset || 0; let n = 0, usd = 0, cost = 0, pending = 0, bs = 0;
    D.ORDERS.forEach(function (o) { if (inWindow(o, offset, offset + days)) { n++; usd += o.usd; cost += o.cost; bs += o.usd * o.rate; if (!o.paid) pending += o.usd; } });
    return { n: n, usd: usd, cost: cost, margin: usd - cost, pending: pending, bs: bs };
  }
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function monthly() {
    const map = {}; const order = [];
    D.ORDERS.forEach(function (o) {
      const key = o.date.getFullYear() * 100 + o.date.getMonth();
      if (!map[key]) { map[key] = { key: key, label: MONTHS[o.date.getMonth()], n: 0, usd: 0, cost: 0 }; order.push(key); }
      map[key].n++; map[key].usd += o.usd; map[key].cost += o.cost;
    });
    order.sort(); const arr = order.map(function (k) { return map[k]; });
    return arr.slice(-12);
  }
  function topExams(days) {
    const m = {}; D.ORDERS.forEach(function (o) { if (inWindow(o, 0, days)) { m[o.exam] = (m[o.exam] || 0) + 1; } });
    return Object.keys(m).map(function (k) { return { id: k, name: D.BY_ID[k].name, n: m[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }
  // Mapa de calor edad x examen (últimos 365 días). Los grupos con menos de 10 no se muestran.
  const MIN_CELL = 10;
  function ageMatrix() {
    const exams = ['glu', 'col', 'tri', 'ure', 'cre', 'hem', 'tsh', 'hemog'];
    const cells = {}; const totals = {}; const overall = {}; let all = 0;
    D.AGE_GROUPS.forEach(function (g) { totals[g] = 0; cells[g] = {}; });
    D.ORDERS.forEach(function (o) { totals[o.age]++; all++; cells[o.age][o.exam] = (cells[o.age][o.exam] || 0) + 1; overall[o.exam] = (overall[o.exam] || 0) + 1; });
    return { exams: exams, cells: cells, totals: totals, overall: overall, all: all };
  }
  function insights() {
    const M = ageMatrix(); const out = [];
    D.AGE_GROUPS.forEach(function (g) {
      const list = [];
      M.exams.forEach(function (e) {
        const n = M.cells[g][e] || 0; if (n < 30) return;
        const share = n / M.totals[g]; const base = (M.overall[e] || 0) / M.all; const lift = share / base;
        if (lift >= 1.5) list.push({ e: e, n: n, share: share, lift: lift });
      });
      list.sort(function (a, b) { return b.lift - a.lift; });
      if (list.length) {
        const top = list.slice(0, 2); const names = top.map(function (t) { return D.BY_ID[t.e].name.toLowerCase(); });
        const tenth = Math.round(top[0].share * 10);
        out.push({ group: g, text: 'Entre ' + g.replace('–', ' y ').replace('+', ' años o más') + (g.indexOf('+') < 0 ? ' años' : '') + ' piden mucho ' + names.join(' y ') + '. ' + (top[0].lift >= 2 ? 'Es más del doble que el resto.' : 'Es bastante más que el resto.'), n: top[0].n });
      }
    });
    return out;
  }

  /* ---------- Red: alertas de posibles brotes (ya agregadas) ---------- */
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function sd(a) { const m = mean(a); return Math.sqrt(mean(a.map(function (x) { return (x - m) * (x - m); }))); }
  function networkSignals() {
    return D.NETWORK.zones.map(function (z) {
      const base = z.counts.slice(0, 5); const last = z.counts[z.counts.length - 1]; const m = mean(base); const s = Math.max(sd(base), 1);
      const ratio = last / Math.max(m, 1); const zscore = (last - m) / s;
      let state = 'normal', why = 'Dentro de lo habitual.';
      if (z.labs < 3) { state = 'oculto'; why = 'Menos de 3 laboratorios aportan datos. Se oculta para proteger a los laboratorios y a las personas.'; }
      else if (zscore >= 3 && ratio >= 2 && last >= 15) { state = 'fuerte'; why = 'Subida clara y sostenida en ' + z.labs + ' laboratorios. Revisa y decide si se envía.'; }
      else if (zscore >= 2 && ratio >= 1.5) { state = 'vigilar'; why = 'Sube, pero todavía con pocos casos. Seguir de cerca.'; }
      return { zone: z.zone, labs: z.labs, counts: z.counts, last: last, base: m, ratio: ratio, state: state, why: why };
    });
  }
  function shown(n) { return n < MIN_CELL ? '<' + MIN_CELL : String(n); }

  /* ---------- Huella, QR de ejemplo ---------- */
  function hash(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function docCode(id, extra) { return 'LB-' + hash(id + '|' + (extra || '')).toString(16).toUpperCase().padStart(8, '0'); }
  function qrSvg(seedStr, size) {
    const n = 25; let s = hash(seedStr); const cells = [];
    function rnd() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }
    function finder(ox, oy) { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { const edge = x === 0 || y === 0 || x === 6 || y === 6; const core = x >= 2 && x <= 4 && y >= 2 && y <= 4; if (edge || core) cells.push([ox + x, oy + y]); } }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); if (!inF && rnd() < 0.48) cells.push([x, y]); }
    const cs = size / n; let out = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Código QR de verificación de ejemplo"><rect width="' + size + '" height="' + size + '" fill="#fff"/>';
    cells.forEach(function (c) { out += '<rect x="' + (c[0] * cs).toFixed(2) + '" y="' + (c[1] * cs).toFixed(2) + '" width="' + (cs + 0.4).toFixed(2) + '" height="' + (cs + 0.4).toFixed(2) + '" fill="#14193A"/>'; });
    return out + '</svg>';
  }

  /* ---------- Firma y sello: de la foto a imágenes con fondo transparente ---------- */
  function loadImageFromFile(file, maxDim) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = function () { const k = Math.min(1, maxDim / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('No se pudo abrir la imagen')); };
      img.src = url;
    });
  }
  // Papel local: percentil alto de cada canal por bloque, interpolado
  function paperMap(data, w, h) {
    const B = 24, bw = Math.ceil(w / B), bh = Math.ceil(h / B); const map = new Float32Array(bw * bh * 3);
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      for (let ch = 0; ch < 3; ch++) {
        const hist = new Uint16Array(256); let cnt = 0;
        for (let y = by * B; y < Math.min(h, by * B + B); y += 2) for (let x = bx * B; x < Math.min(w, bx * B + B); x += 2) { hist[data[(y * w + x) * 4 + ch]]++; cnt++; }
        let acc = 0, val = 255; const target = cnt * 0.85; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= target) { val = i; break; } }
        map[(by * bw + bx) * 3 + ch] = Math.max(val, 90);
      }
    }
    return { map: map, bw: bw, bh: bh, B: B };
  }
  function paperAt(pm, x, y, ch) {
    const fx = Math.min(pm.bw - 1, Math.max(0, x / pm.B - 0.5)), fy = Math.min(pm.bh - 1, Math.max(0, y / pm.B - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(pm.bw - 1, x0 + 1), y1 = Math.min(pm.bh - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    function g(xx, yy) { return pm.map[(yy * pm.bw + xx) * 3 + ch]; }
    return (g(x0, y0) * (1 - tx) + g(x1, y0) * tx) * (1 - ty) + (g(x0, y1) * (1 - tx) + g(x1, y1) * tx) * ty;
  }
  function inkAlpha(data, i, pm, x, y) {
    const r = data[i] / paperAt(pm, x, y, 0), g = data[i + 1] / paperAt(pm, x, y, 1), b = data[i + 2] / paperAt(pm, x, y, 2);
    const a = 1 - Math.min(1, Math.min(r, g, b)); return a;
  }
  function detectParts(canvas) {
    const w = canvas.width, h = canvas.height; const ctx = canvas.getContext('2d'); const img = ctx.getImageData(0, 0, w, h); const data = img.data; const pm = paperMap(data, w, h);
    const alpha = new Float32Array(w * h); const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = inkAlpha(data, (y * w + x) * 4, pm, x, y); alpha[y * w + x] = a; mask[y * w + x] = a > 0.3 ? 1 : 0; }
    const C = 10, cw = Math.ceil(w / C), ch = Math.ceil(h / C); const cell = new Uint8Array(cw * ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) cell[((y / C) | 0) * cw + ((x / C) | 0)]++;
    const on = new Uint8Array(cw * ch); for (let i = 0; i < on.length; i++) on[i] = cell[i] >= 3 ? 1 : 0;
    const R = 3; const dil = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (on[y * cw + x]) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < ch && xx >= 0 && xx < cw) dil[yy * cw + xx] = 1; }
    const lab = new Int32Array(cw * ch).fill(-1); const comps = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      if (!dil[y * cw + x] || lab[y * cw + x] !== -1) continue;
      const id = comps.length; const q = [[x, y]]; lab[y * cw + x] = id; const comp = { x0: x, y0: y, x1: x, y1: y };
      while (q.length) { const p = q.pop(); const px = p[0], py = p[1]; if (on[py * cw + px]) { comp.x0 = Math.min(comp.x0, px); comp.x1 = Math.max(comp.x1, px); comp.y0 = Math.min(comp.y0, py); comp.y1 = Math.max(comp.y1, py); }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { const nx = px + d[0], ny = py + d[1]; if (nx >= 0 && nx < cw && ny >= 0 && ny < ch && dil[ny * cw + nx] && lab[ny * cw + nx] === -1) { lab[ny * cw + nx] = id; q.push([nx, ny]); } }); }
      comps.push(comp);
    }
    const found = [];
    comps.forEach(function (c) {
      const x0 = c.x0 * C, y0 = c.y0 * C, x1 = Math.min(w, (c.x1 + 1) * C), y1 = Math.min(h, (c.y1 + 1) * C); const bw = x1 - x0, bh = y1 - y0; let ink = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) ink += mask[y * w + x];
      if (bw < 40 || bh < 20 || ink < w * h * 0.0006) return;
      const aspect = Math.min(bw, bh) / Math.max(bw, bh); const density = ink / (bw * bh);
      found.push({ x0: x0, y0: y0, w: bw, h: bh, ink: ink, area: bw * bh, score: aspect * 0.65 + Math.min(1, density * 2.2) * 0.35 });
    });
    found.sort(function (a, b) { return b.area - a.area; });
    const top = found.slice(0, 2);
    let stamp = null, sign = null;
    if (top.length === 2) { top.sort(function (a, b) { return b.score - a.score; }); stamp = top[0]; sign = top[1]; }
    else if (top.length === 1) { const t = top[0]; if (t.score > 0.6) stamp = t; else sign = t; }
    return { w: w, h: h, data: data, pm: pm, stamp: stamp, sign: sign };
  }
  function cropTransparent(res, part) {
    if (!part) return null; const pad = 8; const x0 = Math.max(0, part.x0 - pad), y0 = Math.max(0, part.y0 - pad); const x1 = Math.min(res.w, part.x0 + part.w + pad), y1 = Math.min(res.h, part.y0 + part.h + pad);
    const cw = x1 - x0, chh = y1 - y0; const c = document.createElement('canvas'); c.width = cw; c.height = chh; const cx = c.getContext('2d'); const out = cx.createImageData(cw, chh);
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
      const gx = x0 + x, gy = y0 + y, i = (gy * res.w + gx) * 4, o = (y * cw + x) * 4;
      const pr = paperAt(res.pm, gx, gy, 0), pg = paperAt(res.pm, gx, gy, 1), pb = paperAt(res.pm, gx, gy, 2);
      const r = res.data[i] / pr, g = res.data[i + 1] / pg, b = res.data[i + 2] / pb;
      let a = 1 - Math.min(1, Math.min(r, g, b)); a = Math.max(0, Math.min(1, (a - 0.1) / 0.55));
      if (a <= 0.01) { out.data[o + 3] = 0; continue; }
      // Quitar el papel del color: c = (obs - papel*(1-a)) / a
      const cr = Math.max(0, Math.min(255, (res.data[i] - pr * (1 - a)) / a)), cg = Math.max(0, Math.min(255, (res.data[i + 1] - pg * (1 - a)) / a)), cb = Math.max(0, Math.min(255, (res.data[i + 2] - pb * (1 - a)) / a));
      out.data[o] = cr; out.data[o + 1] = cg; out.data[o + 2] = cb; out.data[o + 3] = Math.round(a * 255);
    }
    cx.putImageData(out, 0, 0); return c;
  }
  function boxesOverlay(canvas, res) {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; const cx = c.getContext('2d'); cx.drawImage(canvas, 0, 0); cx.lineWidth = Math.max(3, canvas.width / 260); cx.font = '600 ' + Math.max(16, canvas.width / 45) + 'px Poppins, sans-serif';
    function box(p, color, label) { if (!p) return; cx.strokeStyle = color; cx.fillStyle = color; cx.strokeRect(p.x0, p.y0, p.w, p.h); cx.fillText(label, p.x0 + 4, Math.max(18, p.y0 - 8)); }
    box(res.sign, '#3F51C9', 'Firma'); box(res.stamp, '#B45309', 'Sello'); return c;
  }
  function extract(canvas) { const res = detectParts(canvas); return { res: res, sign: cropTransparent(res, res.sign), stamp: cropTransparent(res, res.stamp), overlay: boxesOverlay(canvas, res) }; }

  // Hoja de ejemplo para probar sin subir nada: papel con sombra, firma a mano y sello redondo
  function sampleSheet() {
    const w = 1000, h = 680; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#f7f5ef'); bg.addColorStop(1, '#e4e1d8'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    let s = 7; function r() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(80,70,50,' + (r() * 0.05).toFixed(3) + ')'; g.fillRect(r() * w, r() * h, 2, 2); }
    // firma
    g.save(); g.translate(120, 380); g.strokeStyle = '#1b2a66'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(30, -60, 60, 120, 90, 10); g.bezierCurveTo(110, -40, 130, 90, 160, 30); g.bezierCurveTo(190, -20, 210, 80, 250, 40); g.bezierCurveTo(300, 0, 330, 60, 380, 20); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(10, 100); g.bezierCurveTo(120, 80, 260, 120, 400, 70); g.stroke(); g.restore();
    // sello
    g.save(); g.translate(720, 330); g.rotate(-0.12); const ink = '#4b2e9c'; g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 130, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 70, 0, 7); g.stroke();
    g.font = '700 21px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const t = 'LABORATORIO EJEMPLO · BIOANÁLISIS · '; const rad = 94;
    for (let i = 0; i < t.length; i++) { const a = (i / t.length) * Math.PI * 2 - Math.PI / 2; g.save(); g.rotate(a); g.translate(0, -rad); g.fillText(t[i], 0, 0); g.restore(); }
    g.font = '700 17px Poppins, sans-serif'; g.fillText('Lic. [NOMBRE]', 0, -10); g.font = '500 15px Poppins, sans-serif'; g.fillText('N.º [______]', 0, 16); g.restore();
    // desgaste del sello
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(240,238,230,' + (0.5 + r() * 0.4).toFixed(2) + ')'; g.beginPath(); g.arc(590 + r() * 260, 200 + r() * 260, r() * 2.2, 0, 7); g.fill(); }
    // sombra de foto
    const sh = g.createRadialGradient(w * 0.2, h * 0.1, 50, w * 0.5, h * 0.5, w * 0.8); sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0.16)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    return c;
  }
  // Imágenes de ejemplo ya listas (se usan al abrir el demo)
  function defaultMarks() { const e = extract(sampleSheet()); return { sign: e.sign, stamp: e.stamp, overlay: e.overlay, source: sampleSheet() }; }

  window.LABS = { fmtUsd: fmtUsd, fmtBs: fmtBs, fmtInt: fmtInt, MODES: MODES, rateOf: rateOf, money: money, judge: judge, summarize: summarize, LEVEL_ORDER: LEVEL_ORDER, PERIODS: PERIODS, periodStats: periodStats, monthly: monthly, topExams: topExams, ageMatrix: ageMatrix, insights: insights, networkSignals: networkSignals, shown: shown, MIN_CELL: MIN_CELL, docCode: docCode, qrSvg: qrSvg, loadImageFromFile: loadImageFromFile, extract: extract, sampleSheet: sampleSheet, defaultMarks: defaultMarks };
})();
