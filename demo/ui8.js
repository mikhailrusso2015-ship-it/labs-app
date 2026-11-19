/* LABS demo · pantalla de inicio con gráficas por tipo de usuario + pantalla "Menú" */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc; const C = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#6250d6', '#e87ba4'];

  /* ---------- Piezas de gráfica (SVG simple, sin librerías) ---------- */
  function short(v) { return v >= 10000 ? Math.round(v / 1000) + 'k' : v >= 1000 ? (v / 1000).toFixed(1).replace('.0', '') + 'k' : String(Math.round(v)); }
  function rbar(x, y, w, h, r) { x = +x; y = +y; w = +w; h = +h; r = Math.min(r, w / 2, h); return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z'; }
  function legend(items) { return '<div class="lg">' + items.map(function (i) { return '<span><i style="background:' + i.c + '"></i>' + esc(i.l) + '</span>'; }).join('') + '</div>'; }
  function table(head, rows) { return '<details class="tv"><summary>Ver como tabla</summary><div class="tw"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>'; }
  function vbars(data, names, fmt) {
    const n = data.length; if (!n) return '<p class="muted">Todavía no hay datos.</p>'; const W = 320, H = 176, base = 148, top = 22, pw = W - 16; const max = Math.max.apply(null, data.map(function (d) { return Math.max(d.a, d.b || 0); })) || 1; const g = pw / n; const two = data[0].b !== undefined; const bw = Math.min(26, g * (two ? .34 : .5));
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfica de barras: ' + esc(names.join(' y ')) + ' por ' + (n) + ' períodos" class="ch">';
    [0.5, 1].forEach(function (f) { const y = base - (base - top) * f; s += '<line x1="8" x2="' + (W - 8) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(51,69,181,.14)" stroke-dasharray="3 4"/>'; });
    s += '<line x1="8" x2="' + (W - 8) + '" y1="' + base + '" y2="' + base + '" stroke="rgba(51,69,181,.35)"/>';
    data.forEach(function (d, i) {
      const cx = 8 + g * i + g / 2; const bars = two ? [[cx - bw - 1, d.a, C[0]], [cx + 1, d.b, C[1]]] : [[cx - bw / 2, d.a, C[0]]];
      bars.forEach(function (b, k) { const h = Math.max(2, (base - top) * (b[1] / max)); s += '<path d="' + rbar(b[0].toFixed(1), (base - h).toFixed(1), bw, h.toFixed(1), 5) + '" fill="' + b[2] + '"><title>' + esc(d.l + ' · ' + names[k] + ': ' + fmt(b[1])) + '</title></path>'; if (k === 0) s += '<text x="' + (b[0] + bw / 2).toFixed(1) + '" y="' + (base - h - 5).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="600" fill="#1D2459">' + short(b[1]) + '</text>'; });
      s += '<text x="' + cx.toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle" font-size="11" fill="#5A6199">' + esc(d.l) + '</text>';
    });
    return s + '</svg>' + (two ? legend([{ c: C[0], l: names[0] }, { c: C[1], l: names[1] }]) : '') + table(['Período'].concat(names), data.map(function (d) { return [d.l, fmt(d.a)].concat(two ? [fmt(d.b)] : []); }));
  }
  function donut(parts, centerBig, centerSmall) {
    const tot = parts.reduce(function (s, p) { return s + p.v; }, 0); const R = 50, CIR = 2 * Math.PI * R; let off = 0;
    let s = '<svg viewBox="0 0 140 140" role="img" aria-label="' + esc(centerSmall + ': ' + parts.map(function (p) { return p.l + ' ' + p.v; }).join(', ')) + '" class="dn"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="rgba(51,69,181,.1)" stroke-width="22"/>';
    if (tot) parts.forEach(function (p) { if (!p.v) return; const len = Math.max(0, p.v / tot * CIR - (parts.filter(function (q) { return q.v; }).length > 1 ? 2.5 : 0)); s += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + p.c + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (CIR - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"><title>' + esc(p.l + ': ' + p.v) + '</title></circle>'; off += p.v / tot * CIR; });
    s += '<text x="70" y="68" text-anchor="middle" font-size="26" font-weight="700" fill="#1D2459">' + esc(centerBig) + '</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="#5A6199">' + esc(centerSmall) + '</text></svg>';
    return '<div class="dnwrap">' + s + '<ul class="dnlg">' + parts.map(function (p) { return '<li><i style="background:' + p.c + '"></i><span>' + esc(p.l) + '</span><b>' + p.v + '</b></li>'; }).join('') + '</ul></div>' + table(['Grupo', 'Cantidad'], parts.map(function (p) { return [p.l, String(p.v)]; }));
  }
  function line(pts, fmt, unit) {
    if (pts.length < 2) return '<p class="muted">Aún no hay suficientes resultados para dibujar la línea.</p>'; const W = 320, H = 170, l = 28, r = 16, t = 26, b = 30; const vs = pts.map(function (p) { return p.v; }); let lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs); const pad = (hi - lo || 1) * .35; lo -= pad; hi += pad;
    const X_ = function (i) { return l + (W - l - r) * i / (pts.length - 1); }, Y_ = function (v) { return H - b - (H - b - t) * (v - lo) / (hi - lo); };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Línea con ' + pts.length + ' resultados' + (unit ? ' en ' + esc(unit) : '') + '" class="ch"><line x1="' + l + '" x2="' + (W - r) + '" y1="' + (H - b) + '" y2="' + (H - b) + '" stroke="rgba(51,69,181,.35)"/>';
    s += '<polyline fill="none" stroke="' + C[0] + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p, i) { return X_(i).toFixed(1) + ',' + Y_(p.v).toFixed(1); }).join(' ') + '"/>';
    pts.forEach(function (p, i) { s += '<circle cx="' + X_(i).toFixed(1) + '" cy="' + Y_(p.v).toFixed(1) + '" r="5" fill="' + C[0] + '" stroke="#fff" stroke-width="2"><title>' + esc(p.m + ': ' + fmt(p.v)) + '</title></circle><text x="' + X_(i).toFixed(1) + '" y="' + (Y_(p.v) - 10).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#1D2459">' + fmt(p.v) + '</text><text x="' + X_(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="#5A6199">' + esc(p.m) + '</text>'; });
    return s + '</svg>' + table(['Mes', 'Valor'], pts.map(function (p) { return [p.m, fmt(p.v)]; }));
  }
  function kpi(label, value, sub, go) { return '<' + (go ? 'button type="button" data-a="nav" data-v="' + go + '"' : 'div') + ' class="card kpi kpb"><small>' + esc(label) + '</small><b>' + value + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</' + (go ? 'button' : 'div') + '>'; }
  function hero(title, sub, btns) { return '<div class="card dark dashhero"><div><small>' + esc(X.longDate ? X.longDate() : '') + '</small><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p></div>' + (btns ? '<div class="row">' + btns + '</div>' : '') + '</div>'; }
  function chartCard(title, note, body) { return '<div class="card chartc"><h2>' + esc(title) + '</h2>' + (note ? '<p class="small muted">' + note + '</p>' : '') + body + '</div>'; }
  function delta(cur, prev) { if (!prev) return ''; const d = Math.round((cur - prev) / prev * 100); return '<span class="delta ' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + ' % vs. período anterior</span>'; }
  const btn = function (a, v, t, cls) { return '<button class="btn ' + (cls || '') + ' sm" type="button" data-a="' + a + '" data-v="' + v + '">' + t + '</button>'; };
  const first = function (n) { return String(n || '').split(' (')[0]; };
  function ordersByState() { const o = S.orders; return [{ l: 'Esperando al paciente', v: o.filter(function (x) { return x.status === 'Esperando paciente'; }).length, c: C[1] }, { l: 'Por cargar resultados', v: o.filter(function (x) { return x.status === 'Por procesar' || x.status === 'En proceso'; }).length, c: C[0] }, { l: 'Enviadas', v: o.filter(function (x) { return x.status === 'Enviada'; }).length, c: C[2] }]; }

  /* ---------- Selector de período: una pestañita que se despliega ---------- */
  function periodPicker() {
    const cur = L.PERIODS.find(function (x) { return x.id === S.period; }) || L.PERIODS[0]; const o = !!S.perOpen;
    return '<div class="per"><button type="button" class="perbtn" data-a="per-toggle" aria-haspopup="listbox" aria-expanded="' + o + '"><span>' + esc(cur.label) + '</span><i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' +
      (o ? '<div class="permenu" role="listbox" aria-label="Período">' + L.PERIODS.map(function (x) { return '<button type="button" role="option" class="peropt" data-a="per-pick" data-v="' + x.id + '" aria-selected="' + (x.id === cur.id) + '"><span>' + esc(x.label) + '</span>' + (x.id === cur.id ? '<b>✓</b>' : '') + '</button>'; }).join('') + '</div>' : '') + '</div>';
  }
  A['per-toggle'] = function () { S.perOpen = !S.perOpen; window.render(); };
  A['per-pick'] = function (v) { S.period = v; S.perOpen = false; window.render(); };
  document.addEventListener('click', function (ev) { if (S.perOpen && !ev.target.closest('.per')) { S.perOpen = false; window.render(); } });
  const SEG_RE = /<div class="seg" role="group" aria-label="Período">[\s\S]*?<\/div>/;
  const res0 = V.lab.resumen; V.lab.resumen = function () { return res0().replace(SEG_RE, periodPicker()); };

  /* ---------- Laboratorio / Recepción ---------- */
  V.lab.inicio = function () {
    const recep = S.auth && S.auth.sub === 'recep'; const st = ordersByState(); const tot = S.orders.filter(function (o) { return o.status !== 'Anulada'; }).length;
    const unpaid = S.orders.filter(function (o) { return !o.paid && o.status !== 'Anulada'; }).length;
    const acts = btn('nav', 'nueva', 'Nueva orden') + '<button class="btn ghost sm" type="button" data-a="dock" data-v="qr">Escanear paciente</button>';
    if (recep) return hero('Hola, ' + first(S.auth.name), 'Tu panel de recepción de hoy', acts) +
      '<div class="grid">' + kpi('Órdenes de hoy', tot, '', 'ordenes') + kpi('Esperando al paciente', st[0].v, '', 'ordenes') + kpi('Sin cobrar', unpaid, 'órdenes', 'ordenes') + kpi('Por cargar resultados', st[1].v, '', 'ordenes') + '</div>' +
      '<div class="grid two">' + chartCard('Estado de las órdenes', 'Dónde está cada orden ahora mismo.', donut(st, String(tot), 'órdenes')) + chartCard('Cobros', 'Cuántas órdenes ya se cobraron.', donut([{ l: 'Cobradas', v: tot - unpaid, c: C[2] }, { l: 'Sin cobrar', v: unpaid, c: C[1] }], String(tot - unpaid) + '/' + tot, 'cobradas')) + '</div>';
    const p = L.PERIODS.find(function (x) { return x.id === S.period; }) || L.PERIODS[0]; const cur = L.periodStats(p.days, 0), prev = L.periodStats(p.days, p.days); const mo = L.monthly().slice(-6); const top = L.topExams(p.days).slice(0, 5); const lab = S.labs[0];
    const warn = lab.due <= 7 ? '<div class="banner" role="status">Tu suscripción vence en ' + lab.due + ' días. <button class="btn ghost sm" type="button" data-a="nav" data-v="config">Ir a Configuración</button></div>' : '';
    return warn + hero('Hola, ' + first(S.auth.name), lab.name + ' · cifras de ejemplo', acts) +
      '<div class="perrow"><b>Resumen</b>' + periodPicker() + '</div>' +
      '<div class="grid">' + kpi('Exámenes hechos', L.fmtInt(cur.n), delta(cur.n, prev.n), 'reportes') + kpi('Facturado', L.fmtUsd(cur.usd), delta(cur.usd, prev.usd), 'reportes') + kpi('Ganancia estimada', L.fmtUsd(cur.margin), cur.usd ? Math.round(cur.margin / cur.usd * 100) + ' % de lo facturado' : '', 'reportes') + kpi('Por cobrar', L.fmtUsd(cur.pending), 'órdenes sin pago', 'ordenes') + '</div>' +
      chartCard('Ventas y costos por mes', 'En dólares, últimos 6 meses.', vbars(mo.map(function (m) { return { l: m.label, a: m.usd, b: m.cost }; }), ['Ventas', 'Costos'], L.fmtUsd)) +
      '<div class="grid two">' + chartCard('Órdenes ahora mismo', 'Toca “Órdenes” para atenderlas.', donut(st, String(tot), 'órdenes')) + chartCard('Exámenes más pedidos', p.label.toLowerCase(), top.length ? U.hbars(top, top[0].n, L.fmtInt) : '<p class="muted">Todavía no hay órdenes en este período.</p>') + '</div>';
  };

  /* ---------- Paciente ---------- */
  V.pat.inicio = function () {
    const pid = X.myPid(); const rs = D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid; }); const last = rs[0]; const sum = last ? L.summarize(last.values) : null; const labs = EXT.payLabs ? EXT.payLabs(pid) : [];
    const due = labs.reduce(function (s, l) { return s + l.due; }, 0); const hist = rs.filter(function (r) { return r.history; })[0];
    let h = hero('Hola, ' + first(S.auth.name), 'Tus resultados y lo que tienes en curso', '<button class="btn sm" type="button" data-a="nav" data-v="lista">Ver mis resultados</button><button class="btn ghost sm" type="button" data-a="dock" data-v="qr">Mi QR</button>');
    h += '<div class="grid">' + kpi('Resultados', rs.length, 'en total', 'lista') + kpi('Valores a vigilar', sum ? sum.watch : 0, 'en tu último examen', 'lista') + kpi('Exámenes en curso', labs.reduce(function (s, l) { return s + l.n; }, 0), labs.length + (labs.length === 1 ? ' laboratorio' : ' laboratorios'), 'pagar') + kpi('Por pagar', L.fmtUsd(due), '', 'pagar') + '</div>';
    if (sum) h += '<div class="grid two">' + chartCard('Mi último examen', esc(last.title) + ' · ' + esc(last.date), donut([{ l: 'En rango normal', v: sum.normal, c: C[2] }, { l: 'A vigilar', v: sum.watch, c: C[1] }], sum.rows.length + '', 'valores')) + (hist ? chartCard('Cómo va mi ' + esc(D.BY_ID[hist.history.id].name.toLowerCase()), 'Cada punto es un examen tuyo.', line(hist.history.points, function (v) { return String(v); }, D.BY_ID[hist.history.id].unit || '')) : chartCard('Mis exámenes', 'Cantidad por mes.', vbars(rs.slice().reverse().map(function (r, i) { return { l: r.date.split(' de ')[1].slice(0, 3), a: r.values.length }; }), ['Valores medidos'], String))) + '</div>';
    else h += '<div class="card"><h2>Aún no tienes resultados</h2><p class="muted">Cuando un laboratorio te los envíe, verás aquí tus gráficas.</p></div>';
    return h;
  };

  /* ---------- Médico ---------- */
  V.doc.inicio = function () {
    const P = S.docPatients; const al = P.map(function (x) { return { n: x.name, a: X.alertsOf(x.pid) }; }); const con = al.filter(function (x) { return x.a > 0; }); const sinRes = P.filter(function (x) { return x.exam === 'Sin resultados'; }).length;
    const need = P.map(function (x, i) { return { x: x, i: i, a: X.alertsOf(x.pid) }; }).filter(function (o) { return o.a > 0; }).slice(0, 4);
    return hero('Hola, ' + first(S.auth.name), 'Tus pacientes de un vistazo', btn('nav', 'pedir', 'Pedir acceso') + '<button class="btn ghost sm" type="button" data-a="dock" data-v="qr">Mi QR / escanear</button>') +
      '<div class="grid">' + kpi('Mis pacientes', P.length, '', 'lista') + kpi('Con avisos', con.length, 'necesitan tu atención', 'lista') + kpi('Solicitudes', S.requests.length, 'por responder', 'sol') + kpi('Sin resultados', sinRes, 'pacientes', 'lista') + '</div>' +
      '<div class="grid two">' + chartCard('Mis pacientes', 'Quiénes tienen valores a vigilar.', donut([{ l: 'Con avisos', v: con.length, c: C[1] }, { l: 'Sin avisos', v: P.length - con.length, c: C[2] }], String(P.length), 'pacientes')) + chartCard('Avisos por paciente', 'Cantidad de valores fuera de rango.', al.length ? U.hbars(al.map(function (x) { return { name: x.n, n: x.a }; }), Math.max.apply(null, al.map(function (x) { return x.a; })) || 1, String) : '<p class="muted">Aún no tienes pacientes.</p>') + '</div>' +
      '<div class="card"><h2>Necesitan atención</h2>' + (need.length ? need.map(function (o) { return '<button type="button" class="needrow" data-a="docopen" data-v="' + o.i + '"><div><b>' + esc(o.x.name) + '</b><div class="small muted">' + esc(o.x.flag || o.x.exam) + '</div></div><span class="chip warn">' + o.a + (o.a === 1 ? ' aviso' : ' avisos') + '</span></button>'; }).join('') : '<p class="muted">Nadie con avisos por ahora.</p>') + '</div>';
  };
  A['docopen'] = function (v) { S.hub = false; S.doc = 'lista'; S.docOpen = parseInt(v, 10); S.docSel = S.docOpen; window.render(); window.scrollTo(0, 0); };

  /* ---------- Superadmin ---------- */
  V.adm.inicio = function () {
    const act = S.labs.filter(function (l) { return l.status === 'Al día' || l.status === 'Vence pronto'; }); const mrr = act.reduce(function (s, l) { return s + l.price; }, 0); const risk = S.labs.filter(function (l) { return l.status === 'Atrasado' || l.status === 'Vence pronto'; });
    const pend = S.payments.filter(function (p) { return p.status === 'Pendiente'; }).length; const tk = S.tickets.filter(function (t) { return t.status === 'Abierto' || t.status === 'En revisión'; }).length; const orders = S.labs.reduce(function (s, l) { return s + l.orders30; }, 0);
    const cnt = function (k) { return S.labs.filter(function (l) { return l.status === k; }).length; };
    const top = S.labs.slice().sort(function (a, b) { return b.orders30 - a.orders30; }).slice(0, 6).map(function (l) { return { name: l.name, n: l.orders30 }; });
    const chips = [['pagos', pend, 'pagos por confirmar'], ['soporte', tk, 'tickets abiertos'], ['claves', S.resets.filter(function (r) { return r.state === 'espera'; }).length, 'claves por aprobar'], ['red', L.networkSignals().filter(function (s) { return (s.state === 'fuerte' || s.state === 'vigilar') && !S.approved[s.zone] && !S.rejected[s.zone]; }).length, 'alertas por revisar']];
    return hero('Hola, ' + first(S.auth.name), 'El negocio de LABS de un vistazo', btn('nav', 'pagos', 'Ver pagos') + btn('nav', 'labs', 'Ver laboratorios', 'ghost')) +
      '<div class="grid">' + kpi('Ingreso mensual', L.fmtUsd(mrr), 'labs al día · plan único $20', 'pagos') + kpi('Laboratorios', S.labs.length, act.length + ' activos', 'labs') + kpi('Pagos por confirmar', pend, '', 'pagos') + kpi('En riesgo', risk.length, 'atrasados o por vencer', 'labs') + '</div>' +
      '<div class="grid two">' + chartCard('Estado de los laboratorios', 'Quién está al día y quién no.', donut([{ l: 'Al día', v: cnt('Al día'), c: C[2] }, { l: 'Vence pronto', v: cnt('Vence pronto'), c: C[3] }, { l: 'Atrasado', v: cnt('Atrasado'), c: C[1] }, { l: 'Prueba gratis', v: cnt('Prueba gratis'), c: C[0] }, { l: 'Suspendido', v: cnt('Suspendido'), c: C[4] }], String(S.labs.length), 'laboratorios')) + chartCard('Laboratorios con más exámenes', L.fmtInt(orders) + ' exámenes en 30 días en toda la red.', U.hbars(top, top[0].n, L.fmtInt)) + '</div>' +
      '<div class="card"><h2>Hay que atender hoy</h2><div class="row">' + chips.map(function (c) { return '<button class="btn ghost" type="button" data-a="nav" data-v="' + c[0] + '">' + c[1] + ' ' + c[2] + '</button>'; }).join('') + '</div></div>';
  };

  /* ---------- Pantalla "Menú": todas las opciones, agrupadas, con iconos ---------- */
  const MI = {
    atencion: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2"/><path d="m9 14 2 2 4-4"/>',
    nueva: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    ordenes: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    pacientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 4.5 5"/>',
    resumen: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    catalogo: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="9" r="1.3"/>',
    reportes: '<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    red: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    firma: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    equipo: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    config: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    suscripcion: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 11h18"/>',
    avisos: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    soporte: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    lista: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    sol: '<path d="M4 13l2-8h12l2 8v6H4z"/><path d="M4 13h5a3 3 0 0 0 6 0h5"/>',
    pedir: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    qr: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="3" height="3"/><rect x="8" y="13" width="3" height="3"/>',
    pagar: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    quien: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    labs: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2"/>',
    planes: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="9" r="1.3"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 4.5 5"/>',
    claves: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    registro: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2M9 12h6M9 16h6"/>'
  };
  MI.pagos = MI.pagar; MI.ajustes = MI.config; EXT.MI = MI;
  const TINT = [['#E6EAFF', '#3345B5'], ['#EDE7FF', '#5B3BD6'], ['#DDF5EC', '#0B7A55'], ['#FFEBD9', '#B45309'], ['#FDE4EE', '#B8326A']];
  function menuView(role) {
    const sub = (S.auth && S.auth.sub) || 'owner'; const items = EXT.nav[role].filter(function (i) { return !i.only || i.only.indexOf(sub) >= 0; }).filter(function (i) { return i.sep || (!i.hidden && ['inicio', 'menu', 'perfil'].indexOf(i.id) < 0); });
    const groups = []; let cur = { t: '', rows: [] }; groups.push(cur);
    items.forEach(function (i) { if (i.sep) { cur = { t: i.sep, rows: [] }; groups.push(cur); } else cur.rows.push(i); });
    return '<div class="head"><div><h1>Menú</h1><p>Todas las opciones de tu cuenta.</p></div></div>' + groups.filter(function (g) { return g.rows.length; }).map(function (g, gi) {
      const t = TINT[gi % TINT.length];
      return (g.t ? '<div class="mgt">' + esc(g.t) + '</div>' : '') + '<div class="mgrp">' + g.rows.map(function (i) {
        const b = i.badge ? i.badge() : ''; const ic = MI[i.id] || '<circle cx="12" cy="12" r="3"/>';
        return '<button type="button" class="mrow" data-a="nav" data-v="' + i.id + '"><span class="mic" style="background:' + t[0] + ';color:' + t[1] + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg></span><span class="ml">' + esc(i.label) + '</span>' + (b ? '<em class="badge">' + b + '</em>' : '') + '<i class="chev" aria-hidden="true">›</i></button>';
      }).join('') + '</div>';
    }).join('');
  }
  ['lab', 'pat', 'doc', 'adm'].forEach(function (r) {
    V[r].menu = function () { return menuView(r); };
    EXT.nav[r] = [{ id: 'inicio', label: 'Inicio' }, { id: 'menu', label: 'Menú', hidden: true }].concat(EXT.nav[r].filter(function (i) { return i.id !== 'inicio' && i.id !== 'menu'; }));
  });

  /* ---------- Teléfono: ninguna tabla con scroll lateral; cada fila es una tarjeta que se abre ---------- */
  function flat(html) { const d = document.createElement('div'); d.innerHTML = String(html).replace(/<(br|\/div|\/p|\/b|\/span)[^>]*>/gi, '$& '); return d.textContent.replace(/\s+/g, ' ').trim(); }
  A['trow'] = function (v) { const p = v.split(':'); const k = (S.role + '/' + S[S.role]) + '#' + p[0]; S.tro = S.tro || {}; S.tro[k] = S.tro[k] === p[1] ? null : p[1]; window.render(); };
  window.UI_post = function () {
    const mob = !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); if (!mob) return;
    const app = document.getElementById('app'); if (!app) return; S.tro = S.tro || {};
    Array.prototype.forEach.call(app.querySelectorAll('.tw table'), function (tb, ti) {
      if (tb.closest('.paper-fit') || tb.closest('.sheet')) return;
      const heads = Array.prototype.map.call(tb.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); }); const key = (S.role + '/' + S[S.role]) + '#' + ti; const openRow = S.tro[key];
      const wrap = document.createElement('div'); wrap.className = 'tcards';
      Array.prototype.forEach.call(tb.querySelectorAll('tbody tr'), function (tr, ri) {
        const tds = Array.prototype.slice.call(tr.children); if (!tds.length) return; const first = tds[0]; const b = first.querySelector('b'); const title = flat(first.innerHTML) || '—';
        const second = tds[1]; const sub = second && !second.querySelector('input,button,select,svg') ? flat(second.innerHTML).slice(0, 60) : ''; let chip = ''; for (let i = 1; i < tds.length; i++) { const c = tds[i].querySelector('.chip'); if (c) { chip = c.outerHTML; break; } }
        const o = String(ri) === String(openRow); let body = '', acts = '';
        for (let i = 1; i < tds.length; i++) { const lab = heads[i] || ''; const hasBtn = tds[i].querySelector('button'); const onlyBtn = hasBtn && !tds[i].querySelector('input,select') && flat(tds[i].innerHTML).length < 80; if (onlyBtn || /^(acciones?|quitar)$/i.test(lab)) acts += '<div class="tka">' + tds[i].innerHTML + '</div>'; else if (tds[i].innerHTML.trim()) body += '<div class="tkv"><small>' + esc(lab) + '</small><div>' + tds[i].innerHTML + '</div></div>'; }
        const d = document.createElement('div'); d.className = 'acc';
        d.innerHTML = '<button type="button" class="acch" data-a="trow" data-v="' + ti + ':' + ri + '" aria-expanded="' + o + '"><span class="t">' + esc(title.length > 46 ? title.slice(0, 44) + '…' : title) + (sub && sub !== title ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' + chip + '<i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' + (o ? '<div class="accb tcb">' + body + acts + '</div>' : '');
        wrap.appendChild(d);
      });
      tb.parentNode.replaceChild(wrap, tb);
    });
  };
  window.render();
})();
