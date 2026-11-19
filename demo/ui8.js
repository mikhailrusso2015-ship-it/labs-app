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
      '<div class="seg" role="group" aria-label="Período">' + L.PERIODS.map(function (x) { return '<button type="button" data-a="period" data-v="' + x.id + '" aria-pressed="' + (S.period === x.id) + '">' + x.label + '</button>'; }).join('') + '</div>' +
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

  /* ---------- Pantalla "Menú": todas las opciones, agrupadas ---------- */
  function menuView(role) {
    const sub = (S.auth && S.auth.sub) || 'owner'; const items = EXT.nav[role].filter(function (i) { return !i.only || i.only.indexOf(sub) >= 0; }).filter(function (i) { return i.sep || (!i.hidden && ['inicio', 'menu', 'perfil'].indexOf(i.id) < 0); });
    const out = []; items.forEach(function (i, k) { if (i.sep && (!items[k + 1] || items[k + 1].sep)) return; out.push(i); });
    return '<div class="head"><div><h1>Menú</h1><p>Todas las opciones. Toca la que necesites.</p></div></div><div class="hub">' + out.map(function (i) { const b = i.badge ? i.badge() : ''; return i.sep ? '<div class="hubsep">' + esc(i.sep) + '</div>' : '<button type="button" class="tile" data-a="nav" data-v="' + i.id + '"><span>' + esc(i.label) + '</span>' + (b ? '<em class="badge">' + b + '</em>' : '') + '</button>'; }).join('') + '</div>';
  }
  ['lab', 'pat', 'doc', 'adm'].forEach(function (r) {
    V[r].menu = function () { return menuView(r); };
    EXT.nav[r] = [{ id: 'inicio', label: 'Inicio' }, { id: 'menu', label: 'Menú', hidden: true }].concat(EXT.nav[r].filter(function (i) { return i.id !== 'inicio' && i.id !== 'menu'; }));
  });
  window.render();
})();
