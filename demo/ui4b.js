/* LABS demo · catálogo grande, paquetes y enfermedades tropicales */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn;
  const esc = U.esc, toast = U.toast, logAudit = U.logAudit, F = X.F, fld = X.fld, errBox = X.errBox, setErr = X.setErr, dlg = X.dlg, A = EXT.actions, V = EXT.views.lab, CAT = D.CATALOG;
  const CATS = ['Sangre y química', 'Hormonas', 'Orina y heces', 'Infecciones y trópico', 'Cultivos', 'Imagen y estudios'];
  const KINDN = { none: 'Texto', pos: 'Positivo o negativo', cult: 'Cultivo con antibiograma', report: 'Informe del especialista' };
  function render() { window.render(); }
  S.npk = S.npk || [];

  /* ---------- Catálogo: categorías que se despliegan, una tarjeta por examen ---------- */
  S.acc = S.acc || {};
  function accOpen(k) { return !!S.acc[k]; }
  function accHead(k, title, sub, right) { const o = accOpen(k); return '<button type="button" class="acch" data-a="acc" data-v="' + esc(k) + '" aria-expanded="' + o + '"><span class="t">' + title + (sub ? '<span class="s">' + sub + '</span>' : '') + '</span>' + (right || '') + '<i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>'; }
  A['acc'] = function (v) { const g = v.split(':')[0]; const was = S.acc[v]; if (g === 'c' || g === 'e' || g === 'p') Object.keys(S.acc).forEach(function (k) { if (k.split(':')[0] === g) delete S.acc[k]; }); if (!was) S.acc[v] = true; if (g === 'c' && !was) Object.keys(S.acc).forEach(function (k) { if (k.charAt(0) === 'e') delete S.acc[k]; }); render(); };
  function money3(usd) { return '<div class="eq"><span>Dólares <b>' + L.fmtUsd(usd) + '</b></span><span>Bs BCV <b>' + L.fmtBs(usd * D.RATES.bcv.value) + '</b></span><span>Bs USDT <b>' + L.fmtBs(usd * D.RATES.usdt.value) + '</b></span></div>'; }
  const CURS = [{ v: 'usd', l: 'Dólares' }, { v: 'bcv', l: 'Bolívares al dólar BCV' }, { v: 'usdt', l: 'Bolívares al USDT' }, { v: 'manual', l: 'Bolívares a mi tasa propia' }];
  function examCard(c, i) {
    const g = c.price - c.cost; const pct = c.price ? Math.round(g / c.price * 100) : 0; c.cur = F('excur-' + i, c.cur || 'bcv'); const rate = c.cur === 'usd' ? 1 : c.cur === 'manual' ? S.manualRate : D.RATES[c.cur].value; const pub = c.cur === 'usd' ? L.fmtUsd(c.price) : L.fmtBs(c.price * rate);
    return '<div class="accb exc">' +
      '<div class="exgrid"><label class="f"><span>Precio (USD)</span><input type="number" inputmode="decimal" step="0.5" min="0" value="' + c.price + '" data-c="price" data-i="' + i + '"></label><label class="f"><span>Costo (USD)</span><input type="number" inputmode="decimal" step="0.1" min="0" value="' + c.cost + '" data-c="cost" data-i="' + i + '"></label></div>' +
      '<div class="gain ' + (g < 0 ? 'neg' : '') + '"><small>Ganancia que calcula LABS</small><b>' + L.fmtUsd(g) + '</b><span>' + pct + ' % del precio</span></div>' +
      fld('Se cobra en', 'excur-' + i, { type: 'select', r: true, def: c.cur, options: CURS }) +
      '<div class="gain pay"><small>El paciente paga</small><b>' + pub + '</b></div>' +
      '<div class="kv"><small>Cómo se entrega el resultado</small><b>' + esc(KINDN[c.kind] || ('Números · ' + U.normalText(c) + ' ' + esc(c.unit || ''))) + '</b></div>' +
      (c.notif || c.sens ? '<div class="row">' + (c.notif ? '<span class="chip warn">Notificación obligatoria</span>' : '') + (c.sens ? '<span class="chip gray">Sensible</span>' : '') + '</div>' : '') +
      '<button class="btn rm sm" type="button" data-a="exdel" data-i="' + i + '" aria-label="Quitar ' + esc(c.name) + '">Quitar este examen</button></div>';
  }
  V.catalogo = function () {
    const m = S.mode; const q = F('ct-q').trim().toLowerCase();
    const note = m === 'usd' ? 'Precios en dólares. Cada orden guarda el precio en dólares y la tasa del momento.' : m === 'manual' ? 'Tasa propia: ' + L.fmtBs(S.manualRate) + ' por dólar.' : D.RATES[m].label + ': ' + L.fmtBs(D.RATES[m].value) + '. ' + D.RATES[m].note + '.';
    const groups = CATS.concat(CAT.map(function (c) { return c.cat; }).filter(function (c, i, a) { return c && CATS.indexOf(c) < 0 && a.indexOf(c) === i; }));
    const list = groups.map(function (g) { const rows = CAT.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) { return x.c.cat === g && (!q || x.c.name.toLowerCase().indexOf(q) >= 0); }); return { g: g, rows: rows }; }).filter(function (x) { return x.rows.length; });
    const body = list.length ? list.map(function (x) {
      const k = 'c:' + x.g; const open = q ? true : accOpen(k);
      return '<div class="acc">' + (q ? '<div class="acch static"><span class="t">' + esc(x.g) + '</span><span class="cnt">' + x.rows.length + '</span></div>' : accHead(k, esc(x.g), '', '<span class="cnt">' + x.rows.length + '</span>')) +
        (open ? '<div class="accb">' + x.rows.map(function (r) { const ek = 'e:' + r.i; const eo = accOpen(ek); return '<div class="exrow' + (eo ? ' open' : '') + '"><button type="button" class="acch ex" data-a="acc" data-v="' + ek + '" aria-expanded="' + eo + '"><span class="t">' + esc(r.c.name) + '</span><b class="pr">' + L.fmtUsd(r.c.price) + '</b><i class="chev' + (eo ? ' open' : '') + '" aria-hidden="true">›</i></button>' + (eo ? examCard(r.c, r.i) : '') + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') : '<p class="muted">No hay exámenes con ese nombre.</p>';
    return '<div class="head"><div><h1>Exámenes y precios</h1><p>Carga lo que ofreces. Los precios se guardan en dólares.</p></div>' + U.modeSelect() + '</div>' +
      '<div class="grid"><div class="card kpi"><small>Dólar BCV (ejemplo)</small><b>' + L.fmtBs(D.RATES.bcv.value) + '</b><small>Fuente oficial</small></div><div class="card kpi"><small>USDT (ejemplo)</small><b>' + L.fmtBs(D.RATES.usdt.value) + '</b><small>Mercado entre personas</small></div><div class="card kpi"><small>Tasa propia</small><label class="f"><span class="sr">Tasa propia en bolívares por dólar</span><input type="number" step="0.01" min="1" value="' + S.manualRate + '" data-c="manual"></label><small>Solo el dueño la cambia</small></div><div class="card kpi"><small>Exámenes y paquetes</small><b>' + CAT.length + ' · ' + D.PACKAGES.length + '</b><small>En tu catálogo</small></div></div>' +
      '<div class="card"><h2>Exámenes</h2><p class="small muted">' + note + ' Toca un grupo y luego el examen que quieres configurar.</p>' + fld('Buscar', 'ct-q', { ph: 'Nombre del examen' }) + body + '</div>' +
      pkgCard() + addCard();
  };
  function pkgCard() {
    const q = F('npk-q').trim().toLowerCase(); const sel = S.npk; const sum = sel.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0); const sug = Math.round(sum * 0.85 * 2) / 2;
    const list = D.PACKAGES.map(function (p) {
      const s = p.items.reduce(function (t, e) { return t + D.BY_ID[e].price; }, 0); const k = 'p:' + p.id; const o = accOpen(k); const save = s ? Math.round((s - p.price) / s * 100) : 0;
      return '<div class="acc">' + accHead(k, esc(p.name), p.items.length + ' exámenes', '<b class="pr">' + L.fmtUsd(p.price) + '</b>') + (o ? '<div class="accb exc"><div class="chips">' + p.items.map(function (e) { return '<span class="chip gray">' + esc(D.BY_ID[e].name) + '</span>'; }).join('') + '</div><div class="kv"><small>Suma de los exámenes sueltos</small><b>' + L.fmtUsd(s) + '</b></div><label class="f"><span>Precio del paquete (USD)</span><input type="number" inputmode="decimal" step="0.5" min="0" data-c="f-pkp-' + p.id + '" value="' + esc(F('pkp-' + p.id, String(p.price))) + '"></label><div class="gain pay"><small>El paciente ahorra</small><b>' + (save > 0 ? save + ' %' : 'Nada') + '</b></div><div class="btnrow"><button class="btn sm" type="button" data-a="pk-save" data-v="' + p.id + '">Guardar precio</button><button class="btn rm sm" type="button" data-a="pk-del" data-v="' + p.id + '">Quitar</button></div></div>' : '') + '</div>';
    }).join('');
    const form = '<div class="grid two">' + fld('Nombre del paquete', 'npk-name') + fld('Buscar exámenes para agregar', 'npk-q', { ph: 'Ej.: hepatitis' }) + '</div>' + (q ? '<div class="pill-row">' + CAT.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 12).map(function (c) { return '<button type="button" class="btn ghost sm" data-a="npk-ex" data-v="' + c.id + '">+ ' + esc(c.name) + '</button>'; }).join('') + '</div>' : '') +
      (sel.length ? '<div class="pill-row">' + sel.map(function (e) { return '<button type="button" class="btn sm" data-a="npk-ex" data-v="' + e + '" aria-label="Quitar ' + esc(D.BY_ID[e].name) + '">✓ ' + esc(D.BY_ID[e].name) + ' ✕</button>'; }).join('') + '</div><p class="small muted">Suma suelta: ' + L.fmtUsd(sum) + ' · Precio sugerido con 15 % menos: ' + L.fmtUsd(sug) + '</p>' : '<p class="small muted">Busca y toca los exámenes que lleva el paquete.</p>') + fld('Precio del paquete (USD, vacío = el sugerido)', 'npk-price', { type: 'number', mode: 'decimal' }) + errBox('npk') + '<button class="btn sm" type="button" data-a="npk-add">Crear paquete</button>';
    return '<div class="card"><h2>Paquetes (perfiles)</h2><p class="small muted">Un paquete junta varios exámenes con un solo precio. Se elige en “Nueva orden”.</p>' + errBox('pks') + list +
      '<div class="acc">' + accHead('newpk', 'Crear un paquete nuevo', '', '<span class="plus">＋</span>') + (accOpen('newpk') ? '<div class="accb">' + form + '</div>' : '') + '</div></div>';
  }
  function addCard() {
    const form = '<div class="grid">' + fld('Nombre', 'ex-name') + fld('Grupo', 'ex-cat', { type: 'select', options: CATS }) + fld('Cómo se entrega el resultado', 'ex-type', { type: 'select', options: [{ v: 'none', l: 'Texto libre' }, { v: 'pos', l: 'Positivo o negativo' }, { v: 'cult', l: 'Cultivo con antibiograma' }, { v: 'report', l: 'Informe del especialista (rayos X, eco…)' }] }) + fld('Precio (USD)', 'ex-price', { type: 'number', mode: 'decimal' }) + fld('Costo (USD)', 'ex-cost', { type: 'number', mode: 'decimal' }) + '</div>' + fld('Es de notificación obligatoria al Ministerio de Salud', 'ex-notif', { type: 'checkbox' }) + fld('Es un resultado sensible (VIH, genética, etc.)', 'ex-sens', { type: 'checkbox' }) + errBox('ex') + '<button class="btn sm" type="button" data-a="ex-add">Agregar al catálogo</button>';
    return '<div class="card"><h2>Agregar un examen o estudio</h2><div class="acc">' + accHead('newex', 'Nuevo examen', '', '<span class="plus">＋</span>') + (accOpen('newex') ? '<div class="accb">' + form + '</div>' : '') + '</div></div>';
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
      '<div class="tw" data-keep-table="1"><table style="min-width:620px"><thead><tr><th>Enfermedad</th><th>Esta semana</th><th>Promedio antes</th><th>Últimas 12 semanas</th><th>Estado</th></tr></thead><tbody>' + TROP.map(function (t) {
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
