/* LABS demo · selector de tasas desplegable + médico: exámenes por separado, repetir/pedir examen, recetar */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc, toast = U.toast, F = X.F, fld = X.fld, errBox = X.errBox, dlg = X.dlg, closeDlg = X.closeDlg, notify = X.notify, chipFor = U.chipFor;
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
    const rxH = rxs.length ? rxs.slice().reverse().map(function (r) { return '<div class="vrow"><span><b>' + esc(r.id) + '</b> · ' + r.meds.length + (r.meds.length === 1 ? ' medicamento' : ' medicamentos') + '<small class="block">' + esc(r.meds.map(function (m) { return m.name; }).join(', ')) + ' · ' + esc(r.created) + '</small></span><span class="chip ok">Enviada</span></div>'; }).join('') : '<p class="small muted">Todavía no le has recetado nada desde la app.</p>';
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
    dlg('Recetar tratamiento', '<p class="small muted">Para <b>' + esc(pname(S.rxPid)) + '</b>. Receta digital con tu MPPS 12345.</p>' + (d ? '<div class="small muted">En esta receta</div>' + d : '') +
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
    if (medFilled() && !pushMed()) return rxDlg(); if (!S.rxd.length) { S.err.rx = 'Agrega al menos un medicamento.'; return rxDlg(); } const dx = F('rx-dx').trim(); if (dx.length < 3) { S.err.rx = 'Escribe el motivo o diagnóstico.'; return rxDlg(); }
    const id = 'RX-' + String(++seq.r + 100).padStart(4, '0'); S.rx.push({ id: id, pid: S.rxPid, dx: dx, note: F('rx-note').trim(), meds: S.rxd.slice(), created: 'Hoy', doctor: DOC, mpps: '12345' });
    notify('pat', DOC + ' te recetó un tratamiento (' + S.rxd.length + (S.rxd.length === 1 ? ' medicamento' : ' medicamentos') + '). Míralo en Mis recetas.', { type: 'go', ref: 'recetas' }, S.rxPid);
    const n = S.rxd.length; S.rxd = []; ['rx-dx', 'rx-note'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null; toast('Receta enviada. ' + pfirst(S.rxPid) + ' recibió una notificación en su teléfono (' + n + (n === 1 ? ' medicamento' : ' medicamentos') + ').');
  };

  /* ---------- Paciente: Mis recetas y pedidos del médico ---------- */
  EXT.nav.pat.splice(1, 0, { id: 'recetas', label: 'Mis recetas', badge: function () { return S.rx.filter(function (r) { return r.pid === X.myPid(); }).length || ''; } });
  if (EXT.MI) EXT.MI.recetas = '<path d="m10.5 20.5-7-7a4.9 4.9 0 0 1 7-7l7 7a4.9 4.9 0 0 1-7 7z"/><path d="m8.5 8.5 7 7"/>';
  function rxCard(r) {
    return '<div class="card"><div class="row between"><div><h2>' + esc(r.id) + ' · ' + esc(r.dx) + '</h2><p class="small muted">' + esc(r.doctor) + ' · MPPS ' + esc(r.mpps) + ' · ' + esc(r.created) + '</p></div></div>' + r.meds.map(function (m) { return '<div class="vrow"><span><b>' + esc(m.name) + '</b> · ' + esc(m.dose) + '<small class="block">' + esc(m.freq) + ' · ' + esc(m.days) + (m.ins ? ' · ' + esc(m.ins) : '') + '</small></span></div>'; }).join('') + (r.note ? '<div class="kv"><small>Indicaciones generales</small><b>' + esc(r.note) + '</b></div>' : '') + '<div class="row"><button class="btn ghost sm" type="button" data-a="rx-print">Imprimir receta</button></div></div>';
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
  render();
})();
