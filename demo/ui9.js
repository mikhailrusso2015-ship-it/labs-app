/* LABS demo · selector de tasas desplegable + médico: exámenes por separado, repetir/pedir examen, recetar */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const logAudit = U.logAudit, esc = U.esc, toast = U.toast, F = X.F, fld = X.fld, errBox = X.errBox, dlg = X.dlg, closeDlg = X.closeDlg, notify = X.notify, chipFor = U.chipFor;
  const DOC = S.docProfile.name;
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
    const txt = window.DOCP() + (kind === 'repetir' ? ' te pidió repetir: ' : ' te pidió hacerte: ') + names.join(', ') + '. ' + (kind === 'repetir' ? 'Motivo: ' + reason.toLowerCase() + '. ' : '') + 'Cuándo: ' + when.toLowerCase() + '.' + (ayuno ? ' Ve en ayunas.' : '') + (note ? ' Nota: ' + note : '');
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
    notify('pat', window.DOCP() + ' te envió un récipe firmado y sellado (' + S.rxd.length + (S.rxd.length === 1 ? ' medicamento' : ' medicamentos') + '). Míralo en Mis recetas.', { type: 'go', ref: 'recetas' }, S.rxPid);
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
    if (ords.length) extra += '<div class="card"><h2>Tu médico te pidió</h2><p class="small"><b>' + esc(S.docProfile.name) + '</b> · MPPS ' + esc(S.docProfile.mpps) + '</p>' + ords.map(function (o) { return '<div class="vrow"><span><b>' + (o.kind === 'repetir' ? 'Repetir' : 'Hacerte') + ':</b> ' + esc(o.exams.join(', ')) + '<small class="block">' + esc(o.when) + (o.ayuno ? ' · en ayunas' : '') + (o.note ? ' · ' + esc(o.note) : '') + '</small></span><button class="btn ghost sm" type="button" data-a="po-done" data-v="' + o.id + '">Ya me lo hice</button></div>'; }).join('') + '<p class="small muted">Ve a tu laboratorio con tu QR. Ellos arman la orden.</p></div>';
    if (rxs.length) extra += '<div class="card"><div class="row between"><h2>Mi última receta</h2><button class="btn ghost sm" type="button" data-a="nav" data-v="recetas">Ver todas</button></div>' + rxs[rxs.length - 1].meds.map(function (m) { return '<div class="vrow"><span><b>' + esc(m.name) + '</b> · ' + esc(m.dose) + '<small class="block">' + esc(m.freq) + ' · ' + esc(m.days) + '</small></span></div>'; }).join('') + '</div>';
    const h = pi0(); const k = h.indexOf('<div class="grid">'); const e = k >= 0 ? h.indexOf('</div></div>', h.indexOf('</div>', k)) : -1; return extra ? h.replace(/(<div class="card dark dashhero">[\s\S]*?<\/div><\/div>|<div class="card dark dashhero">[\s\S]*?<\/div>)/, function (m) { return m + extra; }) : h;
  };
  A['po-done'] = function (v) { const o = S.docOrders.filter(function (x) { return x.id === v; })[0]; if (o) { o.state = 'Hecho'; notify('doc', pname(o.pid).split(' ')[0] + ' marcó como hecho: ' + o.exams.join(', ') + '.', { type: 'go', ref: 'lista' }); } toast('Listo. Tu médico verá que ya te lo hiciste.'); render(); };

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

  /* ---------- Datos del médico: siempre visibles, no se pueden ocultar ---------- */
  const DP = S.docProfile; DP.carnet = ''; DP.colegio = ''; DP.cnum = ''; DP.csaved = false;
  S.docConsult = { price: '25', mode: 'Videollamada o chat', saved: true };
  S.pm.doc = [
    { id: 'dm1', name: 'Pago móvil', on: true, qr: null, f: [{ k: 'Banco', v: 'Banesco' }, { k: 'Teléfono', v: '0414-5550730' }, { k: 'Cédula', v: 'V-11.050.730' }] },
    { id: 'dm2', name: 'Zelle', on: true, qr: null, f: [{ k: 'Correo', v: 'doc@demo.com' }, { k: 'Titular', v: 'Marisol Pérez' }] }
  ];
  const perfil0 = EXT.views.doc.perfil;
  function docChecks() {
    const d = S.docProfile; const row = function (ok, t, go, lab) { return '<div class="vrow"><span>' + t + '</span>' + (ok ? '<span class="chip ok">Listo</span>' : '<button class="btn sm" type="button" data-a="nav" data-v="' + go + '">' + lab + '</button>') + '</div>'; };
    return '<div class="card"><h2>Mi perfil de médico</h2>' + row(S.dm.saved, 'Firma y sello', 'firma', 'Cargar') + row(d.csaved, 'Carnet del Colegio de Médicos', 'carnet', 'Cargar') + row(S.pm.doc.some(function (m) { return m.on; }), 'Cobro de consultas', 'cobros', 'Configurar') + '</div>';
  }
  EXT.views.doc.perfil = function () {
    const tab = S.prof || 'datos'; if (tab !== 'datos') return perfil0(); const d = S.docProfile;
    const tabs = [['datos', 'Mis datos'], ['seguridad', 'Seguridad'], ['avisos', 'Avisos']];
    return '<div class="head"><div><h1>Mi perfil</h1><p>' + esc(d.name) + ' · MPPS ' + esc(d.mpps) + '</p></div></div><div class="seg" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-a="prof-tab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="card"><h2>Mis datos</h2><div class="banner" role="note"><b>Siempre visibles.</b> Tu nombre, tu apellido y tu número de MPPS los ven los laboratorios y los pacientes en cada receta, pedido, solicitud y acceso. No se pueden ocultar ni dejar vacíos.</div>' +
      fld('Nombres', 'dp-first', { def: d.first }) + fld('Apellidos', 'dp-last', { def: d.last }) + fld('N.º de MPPS (licencia médica)', 'dp-mpps', { def: d.mpps, ro: true }) + fld('Especialidad', 'dp-esp', { def: d.esp }) + fld('Teléfono', 'dp-phone', { def: d.phone, type: 'tel', mode: 'tel' }) +
      '<div class="row"><span class="chip ok">MPPS verificado</span></div>' + errBox('dpf') + '<div class="row"><button class="btn" type="button" data-a="d-save">Guardar</button></div></div>' + docChecks();
  };
  A['d-save'] = function () {
    const d = S.docProfile; const fi = F('dp-first', d.first).trim().replace(/\s+/g, ' '), la = F('dp-last', d.last).trim().replace(/\s+/g, ' ');
    if (fi.length < 2) return X.setErr('dpf', 'El nombre es obligatorio. Los laboratorios y los pacientes siempre lo ven.'); if (la.length < 2) return X.setErr('dpf', 'El apellido es obligatorio. Los laboratorios y los pacientes siempre lo ven.');
    if (!d.mpps) return X.setErr('dpf', 'El número de MPPS es obligatorio y no se puede quitar.');
    const ph = F('dp-phone', d.phone).replace(/\D/g, ''); if (!/^04\d{9}$/.test(ph)) return X.setErr('dpf', 'El teléfono debe tener 11 números y empezar por 04.');
    d.first = fi; d.last = la; d.name = d.title + ' ' + fi + ' ' + la; d.esp = F('dp-esp', d.esp).trim() || d.esp; d.phone = ph; S.auth.name = d.name; S.err = {};
    S.access.forEach(function (a) { a.doc = d.name; a.mpps = d.mpps; }); toast('Datos guardados. Tu nombre, apellido y MPPS se muestran siempre.'); render();
  };

  /* ---------- Carnet del Colegio de Médicos ---------- */
  const COLEGIOS = ['Colegio de Médicos del Estado Carabobo', 'Colegio de Médicos del Distrito Metropolitano', 'Colegio de Médicos del Estado Miranda', 'Colegio de Médicos del Estado Aragua', 'Colegio de Médicos del Estado Zulia', 'Colegio de Médicos del Estado Lara', 'Colegio de Médicos del Estado Anzoátegui', 'Colegio de Médicos del Estado Bolívar', 'Colegio de Médicos del Estado Táchira', 'Colegio de Médicos del Estado Mérida', 'Otro colegio'];
  function carnetSample() {
    const c = document.createElement('canvas'); c.width = 860; c.height = 540; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 860, 540); bg.addColorStop(0, '#eef2ff'); bg.addColorStop(1, '#cfd8ff'); g.fillStyle = bg; g.fillRect(0, 0, 860, 540);
    g.fillStyle = '#2c3ba8'; g.fillRect(0, 0, 860, 96); g.fillStyle = '#fff'; g.font = '700 28px Poppins, sans-serif'; g.textAlign = 'center'; g.fillText('COLEGIO DE MÉDICOS', 430, 44); g.font = '500 20px Poppins, sans-serif'; g.fillText('CARNET DE AFILIACIÓN (EJEMPLO)', 430, 76);
    g.fillStyle = '#aab6f0'; g.fillRect(50, 140, 200, 250); g.fillStyle = '#7d8cdb'; g.beginPath(); g.arc(150, 230, 48, 0, 7); g.fill(); g.fillRect(90, 290, 120, 100);
    g.textAlign = 'left'; g.fillStyle = '#14193A'; g.font = '700 34px Poppins, sans-serif'; g.fillText(S.docProfile.name, 290, 190); g.font = '500 24px Poppins, sans-serif'; g.fillText('Médico cirujano · ' + S.docProfile.esp, 290, 238); g.fillText('MPPS N.º ' + S.docProfile.mpps, 290, 286); g.fillText('Colegiatura N.º 00000', 290, 334);
    g.font = '500 18px Poppins, sans-serif'; g.fillStyle = '#3A4470'; g.fillText('Imagen de ejemplo para la demostración', 290, 430); return c;
  }
  S.dk = { img: '', msg: '' };
  function carnetFromCanvas(cv) { S.dk.img = cv.toDataURL('image/jpeg', 0.82); }
  V.doc.carnet = function () {
    const d = S.docProfile, k = S.dk;
    return '<div class="head"><div><h1>Carnet del Colegio de Médicos</h1><p>Sube una foto de tu carnet. Sirve para verificar que eres médico. Solo la ve LABS.</p></div></div>' +
      '<div class="card"><h2>1. Foto del carnet</h2><div class="drop"><p>Foto de frente, con buena luz, que se lea tu nombre y tu número.</p><div class="row" style="justify-content:center"><label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Subir foto<input type="file" accept="image/jpeg,image/png" data-c="dcarnet" class="sr"></label><button class="btn ghost" type="button" data-a="dk-sample">Probar con un carnet de ejemplo</button></div></div>' + (k.msg ? '<p class="small" role="status"><b>' + esc(k.msg) + '</b></p>' : '') + (k.img ? '<img src="' + k.img + '" alt="Foto del carnet" style="width:100%;border-radius:14px">' : '<p class="muted small">Aquí aparece la foto de tu carnet.</p>') + '</div>' +
      '<div class="card"><h2>2. Datos del colegio</h2>' + fld('Colegio de Médicos', 'dk-col', { type: 'select', options: COLEGIOS, def: d.colegio || COLEGIOS[0] }) + fld('N.º de colegiatura', 'dk-num', { def: d.cnum, ph: 'Ej.: 12345' }) + fld('Confirmo que es mi carnet', 'dk-own', { type: 'checkbox' }) + errBox('dk') +
      '<div class="row"><button class="btn" type="button" data-a="dk-save">Guardar carnet</button></div>' + (d.csaved ? '<p class="small up"><b>Guardado.</b> LABS lo revisa para confirmar tu MPPS.</p>' : '') + '</div>' +
      '<div class="card note"><h2>Qué se muestra y qué no</h2><ul class="clean small"><li>Los pacientes y los laboratorios ven siempre tu nombre, apellido y MPPS.</li><li>La foto del carnet solo la ve el equipo de LABS para verificarte.</li><li>No se comparte con laboratorios ni pacientes.</li></ul></div>';
  };
  A['dk-sample'] = function () { try { carnetFromCanvas(carnetSample()); S.dk.msg = 'Carnet de ejemplo cargado.'; } catch (e) { S.dk.msg = 'No se pudo cargar el ejemplo.'; } render(); };
  A['dk-save'] = function () {
    const d = S.docProfile; if (!S.dk.img) return X.setErr('dk', 'Sube primero la foto de tu carnet.'); const n = F('dk-num', d.cnum).trim(); if (n.length < 3) return X.setErr('dk', 'Escribe tu número de colegiatura.'); if (!F('dk-own')) return X.setErr('dk', 'Marca la casilla para confirmar que es tu carnet.');
    d.carnet = S.dk.img; d.colegio = F('dk-col', COLEGIOS[0]); d.cnum = n; d.csaved = true; S.err = {}; logAudit(d.name, 'El médico cargó la foto de su carnet del Colegio de Médicos'); toast('Carnet guardado. LABS lo revisa.'); render();
  };
  document.addEventListener('change', function (ev) {
    const t = ev.target; if (!t.getAttribute || t.getAttribute('data-c') !== 'dcarnet') return; const f = t.files && t.files[0]; if (!f) return; S.dk.msg = 'Procesando la foto…'; render();
    L.loadImageFromFile(f, 1400).then(function (cv) { carnetFromCanvas(cv); S.dk.msg = 'Foto cargada. Revisa que se lea bien.'; render(); }).catch(function () { S.dk.msg = 'No se pudo abrir esa imagen. Usa una foto JPG o PNG.'; render(); });
  });

  /* ---------- Cobro de consultas del médico ---------- */
  V.doc.cobros = function () {
    const c = S.docConsult;
    return '<div class="head"><div><h1>Cobro de consultas</h1><p>Si atiendes a un paciente por la aplicación, así te paga.</p></div></div>' +
      '<div class="card"><h2>Mi consulta por la app</h2>' + fld('Precio de la consulta (dólares)', 'dc-price', { def: c.price, type: 'text', mode: 'decimal', ph: 'Ej.: 25' }) + fld('Cómo la atiendo', 'dc-mode', { type: 'select', options: ['Videollamada o chat', 'Solo videollamada', 'Solo chat'], def: c.mode }) + errBox('dc') + '<div class="row"><button class="btn" type="button" data-a="dc-save">Guardar</button></div><p class="small muted">Tu paciente ve el precio y tus datos de pago en su pantalla “Cómo pagar”. Paga directo a ti y te envía el comprobante.</p></div>' +
      '<div class="card"><h2>Mis métodos de pago</h2><p class="small muted">Tus pacientes ven solo los métodos activos. LABS no toca tu dinero.</p>' + EXT.pm.methodsView('doc', true) + '<div class="row"><button class="btn" type="button" data-a="pm-add" data-v="doc">Agregar método de pago</button></div></div>';
  };
  A['dc-save'] = function () { const p = parseFloat(String(F('dc-price', S.docConsult.price)).replace(',', '.')); if (!(p > 0) || p > 500) return X.setErr('dc', 'Escribe un precio entre 1 y 500 dólares.'); S.docConsult.price = String(Math.round(p * 100) / 100); S.docConsult.mode = F('dc-mode', S.docConsult.mode); S.err = {}; toast('Consulta guardada: $ ' + S.docConsult.price + '.'); render(); };
  const navDoc = EXT.nav.doc; const fi = navDoc.map(function (n) { return n.id; }).indexOf('firma') + 1;
  navDoc.splice(fi, 0, { id: 'carnet', label: 'Carnet del colegio' }, { id: 'cobros', label: 'Cobro de consultas' });
  if (EXT.MI) { EXT.MI.carnet = '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.8 5.4-1.8 6 0M14 10h4M14 14h4"/>'; EXT.MI.cobros = EXT.MI.pagar || EXT.MI.pagos; }

  /* ---------- Paciente: consulta con mi médico (cómo pagar) ---------- */
  const pagar0 = V.pat.pagar;
  V.pat.pagar = function () {
    const h = pagar0(); const c = S.docConsult; const d = S.docProfile; const on = S.pm.doc.some(function (m) { return m.on; });
    const card = '<div class="card"><h2>Consulta con mi médico</h2><p><b>' + esc(d.name) + '</b> · MPPS ' + esc(d.mpps) + '<br><span class="small muted">' + esc(d.esp) + ' · ' + esc(c.mode) + '</span></p><div class="row"><span class="chip ok">Consulta $ ' + esc(c.price) + '</span></div>' + (on ? '<p class="small muted">Paga a estos datos y envíale el comprobante a tu médico.</p>' + EXT.pm.methodsView('doc', false) : '<p class="muted small">Tu médico todavía no ha activado sus métodos de pago.</p>') + '</div>';
    return h + card;
  };
  const sel0 = null;

  /* ---------- Autogestión: QR del laboratorio + orden del paciente con comprobante ---------- */
  S.labQr = { on: true }; S.so = { sel: [], pks: [], open: '', proof: '', msg: '', done: null };
  const QRL = 'QR del laboratorio';
  function receiptSample(bs, ref) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 820; const g = c.getContext('2d');
    g.fillStyle = '#f4f6ff'; g.fillRect(0, 0, 600, 820); g.fillStyle = '#1b8f5a'; g.fillRect(0, 0, 600, 120); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 34px Poppins, sans-serif'; g.fillText('Pago realizado', 300, 62); g.font = '500 20px Poppins, sans-serif'; g.fillText('Comprobante de ejemplo (demostración)', 300, 96);
    g.fillStyle = '#14193A'; g.textAlign = 'left'; const rows = [['Banco', 'Banesco · Pago móvil'], ['Monto', 'Bs ' + bs], ['Referencia', ref], ['Fecha', X.longDate()], ['Destino', '0414-5550100'], ['Concepto', 'Exámenes de laboratorio']];
    rows.forEach(function (r, i) { const y = 190 + i * 96; g.fillStyle = '#5b6490'; g.font = '500 20px Poppins, sans-serif'; g.fillText(r[0], 50, y); g.fillStyle = '#14193A'; g.font = '700 28px Poppins, sans-serif'; g.fillText(r[1], 50, y + 36); });
    return c.toDataURL('image/jpeg', 0.8);
  }
  function priceSel(so) { let t = 0; const cov = []; so.pks.forEach(function (id) { const p = D.PACKAGES.filter(function (x) { return x.id === id; })[0]; if (p) { t += p.price; p.items.forEach(function (e) { cov.push(e); }); } }); so.sel.forEach(function (e) { if (cov.indexOf(e) < 0) t += D.BY_ID[e].price; }); return t; }
  function exSel(so) { const s = []; so.pks.forEach(function (id) { const p = D.PACKAGES.filter(function (x) { return x.id === id; })[0]; if (p) p.items.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); }); so.sel.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); return s; }
  // pedido de ejemplo ya hecho por QR (para que el laboratorio lo vea)
  (function () { const ex = ['glu', 'col'], usd = ex.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0), rate = D.RATES.bcv.value, bs = L.fmtInt ? L.fmtInt(usd * rate) : String(Math.round(usd * rate)); try { S.orders.unshift({ id: 'LAB-0191', pid: 'p5', exams: ex, pkgs: [], usd: usd, cost: ex.reduce(function (s, e) { return s + D.BY_ID[e].cost; }, 0), cur: 'bcv', rate: rate, method: 'Pago móvil', paid: false, status: 'Por procesar', when: 'Hoy 09:12', by: 'Paciente (' + QRL + ')', doctor: '', via: QRL, payRep: { method: 'Pago móvil', ref: '00482917', when: 'Hoy 09:14', proof: receiptSample(bs, '00482917') } }); } catch (e) { } })();

  /* Laboratorio: QR para imprimir y pegar */
  const code = function () { return 'LABS-LAB-' + S.labs[0].id.toUpperCase(); };
  /* Cartel del laboratorio: mismo diseño del manual de marca (A4). El nombre y el QR cambian en cada laboratorio. */
  function posterSvg(name, cd) {
    const nm = String(name || 'Tu laboratorio').toUpperCase(); const ns = nm.length > 34 ? 18 : nm.length > 26 ? 22 : 26;
    const steps = [['1', 'Elige tus', 'exámenes'], ['2', 'Mira cuánto', 'cuesta'], ['3', 'Paga y sube tu', 'comprobante'], ['4', 'Dile a caja tu', 'nombre y cédula']];
    const x0 = (1240 - 4 * 270) / 2; const sy = 1470;
    const st = steps.map(function (s, i) { const cx = x0 + i * 270 + 135; return '<circle cx="' + cx + '" cy="' + (sy + 34) + '" r="34" fill="#4C5FD5"/><text x="' + cx + '" y="' + (sy + 46) + '" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">' + s[0] + '</text><text x="' + cx + '" y="' + (sy + 104) + '" font-size="26" font-weight="500" fill="#3A4470" text-anchor="middle">' + s[1] + '</text><text x="' + cx + '" y="' + (sy + 138) + '" font-size="28" font-weight="700" fill="#14193A" text-anchor="middle">' + s[2] + '</text>'; }).join('');
    const qd = window.QRT ? window.QRT.path(cd, 370, 670, 500) : '';
    return '<svg class="qpost" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 1754" role="img" aria-label="Cartel con el QR del laboratorio" font-family="Poppins, Arial, sans-serif">' +
      '<defs><linearGradient id="qph" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5668E0"/><stop offset=".6" stop-color="#3345B5"/><stop offset="1" stop-color="#2A2A9C"/></linearGradient>' +
      '<filter id="qps" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="26"/><feOffset dy="24" result="o"/><feFlood flood-color="#1D2459" flood-opacity=".38"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<clipPath id="qpc"><path d="M0 0H1240V820Q620 900 0 820Z"/></clipPath></defs>' +
      '<rect width="1240" height="1754" fill="#EEF1FF"/><path d="M0 0H1240V820Q620 900 0 820Z" fill="url(#qph)"/>' +
      '<g clip-path="url(#qpc)"><circle cx="1130" cy="120" r="330" fill="#fff" opacity=".07"/><circle cx="1180" cy="620" r="170" fill="#fff" opacity=".06"/><circle cx="60" cy="700" r="240" fill="#5B3BD6" opacity=".35"/></g>' +
      '<image href="brand/logo-rev.svg" x="90" y="86" width="196" height="64"/>' +
      '<text x="90" y="224" font-size="' + ns + '" font-weight="500" fill="#DDE3FB" letter-spacing="6">' + esc(nm) + '</text>' +
      '<text x="90" y="330" font-size="86" font-weight="700" fill="#fff">Adelanta tu orden</text><text x="90" y="424" font-size="86" font-weight="700" fill="#fff">desde tu teléfono</text>' +
      '<text x="90" y="490" font-size="32" font-weight="500" fill="#DDE3FB">Elige tus exámenes, mira el precio, paga y</text><text x="90" y="534" font-size="32" font-weight="500" fill="#DDE3FB">espera solo a que te llamen para tu muestra.</text>' +
      '<g filter="url(#qps)"><rect x="290" y="600" width="660" height="730" rx="60" fill="#fff"/></g><path d="' + qd + '" fill="#14193A" shape-rendering="crispEdges"/>' +
      '<rect x="380" y="1230" width="480" height="64" rx="32" fill="#5B3BD6"/><text x="620" y="1272" font-size="23" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">ESCANEA CON LA CÁMARA</text>' +
      '<text x="620" y="1392" font-size="24" font-weight="500" fill="#3A4470" text-anchor="middle">Funciona con cualquier teléfono, sin instalar nada</text>' +
      '<line x1="' + (x0 + 169) + '" y1="' + (sy + 34) + '" x2="' + (x0 + 3 * 270 + 101) + '" y2="' + (sy + 34) + '" stroke="#9DB4F0" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>' + st +
      '<rect x="0" y="1628" width="1240" height="126" fill="#E6EAFF"/><text x="90" y="1682" font-size="22" font-weight="500" fill="#3A4470">Hecho con</text><image href="brand/logo-color.svg" x="230" y="1652" width="166" height="54"/>' +
      '<text x="1150" y="1674" font-size="24" font-weight="700" fill="#14193A" text-anchor="end">by Insanity Media LLC</text><text x="1150" y="1699" font-size="19" font-weight="500" fill="#3A4470" text-anchor="end">© All Rights Reserved</text></svg>';
  }
  V.lab.qrlab = function () {
    const lab = S.labs[0]; const n = S.orders.filter(function (o) { return o.via === QRL; }).length; const pend = S.orders.filter(function (o) { return o.via === QRL && !o.paid && o.status !== 'Anulada'; }).length;
    const poster = '<div class="qposter">' + posterSvg(lab.name, code()) + '</div>';
      '<div style="text-align:left;font-size:20px;line-height:1.7"><div><b>1.</b> Elige tus exámenes</div><div><b>2.</b> Mira cuánto cuesta</div><div><b>3.</b> Paga y sube tu comprobante</div><div><b>4.</b> Dile a la persona de caja tu nombre y tu cédula. Espera que te llamen para tomar tu muestra</div></div><div style="margin-top:auto;font-size:14px;color:#3A4470">' + esc(code()) + ' · Hecho con LABS</div></div></div>';
    return '<div class="head"><div><h1>QR para tus pacientes</h1><p>Imprímelo y pégalo en tu local. Tus pacientes lo escanean y adelantan su orden mientras esperan.</p></div></div>' +
      '<div class="card"><h2>Cómo funciona</h2><ul class="clean small"><li>El paciente escanea, elige sus exámenes, ve el precio, paga y sube su comprobante.</li><li>Te llega a <b>Atender pacientes → Cobrar la orden</b>. Búscalo por cédula, mira su comprobante y confirma el pago.</li><li>Después solo falta tomar la muestra. Menos fila y menos espera.</li></ul>' +
      '<div class="row"><span class="chip ' + (S.labQr.on ? 'ok' : 'gray') + '">' + (S.labQr.on ? 'Recibiendo órdenes por QR' : 'Apagado') + '</span><span class="chip gray">' + n + (n === 1 ? ' orden por QR' : ' órdenes por QR') + '</span>' + (pend ? '<span class="chip warn">' + pend + ' por confirmar pago</span>' : '') + '</div>' +
      '<div class="btnrow"><button class="btn" type="button" data-a="qrlab-print">Imprimir cartel</button><button class="btn ghost" type="button" data-a="qrlab-dl">Descargar cartel con QR</button><button class="btn ghost" type="button" data-a="qrlab-copy">Copiar código</button><button class="btn ' + (S.labQr.on ? 'warn' : 'ghost') + '" type="button" data-a="qrlab-toggle">' + (S.labQr.on ? 'Apagar órdenes por QR' : 'Activar órdenes por QR') + '</button></div></div>' +
      '<div class="card"><h2>Así se ve el cartel</h2>' + poster + '</div>' +
      '<div class="card note"><h2>Cuidados</h2><ul class="clean small"><li>El QR es público y solo lleva al laboratorio. No tiene datos de nadie.</li><li>Ningún examen se hace sin pago confirmado por ti.</li><li>Si lo apagas, el que escanee verá que debe pasar por caja.</li></ul></div>';
  };
  A['qrlab-print'] = function () { try { window.print(); } catch (e) { toast('Aquí no se puede imprimir. En la versión real se imprime o se guarda en PDF.'); } };
  /* Descargar el cartel completo (nombre del laboratorio + QR + pasos) como imagen PNG lista para imprimir */
  const _b64 = {};
  function asData(url, mime) { if (_b64[url]) return Promise.resolve(_b64[url]); return fetch(url).then(function (r) { if (!r.ok) throw new Error('x'); return r.blob(); }).then(function (b) { return new Promise(function (ok, no) { const fr = new FileReader(); fr.onload = function () { _b64[url] = fr.result; ok(fr.result); }; fr.onerror = no; fr.readAsDataURL(b); }); }); }
  function posterStandalone(name, cd) {
    return Promise.all([asData('brand/logo-rev.svg'), asData('brand/logo-color.svg'), asData('brand/fonts/poppins-500.ttf'), asData('brand/fonts/poppins-700.ttf')]).then(function (a) {
      let svg = posterSvg(name, cd).replace('class="qpost" ', '').replace('href="brand/logo-rev.svg"', 'href="' + a[0] + '"').replace('href="brand/logo-color.svg"', 'href="' + a[1] + '"');
      const css = '<style>@font-face{font-family:"PoppinsE";font-weight:500;src:url(' + a[2] + ') format("truetype")}@font-face{font-family:"PoppinsE";font-weight:700;src:url(' + a[3] + ') format("truetype")}</style>';
      svg = svg.replace('font-family="Poppins, Arial, sans-serif"', 'font-family="PoppinsE, Poppins, Arial, sans-serif"').replace('<defs>', '<defs>' + css);
      if (svg.indexOf('width="1240"') < 0) svg = svg.replace('<svg ', '<svg width="1240" height="1754" ');
      return svg;
    });
  }
  function saveBlob(blob, fname) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
  A['qrlab-dl'] = function () {
    const lab = S.labs[0]; const base = 'Cartel-QR-' + String(lab.name || 'laboratorio').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-').replace(/^-|-$/g, '');
    toast('Preparando el cartel…');
    posterStandalone(lab.name, code()).then(function (svg) {
      const img = new Image();
      img.onload = function () {
        try { const c = document.createElement('canvas'); c.width = 2480; c.height = 3508; const x = c.getContext('2d'); x.fillStyle = '#EEF1FF'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (b) { if (!b) { saveBlob(new Blob([svg], { type: 'image/svg+xml' }), base + '.svg'); toast('Cartel descargado.'); return; } saveBlob(b, base + '.png'); toast('Cartel descargado. Listo para imprimir en hoja A4.'); }, 'image/png'); }
        catch (e) { saveBlob(new Blob([svg], { type: 'image/svg+xml' }), base + '.svg'); toast('Cartel descargado.'); }
      };
      img.onerror = function () { saveBlob(new Blob([svg], { type: 'image/svg+xml' }), base + '.svg'); toast('Cartel descargado.'); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }).catch(function () { toast('No se pudo descargar el cartel. Prueba con Imprimir cartel y guarda en PDF.'); });
  };
  A['qrlab-copy'] = function () { EXT.pm.copyText(code()).then(function (ok) { toast(ok ? 'Código copiado.' : 'No se pudo copiar.'); }); };
  A['qrlab-toggle'] = function () { S.labQr.on = !S.labQr.on; logAudit(S.auth.name, S.labQr.on ? 'Activó las órdenes por QR' : 'Apagó las órdenes por QR'); toast(S.labQr.on ? 'Órdenes por QR activadas.' : 'Órdenes por QR apagadas.'); render(); };
  EXT.nav.lab.splice(Math.max(1, EXT.nav.lab.map(function (n) { return n.id; }).indexOf('atencion') + 1), 0, { id: 'qrlab', label: 'QR para pacientes' });
  if (EXT.MI) EXT.MI.qrlab = EXT.MI.qr || '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>';
  [[V.lab, 'config'], [V.lab, 'suscripcion']].forEach(function (x) { const f0 = x[0][x[1]]; if (f0) x[0][x[1]] = function () { const h = f0(); const card = '<div class="card"><h2>QR para tus pacientes</h2><p class="small muted">Imprime un cartel con tu QR para que tus pacientes adelanten su orden y su pago mientras esperan.</p><div class="row"><button class="btn" type="button" data-a="nav" data-v="qrlab">Ver y imprimir mi QR</button></div></div>'; const i = h.indexOf('<p class="byline">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); }; });

  /* Paciente: ordenar en el laboratorio */
  EXT.nav.pat.push({ id: 'autoorden', label: 'Ordenar en el laboratorio', hidden: true });
  function trk(o) { const st = [['Orden enviada', true], ['Pago confirmado', !!o.paid], ['Toma de muestra', !!o.sample || o.status === 'Enviada'], ['Resultados', o.status === 'Enviada']]; return '<div class="pill-row">' + st.map(function (s, i) { return '<span class="chip ' + (s[1] ? 'ok' : 'gray') + '">' + (i + 1) + '. ' + s[0] + (s[1] ? ' ✓' : '') + '</span>'; }).join('') + '</div>'; }
  function myQrOrders() { return S.orders.filter(function (o) { return o.pid === X.myPid() && o.via === QRL && o.status !== 'Anulada'; }); }
  function catsOf() { const cs = []; D.CATALOG.forEach(function (c) { const k = c.cat || 'Otros'; if (cs.indexOf(k) < 0) cs.push(k); }); return cs; }
  V.pat.autoorden = function () {
    const lab = S.labs[0]; const so = S.so; const p = X.personOf(X.myPid()) || {};
    if (!S.labQr.on) return '<div class="head"><div><h1>Ordenar en el laboratorio</h1></div></div><div class="card"><p>Este laboratorio no está recibiendo órdenes por QR ahora. Pasa por caja.</p></div>';
    if (so.done) {
      const o = S.orders.filter(function (x) { return x.id === so.done; })[0]; if (o) {
        const pr = o.paid ? '<span class="chip ok">Pago confirmado</span>' : o.payRep ? '<span class="chip warn">Pago por confirmar</span>' : '<span class="chip warn">Pagarás en caja</span>';
        return '<div class="head"><div><h1>Tu orden ' + o.id + '</h1><p>' + esc(lab.name) + '</p></div></div><div class="card"><div class="row">' + pr + '</div>' + trk(o) + '<h3>En caja, di esto</h3><div class="autodata"><b>“Ya hice mi orden con el QR. Mi nombre es ' + esc(p.name) + ' y mi cédula es ' + esc(p.ci) + '.”</b></div><p class="small muted">La persona del laboratorio te busca por la cédula, ve tu orden y tu comprobante y confirma tu pago. Después te llaman para tomarte la muestra.</p></div>' +
          '<div class="card"><h2>Lo que pediste</h2>' + o.exams.map(function (e) { return '<div class="vrow"><span>' + esc(D.BY_ID[e].name) + '</span></div>'; }).join('') + '<div class="vrow"><span><b>Total</b></span><b>' + L.fmtUsd(o.usd) + ' · ' + L.fmtBs(o.usd * o.rate) + '</b></div>' + (o.payRep && o.payRep.proof ? '<img src="' + o.payRep.proof + '" alt="Tu comprobante" style="width:100%;max-width:240px;border-radius:12px">' : '') + '</div>' +
          '<div class="row"><button class="btn ghost" type="button" data-a="so-new">Hacer otra orden</button></div>';
      }
    }
    const usd = priceSel(so); const rBcv = D.RATES.bcv.value, rUsdt = D.RATES.usdt ? D.RATES.usdt.value : rBcv; const cats = catsOf();
    const pkgs = D.PACKAGES.map(function (k) { const on = so.pks.indexOf(k.id) >= 0; return '<button type="button" class="soex' + (on ? ' on' : '') + '" data-a="so-pk" data-v="' + k.id + '" aria-pressed="' + on + '"><span class="t">' + esc(k.name) + '<small>' + k.items.length + ' exámenes</small></span><b>' + L.fmtUsd(k.price) + '</b><i class="ck">' + (on ? '✓' : '') + '</i></button>'; }).join('');
    const catH = cats.map(function (cat) {
      const open = so.open === cat; const list = D.CATALOG.filter(function (c) { return (c.cat || 'Otros') === cat; }); const n = list.filter(function (c) { return so.sel.indexOf(c.id) >= 0; }).length;
      return '<div class="acc"><button type="button" class="acch" data-a="so-cat" data-v="' + esc(cat) + '" aria-expanded="' + open + '"><span class="t">' + esc(cat) + '<span class="s">' + list.length + ' exámenes</span></span>' + (n ? '<span class="chip ok">' + n + '</span>' : '') + '<i class="chev' + (open ? ' open' : '') + '" aria-hidden="true">›</i></button>' + (open ? '<div class="accb pickgrid">' + list.map(function (c) { const on = so.sel.indexOf(c.id) >= 0; return '<button type="button" class="soex' + (on ? ' on' : '') + '" data-a="so-ex" data-v="' + c.id + '" aria-pressed="' + on + '"><span class="t">' + esc(c.name) + '</span><b>' + L.fmtUsd(c.price) + '</b><i class="ck">' + (on ? '✓' : '') + '</i></button>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
    const names = exSel(so).map(function (e) { return D.BY_ID[e].name; });
    const pays = S.pm.lab.filter(function (m) { return m.on; }).map(function (m) { return m.name; }).concat(['Pagar en caja']);
    const meth = F('so-method', pays[0]); const caja = meth === 'Pagar en caja';
    return '<div class="head"><div><h1>Ordenar en el laboratorio</h1><p>' + esc(lab.name) + ' · adelanta tu orden y tu pago</p></div></div>' +
      '<div class="card"><h2>1. Tus datos</h2><div class="kv"><small>Nombre</small><b>' + esc(p.name) + '</b></div><div class="kv"><small>Cédula</small><b>' + esc(p.ci) + '</b></div><div class="kv"><small>Teléfono</small><b>' + esc(p.phone || '—') + '</b></div><p class="small muted">El laboratorio recibe estos datos para armar tu orden.</p></div>' +
      '<div class="card"><h2>2. Elige tus exámenes</h2><div class="acc"><button type="button" class="acch" data-a="so-cat" data-v="__pk" aria-expanded="' + (so.open === '__pk') + '"><span class="t">Paquetes (perfiles)<span class="s">' + D.PACKAGES.length + ' opciones</span></span>' + (so.pks.length ? '<span class="chip ok">' + so.pks.length + '</span>' : '') + '<i class="chev' + (so.open === '__pk' ? ' open' : '') + '" aria-hidden="true">›</i></button>' + (so.open === '__pk' ? '<div class="accb pickgrid">' + pkgs + '</div>' : '') + '</div><h3>Exámenes sueltos</h3>' + catH + '</div>' +
      '<div class="card"><h2>3. Cuánto cuesta</h2>' + (names.length ? '<p class="small">' + esc(names.join(', ')) + '</p>' : '<p class="muted small">Todavía no elegiste nada.</p>') + '<div class="vrow"><span>Dólares</span><b>' + L.fmtUsd(usd) + '</b></div><div class="vrow"><span>Bolívares (BCV)</span><b>' + L.fmtBs(usd * rBcv) + '</b></div><div class="vrow"><span>Bolívares (USDT)</span><b>' + L.fmtBs(usd * rUsdt) + '</b></div></div>' +
      '<div class="card"><h2>4. Paga y sube tu comprobante</h2><p class="small muted">Paga a uno de estos datos. Después sube la captura o la foto del comprobante.</p>' + EXT.pm.methodsView('lab', false) + fld('Cómo pagaste', 'so-method', { type: 'select', options: pays }) +
      (caja ? '<p class="small muted">Pagarás en caja antes de que te tomen la muestra.</p>' : fld('Número de referencia', 'so-ref', { ph: 'Ej.: 00482917', mode: 'numeric' }) + '<div class="drop"><p>Foto o captura del comprobante</p><div class="row" style="justify-content:center"><label class="btn" style="display:inline-flex;align-items:center;cursor:pointer">Subir comprobante<input type="file" accept="image/jpeg,image/png" data-c="rcpt" class="sr"></label><button class="btn ghost" type="button" data-a="so-sample">Usar uno de ejemplo</button></div></div>' + (so.msg ? '<p class="small" role="status"><b>' + esc(so.msg) + '</b></p>' : '') + (so.proof ? '<img src="' + so.proof + '" alt="Tu comprobante" style="width:100%;max-width:240px;border-radius:12px">' : '')) +
      errBox('so') + '<div class="row"><button class="btn" type="button" data-a="so-send"' + (names.length ? '' : ' disabled') + '>Enviar mi orden</button></div><p class="small muted">Después de enviarla, ve a caja y di tu nombre y tu cédula. El laboratorio verá tu orden y tu comprobante.</p></div>';
  };
  A['so-cat'] = function (v) { S.so.open = S.so.open === v ? '' : v; render(); };
  A['so-ex'] = function (v) { const i = S.so.sel.indexOf(v); if (i >= 0) S.so.sel.splice(i, 1); else S.so.sel.push(v); render(); };
  A['so-pk'] = function (v) { const i = S.so.pks.indexOf(v); if (i >= 0) S.so.pks.splice(i, 1); else S.so.pks.push(v); render(); };
  A['so-new'] = function () { S.so = { sel: [], pks: [], open: '', proof: '', msg: '', done: null }; ['so-ref'].forEach(function (k) { delete S.f[k]; }); S.err = {}; render(); window.scrollTo(0, 0); };
  A['so-sample'] = function () { const usd = priceSel(S.so); S.so.proof = receiptSample(L.fmtInt ? L.fmtInt(usd * D.RATES.bcv.value) : String(Math.round(usd * D.RATES.bcv.value)), F('so-ref', '00482917') || '00482917'); S.so.msg = 'Comprobante de ejemplo cargado.'; S.err = {}; render(); };
  document.addEventListener('change', function (ev) { const t = ev.target; if (!t.getAttribute || t.getAttribute('data-c') !== 'rcpt') return; const f = t.files && t.files[0]; if (!f) return; S.so.msg = 'Procesando la foto…'; render(); L.loadImageFromFile(f, 1000).then(function (cv) { S.so.proof = cv.toDataURL('image/jpeg', 0.75); S.so.msg = 'Comprobante cargado. Revisa que se lea bien.'; S.err = {}; render(); }).catch(function () { S.so.msg = 'No se pudo abrir esa imagen. Usa una foto JPG o PNG.'; render(); }); });
  A['so-send'] = function () {
    const so = S.so; const ex = exSel(so); if (!ex.length) return X.setErr('so', 'Elige al menos un examen.');
    const pays = S.pm.lab.filter(function (m) { return m.on; }).map(function (m) { return m.name; }).concat(['Pagar en caja']); const meth = F('so-method', pays[0]); const caja = meth === 'Pagar en caja'; const ref = F('so-ref').trim();
    if (!caja) { if (ref.length < 4) return X.setErr('so', 'Escribe el número de referencia de tu pago.'); if (!so.proof) return X.setErr('so', 'Sube la foto o captura de tu comprobante.'); }
    const usd = priceSel(so); const id = 'LAB-0' + (S.oseq++); const p = X.personOf(X.myPid());
    const o = { id: id, pid: X.myPid(), exams: ex, pkgs: so.pks.map(function (k) { return D.PACKAGES.filter(function (x) { return x.id === k; })[0].name; }), usd: usd, cost: ex.reduce(function (s, e) { return s + D.BY_ID[e].cost; }, 0), cur: 'bcv', rate: D.RATES.bcv.value, method: meth, paid: false, status: 'Por procesar', when: X.when(), by: 'Paciente (' + QRL + ')', doctor: '', via: QRL, payRep: caja ? null : { method: meth, ref: ref, when: X.when(), proof: so.proof } };
    S.orders.unshift(o); so.done = id; ['so-ref', 'so-method'].forEach(function (k) { delete S.f[k]; }); S.err = {}; so.proof = ''; so.msg = '';
    X.notify('lab', p.name + ' (' + p.ci + ') hizo su orden ' + id + ' con el QR' + (caja ? ' y pagará en caja.' : ' y subió su comprobante (Ref. ' + ref + ').'), { type: 'go', ref: 'atencion' });
    logAudit(S.auth.name, 'Hizo la orden ' + id + ' con el QR del laboratorio'); toast('Orden enviada. Ahora ve a caja y di tu nombre y tu cédula.'); render(); window.scrollTo(0, 0);
  };
  A['sc-lab'] = function () { EXT.openScanner('plab'); };
  A['so-open'] = function (v) { S.so.done = v; S.hub = false; S.pat = 'autoorden'; render(); window.scrollTo(0, 0); };
  const pi1 = V.pat.inicio; V.pat.inicio = function () {
    const h = pi1(); const mine = myQrOrders().filter(function (o) { return o.status !== 'Enviada'; }); let card;
    if (mine.length) { const o = mine[0]; card = '<div class="card"><div class="row between"><h2>Tu orden en el laboratorio</h2><button class="btn ghost sm" type="button" data-a="so-open" data-v="' + o.id + '">Ver</button></div><p class="small muted">' + o.id + ' · ' + esc(S.labs[0].name) + '</p>' + trk(o) + '</div>'; }
    else card = '<div class="card"><h2>¿Estás en un laboratorio?</h2><p class="small muted">Escanea el QR que está pegado en el local. Eliges tus exámenes, ves el precio y pagas desde aquí, sin hacer fila.</p><div class="row"><button class="btn" type="button" data-a="sc-lab">Escanear QR del laboratorio</button></div></div>';
    return h.replace(/(<div class="card dark dashhero">[\s\S]*?<\/div><\/div>)/, function (m) { return m + card; });
  };
  const pq1 = V.pat.qr; V.pat.qr = function () { return pq1() + '<div class="card"><h2>Escanear el QR de un laboratorio</h2><p class="small muted">Si estás en un laboratorio, escanea su QR para adelantar tu orden y tu pago.</p><div class="row"><button class="btn ghost" type="button" data-a="sc-lab">Escanear QR del laboratorio</button></div></div>'; };
  const smp0 = A['o-sample-ok']; A['o-sample-ok'] = function (v) { const o = S.orders.filter(function (x) { return x.id === v; })[0]; const ok = F('sm-ok'); smp0(v); if (ok && o && o.sample && o.via === QRL) notify('pat', 'Ya tomaron tu muestra de la orden ' + o.id + '. Te avisamos cuando estén los resultados.', { type: 'go', ref: 'autoorden' }, o.pid); };
  render();
})();
