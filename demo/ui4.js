/* LABS demo · laboratorio: órdenes, resultados, pacientes, suscripción, configuración, equipo */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT;
  const esc = U.esc, toast = U.toast, chipFor = U.chipFor, logAudit = U.logAudit; const X = EXT.fn;
  const F = X.F, fld = X.fld, errBox = X.errBox, setErr = X.setErr, dlg = X.dlg, notify = X.notify, uid = X.uid, A = EXT.actions;
  const CAT = D.CATALOG;
  function render() { window.render(); }

  /* ---------- Datos ---------- */
  S.team = [
    { id: 't1', name: 'Lic. Carla Mendoza', email: 'lab@demo.com', role: 'Dueña y bioanalista', status: 'Activa' },
    { id: 't2', name: 'Gabriela Ruiz', email: 'recep@demo.com', role: 'Recepción', status: 'Activa' },
    { id: 't3', name: 'Dr. Andrés Lozada', email: 'andres@laboratorio.com', role: 'Radiólogo', status: 'Activa' },
    { id: 't4', name: 'Dra. Elena Suárez', email: 'elena@laboratorio.com', role: 'Cardióloga', status: 'Activa' }
  ];
  S.payments = [
    { id: 'pg1', labId: 'l1', when: '12 oct', amount: 20, method: 'Zelle', ref: 'ZL-88213', status: 'Confirmado' },
    { id: 'pg2', labId: 'l1', when: '12 sep', amount: 20, method: 'Pago móvil', ref: 'PM-20931', status: 'Confirmado' },
    { id: 'pg3', labId: 'l1', when: '12 ago', amount: 20, method: 'Transferencia', ref: 'TR-55109', status: 'Confirmado' },
    { id: 'pg4', labId: 'l3', when: 'Hoy 07:30', amount: 20, method: 'Zelle', ref: 'ZL-90412', status: 'Pendiente' },
    { id: 'pg5', labId: 'l5', when: 'Ayer 15:10', amount: 20, method: 'Pago móvil', ref: 'PM-77120', status: 'Pendiente' }
  ];
  S.lcfg = { name: S.labs[0].name, rif: 'J-12345678-9', addr: 'Av. Bolívar Norte, Valencia, Carabobo', phone: '0241-5550100', hours: 'Lunes a sábado, 7:00 a. m. a 4:00 p. m.', sedes: ['Sede Principal · Valencia'], pay: { 'Efectivo USD': true, 'Zelle': true, 'Pago móvil': true, 'Transferencia Bs': true, 'Punto de venta': false, 'USDT': false }, mail: false, net: true };
  S.pnotes = {};
  const NOW = new Date();
  function mk(id, pid, exams, status, paid, extra) {
    const usd = exams.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0), cost = exams.reduce(function (s, e) { return s + D.BY_ID[e].cost; }, 0);
    return Object.assign({ id: id, pid: pid, exams: exams, usd: usd, cost: cost, cur: 'bcv', rate: D.RATES.bcv.value, method: 'Efectivo USD', paid: paid, status: status, when: 'Hoy 08:' + (10 + Math.floor(Math.random() * 40)), by: 'Gabriela Ruiz', doctor: '', via: 'QR', resultIdx: null }, extra || {});
  }
  S.orders = [
    mk('LAB-0146', 'p5', ['ecg', 'tsh'], 'Por procesar', true),
    mk('LAB-0145', 'p4', ['rx'], 'Por procesar', true),
    mk('LAB-0144', 'p3', ['hem', 'cre', 'ure'], 'Esperando paciente', false, { via: 'Cédula' }),
    mk('LAB-0143', 'p2', ['glu', 'col'], 'Por procesar', false),
    mk('LAB-0142', 'p1', ['glu', 'col', 'hdl', 'tri', 'ldl'], 'Enviada', true, { resultIdx: 0, when: '14 nov' }),
    mk('LAB-0121', 'p5', ['hem', 'cre', 'ure'], 'Enviada', true, { resultIdx: 3, when: '12 nov' }),
    mk('LAB-0125', 'p2', ['glu', 'col'], 'Enviada', true, { resultIdx: 5, when: '9 nov' }),
    mk('LAB-0110', 'p4', ['cre', 'ure'], 'Enviada', true, { resultIdx: 4, when: '2 nov' })
  ];
  S.oseq = 147; S.ofilter = 'todas'; S.no = { pid: null, via: '', exams: [], pkgs: [] };
  S.notifs.pat.unshift({ id: uid('n'), when: 'Hoy 08:20', text: 'El Laboratorio Ejemplo creó la orden LAB-0144 a tu nombre. Confírmala si es tuya.', action: { type: 'ordconf', ref: 'LAB-0144' }, read: false, pid: 'p3', done: '' });
  function pname(pid) { const p = X.personOf(pid); return p ? p.name : '—'; }
  function isOwner() { return !S.auth || (S.auth.sub || 'owner') === 'owner'; }
  function examNames(ids) { return ids.map(function (e) { return D.BY_ID[e].name; }).join(', '); }
  function stChip(s) { return '<span class="chip ' + (s === 'Enviada' ? 'ok' : s === 'Anulada' ? 'crit' : s === 'Esperando paciente' ? 'gray' : 'warn') + '">' + s + '</span>'; }
  function payChip(o) { return o.paid ? '<span class="chip ok">Pagado</span>' : '<span class="chip warn">Sin pagar</span>'; }
  function findOrder(id) { return S.orders.filter(function (o) { return o.id === id; })[0]; }
  function pendingCount() { return S.orders.filter(function (o) { return o.status === 'Por procesar' || o.status === 'En proceso'; }).length; }

  /* ---------- Menú ---------- */
  EXT.nav.lab = [
    { sep: 'Operación' }, { id: 'nueva', label: 'Nueva orden' }, { id: 'ordenes', label: 'Órdenes', badge: function () { return pendingCount() || ''; }, },
    { id: 'resultado', label: 'Resultado', hidden: true, only: ['owner'] }, { id: 'pacientes', label: 'Pacientes' },
    { sep: 'Negocio', only: ['owner'] }, { id: 'resumen', label: 'Resumen', only: ['owner'] }, { id: 'catalogo', label: 'Exámenes y precios', only: ['owner'] }, { id: 'reportes', label: 'Reportes', only: ['owner'] }, { id: 'red', label: 'Red de laboratorios', only: ['owner'] },
    { sep: 'Mi laboratorio', only: ['owner'] }, { id: 'firma', label: 'Firma y sello', only: ['owner'] }, { id: 'equipo', label: 'Mi equipo', only: ['owner'] }, { id: 'suscripcion', label: 'Mi suscripción', only: ['owner'] }, { id: 'config', label: 'Configuración', only: ['owner'] },
    { sep: 'Cuenta' }, { id: 'avisos', label: 'Avisos', badge: function () { return X.unread('lab') || ''; } }, { id: 'perfil', label: 'Mi cuenta' }, { id: 'soporte', label: 'Soporte' }
  ];
  const V = EXT.views.lab; const LV = U.labViews;

  /* ---------- Resumen / catálogo / reportes / red / firma envueltos ---------- */
  V.resumen = function () {
    const nw = S.orders.filter(function (o) { return o.status === 'Esperando paciente'; }).length, pr = pendingCount(), np = S.orders.filter(function (o) { return !o.paid && o.status !== 'Anulada'; }).length;
    const lab = S.labs[0]; const warn = lab.due <= 7 ? '<div class="banner" role="status">Tu suscripción vence en ' + lab.due + ' días. <button class="btn ghost sm" type="button" data-a="nav" data-v="suscripcion">Ir a Configuración</button></div>' : '';
    return warn + '<div class="card"><h2>Pendientes de hoy</h2><div class="row"><button class="btn ghost" type="button" data-a="o-filter" data-v="esperando">' + nw + ' esperando al paciente</button><button class="btn ghost" type="button" data-a="o-filter" data-v="proceso">' + pr + ' por cargar resultados</button><button class="btn ghost" type="button" data-a="o-filter" data-v="sinpago">' + np + ' sin cobrar</button><button class="btn" type="button" data-a="nav" data-v="nueva">Nueva orden</button></div></div>' + LV.resumen();
  };
  V.catalogo = function () {
    return LV.catalogo() + '<div class="card"><h2>Agregar un examen o estudio</h2><p class="small muted">Los estudios por imagen, del corazón o del cerebro llevan un informe del especialista en lugar de números.</p><div class="grid">' + fld('Nombre', 'ex-name') + fld('Tipo', 'ex-type', { type: 'select', options: [{ v: 'none', l: 'Examen de laboratorio con resultado en texto' }, { v: 'report', l: 'Estudio con informe (rayos X, eco, resonancia…)' }] }) + fld('Precio (USD)', 'ex-price', { type: 'number', mode: 'decimal' }) + fld('Costo (USD)', 'ex-cost', { type: 'number', mode: 'decimal' }) + '</div>' + errBox('ex') + '<div class="row"><button class="btn" type="button" data-a="ex-add">Agregar al catálogo</button></div></div>';
  };
  V.reportes = function () { return LV.reportes() + '<div class="card"><h2>Llevar los datos</h2><div class="row"><button class="btn ghost" type="button" data-a="rep-csv">Descargar resumen mensual (CSV)</button><button class="btn ghost" type="button" data-a="print">Imprimir</button></div></div>'; };
  V.red = function () { return '<div class="card"><div class="row between"><div><h2>Participar en la red</h2><p class="small muted">Si participas, tus conteos se suman (sin nombres) a las alertas de la zona y tú ves las alertas aprobadas.</p></div><button class="btn ' + (S.lcfg.net ? 'warn' : '') + '" type="button" data-a="net-toggle">' + (S.lcfg.net ? 'Dejar de participar' : 'Participar') + '</button></div></div>' + (S.lcfg.net ? LV.red() : '<div class="card"><p>No participas en la red. Activa la participación para ver las alertas de tu zona.</p></div>'); };
  V.firma = LV.firma;
  V.avisos = X.avisosView; V.soporte = X.supportView;

  /* ---------- Nueva orden ---------- */
  function pkOf(id) { return D.PACKAGES.filter(function (p) { return p.id === id; })[0]; }
  function effEx(n) { const s = []; (n.pkgs || []).forEach(function (id) { pkOf(id).items.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); }); n.exams.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); return s; }
  function priceNo(n) { let t = 0; const cov = []; (n.pkgs || []).forEach(function (id) { const p = pkOf(id); t += p.price; p.items.forEach(function (e) { cov.push(e); }); }); n.exams.forEach(function (e) { if (cov.indexOf(e) < 0) t += D.BY_ID[e].price; }); return t; }
  function totalUsd(ex) { return priceNo({ exams: ex, pkgs: [] }); }
  function fourViews(usd) { return '<div class="grid"><div class="card kpi"><small>Dólares</small><b>' + L.fmtUsd(usd) + '</b></div><div class="card kpi"><small>Bs · BCV</small><b>' + L.fmtBs(usd * D.RATES.bcv.value) + '</b></div><div class="card kpi"><small>Bs · USDT</small><b>' + L.fmtBs(usd * D.RATES.usdt.value) + '</b></div><div class="card kpi"><small>Bs · tasa propia</small><b>' + L.fmtBs(usd * S.manualRate) + '</b></div></div>'; }
  V.nueva = function () {
    const n = S.no; const p = n.pid ? X.personOf(n.pid) : null; const q = F('no-q').trim().toLowerCase(); const qd = q.replace(/\D/g, '');
    const found = q.length >= 3 ? S.patients.filter(function (x) { return x.id !== 'p7' && x.name !== 'Cuenta eliminada' && (x.name.toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && x.ci.replace(/\D/g, '').indexOf(qd) >= 0)); }) : [];
    const usd = priceNo(n); const eff = effEx(n); const cur = F('no-cur', 'bcv'); const rate = cur === 'usd' ? 1 : cur === 'manual' ? S.manualRate : D.RATES[cur].value;
    const groups = [['Laboratorio', CAT.filter(function (c) { return c.kind !== 'report'; })], ['Imagen y estudios del especialista', CAT.filter(function (c) { return c.kind === 'report'; })]];
    const pays = Object.keys(S.lcfg.pay).filter(function (k) { return S.lcfg.pay[k]; });
    return '<div class="head"><div><h1>Nueva orden</h1><p>Busca al paciente, marca los exámenes y cobra.</p></div></div>' +
      '<div class="grid two"><div class="card"><h2>1. Paciente</h2>' + (p ? '<div class="row between" style="background:rgba(76,95,213,0.1);padding:12px;border-radius:14px"><div><b>' + esc(p.name) + '</b><div class="small muted">' + esc(p.ci) + ' · ' + p.age + ' años · ' + (n.via === 'QR' ? 'Identificado con su código QR' : n.via === 'Registro' ? 'Registrado en este laboratorio: no necesita confirmar' : 'Identificado con la cédula: el paciente debe confirmar la orden en su teléfono') + '</div></div><button class="btn ghost sm" type="button" data-a="no-clear">Cambiar</button></div>' :
        fld('Cédula o nombre', 'no-q', { ph: 'Escribe al menos 3 caracteres' }) + (q.length >= 3 ? (found.length ? found.map(function (x) { return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><div><b>' + esc(x.name) + '</b><div class="small muted">' + esc(x.ci) + ' · ' + x.age + ' años</div></div><button class="btn sm" type="button" data-a="no-pick" data-v="' + x.id + '">Elegir</button></div>'; }).join('') : '<p class="small muted">No encontramos a nadie con ese dato.</p><div class="row"><button class="btn sm" type="button" data-a="pc-add">Registrar paciente nuevo</button></div>') : '') +
        '<hr>' + fld('O escribe el código QR del paciente', 'no-qr', { ph: 'LABS-0000-XXXX', enter: 'no-qrok' }) + errBox('noqr') + '<div class="row"><button class="btn ghost sm" type="button" data-a="no-qrok">Validar código QR</button></div><p class="small muted">El paciente lo ve en su teléfono, en “Mi código QR”. Vence a los 5 minutos y sirve una sola vez.</p>') + '</div>' +
      '<div class="card"><h2>3. Cobro</h2>' + fld('Cómo paga', 'no-method', { type: 'select', options: pays.length ? pays : ['Efectivo USD'] }) + fld('Cobrar en', 'no-cur', { type: 'select', r: true, options: [{ v: 'usd', l: 'Dólares' }, { v: 'bcv', l: 'Bolívares a tasa BCV' }, { v: 'usdt', l: 'Bolívares a tasa USDT' }, { v: 'manual', l: 'Bolívares a tasa propia' }] }) + fld('Médico que lo pidió (opcional)', 'no-doc', { type: 'select', options: ['Sin médico', 'Dra. Marisol Pérez', 'Otro médico'] }) +
        '<div class="card" style="background:rgba(76,95,213,0.1);box-shadow:none"><small class="muted">Total a cobrar</small><b style="font-size:26px">' + (cur === 'usd' ? L.fmtUsd(usd) : L.fmtBs(usd * rate)) + '</b>' + (cur === 'usd' ? '' : '<small class="muted">' + L.fmtUsd(usd) + ' a ' + L.fmtBs(rate) + ' por dólar. Esa tasa queda guardada en la orden.</small>') + '</div>' + fld('Ya me pagó', 'no-paid', { type: 'checkbox' }) + '</div></div>' +
      '<div class="card"><h2>2. Paquetes y exámenes</h2><h3>Paquetes (perfiles)</h3><div class="pill-row">' + D.PACKAGES.map(function (p) { const on = (n.pkgs || []).indexOf(p.id) >= 0; return '<button type="button" class="btn ' + (on ? '' : 'ghost') + ' sm" data-a="no-pk" data-v="' + p.id + '" aria-pressed="' + on + '">' + (on ? '✓ ' : '') + esc(p.name) + ' · ' + L.fmtUsd(p.price) + '</button>'; }).join('') + '</div>' + (n.pkgs && n.pkgs.length ? '<p class="small muted">Incluye ' + eff.length + ' exámenes: ' + esc(examNames(eff)) + '.</p>' : '') + '<h3>Exámenes sueltos</h3>' + fld('Buscar un examen', 'no-ex-q', { ph: 'Ej.: dengue, hepatitis, orina…' }) + (function () { const q = F('no-ex-q').trim().toLowerCase(); const cats = ['Sangre y química', 'Hormonas', 'Orina y heces', 'Infecciones y trópico', 'Cultivos', 'Imagen y estudios']; return cats.map(function (cn) { const list = CAT.filter(function (c) { return c.cat === cn && (!q || c.name.toLowerCase().indexOf(q) >= 0); }); if (!list.length) return ''; return '<details class="acc"' + (q || cn === 'Sangre y química' || n.exams.some(function (e) { return D.BY_ID[e].cat === cn; }) ? ' open' : '') + '><summary>' + cn + ' (' + list.length + ')</summary><div class="pill-row">' + list.map(function (c) { const on = n.exams.indexOf(c.id) >= 0; return '<button type="button" class="btn ' + (on ? '' : 'ghost') + ' sm" data-a="no-ex" data-v="' + c.id + '" aria-pressed="' + on + '">' + (on ? '✓ ' : '') + esc(c.name) + ' · ' + L.fmtUsd(c.price) + '</button>'; }).join('') + '</div></details>'; }).join('') || '<p class="muted">No hay exámenes con ese nombre.</p>'; })() + '</div>' +
      '<div class="card"><h2>Total en las cuatro formas</h2>' + fourViews(usd) + errBox('no') + '<div class="row"><button class="btn" type="button" data-a="no-create">Crear orden</button><button class="btn ghost" type="button" data-a="no-reset">Limpiar</button></div></div>';
  };
  A['no-pick'] = function (v) { S.no.pid = v; S.no.via = (X.personOf(v) || {}).labOnly ? 'Registro' : 'Cédula'; clearForm('no-q'); S.err = {}; render(); };
  A['no-clear'] = function () { S.no.pid = null; S.no.via = ''; render(); };
  function clearForm(k) { delete S.f[k]; }
  A['no-qrok'] = function () {
    const c = F('no-qr').trim().toUpperCase(); if (!c) return setErr('noqr', 'Escribe el código QR del paciente.'); S.qrUsed = S.qrUsed || [];
    if (S.qrUsed.indexOf(c) >= 0) return setErr('noqr', 'Ese código ya se usó. Pídele al paciente uno nuevo.');
    if (Date.now() > S.qrEnds) return setErr('noqr', 'Ese código venció. Pídele al paciente uno nuevo.');
    const p = S.patients.filter(function (x) { return EXT.fn.qrCodeOf(x.id) === c; })[0]; if (!p) return setErr('noqr', 'Código no válido. Revisa que esté bien escrito.');
    S.qrUsed.push(c); S.qrN++; S.qrEnds = Date.now() + 300000; S.no.pid = p.id; S.no.via = 'QR'; delete S.f['no-qr']; S.err = {}; toast('Paciente identificado: ' + p.name + '.'); logAudit(S.auth.name, 'Aceptó un código QR de paciente (un solo uso)');
  };
  A['no-pk'] = function (v) { S.no.pkgs = S.no.pkgs || []; const i = S.no.pkgs.indexOf(v); if (i >= 0) S.no.pkgs.splice(i, 1); else S.no.pkgs.push(v); render(); };
  A['no-ex'] = function (v) { const i = S.no.exams.indexOf(v); if (i >= 0) S.no.exams.splice(i, 1); else S.no.exams.push(v); render(); };
  A['no-reset'] = function () { S.no = { pid: null, via: '', exams: [], pkgs: [] }; ['no-ex-q', 'no-q', 'no-qr', 'no-paid', 'no-method', 'no-cur', 'no-doc'].forEach(clearForm); S.err = {}; render(); };
  A['no-create'] = function () {
    const n = S.no; if (!n.pid) return setErr('no', 'Elige primero al paciente.'); if (!effEx(n).length) return setErr('no', 'Marca al menos un paquete o un examen.');
    const cur = F('no-cur', 'bcv'); const rate = cur === 'usd' ? 1 : cur === 'manual' ? S.manualRate : D.RATES[cur].value; const usd = priceNo(n); const cost = effEx(n).reduce(function (s, e) { return s + D.BY_ID[e].cost; }, 0);
    const id = 'LAB-0' + (S.oseq++); const status = n.via === 'QR' || n.via === 'Registro' ? 'Por procesar' : 'Esperando paciente';
    const o = { id: id, pid: n.pid, exams: effEx(n), pkgs: (n.pkgs || []).map(function (id) { return pkOf(id).name; }), usd: usd, cost: cost, cur: cur, rate: rate, method: F('no-method', 'Efectivo USD'), paid: !!F('no-paid'), status: status, when: X.when(), by: S.auth.name, doctor: F('no-doc', 'Sin médico') === 'Sin médico' ? '' : F('no-doc'), via: n.via, resultIdx: null };
    S.orders.unshift(o);
    if (status === 'Esperando paciente') notify('pat', 'El ' + S.labs[0].name + ' creó la orden ' + id + ' a tu nombre. Confírmala si es tuya.', { type: 'ordconf', ref: id }, n.pid);
    logAudit(S.auth.name, 'Creó la orden ' + id + (o.paid ? ' (cobrada)' : ' (sin cobrar)')); S.no = { pid: null, via: '', exams: [], pkgs: [] }; ['no-q', 'no-qr', 'no-paid', 'no-method', 'no-cur', 'no-doc'].forEach(clearForm); S.err = {};
    toast('Orden ' + id + ' creada.' + (status === 'Esperando paciente' ? ' Falta que el paciente la confirme en su teléfono.' : ' Cóbrala antes de tomar la muestra.')); S.lab = 'ordenes'; S.ofilter = 'todas'; render(); window.scrollTo(0, 0);
  };

  function patCell(pid) {
    const p = X.personOf(pid); if (!p) return '—'; const parts = (p.name || '').split(' '); const nom = p.first || parts[0] || '—', ape = p.last || parts.slice(1).join(' ') || '—';
    const ln = function (k, v) { return '<div class="small"><span class="muted">' + k + ':</span> ' + esc(v || '—') + '</div>'; };
    return '<b>' + esc(p.name) + '</b>' + ln('Cédula', p.ci) + ln('Teléfono', p.phone) + '<div class="pmore">' + ln('Nombre', nom) + ln('Apellido', ape) + ln('Correo', p.email) + ln('Dirección', p.address) + ln('Edad y sexo', (p.age && p.age !== '—' ? p.age + ' años' : '—') + ' · ' + (p.sex === 'F' ? 'Femenino' : p.sex === 'M' ? 'Masculino' : (p.sex || '—'))) + '</div>';
  }
  /* ---------- Órdenes ---------- */
  V.ordenes = function () {
    const flt = S.ofilter; const q = F('o-q').trim().toLowerCase();
    const filters = [['todas', 'Todas'], ['esperando', 'Esperando al paciente'], ['proceso', 'Por cargar resultados'], ['enviada', 'Enviadas'], ['sinpago', 'Sin pagar'], ['anulada', 'Anuladas']];
    let list = S.orders.filter(function (o) { return flt === 'todas' ? true : flt === 'esperando' ? o.status === 'Esperando paciente' : flt === 'proceso' ? (o.status === 'Por procesar' || o.status === 'En proceso') : flt === 'enviada' ? o.status === 'Enviada' : flt === 'sinpago' ? (!o.paid && o.status !== 'Anulada') : o.status === 'Anulada'; });
    if (q) list = list.filter(function (o) { const pp = X.personOf(o.pid) || {}; return (o.id + ' ' + pname(o.pid) + ' ' + (pp.ci || '') + ' ' + (pp.phone || '') + ' ' + examNames(o.exams)).toLowerCase().indexOf(q) >= 0; });
    return '<div class="head"><div><h1>Órdenes</h1><p>Todo lo que entra al laboratorio, de la orden al resultado.</p></div><button class="btn" type="button" data-a="nav" data-v="nueva">Nueva orden</button></div>' +
      '<div class="row"><div class="seg" role="group" aria-label="Filtrar órdenes">' + filters.map(function (f) { return '<button type="button" data-a="o-filter" data-v="' + f[0] + '" aria-pressed="' + (flt === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="card">' + fld('Buscar por número, paciente, cédula o examen', 'o-q', { ph: 'Escribe para filtrar' }) + (list.length ? '<div class="tw"><table style="min-width:860px"><thead><tr><th>Orden</th><th>Paciente</th><th>Exámenes</th><th>Total</th><th>Pago</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + list.map(function (o) {
        let acts = '';
        if (!o.paid && o.status !== 'Anulada') acts += '<button class="btn sm" type="button" data-a="o-pay" data-v="' + o.id + '">Cobrar primero</button>';
        if (o.status === 'Esperando paciente') acts += '<button class="btn ghost sm" type="button" data-a="o-remind" data-v="' + o.id + '">Recordar al paciente</button>';
        if (o.paid && (o.status === 'Por procesar' || o.status === 'En proceso') && isOwner()) acts += '<button class="btn sm" type="button" data-a="o-open" data-v="' + o.id + '">' + (o.status === 'En proceso' ? 'Continuar resultados' : 'Cargar resultados') + '</button>';
        if (o.status === 'Enviada') acts += '<button class="btn ghost sm" type="button" data-a="o-view" data-v="' + o.id + '">Ver resultado</button>';
        if (o.status !== 'Enviada' && o.status !== 'Anulada') acts += '<button class="btn ghost sm" type="button" data-a="o-void" data-v="' + o.id + '">Anular</button>';
        return '<tr><td><b>' + o.id + '</b><div class="small muted">' + esc(o.when) + '</div></td><td>' + patCell(o.pid) + '</td><td class="small">' + (o.pkgs && o.pkgs.length ? '<b>' + esc(o.pkgs.join(' + ')) + '</b><div class="muted">' + o.exams.length + ' exámenes</div>' : esc(examNames(o.exams))) + '</td><td>' + L.fmtUsd(o.usd) + '<div class="small muted">' + L.fmtBs(o.usd * o.rate) + '</div></td><td>' + payChip(o) + '</td><td>' + stChip(o.status) + (o.reason ? '<div class="small muted">' + esc(o.reason) + '</div>' : '') + '</td><td><div class="row">' + acts + '</div></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">No hay órdenes con ese filtro.</p>') + (isOwner() ? '' : '<p class="small muted">Recepción crea y cobra órdenes. Solo el bioanalista carga y firma los resultados.</p>') + '</div>';
  };
  A['o-filter'] = function (v) { S.ofilter = v; S.lab = 'ordenes'; render(); window.scrollTo(0, 0); };
  A['o-remind'] = function (v) { const o = findOrder(v); notify('pat', 'Recordatorio: confirma la orden ' + o.id + ' del ' + S.labs[0].name + '.', { type: 'ordconf', ref: o.id }, o.pid); toast('Recordatorio enviado al paciente.'); };
  A['o-view'] = function (v) { const o = findOrder(v); S.modal = { type: 'pdf', i: o.resultIdx, fresh: true }; render(); };
  A['o-pay'] = function (v) { const o = findOrder(v); const pays = Object.keys(S.lcfg.pay).filter(function (k) { return S.lcfg.pay[k]; }); dlg('Cobrar la orden ' + o.id, '<p>Total: <b>' + L.fmtUsd(o.usd) + '</b> (' + L.fmtBs(o.usd * o.rate) + ' a la tasa guardada)</p>' + fld('Cómo pagó', 'pay-m', { type: 'select', options: pays.length ? pays : ['Efectivo USD'] }), { label: 'Marcar como pagado', a: 'o-pay-ok', v: o.id }); };
  A['o-pay-ok'] = function (v) { const o = findOrder(v); o.paid = true; o.method = F('pay-m', o.method); delete S.f['pay-m']; S.modal = null; logAudit(S.auth.name, 'Cobró la orden ' + o.id + ' (' + o.method + ')'); toast('Orden ' + o.id + ' cobrada.'); };
  A['o-void'] = function (v) { const o = findOrder(v); dlg('Anular la orden ' + o.id, '<p>La orden no se borra: queda anulada y anotada en el registro.</p>' + fld('Motivo', 'vd-r', { type: 'select', options: ['El paciente no se hizo el examen', 'Error al crear la orden', 'Paciente duplicado', 'Otro motivo'] }) + errBox('vd'), { label: 'Anular orden', a: 'o-void-ok', v: o.id }); };
  A['o-void-ok'] = function (v) { const o = findOrder(v); o.status = 'Anulada'; o.reason = F('vd-r', 'El paciente no se hizo el examen'); delete S.f['vd-r']; S.modal = null; logAudit(S.auth.name, 'Anuló la orden ' + o.id + ': ' + o.reason); toast('Orden anulada.'); };

  /* ---------- Cargar resultados ---------- */
  const PRE = { normal: { glu: 88, col: 170, hdl: 55, ldl: 100, tri: 110, ure: 28, cre: 0.9, hem: 13.5, tsh: 2.1 }, alto: { glu: 108, col: 212, hdl: 52, ldl: 134, tri: 148, ure: 52, cre: 1.5, hem: 11, tsh: 4.8 }, critico: { glu: 285, col: 290, hdl: 30, ldl: 190, tri: 420, ure: 130, cre: 3.8, hem: 6.5, tsh: 9 } };
  const TXT = { hemog: 'Hematología sin alteraciones importantes.', ori: 'Color amarillo, aspecto claro, sin hallazgos anormales.', hec: 'No se observan parásitos.' };
  const REP = { rx: ['Campos pulmonares limpios. Silueta cardíaca de tamaño normal. Senos costofrénicos libres.', 'Radiografía de tórax sin alteraciones agudas.'], ecoab: ['Hígado de tamaño y ecogenicidad normales. Vesícula sin cálculos. Riñones sin dilatación.', 'Ecografía abdominal sin hallazgos patológicos.'], ecg: ['Ritmo sinusal, frecuencia de 72 por minuto, eje normal.', 'Electrocardiograma dentro de límites normales.'], eeg: ['Actividad de fondo organizada, sin descargas epileptiformes.', 'Electroencefalograma normal.'], rm: ['Menisco medial con señal degenerativa de grado II. Ligamentos cruzados íntegros.', 'Cambios degenerativos meniscales leves.'], tac: ['Sin colecciones ni desplazamiento de la línea media.', 'Tomografía de cráneo sin hallazgos agudos.'] };
  const SPEC = { rx: 'Dr. Andrés Lozada', ecoab: 'Dr. Andrés Lozada', rm: 'Dr. Andrés Lozada', tac: 'Dr. Andrés Lozada', ecg: 'Dra. Elena Suárez', eeg: 'Dra. Elena Suárez' };
  function specialists() { return S.team.filter(function (t) { return t.status === 'Activa' && t.role !== 'Recepción'; }).map(function (t) { return t.name; }); }
  function clearRes() { Object.keys(S.f).forEach(function (k) { if (/^(rv|rt|rh|rc|ri|rby|rp|rd|ro|rn|ra|sd)-/.test(k)) delete S.f[k]; }); }
  A['o-open'] = function (v) { const o = findOrder(v); clearRes(); if (o.draft) Object.keys(o.draft).forEach(function (k) { S.f[k] = o.draft[k]; }); S.ordSel = v; S.lab = 'resultado'; S.err = {}; render(); window.scrollTo(0, 0); };
  const ABX = ['Amoxicilina', 'Ampicilina', 'Ciprofloxacina', 'Ceftriaxona', 'Trimetoprim-sulfametoxazol', 'Gentamicina', 'Nitrofurantoína', 'Azitromicina'];
  const NUMK = ['range', 'max', 'min'];
  function isNum(c) { return NUMK.indexOf(c.kind) >= 0; }
  function genVal(c, sc) { const lo = c.lo, hi = c.hi; let v; if (c.kind === 'range') v = sc === 'normal' ? (lo + hi) / 2 : sc === 'alto' ? hi * 1.2 : lo * 0.3; else if (c.kind === 'max') v = sc === 'normal' ? hi * 0.6 : sc === 'alto' ? hi * 1.3 : hi * 3; else v = sc === 'normal' ? lo * 1.3 : sc === 'alto' ? lo * 0.8 : lo * 0.3; return String(Math.round(v * 10) / 10); }
  function posInput(c) { const id = c.id; return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><div class="row between"><h3>' + esc(c.name) + '</h3><span>' + (c.notif ? '<span class="chip warn">Notificación obligatoria</span> ' : '') + (c.sens ? '<span class="chip gray">Resultado sensible</span>' : '') + '</span></div>' + fld('Resultado', 'rp-' + id, { type: 'select', options: [{ v: '', l: 'Elige…' }, 'Negativo', 'Positivo', 'No concluyente'] }) + (F('rp-' + id) && F('rp-' + id) !== 'Negativo' ? fld((c.dl || 'Detalle (opcional)'), 'rd-' + id, { ph: 'Ej.: título, especie, densidad' }) : '') + '</div>'; }
  function cultInput(c) { const id = c.id; const ng = !!F('ro-' + id + '-ng'); return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><div class="row between"><h3>' + esc(c.name) + '</h3>' + (c.sens ? '<span class="chip gray">Resultado sensible</span>' : '') + '</div>' + fld('Sin desarrollo de bacterias', 'ro-' + id + '-ng', { type: 'checkbox', r: true }) + (ng ? '' : fld('Bacteria encontrada', 'ro-' + id, { ph: 'Ej.: Escherichia coli' }) + '<p class="small muted">Antibiograma: para cada antibiótico, S = sirve, I = a veces, R = no sirve.</p><div class="grid">' + ABX.map(function (a, i) { return fld(a, 'ra-' + id + '-' + i, { type: 'select', options: [{ v: '', l: 'No probado' }, { v: 'S', l: 'S · Sensible' }, { v: 'I', l: 'I · Intermedio' }, { v: 'R', l: 'R · Resistente' }] }); }).join('') + '</div>') + '</div>'; }
  function inputsFor(o) {
    return o.exams.map(function (id) {
      const c = D.BY_ID[id];
      if (c.kind === 'report') return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><h3>' + esc(c.name) + ' <span class="chip gray">Informe del especialista</span></h3>' + fld('Hallazgos', 'rh-' + id, { type: 'textarea', ph: 'Qué se observa en el estudio' }) + fld('Conclusión', 'rc-' + id, { type: 'textarea' }) + fld('Interpretó', 'rby-' + id, { type: 'select', options: specialists(), def: SPEC[id] }) +
        '<label class="f">Imagen o PDF del estudio (opcional, hasta 2 MB)<input type="file" accept="image/*" data-c="file-ri-' + id + '"></label>' + (F('ri-' + id) ? '<img src="' + F('ri-' + id) + '" alt="Imagen adjunta" style="max-width:200px;border-radius:12px"><div><button class="btn ghost sm" type="button" data-a="ri-del" data-v="' + id + '">Quitar imagen</button></div>' : '') + '</div>';
      if (c.kind === 'pos') return posInput(c);
      if (c.kind === 'cult') return cultInput(c);
      if (c.kind === 'none') return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><h3>' + esc(c.name) + '</h3>' + fld('Resultado (texto)', 'rt-' + id, { type: 'textarea' }) + '</div>';
      const v = F('rv-' + id); const j = v !== '' && isFinite(parseFloat(v)) ? L.judge({ id: id, v: parseFloat(v) }) : null;
      return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><div class="row between"><h3>' + esc(c.name) + '</h3><span id="chip-' + id + '">' + (j ? chipFor(j.level, j.label) : '<span class="chip gray">Sin valor</span>') + '</span></div><div class="row" style="flex-wrap:nowrap"><div style="flex:1">' + fld('Valor (' + c.unit + ')', 'rv-' + id, { type: 'number', mode: 'decimal' }) + '</div><div class="small muted" style="padding-top:20px">Normal: ' + U.normalText(c) + '</div></div></div>';
    }).join('');
  }
  A['ri-del'] = function (v) { delete S.f['ri-' + v]; render(); };
  EXT.onInputP = function (n, t) {
    if (n.indexOf('rv-') === 0) { const id = n.slice(3); const el = document.getElementById('chip-' + id); const x = parseFloat(t.value); if (el) el.innerHTML = isFinite(x) ? (function () { const j = L.judge({ id: id, v: x }); return chipFor(j.level, j.label); })() : '<span class="chip gray">Sin valor</span>'; }
    if (n === 'sd-code') { const b = document.querySelector('[data-a="res-send"]'); }
  };
  document.addEventListener('change', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c'); if (!c || c.indexOf('file-ri-') !== 0) return; const id = c.slice(8); const f = t.files && t.files[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setErr('rs', 'La imagen pesa más de 2 MB. En el demo se permite hasta 2 MB.');
    const r = new FileReader(); r.onload = function () { S.f['ri-' + id] = r.result; S.err = {}; render(); }; r.onerror = function () { setErr('rs', 'No se pudo leer el archivo.'); }; r.readAsDataURL(f);
  });
  function collect(o) {
    const values = [], texts = {}, reports = {}, pos = {}, cult = {}; const errs = [];
    o.exams.forEach(function (id) {
      const c = D.BY_ID[id];
      if (c.kind === 'report') { const h = F('rh-' + id).trim(), cc = F('rc-' + id).trim(); if (h.length < 10) errs.push('Escribe los hallazgos de “' + c.name + '” (al menos 10 letras).'); else if (cc.length < 5) errs.push('Escribe la conclusión de “' + c.name + '”.'); else reports[id] = { hallazgos: h, conclusion: cc, img: F('ri-' + id) || '', by: F('rby-' + id, SPEC[id] || specialists()[0]) }; }
      else if (c.kind === 'pos') { const r = F('rp-' + id); if (!r) errs.push('Elige el resultado de “' + c.name + '”.'); else pos[id] = { res: r, detail: F('rd-' + id).trim() }; }
      else if (c.kind === 'cult') { if (F('ro-' + id + '-ng')) cult[id] = { org: '', rows: [], none: true }; else { const org = F('ro-' + id).trim(); if (org.length < 3) errs.push('Escribe la bacteria de “' + c.name + '” o marca “Sin desarrollo”.'); else { const rows = ABX.map(function (a, i) { return { ab: a, r: F('ra-' + id + '-' + i) }; }).filter(function (x) { return x.r; }); if (!rows.length) errs.push('Marca al menos un antibiótico en el antibiograma de “' + c.name + '”.'); else cult[id] = { org: org, rows: rows, none: false }; } } }
      else if (c.kind === 'none') { const t = F('rt-' + id).trim(); if (t.length < 3) errs.push('Escribe el resultado de “' + c.name + '”.'); else texts[id] = t; }
      else { const raw = F('rv-' + id); const x = parseFloat(raw); const top = (c.hi || (c.lo || 1) * 2) * 15; if (raw === '' || !isFinite(x)) errs.push('Falta el valor de “' + c.name + '”.'); else if (x <= 0 || x > top) errs.push('El valor de “' + c.name + '” (' + x + ') es imposible. Revisa que esté bien escrito.'); else values.push({ id: id, v: x }); }
    });
    return { values: values, texts: texts, reports: reports, pos: pos, cult: cult, errs: errs };
  }
  V.resultado = function () {
    const o = findOrder(S.ordSel); if (!o) return '<div class="card"><p>No hay una orden abierta.</p><button class="btn" type="button" data-a="nav" data-v="ordenes">Ir a Órdenes</button></div>'; const p = X.personOf(o.pid);
    const vals = o.exams.filter(function (e) { return isNum(D.BY_ID[e]); }).map(function (e) { const x = parseFloat(F('rv-' + e)); return isFinite(x) && x > 0 ? { id: e, v: x } : null; }).filter(Boolean);
    const sum = L.summarize(vals); const crit = sum.worst === 'urgente'; const needNum = o.exams.some(function (e) { return isNum(D.BY_ID[e]); }); const posNotif = o.exams.some(function (e) { return D.BY_ID[e].notif && F('rp-' + e) === 'Positivo'; }); const sensAny = o.exams.some(function (e) { return D.BY_ID[e].sens; });
    return '<div class="head"><div><button class="btn ghost sm" type="button" data-a="nav" data-v="ordenes">Volver a Órdenes</button></div></div><div><h1>Resultados de la orden ' + o.id + '</h1><p class="small muted">' + esc(p.name) + ' · ' + esc(p.ci) + ' · ' + p.age + ' años · ' + esc(examNames(o.exams)) + '</p></div>' +
      (needNum ? '<div class="card"><h2>Rellenar con un caso de ejemplo</h2><div class="row"><button class="btn ghost sm" type="button" data-a="res-fill" data-v="normal">Todo normal</button><button class="btn ghost sm" type="button" data-a="res-fill" data-v="alto">Con valores altos</button><button class="btn ghost sm" type="button" data-a="res-fill" data-v="critico">Con un valor crítico</button></div></div>' : '<div class="row"><button class="btn ghost sm" type="button" data-a="res-fill" data-v="normal">Rellenar con un ejemplo</button></div>') +
      '<div class="card"><h2>1. Escribe los resultados</h2>' + inputsFor(o) + errBox('rs') + '<div class="row"><button class="btn ghost" type="button" data-a="res-draft">Guardar borrador</button></div></div>' +
      '<div class="card"><h2>2. Revisa y firma</h2>' + (crit ? '<div class="card" style="background:var(--crit-bg);color:var(--crit-ink);box-shadow:none"><p><b>Valor crítico.</b> Este resultado no puede esperar a que el paciente abra la app. Llama al paciente o a su médico antes de enviarlo.</p>' + fld('Ya llamé al paciente o a su médico (se anota la hora ' + U.nowTime() + ')', 'sd-call', { type: 'checkbox' }) + '</div>' : '') + (posNotif ? '<div class="card" style="background:var(--warn-bg);color:var(--warn-ink);box-shadow:none"><p><b>Enfermedad de notificación obligatoria.</b> Un resultado positivo debe avisarse al Ministerio de Salud. LABS no lo hace por ti.</p>' + fld('Notifiqué o notificaré este caso al Ministerio de Salud', 'sd-notif', { type: 'checkbox' }) + '</div>' : '') + (sensAny ? '<div class="card" style="box-shadow:none"><p><b>Resultado sensible.</b> El paciente lo verá solo con su cuenta y su PIN, y el aviso nunca dice de qué examen se trata.</p>' + fld('Ofrecí orientación al paciente antes de entregar este resultado', 'sd-sens', { type: 'checkbox' }) + '</div>' : '') + fld('Revisé cada valor y está correcto', 'sd-review', { type: 'checkbox' }) + fld('Código de seguridad del bioanalista (6 números; en la demo, cualquiera)', 'sd-code', { max: 6, mode: 'numeric', type: 'password' }) + errBox('sd') +
      '<div class="row"><button class="btn" type="button" data-a="res-send">Firmar, sellar y enviar</button></div><p class="small muted">El aviso por WhatsApp dice solo “Tienes un documento nuevo en LABS”. Nunca lleva nombre del examen ni valores.</p></div>';
  };
  A['res-fill'] = function (v) {
    const o = findOrder(S.ordSel); o.exams.forEach(function (id) { const c = D.BY_ID[id]; if (c.kind === 'report') { S.f['rh-' + id] = REP[id] ? REP[id][0] : 'Sin hallazgos de relevancia.'; S.f['rc-' + id] = REP[id] ? REP[id][1] : 'Estudio normal.'; S.f['rby-' + id] = SPEC[id] || specialists()[0]; } else if (c.kind === 'pos') { S.f['rp-' + id] = v === 'normal' ? 'Negativo' : 'Positivo'; if (v !== 'normal' && c.dl) S.f['rd-' + id] = id === 'gota' ? 'Plasmodium vivax, 2.400 parásitos/µL' : id === 'widal' ? '1/160' : id === 'vdrl' ? '1/8' : '1/320'; } else if (c.kind === 'cult') { if (v === 'normal') S.f['ro-' + id + '-ng'] = true; else { S.f['ro-' + id + '-ng'] = false; S.f['ro-' + id] = 'Escherichia coli'; ['S', 'S', 'R', 'S', 'R', 'S', 'S', ''].forEach(function (r, i) { S.f['ra-' + id + '-' + i] = r; }); } } else if (c.kind === 'none') S.f['rt-' + id] = TXT[id] || 'Sin alteraciones.'; else S.f['rv-' + id] = PRE[v][id] !== undefined ? String(PRE[v][id]) : genVal(c, v); });
    S.err = {}; render();
  };
  A['res-draft'] = function () { const o = findOrder(S.ordSel); o.draft = {}; Object.keys(S.f).forEach(function (k) { if (/^(rv|rt|rh|rc|ri|rby|rp|rd|ro|rn|ra)-/.test(k)) o.draft[k] = S.f[k]; }); if (o.status === 'Por procesar') o.status = 'En proceso'; toast('Borrador guardado. Puedes continuar después.'); };
  function histFor(pid, vals) {
    const g = vals.filter(function (x) { return x.id === 'glu'; })[0]; if (!g) return null; const pts = [];
    D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid; }).forEach(function (r) { const x = r.values.filter(function (y) { return y.id === 'glu'; })[0]; if (x) pts.push({ m: (r.date.split(' de ')[1] || '').slice(0, 3).replace(/^./, function (c) { return c.toUpperCase(); }), v: x.v }); });
    if (!pts.length) return null; pts.push({ m: 'Nov', v: g.v }); return { id: 'glu', points: pts.slice(-5) };
  }
  A['res-send'] = function () {
    const o = findOrder(S.ordSel); if (!isOwner()) return setErr('sd', 'Solo el bioanalista puede firmar y enviar resultados.');
    const col = collect(o); if (col.errs.length) return setErr('rs', col.errs[0]);
    const sum = L.summarize(col.values); const crit = sum.worst === 'urgente';
    if (!S.signUrl || !S.stampUrl || !S.saved || !S.owner) return setErr('sd', 'Primero guarda tu firma y tu sello (menú Firma y sello).');
    if (crit && !F('sd-call')) return setErr('sd', 'Hay un valor crítico: llama al paciente o a su médico y marca la casilla.');
    const posNotif = o.exams.filter(function (e) { return D.BY_ID[e].notif && col.pos[e] && col.pos[e].res === 'Positivo'; }); if (posNotif.length && !F('sd-notif')) return setErr('sd', 'Hay un caso de notificación obligatoria: avisa al Ministerio de Salud y marca la casilla.');
    if (o.exams.some(function (e) { return D.BY_ID[e].sens; }) && !F('sd-sens')) return setErr('sd', 'Hay un resultado sensible: marca que ofreciste orientación al paciente.');
    if (!F('sd-review')) return setErr('sd', 'Marca que revisaste cada valor.'); if (!/^\d{6}$/.test(F('sd-code'))) return setErr('sd', 'El código de seguridad debe tener 6 números.');
    if (!o.paid && !confirmed(o)) return;
    const p = X.personOf(o.pid); const names = o.exams.map(function (e) { return D.BY_ID[e].name; }); const title = names.length > 3 ? names.slice(0, 3).join(', ') + ' y ' + (names.length - 3) + ' más' : names.join(', ');
    const r = { id: o.id, title: title, lab: S.labs[0].name, date: X.longDate(), patient: p.name, ci: p.ci ? X.maskCi(p.ci) : 'Dependiente', age: p.age, sex: p.sex, values: col.values, history: histFor(o.pid, col.values), pid: o.pid };
    if (Object.keys(col.texts).length) r.texts = col.texts; if (Object.keys(col.reports).length) r.reports = col.reports; if (Object.keys(col.pos).length) r.pos = col.pos; if (Object.keys(col.cult).length) r.cult = col.cult; r.live = true; r.sens = o.exams.some(function (e) { return D.BY_ID[e].sens; });
    S.cases = S.cases || {}; posNotif.forEach(function (e) { S.cases[e] = (S.cases[e] || 0) + 1; });
    D.PATIENT_RESULTS.push(r); const idx = D.PATIENT_RESULTS.length - 1; o.status = 'Enviada'; o.resultIdx = idx; o.draft = null;
    notify('pat', 'Tienes un documento nuevo en LABS.', { type: 'res', ref: idx }, o.pid);
    if (S.access.some(function (a) { return a.pid === o.pid && a.on; })) notify('doc', 'Hay un resultado nuevo de un paciente que te dio acceso (' + o.id + ').', { type: 'go', ref: 'lista' });
    logAudit(S.auth.name, 'Resultado ' + o.id + ' firmado, sellado y enviado' + (posNotif.length ? ' (caso de notificación obligatoria anotado)' : '') + (crit ? ' (valor crítico informado a las ' + U.nowTime() + ')' : ''));
    clearRes(); S.err = {}; S.lab = 'ordenes'; S.ofilter = 'enviada'; toast('Enviado. El paciente recibe solo el aviso: “Tienes un documento nuevo en LABS”.'); render(); window.scrollTo(0, 0);
  };
  function confirmed(o) { return true; }

  /* ---------- Pacientes ---------- */
  V.pacientes = function () {
    const q = F('pc-q').trim().toLowerCase(); const mine = S.patients.filter(function (p) { return S.orders.some(function (o) { return o.pid === p.id; }) && p.name !== 'Cuenta eliminada'; }); const list = q ? mine.filter(function (p) { return (p.name + ' ' + p.ci).toLowerCase().indexOf(q) >= 0; }) : mine;
    return '<div class="head"><div><h1>Pacientes</h1><p>Las personas que han hecho exámenes aquí.</p></div></div><div class="card">' + fld('Buscar por nombre o cédula', 'pc-q') + (list.length ? '<div class="tw"><table style="min-width:640px"><thead><tr><th>Paciente</th><th>Cédula</th><th>Edad</th><th>Órdenes</th><th>Acciones</th></tr></thead><tbody>' + list.map(function (p) { const n = S.orders.filter(function (o) { return o.pid === p.id; }).length; return '<tr><td><b>' + esc(p.name) + '</b>' + (S.pnotes[p.id] ? '<div class="small muted">Nota: ' + esc(S.pnotes[p.id]) + '</div>' : '') + '</td><td>' + esc(p.ci) + '</td><td>' + p.age + '</td><td>' + n + '</td><td><div class="row"><button class="btn ghost sm" type="button" data-a="pc-hist" data-v="' + p.id + '">Historial</button><button class="btn ghost sm" type="button" data-a="pc-new" data-v="' + p.id + '">Nueva orden</button><button class="btn ghost sm" type="button" data-a="pc-note" data-v="' + p.id + '">Nota</button></div></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No hay pacientes con ese nombre o cédula.</p>') + '<p class="small muted">Aquí solo ves lo que se hizo en este laboratorio. Nunca resultados de otros laboratorios.</p></div>';
  };
  A['pc-hist'] = function (v) { const p = X.personOf(v); const os = S.orders.filter(function (o) { return o.pid === v; }); dlg('Historial de ' + p.name, '<div class="tw"><table><thead><tr><th>Orden</th><th>Exámenes</th><th>Estado</th></tr></thead><tbody>' + os.map(function (o) { return '<tr><td>' + o.id + '<div class="small muted">' + esc(o.when) + '</div></td><td class="small">' + esc(examNames(o.exams)) + '</td><td>' + stChip(o.status) + '</td></tr>'; }).join('') + '</tbody></table></div>', null); };
  A['pc-new'] = function (v) { S.no = { pid: v, via: (X.personOf(v) || {}).labOnly ? 'Registro' : 'Cédula', exams: [], pkgs: [] }; S.lab = 'nueva'; render(); window.scrollTo(0, 0); };
  A['pc-note'] = function (v) { const p = X.personOf(v); S.f['pn-t'] = S.pnotes[v] || ''; dlg('Nota sobre ' + p.name, fld('Nota interna (solo la ve el laboratorio)', 'pn-t', { type: 'textarea' }), { label: 'Guardar nota', a: 'pc-note-ok', v: v }); };
  A['pc-note-ok'] = function (v) { S.pnotes[v] = F('pn-t').trim(); delete S.f['pn-t']; S.modal = null; toast('Nota guardada.'); };

  /* ---------- Catálogo ---------- */
  A['ex-add'] = function () {
    const n = F('ex-name').trim(), pr = parseFloat(F('ex-price')), co = parseFloat(F('ex-cost')); if (n.length < 3) return setErr('ex', 'Escribe el nombre del examen.'); if (CAT.some(function (c) { return c.name.toLowerCase() === n.toLowerCase(); })) return setErr('ex', 'Ya existe un examen con ese nombre.');
    if (!isFinite(pr) || pr <= 0) return setErr('ex', 'El precio debe ser mayor que cero.'); if (!isFinite(co) || co < 0) return setErr('ex', 'Escribe el costo (puede ser 0).'); const kind = F('ex-type', 'none');
    const c = { id: 'x' + (CAT.length + 1), name: n, unit: '', price: pr, cost: co, kind: kind }; CAT.push(c); D.BY_ID[c.id] = c; ['ex-name', 'ex-price', 'ex-cost', 'ex-type'].forEach(clearForm); S.err = {}; logAudit(S.auth.name, 'Agregó al catálogo: ' + n); toast('“' + n + '” agregado al catálogo.');
  };
  A['exdel'] = function (v) { const c = CAT[parseInt(v, 10)]; if (S.orders.some(function (o) { return o.exams.indexOf(c.id) >= 0 && o.status !== 'Enviada' && o.status !== 'Anulada'; })) return dlg('No se puede quitar', '<p>“' + esc(c.name) + '” está en órdenes que todavía no terminan. Termínalas o anúlalas primero.</p>', null); dlg('Quitar “' + c.name + '”', '<p>Ya no se podrá elegir en órdenes nuevas. Las órdenes anteriores no cambian.</p>', { label: 'Quitar del catálogo', a: 'ex-del-ok', v: v }); };
  A['ex-del-ok'] = function (v) { const i = parseInt(v, 10); const c = CAT[i]; CAT.splice(i, 1); S.modal = null; logAudit(S.auth.name, 'Quitó del catálogo: ' + c.name); toast('“' + c.name + '” quitado del catálogo.'); };
  A['rep-csv'] = function () { const mo = L.monthly(); EXT.download('resumen-mensual.csv', 'text/csv', 'Mes,Examenes,Ventas USD,Costos USD\n' + mo.map(function (m) { return [m.label, m.n, m.usd.toFixed(2), m.cost.toFixed(2)].join(','); }).join('\n')); };
  A['net-toggle'] = function () { S.lcfg.net = !S.lcfg.net; logAudit(S.auth.name, S.lcfg.net ? 'Activó la participación en la red' : 'Dejó de participar en la red'); toast(S.lcfg.net ? 'Ahora participas en la red.' : 'Dejaste de participar en la red.'); };

  /* ---------- Equipo ---------- */
  V.equipo = function () {
    return '<div class="head"><div><h1>Mi equipo</h1><p>Una cuenta por persona. Así se sabe quién hizo qué.</p></div></div><div class="card"><div class="tw"><table style="min-width:640px"><thead><tr><th>Persona</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + S.team.map(function (t, i) { return '<tr><td><b>' + esc(t.name) + '</b><div class="small muted">' + esc(t.email) + '</div></td><td>' + esc(t.role) + '</td><td>' + (t.status === 'Activa' ? '<span class="chip ok">Activa</span>' : t.status === 'Invitada' ? '<span class="chip warn">Invitación enviada</span>' : '<span class="chip gray">Dada de baja</span>') + '</td><td><div class="row">' + (i === 0 ? '<span class="small muted">Dueña de la cuenta</span>' : '<button class="btn ghost sm" type="button" data-a="tm-role" data-v="' + t.id + '">Cambiar rol</button><button class="btn ghost sm" type="button" data-a="tm-off" data-v="' + t.id + '">' + (t.status === 'Dada de baja' ? 'Reactivar' : 'Dar de baja') + '</button><button class="btn ghost sm" type="button" data-a="tm-pin" data-v="' + t.id + '">Reiniciar código</button>') + '</div></td></tr>'; }).join('') + '</tbody></table></div><p class="small muted">Solo el bioanalista firma. Si alguien se va, lo das de baja y pierde el acceso al instante.</p></div>' +
      '<div class="card"><h2>Invitar a alguien</h2><div class="grid">' + fld('Nombre', 'tm-name') + fld('Correo', 'tm-mail', { type: 'email' }) + fld('Rol', 'tm-role', { type: 'select', options: ['Recepción', 'Bioanalista', 'Radiólogo', 'Cardiólogo', 'Neurólogo', 'Otro especialista'] }) + '</div>' + errBox('tm') + '<div class="row"><button class="btn" type="button" data-a="tm-add">Enviar invitación</button></div></div>';
  };
  A['tm-add'] = function () { const n = F('tm-name').trim(), m = F('tm-mail').trim().toLowerCase(); if (n.length < 4) return setErr('tm', 'Escribe el nombre completo.'); if (!/^\S+@\S+\.\S+$/.test(m)) return setErr('tm', 'Escribe un correo válido.'); if (S.team.some(function (t) { return t.email === m; })) return setErr('tm', 'Ese correo ya está en el equipo.'); S.team.push({ id: uid('t'), name: n, email: m, role: F('tm-role', 'Recepción'), status: 'Invitada' }); ['tm-name', 'tm-mail', 'tm-role'].forEach(clearForm); S.err = {}; logAudit(S.auth.name, 'Invitó a ' + n + ' al equipo'); toast('Invitación enviada a ' + m + '.'); };
  A['tm-off'] = function (v) { const t = S.team.filter(function (x) { return x.id === v; })[0]; t.status = t.status === 'Dada de baja' ? 'Activa' : 'Dada de baja'; logAudit(S.auth.name, (t.status === 'Activa' ? 'Reactivó a ' : 'Dio de baja a ') + t.name); toast(t.name + ': ' + t.status.toLowerCase() + '.'); };
  A['tm-pin'] = function (v) { const t = S.team.filter(function (x) { return x.id === v; })[0]; logAudit(S.auth.name, 'Reinició el código de seguridad de ' + t.name); toast('Enviamos a ' + t.name + ' un enlace para elegir un código nuevo.'); };
  A['tm-role'] = function (v) { const t = S.team.filter(function (x) { return x.id === v; })[0]; S.f['tr-r'] = t.role; dlg('Cambiar el rol de ' + t.name, fld('Rol', 'tr-r', { type: 'select', options: ['Recepción', 'Bioanalista', 'Radiólogo', 'Cardiólogo', 'Neurólogo', 'Otro especialista'] }), { label: 'Guardar rol', a: 'tm-role-ok', v: v }); };
  A['tm-role-ok'] = function (v) { const t = S.team.filter(function (x) { return x.id === v; })[0]; t.role = F('tr-r', t.role); delete S.f['tr-r']; S.modal = null; logAudit(S.auth.name, 'Cambió el rol de ' + t.name + ' a ' + t.role); toast('Rol actualizado.'); };

  /* ---------- Suscripción ---------- */
  V.suscripcion = function () {
    const lab = S.labs[0]; const mine = S.payments.filter(function (p) { return p.labId === 'l1'; }); const pend = mine.some(function (p) { return p.status === 'Pendiente'; });
    return '<div class="head"><div><h1>Mi suscripción</h1><p>Tu plan, tus pagos y lo que viene.</p></div></div><div class="grid"><div class="card kpi"><small>Plan</small><b>' + lab.plan + '</b><small>' + L.fmtUsd(lab.price) + ' al mes</small></div><div class="card kpi"><small>Vence en</small><b>' + lab.due + ' días</b><small>' + (lab.cancel ? 'No se renovará' : 'Se renueva solo si pagas') + '</small></div><div class="card kpi"><small>Estado</small><b style="font-size:20px">' + (pend ? 'Pago en revisión' : lab.status) + '</b></div></div>' +
      (lab.nextPlan ? '<div class="banner" role="status">Cambio de plan programado: ' + lab.plan + ' → ' + lab.nextPlan + ' desde el próximo ciclo. <button class="btn ghost sm" type="button" data-a="sub-undo-plan">Deshacer</button></div>' : '') + (lab.cancel ? '<div class="banner" role="status">Pediste cancelar. Tu cuenta sigue activa hasta que venza. <button class="btn ghost sm" type="button" data-a="sub-undo-cancel">Reactivar</button></div>' : '') +
      '<div class="card"><h2>Acciones</h2><div class="row"><button class="btn" type="button" data-a="sub-pay">Reportar un pago</button><button class="btn ghost" type="button" data-a="sub-plan">Cambiar de plan</button>' + (lab.cancel ? '' : '<button class="btn ghost" type="button" data-a="sub-cancel">Cancelar suscripción</button>') + '</div></div>' +
      '<div class="card"><h2>Historial de pagos</h2><div class="tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>' + mine.map(function (p) { return '<tr><td>' + esc(p.when) + '</td><td>' + L.fmtUsd(p.amount) + '</td><td>' + esc(p.method) + '</td><td>' + esc(p.ref) + '</td><td><span class="chip ' + (p.status === 'Confirmado' ? 'ok' : p.status === 'Rechazado' ? 'crit' : 'warn') + '">' + p.status + '</span>' + (p.note ? '<div class="small muted">' + esc(p.note) + '</div>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  };
  A['sub-pay'] = function () { S.f['pg-amt'] = String(S.labs[0].price); dlg('Reportar un pago', fld('Método', 'pg-m', { type: 'select', options: ['Zelle', 'Pago móvil', 'Transferencia', 'USDT'] }) + fld('Referencia del pago', 'pg-ref', { ph: 'Número de referencia' }) + fld('Monto pagado (USD)', 'pg-amt', { type: 'number', mode: 'decimal' }) + errBox('pg'), { label: 'Reportar pago', a: 'sub-pay-ok' }); };
  A['sub-pay-ok'] = function () { const ref = F('pg-ref').trim(), amt = parseFloat(F('pg-amt')); if (ref.length < 4) { S.err.pg = 'Escribe la referencia (al menos 4 caracteres).'; return render(); } if (!isFinite(amt) || amt <= 0) { S.err.pg = 'Escribe el monto pagado.'; return render(); } if (S.payments.some(function (p) { return p.ref === ref; })) { S.err.pg = 'Esa referencia ya fue reportada.'; return render(); }
    S.payments.unshift({ id: uid('pg'), labId: 'l1', when: X.when(), amount: amt, method: F('pg-m', 'Zelle'), ref: ref, status: 'Pendiente' }); notify('adm', 'Pago reportado por ' + S.labs[0].name + ': ' + L.fmtUsd(amt) + ' (' + ref + ').', { type: 'go', ref: 'pagos' }); ['pg-m', 'pg-ref', 'pg-amt'].forEach(clearForm); S.err = {}; S.modal = null; toast('Pago reportado. LABS lo confirma y te avisa.'); };
  A['sub-plan'] = function () { dlg('Cambiar de plan', '<p>El cambio empieza en el próximo ciclo.</p>' + fld('Plan nuevo', 'pl-new', { type: 'select', options: D.PLANS.map(function (p) { return { v: p.name, l: p.name + ' · ' + L.fmtUsd(p.price) + ' al mes' }; }) }) + errBox('pl'), { label: 'Programar cambio', a: 'sub-plan-ok' }); };
  A['sub-plan-ok'] = function () { const np = F('pl-new', D.PLANS[0].name); if (np === S.labs[0].plan) { S.err.pl = 'Ya estás en ese plan.'; return render(); } S.labs[0].nextPlan = np; delete S.f['pl-new']; S.err = {}; S.modal = null; logAudit(S.auth.name, 'Programó cambio de plan a ' + np); toast('Cambio de plan programado.'); };
  A['sub-undo-plan'] = function () { S.labs[0].nextPlan = null; toast('Cambio de plan deshecho.'); };
  A['sub-cancel'] = function () { dlg('Cancelar suscripción', '<p>Tu cuenta sigue activa hasta que venza. Tus resultados y los de tus pacientes no se borran.</p>' + fld('¿Por qué te vas?', 'cn-r', { type: 'select', options: ['Es muy caro', 'No lo uso lo suficiente', 'Faltan funciones', 'Cierro el laboratorio', 'Otro motivo'] }), { label: 'Cancelar suscripción', a: 'sub-cancel-ok' }); };
  A['sub-cancel-ok'] = function () { S.labs[0].cancel = true; delete S.f['cn-r']; S.modal = null; logAudit(S.auth.name, 'Pidió cancelar la suscripción'); toast('Suscripción cancelada al vencer. Puedes reactivarla cuando quieras.'); };
  A['sub-undo-cancel'] = function () { S.labs[0].cancel = false; toast('Suscripción reactivada.'); };

  /* ---------- Configuración ---------- */
  V.config = function () {
    const c = S.lcfg;
    return '<div class="head"><div><h1>Configuración</h1><p>Los datos de tu laboratorio.</p></div></div><div class="card"><h2>Datos del laboratorio</h2><div class="grid two">' + fld('Nombre', 'cf-name', { def: c.name }) + fld('RIF', 'cf-rif', { def: c.rif }) + fld('Teléfono', 'cf-phone', { def: c.phone, type: 'tel' }) + fld('Horario', 'cf-hours', { def: c.hours }) + '</div>' + fld('Dirección', 'cf-addr', { def: c.addr }) + errBox('cf') + '<div class="row"><button class="btn" type="button" data-a="cf-save">Guardar datos</button></div></div>' +
      '<div class="card"><h2>Sedes</h2>' + c.sedes.map(function (s, i) { return '<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>' + esc(s) + '</span>' + (i === 0 ? '<span class="chip gray">Principal</span>' : '<button class="btn ghost sm" type="button" data-a="cf-sede-del" data-v="' + i + '">Quitar</button>') + '</div>'; }).join('') + fld('Nueva sede', 'cf-sede', { ph: 'Nombre y ciudad' }) + errBox('cfs') + '<div class="row"><button class="btn ghost" type="button" data-a="cf-sede-add">Agregar sede</button></div><p class="small muted">Tu plan ' + S.labs[0].plan + ' incluye ' + 'sedes ilimitadas' + '.</p></div>' +
      '<div class="card"><h2>Métodos de pago que aceptas</h2><div class="grid">' + Object.keys(c.pay).map(function (k) { return fld(k, 'cp-' + k, { type: 'checkbox', def: c.pay[k] }); }).join('') + '</div>' + errBox('cfp') + '<div class="row"><button class="btn" type="button" data-a="cf-pay">Guardar métodos</button></div></div>' +
      '<div class="card"><h2>Aviso al paciente</h2><p class="small muted">Esto es lo que recibe el paciente cuando su resultado está listo.</p><div class="bub" style="max-width:100%">Tienes un documento nuevo en LABS. Ábrelo con tu cuenta.</div>' + fld('Enviar también por correo', 'cf-mail', { type: 'checkbox', def: c.mail }) + '<div class="row"><button class="btn ghost" type="button" data-a="cf-notice">Guardar</button></div></div>' +
      '<div class="card"><h2>Mis datos</h2><div class="row"><button class="btn ghost" type="button" data-a="cf-export">Descargar órdenes (CSV)</button></div></div>';
  };
  A['cf-save'] = function () { const c = S.lcfg; const n = F('cf-name', c.name).trim(), rif = F('cf-rif', c.rif).trim().toUpperCase(); if (n.length < 3) return setErr('cf', 'Escribe el nombre del laboratorio.'); if (!/^[JGVE]-?\d{8}-?\d$/.test(rif)) return setErr('cf', 'El RIF debe verse así: J-12345678-9.'); c.name = n; c.rif = rif; c.phone = F('cf-phone', c.phone); c.hours = F('cf-hours', c.hours); c.addr = F('cf-addr', c.addr); S.labs[0].name = n; S.err = {}; logAudit(S.auth.name, 'Actualizó los datos del laboratorio'); toast('Datos guardados.'); };
  A['cf-sede-add'] = function () { const n = F('cf-sede').trim(); const lim = 99; if (n.length < 4) return setErr('cfs', 'Escribe el nombre de la sede.'); if (S.lcfg.sedes.length >= lim) return setErr('cfs', 'Tu plan ' + S.labs[0].plan + ' no permite más sedes. Cambia de plan en Configuración.'); S.lcfg.sedes.push(n); delete S.f['cf-sede']; S.err = {}; toast('Sede agregada.'); };
  A['cf-sede-del'] = function (v) { S.lcfg.sedes.splice(parseInt(v, 10), 1); toast('Sede quitada.'); };
  A['cf-pay'] = function () { const c = S.lcfg; const next = {}; let any = false; Object.keys(c.pay).forEach(function (k) { next[k] = !!F('cp-' + k, c.pay[k]); if (next[k]) any = true; }); if (!any) return setErr('cfp', 'Debes aceptar al menos un método de pago.'); c.pay = next; S.err = {}; toast('Métodos de pago guardados.'); };
  A['cf-notice'] = function () { S.lcfg.mail = !!F('cf-mail', S.lcfg.mail); toast('Preferencia guardada.'); };
  A['cf-export'] = function () { EXT.download('ordenes.csv', 'text/csv', 'Orden,Paciente,Examenes,USD,Estado,Pagado\n' + S.orders.map(function (o) { return [o.id, '"' + pname(o.pid) + '"', '"' + examNames(o.exams) + '"', o.usd, o.status, o.paid ? 'Si' : 'No'].join(','); }).join('\n')); };

  /* ---------- Mi cuenta (laboratorio) ---------- */
  V.perfil = function () {
    const a = S.accounts.filter(function (x) { return x.id === S.auth.id; })[0];
    return '<div class="head"><div><h1>Mi cuenta</h1><p>' + esc(S.auth.name) + ' · ' + esc(a.email) + '</p></div></div><div class="card"><h2>Cambiar mi clave</h2>' + fld('Clave actual', 'pw-old', { type: 'password' }) + fld('Clave nueva', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + X.meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave nueva', 'pw-new2', { type: 'password' }) + errBox('pw') + '<div class="row"><button class="btn" type="button" data-a="pw-save">Cambiar clave</button></div></div><div class="card"><h2>Mi rol</h2><p>' + (isOwner() ? 'Dueña y bioanalista: puedes todo, incluida la firma.' : 'Recepción: creas y cobras órdenes. No ves resultados, dinero ni firma.') + '</p></div>';
  };
})();
