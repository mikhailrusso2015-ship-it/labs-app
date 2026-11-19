/* LABS demo · interfaz: base y panel del laboratorio */
(function () {
  const L = window.LABS, D = window.LABSDATA;
  const S = {
    role: 'lab', lab: 'resumen', pat: 'lista', doc: 'lista', adm: 'resumen',
    mode: 'usd', manualRate: 940, period: 'month',
    marks: null, signUrl: '', stampUrl: '', overlayUrl: '', srcUrl: '', swapped: false, owner: false, saved: true, extractMsg: '',
    resIdx: null, docSel: 0, sendScenario: 'alto', sendChecks: { review: false, call: false, code: '' },
    labs: D.LABS.map(function (x) { return Object.assign({}, x); }), audit: D.AUDIT_SEED.slice(), approved: {}, rejected: {}, resets: [],
    modal: null, toast: '', perm: { l1: true, l3: false, l2req: null }, demoSecurity: { pin: true, notify: true, discrete: false },
    newLab: { name: '', city: '', plan: 'Plan único' }, resetType: 'Laboratorio', resetWho: 0
  };
  window.S = S;
  const CAT = D.CATALOG;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function chipFor(level, label) { const c = level === 'normal' ? 'ok' : level === 'urgente' ? 'crit' : 'warn'; return '<span class="chip ' + c + '">' + (level === 'urgente' ? '! ' : '') + esc(label) + '</span>'; }
  function nowTime() { const d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function logAudit(who, what) { S.audit.unshift({ when: 'Hoy ' + nowTime(), who: who, what: what }); }
  function toast(msg) { S.toast = msg; render(true); clearTimeout(toast.t); toast.t = setTimeout(function () { S.toast = ''; const h = document.getElementById('toast-host'); if (h) h.innerHTML = ''; }, 4200); }

  /* ---------- Gráficas ---------- */
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1)))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function barPairs(series, aKey, bKey, aLabel, bLabel) {
    const W = 640, H = 240, pl = 48, pr = 10, pt = 14, pb = 30; const max = niceMax(Math.max.apply(null, series.map(function (s) { return Math.max(s[aKey], s[bKey]); })));
    const cw = (W - pl - pr) / series.length; let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Ventas y costos por mes, en dólares">';
    for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * (1 - i / 4); svg += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(70,80,160,0.16)"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" font-size="11" text-anchor="end" fill="#3A4470">' + L.fmtInt(max * i / 4) + '</text>'; }
    series.forEach(function (s, i) {
      const x = pl + i * cw; const bw = Math.min(16, cw * 0.32); const ha = (H - pt - pb) * s[aKey] / max, hb = (H - pt - pb) * s[bKey] / max;
      svg += '<rect x="' + (x + cw / 2 - bw - 1) + '" y="' + (H - pb - ha) + '" width="' + bw + '" height="' + ha + '" rx="4" fill="#4C5FD5"><title>' + s.label + ' · ' + aLabel + ': ' + L.fmtUsd(s[aKey]) + '</title></rect>';
      svg += '<rect x="' + (x + cw / 2 + 1) + '" y="' + (H - pb - hb) + '" width="' + bw + '" height="' + hb + '" rx="4" fill="#9AA5DA"><title>' + s.label + ' · ' + bLabel + ': ' + L.fmtUsd(s[bKey]) + '</title></rect>';
      svg += '<text x="' + (x + cw / 2) + '" y="' + (H - 10) + '" font-size="11" text-anchor="middle" fill="#3A4470">' + s.label + '</text>';
    });
    return svg + '</svg><div class="legend"><span><i style="background:#4C5FD5"></i>' + aLabel + '</span><span><i style="background:#9AA5DA"></i>' + bLabel + '</span></div>';
  }
  function hbars(list, max, fmt) {
    return list.map(function (r) { return '<div style="display:grid;grid-template-columns:minmax(110px,1.1fr) 3fr auto;gap:10px;align-items:center"><span class="small">' + esc(r.name) + '</span><div class="bar" role="img" aria-label="' + esc(r.name) + ': ' + fmt(r.n) + '"><i style="width:' + Math.max(2, r.n / max * 100) + '%"></i></div><b class="small">' + fmt(r.n) + '</b></div>'; }).join('');
  }
  // Línea con franja de zona normal. points: [{m,v}], lo/hi pueden faltar.
  function lineBand(points, lo, hi, unit) {
    const W = 520, H = 190, pl = 40, pr = 16, pt = 22, pb = 28; const vals = points.map(function (p) { return p.v; }).concat([lo || points[0].v, hi || points[0].v]);
    const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals); const pad = (mx - mn) * 0.25 || 5; const y0 = mn - pad, y1 = mx + pad;
    function Y(v) { return pt + (H - pt - pb) * (1 - (v - y0) / (y1 - y0)); } function X(i) { return pl + 28 + (W - pl - pr - 56) * (points.length === 1 ? 0.5 : i / (points.length - 1)); }
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:560px" role="img" aria-label="Historial. ' + points.map(function (p) { return p.m + ': ' + p.v; }).join(', ') + (lo !== undefined && hi !== undefined ? '. Zona normal: ' + lo + ' a ' + hi : '') + '">';
    if (lo !== undefined && hi !== undefined) svg += '<rect x="' + pl + '" y="' + Y(hi) + '" width="' + (W - pl - pr) + '" height="' + (Y(lo) - Y(hi)) + '" rx="8" fill="rgba(76,95,213,0.2)"/><text x="' + (pl - 6) + '" y="' + (Y(hi) + 4) + '" font-size="11" text-anchor="end" fill="#2F3E9E">' + hi + '</text><text x="' + (pl - 6) + '" y="' + (Y(lo) + 4) + '" font-size="11" text-anchor="end" fill="#2F3E9E">' + lo + '</text><text x="' + (W - pr - 6) + '" y="' + (Y(lo) - 6) + '" font-size="11" font-weight="600" text-anchor="end" fill="#2F3E9E">Zona normal</text>';
    svg += '<polyline points="' + points.map(function (p, i) { return X(i) + ',' + Y(p.v); }).join(' ') + '" fill="none" stroke="#4C5FD5" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    points.forEach(function (p, i) { const out = hi !== undefined && p.v > hi || lo !== undefined && p.v < lo; svg += '<circle cx="' + X(i) + '" cy="' + Y(p.v) + '" r="7" fill="' + (out ? '#B45309' : '#4C5FD5') + '" stroke="#fff" stroke-width="2"/><text x="' + X(i) + '" y="' + (Y(p.v) - 12) + '" font-size="12" font-weight="600" text-anchor="middle" fill="#14193A">' + p.v + '</text><text x="' + X(i) + '" y="' + (H - 8) + '" font-size="11" text-anchor="middle" fill="#3A4470">' + p.m + '</text>'; });
    return svg + '</svg>';
  }
  function spark(counts, color) {
    const W = 140, H = 36, mx = Math.max.apply(null, counts), mn = 0; const pts = counts.map(function (v, i) { return (4 + (W - 8) * i / (counts.length - 1)) + ',' + (H - 4 - (H - 8) * (v - mn) / (mx - mn || 1)); }).join(' ');
    const last = pts.split(' ').pop().split(',');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" width="140" height="36" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="' + color + '" stroke="#fff" stroke-width="2"/></svg>';
  }
  // Barra con zona normal para un valor
  function rangeBar(c, v, level) {
    let min, max, z0, z1;
    if (c.kind === 'range') { min = Math.max(0, c.lo * 0.5); max = c.hi * 1.7; z0 = c.lo; z1 = c.hi; } else if (c.kind === 'max') { min = 0; max = c.hi * 1.7; z0 = 0; z1 = c.hi; } else { min = 0; max = c.lo * 2.4; z0 = c.lo; z1 = max; }
    function P(x) { return Math.max(3, Math.min(97, (x - min) / (max - min) * 100)); }
    const color = level === 'normal' ? '#4C5FD5' : level === 'urgente' ? '#B3261E' : '#B45309'; let t = '';
    if (c.kind !== 'min' || true) { if (z0 > min) t += '<span class="tick" style="left:' + P(z0) + '%">' + z0 + '</span>'; if (z1 < max) t += '<span class="tick" style="left:' + P(z1) + '%">' + z1 + '</span>'; }
    return '<div class="rbar" role="img" aria-label="Tu valor ' + v + ' ' + c.unit + '. Zona normal: ' + (c.kind === 'range' ? c.lo + ' a ' + c.hi : c.kind === 'max' ? 'menos de ' + c.hi : 'más de ' + c.lo) + '"><div class="zone" style="left:' + P(z0) + '%;width:' + (P(z1) - P(z0)) + '%"></div>' + t + '<span class="dot" style="left:' + P(v) + '%;background:' + color + '"></span></div>';
  }
  function normalText(c) { return c.kind === 'range' ? c.lo + ' a ' + c.hi : c.kind === 'max' ? 'menos de ' + c.hi : c.kind === 'min' ? 'más de ' + c.lo : '—'; }

  /* ---------- Hoja de resultado firmada ---------- */
  function extraSheet(r) {
    let h = '';
    if (r.texts) Object.keys(r.texts).forEach(function (k) { h += '<div><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + ':</b> ' + esc(r.texts[k]) + '</div>'; });
    if (r.pos) Object.keys(r.pos).forEach(function (k) { const x = r.pos[k]; h += '<div><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + ':</b> ' + esc(x.res) + (x.detail ? ' · ' + esc(x.detail) : '') + '</div>'; });
    if (r.cult) Object.keys(r.cult).forEach(function (k) { const x = r.cult[k]; h += '<div style="border-top:1px solid #C9CFEA;padding-top:8px"><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + ':</b> ' + (x.none ? 'Sin desarrollo de bacterias' : esc(x.org) + '<table style="margin-top:4px"><tbody>' + x.rows.map(function (a) { return '<tr><td style="padding-right:12px">' + esc(a.ab) + '</td><td>' + ({ S: 'Sensible', I: 'Intermedio', R: 'Resistente' })[a.r] + '</td></tr>'; }).join('') + '</tbody></table>') + '</div>'; });
    if (r.reports) Object.keys(r.reports).forEach(function (k) { const x = r.reports[k]; h += '<div style="border-top:1px solid #C9CFEA;padding-top:8px"><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + '</b><div><b>Hallazgos:</b> ' + esc(x.hallazgos) + '</div><div><b>Conclusión:</b> ' + esc(x.conclusion) + '</div>' + (x.img ? '<img src="' + x.img + '" alt="Imagen adjunta del estudio" style="max-width:220px;max-height:160px;border-radius:6px;margin-top:6px">' : '') + '<div class="small" style="font-size:12px">Interpretó: ' + esc(x.by || 'Especialista') + '</div></div>'; });
    return h;
  }
  function sheetHtml(r, withSeal) {
    const sum = L.summarize(r.values); const code = L.docCode(r.id, r.date);
    const rows = sum.rows.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td><b>' + x.v + '</b></td><td>' + esc(x.unit) + '</td><td>' + normalText(x.c) + '</td><td>' + (x.level === 'normal' ? 'Normal' : esc(x.label)) + '</td></tr>'; }).join('');
    const sig = withSeal && S.signUrl ? '<img class="sign" src="' + S.signUrl + '" alt="Firma del bioanalista" style="left:0;top:34px;max-width:150px;max-height:70px">' : '';
    const stp = withSeal && S.stampUrl ? '<img class="stamp" src="' + S.stampUrl + '" alt="Sello del laboratorio" style="left:120px;top:-6px;max-width:120px;max-height:120px;mix-blend-mode:multiply">' : '';
    return '<div class="row between sheetbar"><span class="small muted">Hoja tamaño carta</span><button class="btn ghost sm" type="button" data-a="pz">' + (S.pz === 'big' ? 'Ver hoja completa' : 'Acercar') + '</button></div><div class="paper-fit"><div class="sheet" id="sheet"><div class="row between style="border-bottom:2px solid #14193A;padding-bottom:10px"><div><b style="font-size:17px">' + esc(r.lab) + '</b><div>RIF [J-00000000-0] · Valencia, Carabobo</div></div><div style="text-align:right"><b>Resultado de laboratorio</b><div>Orden ' + esc(r.id) + '</div></div></div>' +
      '<div class="row between"><div><b>Paciente:</b> ' + esc(r.patient) + ' · ' + esc(r.ci) + '</div><div><b>Edad:</b> ' + r.age + ' · <b>Sexo:</b> ' + r.sex + ' · <b>Fecha:</b> ' + esc(r.date) + '</div></div>' +
      '<h3 style="margin-top:4px">' + esc(r.title) + '</h3><table><thead><tr><th>Examen</th><th>Resultado</th><th>Unidad</th><th>Margen normal</th><th>Estado</th></tr></thead><tbody>' + rows + '</tbody></table>' + extraSheet(r) +
      '<div class="foot"><div><div class="sig">' + sig + stp + '</div><div style="border-top:1px solid #14193A;padding-top:4px;width:250px">Lic. [NOMBRE DEL BIOANALISTA]<br>Bioanalista · N.º [______]</div></div>' +
      '<div style="text-align:center">' + L.qrSvg(code, 92) + '<div style="font-size:11px">' + code + '</div><div style="font-size:11px">QR de verificación (ejemplo)</div></div></div>' +
      '<p style="font-size:11px;color:#3A4470">Validación electrónica de LABS, verificable con el código QR. Copia informativa: el laboratorio conserva el original. No es factura fiscal. Estos valores no reemplazan la opinión de un médico.</p></div></div>';
  }

  /* ---------- Piezas comunes ---------- */
  function modeSelect() {
    return '<div class="seg" role="group" aria-label="Moneda para ver los precios">' + L.MODES.map(function (m) { return '<button type="button" data-a="mode" data-v="' + m.id + '" aria-pressed="' + (S.mode === m.id) + '">' + m.label + '</button>'; }).join('') + '</div>';
  }
  function rateNote() {
    if (S.mode === 'usd') return 'Precios en dólares. Cada orden guarda el precio en dólares y la tasa del momento.';
    if (S.mode === 'manual') return 'Tasa propia: ' + L.fmtBs(S.manualRate) + ' por dólar. La escribes tú y solo el dueño puede cambiarla.';
    const r = D.RATES[S.mode]; return r.label + ': ' + L.fmtBs(r.value) + '. ' + r.note + '. En la versión real se muestra la hora de la última actualización.';
  }
  function side(items, cur, who, sub) {
    return '<nav class="side" aria-label="Menú"><div class="who"><b>' + esc(who) + '</b><small>' + esc(sub) + '</small></div>' + items.map(function (i) { if (i.sep) return '<div class="sep">' + esc(i.sep) + '</div>'; return '<button type="button" data-a="nav" data-v="' + i.id + '"' + (cur === i.id ? ' aria-current="page"' : '') + '>' + i.label + (i.badge ? '<span class="badge">' + i.badge + '</span>' : '') + '</button>'; }).join('') + '</nav>';
  }

  /* ---------- Laboratorio ---------- */
  const LAB_NAV = [
    { id: 'resumen', label: 'Resumen' }, { id: 'enviar', label: 'Enviar resultado' }, { id: 'catalogo', label: 'Exámenes y precios' },
    { id: 'reportes', label: 'Reportes' }, { id: 'red', label: 'Red de laboratorios' }, { id: 'firma', label: 'Firma y sello' }, { id: 'equipo', label: 'Mi equipo' }
  ];
  function pct(a, b) { if (!b) return null; return Math.round((a - b) / b * 100); }
  function delta(a, b, goodUp) { const p = pct(a, b); if (p === null) return ''; const up = p >= 0; return '<span class="delta ' + ((up === goodUp) ? 'up' : 'down') + '">' + (up ? '▲ ' : '▼ ') + Math.abs(p) + '% frente al período anterior</span>'; }
  function labResumen() {
    const p = L.PERIODS.find(function (x) { return x.id === S.period; }); const cur = L.periodStats(p.days, 0), prev = L.periodStats(p.days, p.days);
    const mo = L.monthly(); const best = mo.slice().sort(function (a, b) { return b.usd - a.usd; })[0], worst = mo.slice(0, -1).sort(function (a, b) { return a.usd - b.usd; })[0];
    const top = L.topExams(p.days).slice(0, 6); const tmax = top.length ? top[0].n : 1;
    const marginPct = cur.usd ? Math.round(cur.margin / cur.usd * 100) : 0;
    const recent = D.ORDERS.slice(-7).reverse();
    return '<div class="head"><div><h1>Resumen</h1><p>' + esc(S.labs[0].name) + ' · cifras de ejemplo</p></div><div class="seg" role="group" aria-label="Período">' + L.PERIODS.map(function (x) { return '<button type="button" data-a="period" data-v="' + x.id + '" aria-pressed="' + (S.period === x.id) + '">' + x.label + '</button>'; }).join('') + '</div></div>' +
      '<div class="grid">' +
      '<div class="card kpi"><small>Exámenes hechos</small><b>' + L.fmtInt(cur.n) + '</b>' + delta(cur.n, prev.n, true) + '</div>' +
      '<div class="card kpi"><small>Facturado</small><b>' + L.fmtUsd(cur.usd) + '</b><small>' + L.fmtBs(cur.bs) + ' a las tasas de cada día</small></div>' +
      '<div class="card kpi"><small>Ganancia estimada</small><b>' + L.fmtUsd(cur.margin) + '</b><small>' + marginPct + ' % de lo facturado · estimado con los costos cargados</small></div>' +
      '<div class="card kpi"><small>Por cobrar</small><b>' + L.fmtUsd(cur.pending) + '</b><small>Órdenes aún sin pago</small></div></div>' +
      '<div class="grid two"><div class="card"><h2>Ventas y costos por mes (dólares)</h2><p class="small muted">Siempre en dólares: el bolívar pierde valor y haría parecer que vendes más.</p>' + barPairs(mo, 'usd', 'cost', 'Ventas', 'Costos') +
      '<div class="row"><span class="chip ok">Mes más fuerte: ' + best.label + ' · ' + L.fmtUsd(best.usd) + '</span><span class="chip warn">Mes más flojo: ' + worst.label + ' · ' + L.fmtUsd(worst.usd) + '</span></div></div>' +
      '<div class="card"><h2>Exámenes más pedidos · ' + p.label.toLowerCase() + '</h2>' + (top.length ? hbars(top, tmax, L.fmtInt) : '<p class="muted">Todavía no hay órdenes en este período.</p>') + '</div></div>' +
      '<div class="card"><h2>Últimas órdenes</h2><div class="tw"><table><thead><tr><th>Examen</th><th>Edad</th><th>Precio</th><th>Tasa guardada (BCV)</th><th>Cobrado</th><th>Pago</th></tr></thead><tbody>' + recent.map(function (o) { return '<tr><td>' + esc(D.BY_ID[o.exam].name) + '</td><td>' + o.age + '</td><td>' + L.fmtUsd(o.usd) + '</td><td>Bs ' + o.rate.toFixed(2) + '</td><td>' + L.fmtBs(o.usd * o.rate) + '</td><td>' + (o.paid ? '<span class="chip ok">Pagado</span>' : '<span class="chip warn">Pendiente</span>') + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small muted">La tasa queda congelada en cada orden. Una venta de ayer no cambia si hoy sube el dólar.</p></div>';
  }

  function labCatalogo() {
    const ex = 100; const m = S.mode;
    return '<div class="head"><div><h1>Exámenes y precios</h1><p>Carga lo que ofreces. Los precios se guardan en dólares.</p></div>' + modeSelect() + '</div>' +
      '<div class="grid"><div class="card kpi"><small>Dólar BCV (ejemplo)</small><b>' + L.fmtBs(D.RATES.bcv.value) + '</b><small>Fuente oficial</small></div><div class="card kpi"><small>USDT (ejemplo)</small><b>' + L.fmtBs(D.RATES.usdt.value) + '</b><small>Mercado entre personas</small></div>' +
      '<div class="card kpi"><small>Tasa propia</small><label class="f"><span class="sr">Tasa propia en bolívares por dólar</span><input type="number" step="0.01" min="1" value="' + S.manualRate + '" data-c="manual"></label><small>Solo el dueño la cambia</small></div>' +
      '<div class="card kpi"><small>Diferencia USDT frente a BCV</small><b>' + Math.round((D.RATES.usdt.value / D.RATES.bcv.value - 1) * 100) + ' %</b><small>Se avisa si una fuente salta más de 10 % en un día</small></div></div>' +
      '<div class="card"><div class="row between"><h2>Catálogo</h2><span class="small muted">' + rateNote() + '</span></div><div class="tw"><table><thead><tr><th>Examen</th><th>Precio USD</th><th>Costo USD</th><th>Ganancia</th><th>Precio al público (' + L.MODES.find(function (x) { return x.id === m; }).label + ')</th><th>Margen normal</th><th>Quitar</th></tr></thead><tbody>' +
      CAT.map(function (c, i) { const g = c.price - c.cost; return '<tr><td>' + esc(c.name) + '</td><td><label class="f"><span class="sr">Precio de ' + esc(c.name) + '</span><input type="number" step="0.5" min="0" value="' + c.price + '" data-c="price" data-i="' + i + '" style="width:90px"></label></td><td><label class="f"><span class="sr">Costo de ' + esc(c.name) + '</span><input type="number" step="0.1" min="0" value="' + c.cost + '" data-c="cost" data-i="' + i + '" style="width:90px"></label></td><td>' + L.fmtUsd(g) + ' <span class="small muted">(' + Math.round(g / c.price * 100) + ' %)</span></td><td><b>' + L.money(c.price, m, S) + '</b></td><td class="small">' + (c.kind === 'none' ? 'No aplica' : c.kind === 'report' ? 'Informe del especialista' : normalText(c) + ' ' + esc(c.unit)) + '</td><td><button class="btn ghost sm" type="button" data-a="exdel" data-i="' + i + '" aria-label="Quitar ' + esc(c.name) + '">Quitar</button></td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="small muted">Si falta el costo de un examen, el sistema dice “sin costo cargado” y no inventa la ganancia. El margen normal lo pone el laboratorio, según su equipo.</p></div>';
  }

  function labReportes() {
    const M = L.ageMatrix(); const ins = L.insights(); const ex = M.exams; const names = ex.map(function (e) { return D.BY_ID[e].name.replace('Hematología completa', 'Hematología'); });
    let head = '<tr><th>Edad</th>' + names.map(function (n) { return '<th>' + esc(n) + '</th>'; }).join('') + '<th>Órdenes</th></tr>';
    const body = D.AGE_GROUPS.map(function (g) {
      return '<tr><td><b>' + g + '</b></td>' + ex.map(function (e) { const n = M.cells[g][e] || 0; if (n < L.MIN_CELL) return '<td><span class="chip gray" title="Grupo muy pequeño: no se muestra">&lt;' + L.MIN_CELL + '</span></td>'; const share = n / M.totals[g]; const a = Math.min(0.85, share * 3.2); return '<td style="background:rgba(76,95,213,' + a.toFixed(2) + ');color:' + (a > 0.5 ? '#fff' : '#14193A') + ';border-radius:8px;text-align:center" title="' + n + ' órdenes"><b>' + Math.round(share * 100) + ' %</b></td>'; }).join('') + '<td>' + L.fmtInt(M.totals[g]) + '</td></tr>';
    }).join('');
    const mo = L.monthly().slice().sort(function (a, b) { return b.n - a.n; });
    return '<div class="head"><div><h1>Reportes</h1><p>El sistema busca patrones solo. Sin nombres de pacientes.</p></div></div>' +
      '<div class="card dark"><h2>Lo que descubrió el sistema</h2><ul class="clean">' + ins.map(function (i) { return '<li>' + esc(i.text) + '</li>'; }).join('') + '</ul><p class="small" style="color:#E4E9FF">Se calcula con las órdenes del último año. Un grupo con menos de ' + L.MIN_CELL + ' personas no se muestra.</p></div>' +
      '<div class="card"><h2>Qué piden por edad</h2><p class="small muted">Cada casilla es el porcentaje de órdenes de ese grupo de edad. Más oscuro, más pedido.</p><div class="tw"><table style="min-width:720px"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div></div>' +
      '<div class="grid two"><div class="card"><h2>Meses con más y menos movimiento</h2>' + hbars(mo.map(function (m) { return { name: m.label, n: m.n }; }), mo[0].n, L.fmtInt) + '</div>' +
      '<div class="card"><h2>Rentabilidad por examen</h2>' + CAT.filter(function (c) { return c.kind !== 'none' || true; }).map(function (c) { return { name: c.name, n: Math.round((c.price - c.cost) / c.price * 100) }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 8).map(function (r) { return '<div style="display:grid;grid-template-columns:minmax(110px,1.1fr) 3fr auto;gap:10px;align-items:center"><span class="small">' + esc(r.name) + '</span><div class="bar"><i style="width:' + r.n + '%"></i></div><b class="small">' + r.n + ' %</b></div>'; }).join('') + '<p class="small muted">Estimado con los costos que cargó el laboratorio.</p></div></div>';
  }

  function labRed() {
    const sig = L.networkSignals().filter(function (s) { return S.approved[s.zone]; }); const labsN = S.labs.length;
    return '<div class="head"><div><h1>Red de laboratorios</h1><p>Señales que juntan a varios laboratorios, sin nombres.</p></div><span class="chip ok">' + labsN + ' laboratorios aportan datos</span></div>' +
      '<div class="card"><h2>Alertas aprobadas por LABS</h2>' + (sig.length ? sig.map(function (s) { return '<div class="row between" style="padding:10px 0;border-top:1px solid var(--line)"><div><b>' + esc(s.zone) + '</b><div class="small muted">Posible aumento de casos por confirmar · ' + esc(D.NETWORK.marker) + '</div></div><div class="row">' + spark(s.counts, s.state === 'fuerte' ? '#B45309' : '#4C5FD5') + '<span class="chip ' + (s.state === 'fuerte' ? 'warn' : 'gray') + '">' + (s.state === 'fuerte' ? 'Señal fuerte' : 'Para vigilar') + '</span></div></div>'; }).join('') : '<p class="muted">Todavía no hay alertas aprobadas. Cada señal la revisa una persona de LABS antes de enviarse (puedes aprobarla desde el rol Superadmin de esta demo).</p>') + '<p class="small muted">Esto es una señal para vigilar, no un diagnóstico. No reemplaza la notificación obligatoria al Ministerio de Salud.</p></div>' +
      '<div class="card"><h2>Casos por semana y zona (ya agrupados)</h2><div class="tw"><table><thead><tr><th>Zona</th>' + D.NETWORK.weeks.slice(-6).map(function (w) { return '<th>' + w + '</th>'; }).join('') + '<th>Tendencia</th></tr></thead><tbody>' + L.networkSignals().map(function (s) { return '<tr><td><b>' + esc(s.zone) + '</b></td>' + (s.state === 'oculto' ? '<td colspan="6"><span class="chip gray">Oculto: menos de 3 laboratorios aportan en esta zona</span></td><td></td>' : s.counts.slice(-6).map(function (c) { return '<td>' + L.shown(c) + '</td>'; }).join('') + '<td>' + spark(s.counts, '#4C5FD5') + '</td>') + '</tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="card note"><h2>Cómo se protege a las personas</h2><ul class="clean small"><li>Nunca se muestran nombres, cédulas ni teléfonos.</li><li>Un grupo con menos de ' + L.MIN_CELL + ' casos se muestra como “&lt;' + L.MIN_CELL + '”.</li><li>Una zona con menos de 3 laboratorios se oculta.</li><li>Solo hay informes fijos por semana, nadie puede hacer preguntas libres.</li><li>Nunca se dice qué laboratorio aportó cada dato.</li></ul></div>';
  }

  function labFirma() {
    const hasMarks = !!S.signUrl || !!S.stampUrl; const r = D.PATIENT_RESULTS[0];
    return '<div class="head"><div><h1>Firma y sello</h1><p>Fotografía una hoja con tu firma y tu sello, separados. LABS los detecta y los copia igual.</p></div></div>' +
      '<div class="grid two"><div class="card"><h2>1. Sube la foto</h2><div class="drop"><p>Una hoja blanca, buena luz, con la firma y el sello sin tocarse.</p><div class="row" style="justify-content:center"><label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Subir foto<input type="file" accept="image/jpeg,image/png" data-c="file" class="sr"></label><button class="btn ghost" type="button" data-a="sample">Probar con una hoja de ejemplo</button></div><p class="small muted">La foto se procesa en tu navegador. En la versión real se guarda cifrada y solo la puede subir el propio bioanalista.</p></div>' + (S.extractMsg ? '<p class="small" role="status"><b>' + esc(S.extractMsg) + '</b></p>' : '') + '</div>' +
      '<div class="card"><h2>2. Lo que detectó</h2>' + (S.overlayUrl ? '<img src="' + S.overlayUrl + '" alt="Foto con la firma y el sello marcados" style="width:100%;border-radius:14px">' : '<p class="muted">Aquí aparece tu foto con la firma y el sello marcados.</p>') + '</div></div>' +
      '<div class="grid two"><div class="card"><h2>3. Revisa y guarda</h2><div class="grid"><div><b class="small">Firma</b><div class="check">' + (S.signUrl ? '<img src="' + S.signUrl + '" alt="Firma recortada">' : '<span class="small muted">No detectada</span>') + '</div></div><div><b class="small">Sello</b><div class="check">' + (S.stampUrl ? '<img src="' + S.stampUrl + '" alt="Sello recortado">' : '<span class="small muted">No detectado</span>') + '</div></div></div>' +
      '<div class="row"><button class="btn ghost sm" type="button" data-a="swap">Intercambiar firma y sello</button></div>' +
      '<label class="row small" style="cursor:pointer"><input type="checkbox" data-c="owner" ' + (S.owner ? 'checked' : '') + ' style="width:22px;height:22px"> Soy el bioanalista y esta es mi firma y mi sello.</label>' +
      '<button class="btn" type="button" data-a="savemarks" ' + (hasMarks && S.owner ? '' : 'disabled') + '>Guardar firma y sello</button>' + (S.saved && hasMarks && S.owner ? '<p class="small up"><b>Guardado.</b> Se estampan solo cuando tú validas un resultado.</p>' : '') + '</div>' +
      '<div class="card"><h2>Así sale en el PDF</h2>' + sheetHtml(r, true) + '</div></div>' +
      '<div class="card note"><h2>Cómo se cuida tu firma</h2><ul class="clean small"><li>No se puede descargar ni copiar desde el sistema.</li><li>Se estampa solo cuando el bioanalista valida el resultado con un código extra.</li><li>Cada estampado queda anotado: quién, cuándo y en qué orden.</li><li>El PDF lleva un código QR que confirma que es auténtico y que no se modificó.</li><li>Si el bioanalista se va, el laboratorio desactiva su firma y los resultados viejos conservan la de quien los firmó.</li></ul></div>';
  }

  function sendResult() {
    const base = S.sendScenario === 'normal' ? D.PATIENT_RESULTS[1] : D.PATIENT_RESULTS[0];
    const r = JSON.parse(JSON.stringify(base)); if (S.sendScenario === 'critico') { r.values[0].v = 285; }
    const sum = L.summarize(r.values); const crit = sum.worst === 'urgente'; const ch = S.sendChecks; const ready = ch.review && /^\d{6}$/.test(ch.code) && (!crit || ch.call);
    return '<div class="head"><div><h1>Enviar resultado</h1><p>Orden ' + esc(r.id) + ' · ' + esc(r.title) + '</p></div><label class="f">Caso de la demo<select data-c="scenario"><option value="alto"' + (S.sendScenario === 'alto' ? ' selected' : '') + '>Con valores altos</option><option value="normal"' + (S.sendScenario === 'normal' ? ' selected' : '') + '>Todo normal</option><option value="critico"' + (S.sendScenario === 'critico' ? ' selected' : '') + '>Con un valor crítico</option></select></label></div>' +
      '<div class="grid two"><div style="display:flex;flex-direction:column;gap:16px"><div class="card"><h2>1. Paciente de la orden</h2><div class="row" style="background:rgba(76,95,213,0.1);padding:12px;border-radius:14px"><span aria-hidden="true">🔒</span><div><b>[NOMBRE DEL PACIENTE] · ' + esc(r.ci) + '</b><div class="small muted">Confirmó la orden en su teléfono hoy a las 9:14 a. m. No se puede cambiar el paciente.</div></div></div>' +
      '<div class="row"><span class="chip ok">Etiqueta del tubo LAB-0142-A coincide con la orden</span><span class="chip ok">Destino: perfil confirmado del paciente</span></div><p class="small muted">El laboratorio nunca escribe el teléfono. El aviso va al contacto que el paciente ya confirmó.</p></div>' +
      '<div class="card"><h2>2. Revisa los valores</h2><div class="tw"><table><thead><tr><th>Examen</th><th>Resultado</th><th>Margen normal (tuyo)</th><th>LABS dice</th></tr></thead><tbody>' + sum.rows.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td><b>' + x.v + '</b> ' + esc(x.unit) + '</td><td>' + normalText(x.c) + '</td><td>' + chipFor(x.level, x.label) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="small muted">Si subes un PDF o una foto, LABS lee los números y te los muestra al lado de la imagen. Tú confirmas uno por uno. Un valor imposible se bloquea solo.</p></div>' +
      '<div class="card"><h2>3. Firma y envía</h2>' + (crit ? '<div class="card" style="background:var(--crit-bg);color:var(--crit-ink)"><b>Valor crítico.</b> Este resultado no puede esperar a que el paciente abra la app. Llama al paciente o a su médico antes de enviarlo.<label class="row small" style="cursor:pointer"><input type="checkbox" data-c="call" ' + (ch.call ? 'checked' : '') + ' style="width:22px;height:22px"> Ya llamé al paciente o a su médico (se anota la hora ' + nowTime() + ').</label></div>' : '') +
      '<label class="row small" style="cursor:pointer"><input type="checkbox" data-c="review" ' + (ch.review ? 'checked' : '') + ' style="width:22px;height:22px"> Revisé cada valor y está correcto.</label>' +
      '<label class="f">Código de seguridad del bioanalista (6 números, en la demo escribe cualquiera)<input type="text" inputmode="numeric" maxlength="6" value="' + esc(ch.code) + '" data-c="code" style="max-width:200px"></label>' +
      '<button class="btn" type="button" data-a="send" ' + (ready ? '' : 'disabled') + '>Firmar, sellar y enviar</button><p class="small muted">El aviso por WhatsApp dice solo “Tienes un documento nuevo en LABS”. Nunca lleva nombre del examen ni valores.</p></div></div>' +
      '<div style="display:flex;flex-direction:column;gap:16px"><div class="card"><h2>Así lo recibe el paciente</h2>' + sheetHtml(r, true) + '</div>' +
      '<div class="card note"><h2>Casos especiales</h2><ul class="clean small"><li><b>Exámenes delicados</b> (VIH, embarazo, biopsias): quedan retenidos hasta que los liberes o el paciente pase por el laboratorio.</li><li><b>Correcciones:</b> el resultado anterior queda “reemplazado”, nunca se borra, y se avisa al paciente y a su médico.</li></ul></div></div></div>';
  }

  function labEquipo() {
    const team = [{ n: 'Dueño(a)', r: 'Administrador', can: 'Precios, finanzas, usuarios', c: true }, { n: 'Lic. [BIOANALISTA]', r: 'Bioanalista', can: 'Valida y firma resultados', c: true }, { n: '[RECEPCIÓN 1]', r: 'Recepción', can: 'Crea órdenes. No ve resultados ni finanzas', c: true }, { n: '[RECEPCIÓN 2]', r: 'Recepción', can: 'Crea órdenes. No ve resultados ni finanzas', c: false }];
    return '<div class="head"><div><h1>Mi equipo</h1><p>Una cuenta por persona. Así se sabe quién hizo qué.</p></div></div><div class="card"><div class="tw"><table><thead><tr><th>Persona</th><th>Rol</th><th>Qué puede hacer</th><th>Estado</th></tr></thead><tbody>' + team.map(function (t) { return '<tr><td><b>' + t.n + '</b></td><td>' + t.r + '</td><td>' + t.can + '</td><td>' + (t.c ? '<span class="chip ok">Activa</span>' : '<span class="chip gray">Dada de baja</span>') + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small muted">Solo el bioanalista puede estampar la firma y el sello. Si alguien se va, el dueño le quita el acceso al instante.</p></div>';
  }

  const LAB_VIEWS = { resumen: labResumen, catalogo: labCatalogo, reportes: labReportes, red: labRed, firma: labFirma, equipo: labEquipo };
  function labView() {
    const nav = LAB_NAV.map(function (n) { return n; });
    const views = { resumen: labResumen, enviar: sendResult, catalogo: labCatalogo, reportes: labReportes, red: labRed, firma: labFirma, equipo: labEquipo };
    return '<div class="shell">' + side(nav, S.lab, esc(S.labs[0].name), 'Panel del laboratorio') + '<main class="main">' + views[S.lab]() + '</main></div>';
  }

  window.UI = { esc: esc, chipFor: chipFor, logAudit: logAudit, toast: toast, lineBand: lineBand, rangeBar: rangeBar, normalText: normalText, sheetHtml: sheetHtml, side: side, spark: spark, hbars: hbars, labView: labView, labViews: LAB_VIEWS, nowTime: nowTime, modeSelect: modeSelect };
})();
