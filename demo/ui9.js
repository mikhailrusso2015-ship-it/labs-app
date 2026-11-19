/* LABS demo · selector de tasas desplegable + médico: exámenes por separado, repetir/pedir examen, recetar */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const logAudit = U.logAudit, esc = U.esc, toast = U.toast, F = X.F, fld = X.fld, errBox = X.errBox, dlg = X.dlg, closeDlg = X.closeDlg, notify = X.notify, chipFor = U.chipFor;
  const DOC = 'Dra. Marisol Pérez';
  function render() { window.render(); }
  function pname(pid) { const d = (S.docPatients || []).filter(function (x) { return x.pid === pid; })[0]; if (d) return d.name; const p = X.personOf(pid); return p ? p.name : 'el paciente'; }
  function pfirst(pid) { return pname(pid); }

  /* ---------- Selector de tasas: pestañita desplegable ---------- */
  U.modeSelect = function () {
    const cur = L.MODES.filter(function (m) { return m.id === S.mode; })[0] || L.MODES[0]; const o = !!S.modeOpen;
    return '<div class="per"><button type="button" class="perbtn" data-a="mode-toggle" aria-haspopup="listbox" aria-expanded="' + o + '"><span>Ver en: ' + esc(cur.label) + '</span><i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' +
      (o ? '<div class="permenu" role="listbox" aria-label="Moneda para ver los precios">' + L.MODES.map(function (m) { const on = m.id === cur.id; return '<button type="button" role="option" class="peropt" data-a="mode-pick" data-v="' + m.id + '" aria-selected="' + on + '"><span>' + esc(m.label) + '</span>' + (on ? '<b>✓</b>' : '') + '</button>'; }).join('') + '</div>' : '') + '</div>';
  };
  A['mode-toggle'] = function () { S.modeOpen = !S.modeOpen; render(); };
  A['mode-pick'] = function (v) { S.mode = v; S.modeOpen = false; render(); };
  document.addEventListener('click', function (ev) { if (S.modeOpen && !ev.target.closest('.per')) { S.modeOpen = false; render(); } });

  /* ---------- Datos del médico ---------- */
  S.docOrders = S.docOrders || []; S.rx = S.rx || []; S.dx = S.dx || { sel: [], cat: '', ri: null }; S.rxd = S.rxd || [];
  S.docOrders.push({ id: 'DR-0001', pid: 'p5', kind: 'repetir', exams: ['Hemoglobina'], reason: 'Valor fuera de rango', note: 'Repetir en ayunas.', when: 'En 1 semana', created: '12 nov', state: 'Hecho' });
  const seq = { o: 1, r: 0 };
  function mine() { const p = S.docPatients[S.docOpen]; return p; }

  /* ---------- Tarjeta del paciente (vista del médico) ---------- */
  const lista0 = V.doc.lista;
  V.doc.lista = function () {
    const P = S.docPatients; if (S.docOpen === null || S.docOpen === undefined || !P[S.docOpen]) return lista0();
    const p = P[S.docOpen]; S.docSel = S.docOpen;
    const rs = D.PATIENT_RESULTS.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.pid === p.pid; });
    const withHist = rs.filter(function (x) { return x.r.history; })[0]; const g = withHist ? D.BY_ID[withHist.r.history.id] : null;
    const exams = rs.length ? rs.map(function (x) {
      const r = x.r, k = 'r:' + x.i, o = !!S.acc[k]; const s = r.values.length ? L.summarize(r.values) : null;
      const chip = s ? (s.worst === 'normal' ? '<span class="chip ok">Normal</span>' : chipFor(s.worst, s.watch + (s.watch === 1 ? ' aviso' : ' avisos'))) : '<span class="chip gray">Informe</span>';
      let body = '';
      if (o) {
        body = '<div class="accb exc">' + (s ? s.rows.map(function (v) { return '<div class="vrow"><span>' + esc(v.name) + '</span><b>' + v.v + ' <small>' + esc(v.unit || '') + '</small></b>' + chipFor(v.level, v.label) + '</div>'; }).join('') : '<p class="small muted">Este estudio trae un informe o resultado en texto. Ábrelo para verlo completo.</p>') +
          '<div class="btnrow"><button class="btn ghost sm" type="button" data-a="d-pdf" data-i="' + x.i + '">Abrir resultado</button><button class="btn sm" type="button" data-a="dx-rep" data-v="' + x.i + '">Pedir repetir</button></div><button class="btn ghost sm" type="button" data-a="dx-new" data-v="' + x.i + '">Pedir otro examen según este resultado</button></div>';
      }
      return '<div class="acc"><button type="button" class="acch" data-a="acc" data-v="' + k + '" aria-expanded="' + o + '"><span class="t">' + esc(r.title) + '<span class="s">' + esc(r.date) + ' · ' + esc(r.id) + '</span></span>' + chip + '<i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' + body + '</div>';
    }).join('') : '<p class="muted">Este paciente todavía no tiene resultados.</p>';
    const ords = S.docOrders.filter(function (o) { return o.pid === p.pid; }); const rxs = S.rx.filter(function (r) { return r.pid === p.pid; });
    const ordH = ords.length ? ords.slice().reverse().map(function (o) { return '<div class="vrow"><span><b>' + (o.kind === 'repetir' ? 'Repetir' : 'Hacerse') + ':</b> ' + esc(o.exams.join(', ')) + '<small class="block">' + esc(o.created) + ' · ' + esc(o.when) + '</small></span><span class="chip ' + (o.state === 'Hecho' ? 'ok' : 'warn') + '">' + o.state + '</span></div>'; }).join('') : '<p class="small muted">Todavía no le has pedido exámenes desde la app.</p>';
    const rxH = rxs.length ? rxs.slice().reverse().map(function (r) { return '<div class="vrow"><span><b>' + esc(r.id) + '</b> · ' + r.meds.length + (r.meds.length === 1 ? ' medicamento' : ' medicamentos') + '<small class="block">' + esc(r.meds.map(function (m) { return m.name; }).join(', ')) + ' · ' + esc(r.created) + '</small></span><button class="btn ghost sm" type="button" data-a="rx-view" data-v="' + r.id + '">Ver récipe</button></div>'; }).join('') : '<p class="small muted">Todavía no le has recetado nada desde la app.</p>';
    return '<div class="deskback"><button class="btn ghost sm" type="button" data-a="docback">‹ Volver a mis pacientes</button></div>' +
      '<div class="card"><h2>' + esc(p.name) + '</h2><div class="small muted">Cédula ' + esc(p.ci) + '</div><div class="row"><span class="chip gray">' + esc(p.scope) + '</span><span class="chip gray">Acceso hasta ' + esc(p.until) + '</span></div>' +
      '<div class="btnrow"><button class="btn sm" type="button" data-a="dx-new" data-v="">Pedir un examen</button><button class="btn sm" type="button" data-a="rx-open" data-v="' + p.pid + '">Recetar tratamiento</button></div></div>' +
      '<div class="card"><h2>Exámenes de ' + esc(p.name.replace('Paciente ', '')) + '</h2><p class="small muted">Cada examen va por separado. Toca uno para ver sus valores y decidir qué hacer.</p>' + exams + '</div>' +
      (g ? '<div class="card"><h2>' + esc(g.name) + ' en el tiempo</h2>' + U.lineBand(withHist.r.history.points, g.lo, g.hi, g.unit) + '</div>' : '') +
      '<div class="card"><h2>Lo que le pediste</h2>' + ordH + '<h3>Recetas enviadas</h3>' + rxH + '</div>' +
      '<div class="card"><h2>Mis notas (solo las ves tú)</h2>' + fld('Notas sobre el paciente', 'note-' + p.pid, { type: 'textarea', ph: 'Escribe una nota…' }) + '<div class="row"><button class="btn sm" type="button" data-a="d-note" data-v="' + p.pid + '">Guardar nota</button></div><p class="small muted">El paciente no ve tus notas. Cada vez que abres un resultado queda anotado en su registro.</p></div>';
  };

  /* ---------- Pedir repetir / pedir otro examen ---------- */
  const REASONS = ['Valor fuera de rango', 'Muestra con problema', 'Control del tratamiento', 'Confirmar un hallazgo', 'Otro motivo'];
  const WHEN = ['Lo antes posible', 'En 1 semana', 'En 1 mes', 'En 3 meses'];
  function sendOrder(kind, pid, names) {
    const id = 'DR-' + String(++seq.o + 1).padStart(4, '0'); const reason = F('dx-reason', REASONS[0]), when = F('dx-when', WHEN[0]), note = F('dx-note').trim(), ayuno = !!F('dx-ayuno');
    S.docOrders.push({ id: id, pid: pid, kind: kind, exams: names, reason: reason, note: note, when: when, ayuno: ayuno, created: 'Hoy', state: 'Pendiente' });
    const txt = DOC + (kind === 'repetir' ? ' te pidió repetir: ' : ' te pidió hacerte: ') + names.join(', ') + '. ' + (kind === 'repetir' ? 'Motivo: ' + reason.toLowerCase() + '. ' : '') + 'Cuándo: ' + when.toLowerCase() + '.' + (ayuno ? ' Ve en ayunas.' : '') + (note ? ' Nota: ' + note : '');
    notify('pat', txt, { type: 'go', ref: 'inicio' }, pid); X.logAudit && X.logAudit(DOC, 'Pidió ' + (kind === 'repetir' ? 'repetir' : 'hacer') + ' exámenes a un paciente');
    ['dx-reason', 'dx-when', 'dx-note', 'dx-ayuno'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null;
    toast('Enviado. ' + pfirst(pid) + ' recibió una notificación en su teléfono: “' + names.join(', ') + '”.');
  }
  function repDlg() {
    const r = D.PATIENT_RESULTS[S.dx.ri]; const items = r.values.length ? r.values.map(function (v) { return { id: v.id, name: D.BY_ID[v.id].name }; }) : [{ id: 't', name: r.title }];
    const chips = items.map(function (it) { const on = S.dx.sel.indexOf(it.id) >= 0; return '<button type="button" class="btn sm ' + (on ? '' : 'ghost') + '" data-a="dx-t" data-v="' + it.id + '" aria-pressed="' + on + '">' + (on ? '✓ ' : '') + esc(it.name) + '</button>'; }).join('');
    dlg('Pedir repetir un examen', '<p class="small muted">Resultado: <b>' + esc(r.title) + '</b> · ' + esc(r.date) + '. Elige qué se repite:</p><div class="pill-row">' + chips + '</div>' + fld('Motivo', 'dx-reason', { type: 'select', options: REASONS }) + fld('Cuándo debe hacerlo', 'dx-when', { type: 'select', options: WHEN }) + fld('Debe ir en ayunas', 'dx-ayuno', { type: 'checkbox' }) + fld('Nota para el paciente (opcional)', 'dx-note', { type: 'textarea', ph: 'Ej.: Repite sin comer ni beber nada 8 horas antes.' }) + errBox('dx') + '<p class="small muted">El paciente recibe una notificación en su teléfono. No lleva valores ni resultados, solo el pedido.</p>', { label: 'Enviar al paciente', a: 'dx-rep-ok', v: '' });
  }
  A['dx-rep'] = function (v) { const ri = parseInt(v, 10); const r = D.PATIENT_RESULTS[ri]; const s = r.values.length ? L.summarize(r.values) : null; S.dx = { sel: s ? s.rows.filter(function (x) { return x.level !== 'normal'; }).map(function (x) { return x.id; }) : ['t'], cat: '', ri: ri }; if (s && !S.dx.sel.length) S.dx.sel = s.rows.map(function (x) { return x.id; }); S.err = {}; repDlg(); };
  A['dx-t'] = function (v) { const i = S.dx.sel.indexOf(v); if (i >= 0) S.dx.sel.splice(i, 1); else S.dx.sel.push(v); if (S.modal && S.modal.title === 'Pedir repetir un examen') repDlg(); else newDlg(); };
  A['dx-rep-ok'] = function () {
    const r = D.PATIENT_RESULTS[S.dx.ri]; if (!S.dx.sel.length) { S.err.dx = 'Elige al menos un examen para repetir.'; return repDlg(); }
    const names = S.dx.sel.map(function (id) { return id === 't' ? r.title : D.BY_ID[id].name; }); sendOrder('repetir', r.pid, names);
  };
  function groups() { const seen = []; D.CATALOG.forEach(function (c) { if (c.cat && seen.indexOf(c.cat) < 0) seen.push(c.cat); }); return seen; }
  function newDlg() {
    const g = groups(); const cat = S.dx.cat || g[0]; const list = D.CATALOG.filter(function (c) { return c.cat === cat; });
    const sel = S.dx.sel.map(function (id) { return '<button type="button" class="btn sm" data-a="dx-t" data-v="' + id + '" aria-label="Quitar ' + esc(D.BY_ID[id].name) + '">' + esc(D.BY_ID[id].name) + ' ✕</button>'; }).join('');
    dlg('Pedir otro examen', '<div class="small muted">Grupo</div><div class="pill-row">' + g.map(function (c) { return '<button type="button" class="btn sm ' + (c === cat ? '' : 'ghost') + '" data-a="dx-cat" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div><div class="small muted">Toca los exámenes que quieres pedir</div><div class="pill-row">' + list.map(function (c) { const on = S.dx.sel.indexOf(c.id) >= 0; return '<button type="button" class="btn sm ' + (on ? '' : 'ghost') + '" data-a="dx-t" data-v="' + c.id + '">' + (on ? '✓ ' : '') + esc(c.name) + '</button>'; }).join('') + '</div>' + (sel ? '<div class="small muted">Elegidos</div><div class="pill-row">' + sel + '</div>' : '') + fld('Cuándo debe hacerlo', 'dx-when', { type: 'select', options: WHEN }) + fld('Debe ir en ayunas', 'dx-ayuno', { type: 'checkbox' }) + fld('Nota para el paciente (opcional)', 'dx-note', { type: 'textarea', ph: 'Ej.: Para confirmar el resultado de glucosa.' }) + errBox('dx'), { label: 'Enviar al paciente', a: 'dx-new-ok', v: '' });
  }
  A['dx-new'] = function (v) { const ri = v === '' ? null : parseInt(v, 10); S.dx = { sel: [], cat: '', ri: ri }; S.err = {}; newDlg(); };
  A['dx-cat'] = function (v) { S.dx.cat = v; newDlg(); };
  A['dx-new-ok'] = function () {
    if (!S.dx.sel.length) { S.err.dx = 'Elige al menos un examen.'; return newDlg(); } const p = mine(); sendOrder('nuevo', p.pid, S.dx.sel.map(function (id) { return D.BY_ID[id].name; }));
  };

  /* ---------- Recetar tratamiento ---------- */
  const FREQ = ['Cada 8 horas', 'Cada 12 horas', 'Una vez al día', 'Antes de dormir', 'Solo si hay dolor o molestia', 'Con las comidas'];
  function medFilled() { return F('rx-name').trim() !== ''; }
  function rxDlg() {
    const d = S.rxd.map(function (m, i) { return '<div class="vrow"><span><b>' + esc(m.name) + '</b> · ' + esc(m.dose) + '<small class="block">' + esc(m.freq) + ' · ' + esc(m.days) + (m.ins ? ' · ' + esc(m.ins) : '') + '</small></span><button type="button" class="btn rm sm" data-a="rx-rm" data-v="' + i + '" aria-label="Quitar ' + esc(m.name) + '">✕</button></div>'; }).join('');
    dlg('Recetar tratamiento', '<p class="small muted">Para <b>' + esc(pname(S.rxPid)) + '</b>. El récipe sale con tu sello (MPPS 12345) y tu firma.</p>' + (S.dm.saved ? '' : '<div class="banner warn"><b>Falta tu firma y tu sello.</b> Cárgalos una sola vez y quedan guardados.<div class="btnrow"><button class="btn sm" type="button" data-a="dm-go">Cargar firma y sello</button></div></div>') + (d ? '<div class="small muted">En esta receta</div>' + d : '') +
      '<div class="small muted">' + (d ? 'Agregar otro medicamento' : 'Medicamento') + '</div>' + fld('Nombre del medicamento', 'rx-name', { ph: 'Ej.: Metformina' }) + '<div class="exgrid">' + fld('Dosis', 'rx-dose', { ph: '500 mg' }) + fld('Por cuántos días', 'rx-days', { ph: '30 días' }) + '</div>' + fld('Cada cuánto', 'rx-freq', { type: 'select', options: FREQ }) + fld('Indicación de este medicamento (opcional)', 'rx-ins', { ph: 'Ej.: Tomar con comida' }) + '<button class="btn ghost sm" type="button" data-a="rx-add">＋ Agregar a la receta</button>' +
      fld('Motivo o diagnóstico', 'rx-dx', { ph: 'Ej.: Control de glucosa' }) + fld('Indicaciones generales (opcional)', 'rx-note', { type: 'textarea', ph: 'Dieta, ejercicio, cuándo volver…' }) + errBox('rx'), { label: 'Enviar receta', a: 'rx-ok', v: '' });
  }
  A['rx-open'] = function (v) { S.rxPid = v; S.rxd = []; ['rx-name', 'rx-dose', 'rx-days', 'rx-freq', 'rx-ins', 'rx-dx', 'rx-note'].forEach(function (k) { delete S.f[k]; }); S.err = {}; rxDlg(); };
  function pushMed() {
    const name = F('rx-name').trim(), dose = F('rx-dose').trim(), days = F('rx-days').trim(); if (name.length < 3) { S.err.rx = 'Escribe el nombre del medicamento.'; return false; } if (!dose) { S.err.rx = 'Escribe la dosis. Ej.: 500 mg.'; return false; } if (!days) { S.err.rx = 'Escribe por cuántos días. Ej.: 30 días.'; return false; }
    S.rxd.push({ name: name, dose: dose, days: days, freq: F('rx-freq', FREQ[0]), ins: F('rx-ins').trim() }); ['rx-name', 'rx-dose', 'rx-days', 'rx-freq', 'rx-ins'].forEach(function (k) { delete S.f[k]; }); S.err = {}; return true;
  }
  A['rx-add'] = function () { pushMed(); rxDlg(); };
  A['rx-rm'] = function (v) { S.rxd.splice(parseInt(v, 10), 1); rxDlg(); };
  A['rx-ok'] = function () {
    if (!S.dm.saved) { S.err.rx = 'Primero carga y guarda tu firma y tu sello. Sin eso el récipe no es válido.'; return rxDlg(); }
    if (medFilled() && !pushMed()) return rxDlg(); if (!S.rxd.length) { S.err.rx = 'Agrega al menos un medicamento.'; return rxDlg(); } const dx = F('rx-dx').trim(); if (dx.length < 3) { S.err.rx = 'Escribe el motivo o diagnóstico.'; return rxDlg(); }
    const id = 'RX-' + String(++seq.r + 100).padStart(4, '0'); S.rx.push({ id: id, pid: S.rxPid, dx: dx, note: F('rx-note').trim(), meds: S.rxd.slice(), created: 'Hoy', date: X.longDate(), doctor: DOC, mpps: '12345', sign: S.dm.sign, stamp: S.dm.stamp });
    notify('pat', DOC + ' te envió un récipe firmado y sellado (' + S.rxd.length + (S.rxd.length === 1 ? ' medicamento' : ' medicamentos') + '). Míralo en Mis recetas.', { type: 'go', ref: 'recetas' }, S.rxPid);
    const n = S.rxd.length; S.rxd = []; ['rx-dx', 'rx-note'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null; toast('Récipe enviado con tu firma y tu sello. ' + pfirst(S.rxPid) + ' recibió una notificación en su teléfono (' + n + (n === 1 ? ' medicamento' : ' medicamentos') + ').');
  };

  /* ---------- Paciente: Mis recetas y pedidos del médico ---------- */
  EXT.nav.pat.splice(1, 0, { id: 'recetas', label: 'Mis recetas', badge: function () { return S.rx.filter(function (r) { return r.pid === X.myPid(); }).length || ''; } });
  if (EXT.MI) EXT.MI.recetas = '<path d="m10.5 20.5-7-7a4.9 4.9 0 0 1 7-7l7 7a4.9 4.9 0 0 1-7 7z"/><path d="m8.5 8.5 7 7"/>';
  function rxCard(r) {
    return '<div class="card"><div class="row between"><div><h2>' + esc(r.id) + ' · ' + esc(r.dx) + '</h2><p class="small muted">' + esc(r.doctor) + ' · MPPS ' + esc(r.mpps) + ' · ' + esc(r.created) + '</p></div></div>' + r.meds.map(function (m) { return '<div class="vrow"><span><b>' + esc(m.name) + '</b> · ' + esc(m.dose) + '<small class="block">' + esc(m.freq) + ' · ' + esc(m.days) + (m.ins ? ' · ' + esc(m.ins) : '') + '</small></span></div>'; }).join('') + (r.note ? '<div class="kv"><small>Indicaciones generales</small><b>' + esc(r.note) + '</b></div>' : '') + '<div class="row"><button class="btn sm" type="button" data-a="rx-view" data-v="' + r.id + '">Ver récipe con firma y sello</button></div></div>';
  }
  A['rx-print'] = function () { try { window.print(); } catch (e) { toast('Aquí no se puede imprimir. En la app real se imprime o se guarda en PDF.'); } };
  V.pat.recetas = function () {
    const list = S.rx.filter(function (r) { return r.pid === X.myPid(); }).slice().reverse();
    return '<div class="head"><div><h1>Mis recetas</h1><p>Los tratamientos que tu médico te envía.</p></div></div>' + (list.length ? list.map(rxCard).join('') : '<div class="card"><p class="muted">Todavía no tienes recetas. Cuando tu médico te recete algo desde LABS, aparecerá aquí y te llegará un aviso.</p></div>');
  };
  const pi0 = V.pat.inicio;
  V.pat.inicio = function () {
    const pid = X.myPid(); const ords = S.docOrders.filter(function (o) { return o.pid === pid && o.state === 'Pendiente'; }); const rxs = S.rx.filter(function (r) { return r.pid === pid; });
    let extra = '';
    if (ords.length) extra += '<div class="card"><h2>Tu médico te pidió</h2>' + ords.map(function (o) { return '<div class="vrow"><span><b>' + (o.kind === 'repetir' ? 'Repetir' : 'Hacerte') + ':</b> ' + esc(o.exams.join(', ')) + '<small class="block">' + esc(o.when) + (o.ayuno ? ' · en ayunas' : '') + (o.note ? ' · ' + esc(o.note) : '') + '</small></span><button class="btn ghost sm" type="button" data-a="po-done" data-v="' + o.id + '">Ya me lo hice</button></div>'; }).join('') + '<p class="small muted">Ve a tu laboratorio con tu QR. Ellos arman la orden.</p></div>';
    if (rxs.length) extra += '<div class="card"><div class="row between"><h2>Mi última receta</h2><button class="btn ghost sm" type="button" data-a="nav" data-v="recetas">Ver todas</button></div>' + rxs[rxs.length - 1].meds.map(function (m) { return '<div class="vrow"><span><b>' + esc(m.name) + '</b> · ' + esc(m.dose) + '<small class="block">' + esc(m.freq) + ' · ' + esc(m.days) + '</small></span></div>'; }).join('') + '</div>';
    const h = pi0(); const k = h.indexOf('<div class="grid">'); const e = k >= 0 ? h.indexOf('</div></div>', h.indexOf('</div>', k)) : -1; return extra ? h.replace(/(<div class="card dark dashhero">[\s\S]*?<\/div><\/div>|<div class="card dark dashhero">[\s\S]*?<\/div>)/, function (m) { return m + extra; }) : h;
  };
  A['po-done'] = function (v) { const o = S.docOrders.filter(function (x) { return x.id === v; })[0]; if (o) { o.state = 'Hecho'; notify('doc', pname(o.pid) .split(' ')[0] + ' marcó como hecho: ' + o.exams.join(', ') + '.', { type: 'go', ref: 'lista' }); } toast('Listo. Tu médico verá que ya te lo hiciste.'); render(); };

  /* ---------- Órdenes (teléfono): filtro como pestañita desplegable ---------- */
  const FIL = [['todas', 'Todas'], ['esperando', 'Esperando al paciente'], ['proceso', 'Por cargar resultados'], ['enviada', 'Enviadas'], ['sinpago', 'Sin pagar'], ['anulada', 'Anuladas']];
  const ord0 = V.lab.ordenes;
  V.lab.ordenes = function () {
    const h = ord0(); if (!window.matchMedia('(max-width: 760px)').matches) return h;
    const cur = FIL.filter(function (f) { return f[0] === S.ofilter; })[0] || FIL[0]; const o = !!S.ofOpen;
    const dd = '<div class="row"><div class="per"><button type="button" class="perbtn" data-a="of-toggle" aria-haspopup="listbox" aria-expanded="' + o + '"><span>Ver: ' + esc(cur[1]) + '</span><i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' + (o ? '<div class="permenu l" role="listbox" aria-label="Tipo de orden">' + FIL.map(function (f) { const on = f[0] === cur[0]; return '<button type="button" role="option" class="peropt" data-a="of-pick" data-v="' + f[0] + '" aria-selected="' + on + '"><span>' + esc(f[1]) + '</span>' + (on ? '<b>✓</b>' : '') + '</button>'; }).join('') + '</div>' : '') + '</div></div>';
    return h.replace(/<div class="row"><div class="seg" role="group" aria-label="Filtrar órdenes">[\s\S]*?<\/div><\/div>/, dd);
  };
  A['of-toggle'] = function () { S.ofOpen = !S.ofOpen; render(); };
  A['of-pick'] = function (v) { S.ofilter = v; S.ofOpen = false; render(); };
  document.addEventListener('click', function (ev) { if (S.ofOpen && !ev.target.closest('.per')) { S.ofOpen = false; render(); } });

  /* ---------- Mis pacientes (laboratorio): lista simple + pantalla propia por paciente ---------- */
  const pac0 = V.lab.pacientes; S.pcOpen = null;
  function labMine() { return S.patients.filter(function (p) { return p.name !== 'Cuenta eliminada' && !p.deleted && p.id !== 'p7' && (p.labOnly || S.orders.some(function (o) { return o.pid === p.id; })); }); }
  function isOwn() { return (S.auth && (S.auth.sub || 'owner')) === 'owner'; }
  V.lab.pacientes = function () {
    const p = S.pcOpen ? X.personOf(S.pcOpen) : null;
    if (!p || p.deleted || p.name === 'Cuenta eliminada') { S.pcOpen = null; return pcList(); }
    const os = S.orders.filter(function (o) { return o.pid === p.id; }); const note = S.pnotes[p.id];
    const rows = os.length ? os.slice().reverse().map(function (o) { return '<div class="vrow"><span><b>' + esc(o.id) + '</b><small class="block">' + esc(o.when) + ' · ' + esc(o.exams.map(function (e) { return D.BY_ID[e].name; }).slice(0, 2).join(', ')) + (o.exams.length > 2 ? ' y ' + (o.exams.length - 2) + ' más' : '') + '</small></span><span class="chip ' + (o.status === 'Enviada' ? 'ok' : o.status === 'Anulada' ? 'crit' : o.status === 'Esperando paciente' ? 'gray' : 'warn') + '">' + esc(o.status) + '</span></div>'; }).join('') : '<p class="small muted">Todavía no tiene órdenes aquí.</p>';
    return '<div class="deskback"><button class="btn ghost sm" type="button" data-a="pc-back">‹ Volver a mis pacientes</button></div>' +
      '<div class="card"><div class="row between"><h2>' + esc(p.name) + '</h2><span class="chip ' + (p.labOnly ? 'warn' : 'ok') + '">' + (p.labOnly ? 'Solo en este laboratorio' : 'Tiene cuenta LABS') + '</span></div><div class="small muted">Cédula ' + esc(X.maskCi(p.ci)) + ' · ' + os.length + (os.length === 1 ? ' orden' : ' órdenes') + '</div>' + (note ? '<div class="kv"><small>Nota interna</small><b>' + esc(note) + '</b></div>' : '') +
      '<div class="btnrow"><button class="btn sm" type="button" data-a="pc-new" data-v="' + p.id + '">Nueva orden</button><button class="btn ghost sm" type="button" data-a="pc-hist" data-v="' + p.id + '">Historial completo</button><button class="btn ghost sm" type="button" data-a="pc-ci" data-v="' + p.id + '">Ver cédula</button><button class="btn ghost sm" type="button" data-a="pc-note" data-v="' + p.id + '">' + (note ? 'Editar nota' : 'Agregar nota') + '</button>' + (p.labOnly ? '<button class="btn ghost sm" type="button" data-a="pc-add" data-v="' + p.id + '">Corregir datos</button>' : '') + (p.labOnly && isOwn() ? '<button class="btn warn sm" type="button" data-a="pc-del" data-v="' + p.id + '">Borrar datos</button>' : '') + '</div></div>' +
      '<div class="card"><h2>Sus órdenes</h2>' + rows + '</div>';
  };
  function pcList() {
    const q = F('pc-q').trim().toLowerCase(); const qd = q.replace(/\D/g, ''); const all = labMine();
    const list = q ? all.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && p.ci.replace(/\D/g, '').indexOf(qd) >= 0); }) : all;
    return '<div class="head"><div><h1>Mis pacientes</h1><p>' + all.length + ' pacientes con historial en este laboratorio. Toca un nombre para ver sus opciones.</p></div><button class="btn" type="button" data-a="pc-add">Registrar paciente</button></div>' +
      '<div class="card">' + fld('Buscar por nombre o cédula', 'pc-q') + (list.length ? list.map(function (p) {
        const n = S.orders.filter(function (o) { return o.pid === p.id; }).length;
        return '<button type="button" class="pcrow" data-a="pc-open" data-v="' + p.id + '"><span class="t"><b>' + esc(p.name) + '</b><span class="s">Cédula ' + esc(X.maskCi(p.ci)) + ' · ' + n + (n === 1 ? ' orden' : ' órdenes') + '</span></span><span class="chip ' + (p.labOnly ? 'warn' : 'ok') + '">' + (p.labOnly ? 'Solo aquí' : 'Con cuenta') + '</span><i class="chev" aria-hidden="true">›</i></button>';
      }).join('') : '<p class="muted">No hay pacientes con ese nombre o cédula.</p>') + '</div>' +
      '<div class="card note"><h2>Cómo se cuidan estos datos</h2><ul class="clean small"><li>Solo se guarda nombre, apellido y cédula. La edad y el sexo son opcionales.</li><li>La cédula se ve oculta. Verla completa queda anotado en el registro del laboratorio.</li><li>Solo el personal de este laboratorio ve su lista. Otros laboratorios, médicos y LABS no la ven.</li><li>Cada paciente debe autorizar que lo guardes. Puede pedirte que lo borres.</li><li>Nunca ves resultados de otros laboratorios.</li></ul></div>';
  }
  A['pc-open'] = function (v) { S.pcOpen = v; render(); window.scrollTo(0, 0); };
  A['pc-back'] = function () { S.pcOpen = null; render(); window.scrollTo(0, 0); };
  const nav0 = A['nav']; A['nav'] = function (v, el) { S.pcOpen = null; return nav0(v, el); };
  const pcnew0 = A['pc-new']; A['pc-new'] = function (v) { S.pcOpen = null; return pcnew0(v); };
  const del0 = A['pc-del-ok']; A['pc-del-ok'] = function (v) { S.pcOpen = null; return del0(v); };

  /* ---------- Firma y sello del médico + récipe ---------- */
  S.dm = { sign: '', stamp: '', over: '', msg: '', own: false, saved: false };
  function doctorSample() {
    const w = 1000, h = 680; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#f7f5ef'); bg.addColorStop(1, '#e4e1d8'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    let sd = 7; function rn() { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; }
    for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(80,70,50,' + (rn() * 0.05).toFixed(3) + ')'; g.fillRect(rn() * w, rn() * h, 2, 2); }
    g.save(); g.translate(120, 380); g.strokeStyle = '#1b2a66'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, 50); g.bezierCurveTo(40, -70, 70, 110, 110, 0); g.bezierCurveTo(140, -50, 150, 100, 200, 40); g.bezierCurveTo(240, -10, 280, 90, 330, 30); g.bezierCurveTo(350, 10, 380, 50, 400, 25); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(20, 95); g.bezierCurveTo(130, 70, 250, 115, 390, 65); g.stroke(); g.restore();
    g.save(); g.translate(790, 330); g.rotate(-0.1); const ink = '#4b2e9c'; g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 130, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.stroke();
    g.font = '700 20px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const t = 'DRA. MARISOL PÉREZ · MÉDICO CIRUJANO · '; const rad = 94;
    for (let i = 0; i < t.length; i++) { const a = (i / t.length) * Math.PI * 2 - Math.PI / 2; g.save(); g.rotate(a); g.translate(0, -rad); g.fillText(t[i], 0, 0); g.restore(); }
    g.font = '700 20px Poppins, sans-serif'; g.fillText('MPPS', 0, -12); g.font = '700 22px Poppins, sans-serif'; g.fillText('N.º 12345', 0, 18); g.restore();
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(240,238,230,' + (0.5 + rn() * 0.4).toFixed(2) + ')'; g.beginPath(); g.arc(660 + rn() * 260, 200 + rn() * 260, rn() * 2.2, 0, 7); g.fill(); }
    const sh = g.createRadialGradient(w * 0.2, h * 0.1, 50, w * 0.5, h * 0.5, w * 0.8); sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0.16)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    return c;
  }
  function setDm(e) { S.dm.sign = e.sign ? e.sign.toDataURL() : ''; S.dm.stamp = e.stamp ? e.stamp.toDataURL() : ''; S.dm.over = e.overlay.toDataURL('image/jpeg', 0.8); }
  function dmMsg(e) { return e.sign && e.stamp ? 'Detectó la firma y el sello.' : e.sign ? 'Detectó la firma, pero no el sello. Prueba otra foto con el sello más separado.' : e.stamp ? 'Detectó el sello, pero no la firma. Prueba otra foto con la firma más separada.' : 'No detectó ni firma ni sello. Usa una hoja blanca, buena luz y firma y sello sin tocarse.'; }
  try { setDm(L.extract(doctorSample())); S.dm.own = true; S.dm.saved = true; S.dm.msg = 'Hoja de ejemplo cargada. Detectó la firma y el sello.'; } catch (e) { S.dm.msg = 'No se pudo cargar la hoja de ejemplo.'; }

  function recetaSheet(r, bar) {
    const code = L.docCode(r.id, r.date || ''); const pp = r.pid ? X.personOf(r.pid) : null;
    const meds = r.meds.map(function (m, i) { return '<div style="padding:8px 0;border-top:1px solid #d7dcf0"><b>' + (i + 1) + '. ' + esc(m.name) + '</b> · ' + esc(m.dose) + '<div>' + esc(m.freq) + ' · ' + esc(m.days) + (m.ins ? ' · ' + esc(m.ins) : '') + '</div></div>'; }).join('');
    const sig = r.sign ? '<img class="sign" src="' + r.sign + '" alt="Firma del médico" style="left:0;top:34px;max-width:150px;max-height:70px">' : '';
    const stp = r.stamp ? '<img class="stamp" src="' + r.stamp + '" alt="Sello del médico" style="left:120px;top:-6px;max-width:120px;max-height:120px;mix-blend-mode:multiply">' : '';
    return (bar ? '<div class="row between sheetbar"><span class="small muted">Hoja tamaño carta</span><button class="btn ghost sm" type="button" data-a="pz">' + (S.pz === 'big' ? 'Ver hoja completa' : 'Acercar') + '</button></div>' : '') +
      '<div class="paper-fit"><div class="sheet"><div class="row between" style="border-bottom:2px solid #14193A;padding-bottom:10px"><div><b style="font-size:17px">' + esc(r.doctor) + '</b><div>Médico · MPPS ' + esc(r.mpps) + '</div></div><div style="text-align:right"><b style="font-size:18px">Récipe médico</b><div>N.º ' + esc(r.id) + '</div><div>' + esc(r.date || '') + '</div></div></div>' +
      '<div><b>Paciente:</b> ' + esc(pp ? pp.name : r.patient || '—') + (pp ? ' · ' + esc(X.maskCi(pp.ci)) : '') + '</div><div><b>Diagnóstico o motivo:</b> ' + esc(r.dx) + '</div>' +
      '<div><b style="font-size:20px">Rp/</b>' + meds + '</div>' + (r.note ? '<div><b>Indicaciones generales:</b> ' + esc(r.note) + '</div>' : '') +
      '<div class="foot"><div><div class="sig">' + sig + stp + '</div><div style="border-top:1px solid #14193A;padding-top:4px;width:250px">' + esc(r.doctor) + '<br>Médico · MPPS ' + esc(r.mpps) + '</div></div><div style="text-align:center">' + L.qrSvg(code, 92) + '<div style="font-size:11px">' + code + '</div><div style="font-size:11px">QR de verificación (ejemplo)</div></div></div>' +
      '<p style="font-size:11px;color:#3A4470">Récipe digital emitido desde LABS con la firma y el sello del médico. Se verifica con el código QR. Para usarlo en la farmacia, preséntalo en tu teléfono o impreso.</p></div></div>';
  }
  const SAMPLE_RX = { id: 'RX-0000', pid: 'p1', dx: 'Control de glucosa', note: 'Dieta baja en azúcar. Volver en 30 días con nuevos exámenes.', date: '', doctor: DOC, mpps: '12345', meds: [{ name: 'Metformina', dose: '500 mg', freq: 'Cada 12 horas', days: '30 días', ins: 'Tomar con comida' }] };
  function findRx(id) { return S.rx.filter(function (r) { return r.id === id; })[0]; }
  A['rx-view'] = function (v) { const r = findRx(v); if (!r) return; dlg('Récipe ' + r.id, recetaSheet(r, false), { label: 'Imprimir o guardar PDF', a: 'rx-print', closeLabel: 'Cerrar' }); };
  A['dm-go'] = function () { S.modal = null; S.doc = 'firma'; S.docOpen = null; render(); window.scrollTo(0, 0); };

  EXT.nav.doc.splice(Math.max(1, EXT.nav.doc.map(function (n) { return n.id; }).indexOf('lista') + 1), 0, { id: 'firma', label: 'Firma y sello' });
  V.doc.firma = function () {
    const d = S.dm; const has = !!d.sign || !!d.stamp; const pv = Object.assign({}, SAMPLE_RX, { date: X.longDate(), sign: d.sign, stamp: d.stamp });
    return '<div class="head"><div><h1>Firma y sello</h1><p>Fotografía una hoja con tu firma y tu sello (con tu número MPPS), separados. LABS los detecta y los copia igual. Los cargas una sola vez.</p></div></div>' +
      '<div class="card"><h2>1. Sube la foto</h2><div class="drop"><p>Una hoja blanca, buena luz, con la firma y el sello sin tocarse.</p><div class="row" style="justify-content:center"><label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Subir foto<input type="file" accept="image/jpeg,image/png" data-c="dfile" class="sr"></label><button class="btn ghost" type="button" data-a="dm-sample">Probar con una hoja de ejemplo</button></div><p class="small muted">La foto se procesa en tu navegador. En la versión real se guarda cifrada y solo la puedes subir tú.</p></div>' + (d.msg ? '<p class="small" role="status"><b>' + esc(d.msg) + '</b></p>' : '') + '</div>' +
      '<div class="card"><h2>2. Lo que detectó</h2>' + (d.over ? '<img src="' + d.over + '" alt="Foto con la firma y el sello marcados" style="width:100%;border-radius:14px">' : '<p class="muted">Aquí aparece tu foto con la firma y el sello marcados.</p>') + '</div>' +
      '<div class="card"><h2>3. Revisa y guarda</h2><div class="grid"><div><b class="small">Firma</b><div class="check">' + (d.sign ? '<img src="' + d.sign + '" alt="Firma recortada">' : '<span class="small muted">No detectada</span>') + '</div></div><div><b class="small">Sello</b><div class="check">' + (d.stamp ? '<img src="' + d.stamp + '" alt="Sello recortado">' : '<span class="small muted">No detectado</span>') + '</div></div></div>' +
      '<div class="row"><button class="btn ghost sm" type="button" data-a="dm-swap">Intercambiar firma y sello</button></div>' +
      '<label class="row small" style="cursor:pointer"><input type="checkbox" data-c="dm-own" ' + (d.own ? 'checked' : '') + ' style="width:22px;height:22px"> Soy el médico (MPPS 12345) y esta es mi firma y mi sello.</label>' +
      '<button class="btn" type="button" data-a="dm-save" ' + (has && d.own ? '' : 'disabled') + '>Guardar firma y sello</button>' + (d.saved && has && d.own ? '<p class="small up"><b>Guardado.</b> Se estampan solo cuando tú envías un récipe.</p>' : '') + '</div>' +
      '<div class="card"><h2>Así sale tu récipe</h2>' + recetaSheet(pv, true) + '</div>' +
      '<div class="card note"><h2>Cómo se cuida tu firma</h2><ul class="clean small"><li>No se puede descargar ni copiar desde el sistema.</li><li>Se estampa solo cuando tú envías un récipe.</li><li>Cada récipe queda con su número y su código QR de verificación.</li><li>Si cambias tu firma, los récipes ya enviados conservan la que tenían.</li></ul></div>';
  };
  A['dm-sample'] = function () { try { const e = L.extract(doctorSample()); setDm(e); S.dm.msg = 'Hoja de ejemplo cargada. ' + dmMsg(e); S.dm.own = false; S.dm.saved = false; } catch (er) { S.dm.msg = 'No se pudo usar la hoja de ejemplo.'; } render(); };
  A['dm-swap'] = function () { const x = S.dm.sign; S.dm.sign = S.dm.stamp; S.dm.stamp = x; S.dm.saved = false; render(); };
  A['dm-save'] = function () { S.dm.saved = true; logAudit(DOC, 'El médico actualizó su firma y su sello'); toast('Firma y sello guardados. Solo se estampan al enviar un récipe.'); render(); };
  document.addEventListener('change', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c');
    if (c === 'dm-own') { S.dm.own = t.checked; render(); return; }
    if (c === 'dfile') { const f = t.files && t.files[0]; if (!f) return; S.dm.msg = 'Procesando la foto…'; render(); L.loadImageFromFile(f, 1400).then(function (cv) { const e = L.extract(cv); setDm(e); S.dm.msg = dmMsg(e); S.dm.own = false; S.dm.saved = false; render(); }).catch(function () { S.dm.msg = 'No se pudo abrir esa imagen. Usa una foto JPG o PNG.'; render(); }); }
  });

  /* ---------- Teléfono: todo selector de pestañas pasa a ser una pestañita desplegable ---------- */
  window.UI_segs = function (root) {
    if (!root || !window.matchMedia('(max-width: 760px)').matches) return;
    Array.prototype.forEach.call(root.querySelectorAll('.seg'), function (seg) {
      const btns = Array.prototype.slice.call(seg.querySelectorAll('button')); if (!btns.length) return;
      const cur = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || btns[0];
      const wrap = document.createElement('div'); wrap.className = 'per segdd';
      const top = document.createElement('button'); top.type = 'button'; top.className = 'perbtn segbtn'; top.setAttribute('aria-haspopup', 'listbox'); top.setAttribute('aria-expanded', 'false');
      top.innerHTML = '<span>Ver: ' + esc(cur.textContent.trim()) + '</span><i class="chev" aria-hidden="true">›</i>';
      const menu = document.createElement('div'); menu.className = 'permenu l'; menu.setAttribute('role', 'listbox'); menu.hidden = true; if (seg.getAttribute('aria-label')) menu.setAttribute('aria-label', seg.getAttribute('aria-label'));
      btns.forEach(function (b) { const o = b.cloneNode(true); const on = b === cur; o.className = 'peropt segopt'; o.setAttribute('role', 'option'); o.setAttribute('aria-selected', String(on)); o.removeAttribute('aria-pressed'); o.removeAttribute('data-c'); o.innerHTML = '<span>' + esc(b.textContent.trim()) + '</span>' + (on ? '<b>✓</b>' : ''); menu.appendChild(o); });
      wrap.appendChild(top); wrap.appendChild(menu); seg.parentNode.replaceChild(wrap, seg);
    });
  };
  document.addEventListener('click', function (ev) {
    const tb = ev.target.closest && ev.target.closest('.segbtn');
    document.querySelectorAll('.segdd').forEach(function (w) { const m = w.querySelector('.permenu'), b = w.querySelector('.segbtn'); if (tb && tb === b) { m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); b.querySelector('.chev').classList.toggle('open', !m.hidden); } else { m.hidden = true; b.setAttribute('aria-expanded', 'false'); b.querySelector('.chev').classList.remove('open'); } });
  }, true);
  const post0 = window.UI_post; window.UI_post = function () { if (post0) post0(); window.UI_segs(document.getElementById('app')); };

  /* ---------- Pie de autor ---------- */
  const BYLINE = '<p class="byline">BY INSANITY MEDIA LLC<sup>®</sup> · All rights reserved</p>';
  [[V.lab, 'config'], [V.lab, 'suscripcion'], [EXT.views.adm, 'ajustes']].forEach(function (x) { const f0 = x[0][x[1]]; if (f0) x[0][x[1]] = function () { return f0() + BYLINE; }; });
  render();
})();
