/* LABS demo · catálogo grande, paquetes y enfermedades tropicales */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn;
  const esc = U.esc, toast = U.toast, logAudit = U.logAudit, F = X.F, fld = X.fld, errBox = X.errBox, setErr = X.setErr, dlg = X.dlg, A = EXT.actions, V = EXT.views.lab, CAT = D.CATALOG;
  const CATS = ['Sangre y química', 'Hormonas', 'Orina y heces', 'Infecciones y trópico', 'Cultivos', 'Imagen y estudios'];
  const KINDN = { none: 'Texto', pos: 'Positivo o negativo', cult: 'Cultivo con antibiograma', report: 'Informe del especialista' };
  function render() { window.render(); }
  S.npk = S.npk || [];

  /* ---------- Catálogo ---------- */
  V.catalogo = function () {
    const m = S.mode; const q = F('ct-q').trim().toLowerCase(), cf = F('ct-cat', 'todas'); const mlabel = L.MODES.filter(function (x) { return x.id === m; })[0].label;
    const rows = CAT.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return (cf === 'todas' || x.c.cat === cf) && (!q || x.c.name.toLowerCase().indexOf(q) >= 0); });
    const note = m === 'usd' ? 'Precios en dólares. Cada orden guarda el precio en dólares y la tasa del momento.' : m === 'manual' ? 'Tasa propia: ' + L.fmtBs(S.manualRate) + ' por dólar.' : D.RATES[m].label + ': ' + L.fmtBs(D.RATES[m].value) + '. ' + D.RATES[m].note + '.';
    return '<div class="head"><div><h1>Exámenes y precios</h1><p>Carga lo que ofreces. Los precios se guardan en dólares.</p></div>' + U.modeSelect() + '</div>' +
      '<div class="grid"><div class="card kpi"><small>Dólar BCV (ejemplo)</small><b>' + L.fmtBs(D.RATES.bcv.value) + '</b><small>Fuente oficial</small></div><div class="card kpi"><small>USDT (ejemplo)</small><b>' + L.fmtBs(D.RATES.usdt.value) + '</b><small>Mercado entre personas</small></div><div class="card kpi"><small>Tasa propia</small><label class="f"><span class="sr">Tasa propia en bolívares por dólar</span><input type="number" step="0.01" min="1" value="' + S.manualRate + '" data-c="manual"></label><small>Solo el dueño la cambia</small></div><div class="card kpi"><small>Exámenes y paquetes</small><b>' + CAT.length + ' · ' + D.PACKAGES.length + '</b><small>En tu catálogo</small></div></div>' +
      '<div class="card"><div class="row between"><h2>Exámenes</h2><span class="small muted">' + note + '</span></div><div class="grid two">' + fld('Buscar', 'ct-q', { ph: 'Nombre del examen' }) + fld('Grupo', 'ct-cat', { type: 'select', r: true, options: [{ v: 'todas', l: 'Todos los grupos' }].concat(CATS.map(function (c) { return { v: c, l: c }; })) }) + '</div>' +
      (rows.length ? '<div class="tw"><table style="min-width:900px"><thead><tr><th>Examen</th><th>Precio USD</th><th>Costo USD</th><th>Ganancia</th><th>Al público (' + mlabel + ')</th><th>Cómo se entrega</th><th>Quitar</th></tr></thead><tbody>' + rows.map(function (x) { const c = x.c, i = x.i, g = c.price - c.cost; return '<tr><td><b>' + esc(c.name) + '</b>' + (c.notif ? ' <span class="chip warn">Notificación obligatoria</span>' : '') + (c.sens ? ' <span class="chip gray">Sensible</span>' : '') + '<div class="small muted">' + esc(c.cat) + '</div></td><td><label class="f"><span class="sr">Precio de ' + esc(c.name) + '</span><input type="number" step="0.5" min="0" value="' + c.price + '" data-c="price" data-i="' + i + '" style="width:90px"></label></td><td><label class="f"><span class="sr">Costo de ' + esc(c.name) + '</span><input type="number" step="0.1" min="0" value="' + c.cost + '" data-c="cost" data-i="' + i + '" style="width:90px"></label></td><td>' + L.fmtUsd(g) + ' <span class="small muted">(' + (c.price ? Math.round(g / c.price * 100) : 0) + ' %)</span></td><td><b>' + L.money(c.price, m, S) + '</b></td><td class="small">' + (KINDN[c.kind] || (U.normalText(c) + ' ' + esc(c.unit))) + '</td><td><button class="btn ghost sm" type="button" data-a="exdel" data-i="' + i + '" aria-label="Quitar ' + esc(c.name) + '">Quitar</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No hay exámenes con ese nombre.</p>') + '</div>' +
      pkgCard() + addCard();
  };
  function pkgCard() {
    const q = F('npk-q').trim().toLowerCase(); const sel = S.npk; const sum = sel.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0); const sug = Math.round(sum * 0.85 * 2) / 2;
    return '<div class="card"><h2>Paquetes (perfiles)</h2><p class="small muted">Un paquete junta varios exámenes con un solo precio. Se elige en “Nueva orden”.</p><div class="tw"><table style="min-width:700px"><thead><tr><th>Paquete</th><th>Exámenes</th><th>Suma suelta</th><th>Precio USD</th><th>Acciones</th></tr></thead><tbody>' + D.PACKAGES.map(function (p) { const s = p.items.reduce(function (t, e) { return t + D.BY_ID[e].price; }, 0); return '<tr><td><b>' + esc(p.name) + '</b></td><td class="small">' + p.items.length + ': ' + esc(p.items.map(function (e) { return D.BY_ID[e].name; }).join(', ')) + '</td><td>' + L.fmtUsd(s) + '</td><td><label class="f"><span class="sr">Precio de ' + esc(p.name) + '</span><input type="number" step="0.5" min="0" data-c="f-pkp-' + p.id + '" value="' + esc(F('pkp-' + p.id, String(p.price))) + '" style="width:90px"></label></td><td><div class="row"><button class="btn ghost sm" type="button" data-a="pk-save" data-v="' + p.id + '">Guardar precio</button><button class="btn ghost sm" type="button" data-a="pk-del" data-v="' + p.id + '">Quitar</button></div></td></tr>'; }).join('') + '</tbody></table></div>' + errBox('pks') +
      '<h3>Crear un paquete</h3><div class="grid two">' + fld('Nombre del paquete', 'npk-name') + fld('Buscar exámenes para agregar', 'npk-q', { ph: 'Ej.: hepatitis' }) + '</div>' + (q ? '<div class="pill-row">' + CAT.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 12).map(function (c) { return '<button type="button" class="btn ghost sm" data-a="npk-ex" data-v="' + c.id + '">+ ' + esc(c.name) + '</button>'; }).join('') + '</div>' : '') +
      (sel.length ? '<div class="pill-row">' + sel.map(function (e) { return '<button type="button" class="btn sm" data-a="npk-ex" data-v="' + e + '" aria-label="Quitar ' + esc(D.BY_ID[e].name) + '">✓ ' + esc(D.BY_ID[e].name) + ' ✕</button>'; }).join('') + '</div><p class="small muted">Suma suelta: ' + L.fmtUsd(sum) + ' · Precio sugerido con 15 % menos: ' + L.fmtUsd(sug) + '</p>' : '<p class="small muted">Busca y toca los exámenes que lleva el paquete.</p>') + fld('Precio del paquete (USD, déjalo vacío para usar el sugerido)', 'npk-price', { type: 'number', mode: 'decimal' }) + errBox('npk') + '<div class="row"><button class="btn" type="button" data-a="npk-add">Crear paquete</button></div></div>';
  }
  function addCard() {
    return '<div class="card"><h2>Agregar un examen o estudio</h2><div class="grid">' + fld('Nombre', 'ex-name') + fld('Grupo', 'ex-cat', { type: 'select', options: CATS }) + fld('Cómo se entrega el resultado', 'ex-type', { type: 'select', options: [{ v: 'none', l: 'Texto libre' }, { v: 'pos', l: 'Positivo o negativo' }, { v: 'cult', l: 'Cultivo con antibiograma' }, { v: 'report', l: 'Informe del especialista (rayos X, eco…)' }] }) + fld('Precio (USD)', 'ex-price', { type: 'number', mode: 'decimal' }) + fld('Costo (USD)', 'ex-cost', { type: 'number', mode: 'decimal' }) + '</div>' + fld('Es de notificación obligatoria al Ministerio de Salud', 'ex-notif', { type: 'checkbox' }) + fld('Es un resultado sensible (VIH, genética, etc.)', 'ex-sens', { type: 'checkbox' }) + errBox('ex') + '<div class="row"><button class="btn" type="button" data-a="ex-add">Agregar al catálogo</button></div></div>';
  }
  A['ex-add'] = function () {
    const n = F('ex-name').trim(), pr = parseFloat(F('ex-price')), co = parseFloat(F('ex-cost')); if (n.length < 3) return setErr('ex', 'Escribe el nombre del examen.'); if (CAT.some(function (c) { return c.name.toLowerCase() === n.toLowerCase(); })) return setErr('ex', 'Ya existe un examen con ese nombre.');
    if (!isFinite(pr) || pr <= 0) return setErr('ex', 'El precio debe ser mayor que cero.'); if (!isFinite(co) || co < 0) return setErr('ex', 'Escribe el costo (puede ser 0).');
    const kind = F('ex-type', 'none'); const c = { id: 'x' + (CAT.length + 1) + Date.now() % 1000, name: n, unit: '', price: pr, cost: co, kind: kind, cat: kind === 'report' ? 'Imagen y estudios' : kind === 'cult' ? 'Cultivos' : kind === 'pos' ? 'Infecciones y trópico' : F('ex-cat', CATS[0]), notif: !!F('ex-notif'), sens: !!F('ex-sens') };
    CAT.push(c); D.BY_ID[c.id] = c; ['ex-name', 'ex-price', 'ex-cost', 'ex-type', 'ex-cat', 'ex-notif', 'ex-sens'].forEach(function (k) { delete S.f[k]; }); S.err = {}; logAudit(S.auth.name, 'Agregó al catálogo: ' + n); toast('“' + n + '” agregado al catálogo.');
  };
  A['exdel'] = function (v) {
    const c = CAT[parseInt(v, 10)];
    if (S.orders.some(function (o) { return o.exams.indexOf(c.id) >= 0 && o.status !== 'Enviada' && o.status !== 'Anulada'; })) return dlg('No se puede quitar', '<p>“' + esc(c.name) + '” está en órdenes que todavía no terminan. Termínalas o anúlalas primero.</p>', null);
    const inPk = D.PACKAGES.filter(function (p) { return p.items.indexOf(c.id) >= 0; }); if (inPk.length) return dlg('No se puede quitar', '<p>“' + esc(c.name) + '” forma parte de: ' + esc(inPk.map(function (p) { return p.name; }).join(', ')) + '. Quítalo primero de esos paquetes.</p>', null);
    dlg('Quitar “' + c.name + '”', '<p>Ya no se podrá elegir en órdenes nuevas. Las órdenes anteriores no cambian.</p>', { label: 'Quitar del catálogo', a: 'ex-del-ok', v: v });
  };
  A['pk-save'] = function (v) { const p = D.PACKAGES.filter(function (x) { return x.id === v; })[0]; const n = parseFloat(F('pkp-' + v, String(p.price))); if (!isFinite(n) || n <= 0) return setErr('pks', 'El precio de “' + p.name + '” debe ser mayor que cero.'); p.price = n; S.err = {}; delete S.f['pkp-' + v]; logAudit(S.auth.name, 'Cambió el precio del paquete ' + p.name); toast('Precio de “' + p.name + '” guardado.'); };
  A['pk-del'] = function (v) { const p = D.PACKAGES.filter(function (x) { return x.id === v; })[0]; dlg('Quitar el paquete “' + p.name + '”', '<p>Los exámenes siguen en el catálogo. Las órdenes anteriores no cambian.</p>', { label: 'Quitar paquete', a: 'pk-del-ok', v: v }); };
  A['pk-del-ok'] = function (v) { const i = D.PACKAGES.findIndex(function (x) { return x.id === v; }); const p = D.PACKAGES[i]; D.PACKAGES.splice(i, 1); if (S.no && S.no.pkgs) S.no.pkgs = S.no.pkgs.filter(function (x) { return x !== v; }); S.modal = null; logAudit(S.auth.name, 'Quitó el paquete ' + p.name); toast('Paquete quitado.'); };
  A['npk-ex'] = function (v) { const i = S.npk.indexOf(v); if (i >= 0) S.npk.splice(i, 1); else S.npk.push(v); render(); };
  A['npk-add'] = function () {
    const n = F('npk-name').trim(); if (n.length < 3) return setErr('npk', 'Escribe el nombre del paquete.'); if (D.PACKAGES.some(function (p) { return p.name.toLowerCase() === n.toLowerCase(); })) return setErr('npk', 'Ya existe un paquete con ese nombre.'); if (S.npk.length < 2) return setErr('npk', 'Elige al menos 2 exámenes.');
    const sum = S.npk.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0); const raw = F('npk-price').trim(); const pr = raw === '' ? Math.round(sum * 0.85 * 2) / 2 : parseFloat(raw); if (!isFinite(pr) || pr <= 0) return setErr('npk', 'El precio debe ser mayor que cero.');
    D.PACKAGES.push({ id: 'pk' + Date.now() % 100000, name: n, items: S.npk.slice(), price: pr }); S.npk = []; ['npk-name', 'npk-q', 'npk-price'].forEach(function (k) { delete S.f[k]; }); S.err = {}; logAudit(S.auth.name, 'Creó el paquete ' + n); toast('Paquete “' + n + '” creado. Ya sale en Nueva orden.');
  };

  /* ---------- Enfermedades tropicales ---------- */
  const TROP = [
    { name: 'Dengue', ex: ['dns1', 'dig'], w: [6, 5, 7, 6, 8, 10, 13, 17, 22, 29, 37, 48] },
    { name: 'Malaria', ex: ['gota', 'mal'], w: [14, 16, 15, 17, 15, 16, 18, 17, 19, 20, 21, 23] },
    { name: 'Leptospirosis', ex: ['lepto'], w: [1, 2, 2, 1, 3, 2, 4, 6, 9, 12, 14, 19] },
    { name: 'Chagas', ex: ['chag', 'chagf'], w: [3, 2, 4, 3, 2, 3, 4, 3, 2, 4, 3, 3] },
    { name: 'Leishmaniasis', ex: ['leish', 'rk39'], w: [2, 3, 2, 4, 3, 3, 5, 4, 3, 4, 6, 5] },
    { name: 'Tuberculosis', ex: ['baar', 'gx'], w: [5, 4, 6, 5, 5, 4, 6, 5, 5, 6, 5, 5] }
  ];
  function tropicalCard(who) {
    const zones = D.NETWORK.zones.map(function (z) { return z.zone; }); const zi = who === 'adm' ? Math.max(0, zones.indexOf(F('tr-zone', zones[0]))) : Math.max(0, zones.indexOf('Carabobo')); const factor = [1, 0.7, 1.4, 0.5, 1.2, 0.8, 0.6, 1.1][zi % 8]; const zone = zones[zi];
    const sel = who === 'adm' ? fld('Zona', 'tr-zone', { type: 'select', r: true, options: zones }) : '';
    return '<div class="card"><h2>Enfermedades de notificación obligatoria' + (who === 'adm' ? '' : ' en tu zona (' + esc(zone) + ')') + '</h2><p class="small muted">Conteos juntos por semana, sin nombres. Si una zona tiene menos de ' + L.MIN_CELL + ' casos, no se muestra el número. Datos de ejemplo' + (who === 'adm' ? '' : ' más los casos positivos que tu laboratorio acaba de enviar') + '.</p>' + sel +
      '<div class="tw"><table style="min-width:620px"><thead><tr><th>Enfermedad</th><th>Esta semana</th><th>Promedio antes</th><th>Últimas 12 semanas</th><th>Estado</th></tr></thead><tbody>' + TROP.map(function (t) {
        const own = who === 'adm' ? 0 : t.ex.reduce(function (s, e) { return s + ((S.cases || {})[e] || 0); }, 0); const w = t.w.map(function (x) { return Math.round(x * factor); }); const last = w[11] + own; const base = (w[7] + w[8] + w[9] + w[10]) / 4; const hid = last < L.MIN_CELL; const ratio = base > 0 ? last / base : 1;
        const st = hid ? '<span class="chip gray">Pocos casos</span>' : ratio >= 2 ? '<span class="chip crit">Subiendo mucho</span>' : ratio >= 1.4 ? '<span class="chip warn">Subiendo</span>' : '<span class="chip ok">Estable</span>';
        return '<tr><td><b>' + t.name + '</b></td><td>' + L.shown(last) + (own ? ' <span class="small muted">(' + own + ' de tu lab)</span>' : '') + '</td><td>' + (hid ? '—' : base.toFixed(1).replace('.', ',')) + '</td><td>' + (hid ? '—' : U.spark(w.slice(0, 11).concat([last]), ratio >= 1.4 ? '#B45309' : '#4C5FD5')) + '</td><td>' + st + '</td></tr>';
      }).join('') + '</tbody></table></div><div class="card note small"><p>Es una señal para vigilar, no un diagnóstico. No reemplaza la notificación al Ministerio de Salud, que sigue siendo del laboratorio.</p></div></div>';
  }
  X.tropicalCard = tropicalCard;
  const redOld = V.red;
  V.red = function () { return redOld() + (S.lcfg.net ? tropicalCard('lab') : ''); };

  /* ---------- Resultado ya enviado para el paciente demo ---------- */
  (function () {
    const p = X.personOf('p1'); if (!p) return;
    const r = { id: 'LAB-0139', title: 'Perfil de fiebre tropical', lab: S.labs[0].name, date: '3 de noviembre de 2026', patient: p.name, ci: X.maskCi(p.ci), age: p.age, sex: p.sex, pid: 'p1', values: [{ id: 'plq', v: 185 }], history: null, pos: { gota: { res: 'Negativo', detail: '' }, dns1: { res: 'Negativo', detail: '' }, widal: { res: 'Negativo', detail: '' }, lepto: { res: 'Negativo', detail: '' } } };
    D.PATIENT_RESULTS.push(r); const idx = D.PATIENT_RESULTS.length - 1; const items = D.PACKAGES.filter(function (x) { return x.name === 'Perfil de fiebre tropical'; })[0];
    S.orders.push({ id: 'LAB-0139', pid: 'p1', exams: items.items.slice(), pkgs: [items.name], usd: items.price, cost: 12, cur: 'bcv', rate: D.RATES.bcv.value, method: 'Pago móvil', paid: true, status: 'Enviada', when: '3 nov', by: 'Gabriela Ruiz', doctor: '', via: 'QR', resultIdx: idx });
  })();
})();
