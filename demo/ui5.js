/* LABS demo · superadmin: pagos, usuarios, planes, ajustes, soporte */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, U2 = window.UI2, EXT = window.EXT, X = EXT.fn;
  const esc = U.esc, toast = U.toast, logAudit = U.logAudit;
  const F = X.F, fld = X.fld, errBox = X.errBox, setErr = X.setErr, dlg = X.dlg, notify = X.notify, A = EXT.actions;
  function render() { window.render(); }
  const V = EXT.views.adm;
  S.settings.terms = S.settings.terms || '1.2';
  S.settings.approver = S.settings.approver || 'segundo@labs.demo';
  function labOf(id) { return S.labs.filter(function (l) { return l.id === id; })[0]; }
  function pendPay() { return S.payments.filter(function (p) { return p.status === 'Pendiente'; }).length; }
  function openTk() { return S.tickets.filter(function (t) { return t.status === 'Abierto' || t.status === 'En revisión'; }).length; }
  function resetsWait() { return S.resets.filter(function (r) { return r.state === 'espera'; }).length; }
  function alertsWait() { return L.networkSignals().filter(function (s) { return (s.state === 'fuerte' || s.state === 'vigilar') && !S.approved[s.zone] && !S.rejected[s.zone]; }).length; }

  EXT.nav.adm = [
    { sep: 'Negocio' }, { id: 'resumen', label: 'Resumen' }, { id: 'labs', label: 'Laboratorios' }, { id: 'pagos', label: 'Pagos', badge: function () { return pendPay() || ''; } }, { id: 'planes', label: 'Planes' },
    { sep: 'Personas' }, { id: 'usuarios', label: 'Usuarios' }, { id: 'claves', label: 'Claves', badge: function () { return resetsWait() || ''; } }, { id: 'red', label: 'Alertas de la red', badge: function () { return alertsWait() || ''; } },
    { sep: 'Plataforma' }, { id: 'ajustes', label: 'Ajustes' }, { id: 'soporte', label: 'Soporte', badge: function () { return openTk() || ''; } }, { id: 'registro', label: 'Registro' },
    { sep: 'Cuenta' }, { id: 'avisos', label: 'Avisos', badge: function () { return X.unread('adm') || ''; } }, { id: 'perfil', label: 'Mi cuenta' }
  ];

  V.resumen = function () {
    const chips = [['pagos', pendPay(), 'pagos por confirmar'], ['soporte', openTk(), 'tickets abiertos'], ['red', alertsWait(), 'alertas por revisar'], ['claves', resetsWait(), 'claves por aprobar']];
    return '<div class="card"><h2>Hay que atender hoy</h2><div class="row">' + chips.map(function (c) { return '<button class="btn ghost" type="button" data-a="nav" data-v="' + c[0] + '">' + c[1] + ' ' + c[2] + '</button>'; }).join('') + '</div></div>' + U2.admResumen();
  };
  V.labs = U2.admLabs; V.claves = U2.admClaves; V.red = function () { return U2.admRed() + X.tropicalCard('adm'); }; V.registro = U2.admRegistro;
  V.avisos = X.avisosView;

  /* ---------- Pagos ---------- */
  V.pagos = function () {
    const q = F('pg-q').trim().toLowerCase(); let list = S.payments.slice().sort(function (a, b) { return (a.status === 'Pendiente' ? 0 : 1) - (b.status === 'Pendiente' ? 0 : 1); });
    if (q) list = list.filter(function (p) { return ((labOf(p.labId) || {}).name + ' ' + p.ref + ' ' + p.method).toLowerCase().indexOf(q) >= 0; });
    const conf = S.payments.filter(function (p) { return p.status === 'Confirmado'; }).reduce(function (s, p) { return s + p.amount; }, 0);
    return '<div class="head"><div><h1>Pagos</h1><p>Los laboratorios reportan su pago; tú lo confirmas contra tu banco.</p></div><button class="btn ghost sm" type="button" data-a="pg-csv">Descargar CSV</button></div>' +
      '<div class="grid"><div class="card kpi"><small>Por confirmar</small><b>' + pendPay() + '</b></div><div class="card kpi"><small>Cobrado y confirmado</small><b>' + L.fmtUsd(conf) + '</b></div></div>' +
      '<div class="card">' + fld('Buscar por laboratorio o referencia', 'pg-q') + (list.length ? '<div class="tw"><table style="min-width:760px"><thead><tr><th>Laboratorio</th><th>Fecha</th><th>Monto</th><th>Método y referencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + list.map(function (p) {
        const l = labOf(p.labId) || { name: '—' };
        return '<tr><td><b>' + esc(l.name) + '</b></td><td>' + esc(p.when) + '</td><td>' + L.fmtUsd(p.amount) + '</td><td>' + esc(p.method) + '<div class="small muted">' + esc(p.ref) + '</div></td><td><span class="chip ' + (p.status === 'Confirmado' ? 'ok' : p.status === 'Rechazado' ? 'crit' : 'warn') + '">' + p.status + '</span>' + (p.note ? '<div class="small muted">' + esc(p.note) + '</div>' : '') + '</td><td>' + (p.status === 'Pendiente' ? '<div class="row"><button class="btn sm" type="button" data-a="pg-ok" data-v="' + p.id + '">Confirmar</button><button class="btn ghost sm" type="button" data-a="pg-no" data-v="' + p.id + '">Rechazar</button></div>' : '<span class="small muted">Sin acciones</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">No hay pagos con esa búsqueda.</p>') + '</div>';
  };
  function pay(id) { return S.payments.filter(function (p) { return p.id === id; })[0]; }
  A['pg-ok'] = function (v) { const p = pay(v); const l = labOf(p.labId); p.status = 'Confirmado'; if (l) { l.status = 'Al día'; l.due = Math.max(l.due, 0) + 30; } logAudit('Superadministrador', 'Confirmó pago de ' + (l ? l.name : '') + ' (' + p.ref + ')'); if (p.labId === 'l1') notify('lab', 'Confirmamos tu pago ' + p.ref + '. Tu suscripción sigue al día.', { type: 'go', ref: 'suscripcion' }); toast('Pago confirmado. ' + (l ? l.name : '') + ' queda al día por 30 días más.'); };
  A['pg-no'] = function (v) { dlg('Rechazar el pago', fld('Motivo (se lo mostramos al laboratorio)', 'pgn-r', { type: 'select', options: ['No encontramos el pago en el banco', 'El monto no coincide', 'La referencia ya se usó', 'Otro motivo'] }), { label: 'Rechazar pago', a: 'pg-no-ok', v: v }); };
  A['pg-no-ok'] = function (v) { const p = pay(v); p.status = 'Rechazado'; p.note = F('pgn-r', 'No encontramos el pago en el banco'); delete S.f['pgn-r']; S.modal = null; logAudit('Superadministrador', 'Rechazó pago ' + p.ref + ': ' + p.note); if (p.labId === 'l1') notify('lab', 'No pudimos confirmar tu pago ' + p.ref + ': ' + p.note + '.', { type: 'go', ref: 'suscripcion' }); toast('Pago rechazado.'); };
  A['pg-csv'] = function () { EXT.download('pagos.csv', 'text/csv', 'Laboratorio,Fecha,Monto USD,Metodo,Referencia,Estado\n' + S.payments.map(function (p) { return ['"' + ((labOf(p.labId) || {}).name || '') + '"', p.when, p.amount, p.method, p.ref, p.status].join(','); }).join('\n')); };

  /* ---------- Planes ---------- */
  V.planes = function () {
    return '<div class="head"><div><h1>Planes</h1><p>Lo que ofreces a los laboratorios. El cambio de precio aplica a laboratorios nuevos y a cada renovación.</p></div></div><div class="grid">' + D.PLANS.map(function (p, i) {
      const n = S.labs.filter(function (l) { return l.plan === p.name; }).length;
      return '<div class="card"><h2>' + esc(p.name) + '</h2>' + fld('Precio al mes (USD)', 'pp-' + i, { type: 'number', mode: 'decimal', def: String(p.price) }) + fld('Qué incluye', 'pt-' + i, { type: 'textarea', def: p.text }) + '<span class="chip gray">' + n + ' laboratorios</span>' + errBox('pp' + i) + '<div class="row"><button class="btn" type="button" data-a="pl-save" data-v="' + i + '">Guardar plan</button></div></div>';
    }).join('') + '</div><div class="card note small">LABS cobra la suscripción y no emite factura al paciente. El laboratorio sigue emitiendo sus propias facturas.</div>';
  };
  A['pl-save'] = function (v) { const i = parseInt(v, 10), p = D.PLANS[i]; const pr = parseFloat(F('pp-' + i, String(p.price))), tx = F('pt-' + i, p.text).trim(); if (!isFinite(pr) || pr <= 0 || pr > 5000) return setErr('pp' + i, 'El precio debe estar entre 1 y 5.000 dólares.'); if (tx.length < 10) return setErr('pp' + i, 'Describe qué incluye el plan (al menos 10 letras).'); p.price = pr; p.text = tx; S.err = {}; logAudit('Superadministrador', 'Cambió el plan ' + p.name + ': ' + pr + ' USD'); toast('Plan ' + p.name + ' guardado.'); };

  /* ---------- Usuarios ---------- */
  const ROLE = { lab: 'Laboratorio', pat: 'Paciente', doc: 'Médico', adm: 'Superadmin' };
  function maskMail(e) { const a = e.split('@'); return a[0].slice(0, 2) + '•••@' + (a[1] || ''); }
  V.usuarios = function () {
    const q = F('us-q').trim().toLowerCase(), rf = F('us-role', 'todos'); let list = S.accounts.filter(function (a) { return rf === 'todos' || a.role === rf; });
    if (q) list = list.filter(function (a) { return (a.name + ' ' + a.email).toLowerCase().indexOf(q) >= 0; });
    return '<div class="head"><div><h1>Usuarios</h1><p>Ves quién tiene cuenta y su estado. Nunca ves claves ni resultados médicos.</p></div></div><div class="card"><div class="grid two">' + fld('Buscar por nombre o correo', 'us-q') + fld('Tipo', 'us-role', { type: 'select', r: true, options: [{ v: 'todos', l: 'Todos' }, { v: 'lab', l: 'Laboratorios' }, { v: 'pat', l: 'Pacientes' }, { v: 'doc', l: 'Médicos' }, { v: 'adm', l: 'Superadmin' }] }) + '</div>' +
      (list.length ? '<div class="tw"><table style="min-width:760px"><thead><tr><th>Persona</th><th>Tipo</th><th>Estado</th><th>Último ingreso</th><th>Acciones</th></tr></thead><tbody>' + list.map(function (a) {
        const me = a.id === S.auth.id; return '<tr><td><b>' + esc(a.name) + '</b><div class="small muted">' + esc(maskMail(a.email)) + '</div></td><td>' + ROLE[a.role] + '</td><td><span class="chip ' + (a.status === 'activo' ? 'ok' : 'gray') + '">' + (a.status === 'activo' ? 'Activa' : a.status === 'suspendido' ? 'Suspendida' : 'Eliminada') + '</span></td><td class="small">' + esc(a.last) + '</td><td><div class="row"><button class="btn ghost sm" type="button" data-a="us-ficha" data-v="' + a.id + '">Ficha</button>' + (a.status === 'eliminada' ? '' : '<button class="btn ghost sm" type="button" data-a="us-reset" data-v="' + a.id + '">Enviar enlace de clave</button>' + (me ? '' : '<button class="btn ghost sm" type="button" data-a="us-susp" data-v="' + a.id + '">' + (a.status === 'suspendido' ? 'Reactivar' : 'Suspender') + '</button>')) + '</div></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">No hay usuarios con ese filtro.</p>') + '</div>';
  };
  function acct(id) { return S.accounts.filter(function (a) { return a.id === id; })[0]; }
  A['us-ficha'] = function (v) { const a = acct(v); const p = a.pid ? X.personOf(a.pid) : null; const tks = S.tickets.filter(function (t) { return t.acct === a.id; }).length; X.dlgInfo('Ficha de ' + a.name, '<div class="small"><p>Tipo: <b>' + ROLE[a.role] + '</b></p><p>Correo: ' + esc(maskMail(a.email)) + '</p>' + (p ? '<p>Cédula: ' + esc(X.maskCi(p.ci)) + '</p>' : '') + '<p>Estado: ' + a.status + '</p><p>Último ingreso: ' + esc(a.last) + '</p><p>Tickets de soporte: ' + tks + '</p></div><div class="card note small"><p>Por privacidad, aquí no aparecen resultados, valores ni diagnósticos de nadie.</p></div>'); };
  A['us-reset'] = function (v) { const a = acct(v); const isLab = a.role === 'lab'; S.resets.unshift({ type: isLab ? 'Laboratorio' : ROLE[a.role], who: a.name, when: 'Hoy ' + U.nowTime(), state: isLab ? 'espera' : 'listo', msg: isLab ? '' : 'Enlace enviado al contacto registrado' }); logAudit('Superadministrador', (isLab ? 'Pidió reiniciar la clave de ' : 'Envió enlace de nueva clave a ') + a.name); toast(isLab ? 'Pedido creado. Falta el segundo aprobador (pantalla Claves).' : 'Enlace enviado al contacto registrado de ' + a.name + '. Vence en 30 minutos.'); };
  A['us-susp'] = function (v) { const a = acct(v); if (a.status === 'suspendido') { a.status = 'activo'; logAudit('Superadministrador', 'Reactivó la cuenta de ' + a.name); toast('Cuenta reactivada.'); } else { dlg('Suspender la cuenta de ' + a.name, '<p>No podrá entrar a LABS hasta que la reactives. No se borra nada.</p>', { label: 'Suspender', a: 'us-susp-ok', v: v }); } };
  A['us-susp-ok'] = function (v) { const a = acct(v); a.status = 'suspendido'; S.modal = null; logAudit('Superadministrador', 'Suspendió la cuenta de ' + a.name); toast('Cuenta suspendida.'); };

  /* ---------- Ajustes ---------- */
  V.ajustes = function () {
    const st = S.settings;
    return '<div class="head"><div><h1>Ajustes</h1><p>Lo que controla toda la plataforma.</p></div></div>' +
      '<div class="card"><h2>Tasas del día</h2><p class="small muted">Última actualización: ' + esc(st.ratesAt) + '. Los laboratorios las usan para cobrar en bolívares.</p><div class="grid">' + fld('Bs por dólar · BCV', 'aj-bcv', { type: 'number', mode: 'decimal', def: String(D.RATES.bcv.value) }) + fld('Bs por dólar · USDT', 'aj-usdt', { type: 'number', mode: 'decimal', def: String(D.RATES.usdt.value) }) + fld('Bs por dólar · tasa propia (sugerida)', 'aj-man', { type: 'number', mode: 'decimal', def: String(S.manualRate) }) + '</div>' + errBox('ajr') + '<div class="row"><button class="btn" type="button" data-a="aj-rates">Guardar tasas</button></div></div>' +
      '<div class="card"><h2>Mantenimiento</h2>' + fld('Mostrar aviso de mantenimiento a todos', 'aj-maint', { type: 'checkbox', def: st.maint }) + fld('Mensaje', 'aj-msg', { type: 'textarea', def: st.maintMsg }) + errBox('ajm') + '<div class="row"><button class="btn" type="button" data-a="aj-maint">Guardar aviso</button></div></div>' +
      '<div class="card"><h2>Segundo aprobador</h2><p class="small muted">Para reiniciar la clave de un laboratorio, otra persona debe aprobarlo.</p>' + fld('Correo del segundo aprobador', 'aj-appr', { type: 'email', def: st.approver }) + errBox('aja') + '<div class="row"><button class="btn" type="button" data-a="aj-appr">Guardar</button></div></div>' +
      '<div class="card"><h2>Términos de uso</h2><p>Versión vigente: <b>v' + esc(st.terms) + '</b></p><p class="small muted">Al publicar una versión nueva, todos reciben un aviso para leerla.</p><div class="row"><button class="btn" type="button" data-a="aj-terms">Publicar versión nueva</button></div></div>';
  };
  A['aj-rates'] = function () {
    const b = parseFloat(F('aj-bcv', String(D.RATES.bcv.value))), u = parseFloat(F('aj-usdt', String(D.RATES.usdt.value))), m = parseFloat(F('aj-man', String(S.manualRate)));
    if (![b, u, m].every(function (x) { return isFinite(x) && x > 0; })) return setErr('ajr', 'Las tres tasas deben ser números mayores que cero.');
    if (b < D.RATES.bcv.value * 0.7 || b > D.RATES.bcv.value * 1.3 || u < D.RATES.usdt.value * 0.7 || u > D.RATES.usdt.value * 1.3) return setErr('ajr', 'Una tasa cambia más de 30 % de golpe. Revisa que no sea un error de escritura.');
    D.RATES.bcv.value = b; D.RATES.usdt.value = u; S.manualRate = m; S.settings.ratesAt = 'Hoy ' + U.nowTime(); ['aj-bcv', 'aj-usdt', 'aj-man'].forEach(function (k) { delete S.f[k]; }); S.err = {}; logAudit('Superadministrador', 'Actualizó las tasas del día'); toast('Tasas guardadas. Las órdenes nuevas usan estas tasas.');
  };
  A['aj-maint'] = function () { const on = !!F('aj-maint', S.settings.maint), msg = F('aj-msg', S.settings.maintMsg).trim(); if (on && msg.length < 10) return setErr('ajm', 'Escribe el mensaje que verán todos (al menos 10 letras).'); S.settings.maint = on; S.settings.maintMsg = msg || S.settings.maintMsg; S.err = {}; logAudit('Superadministrador', on ? 'Activó el aviso de mantenimiento' : 'Quitó el aviso de mantenimiento'); toast(on ? 'Aviso activado: lo ven todos arriba.' : 'Aviso desactivado.'); };
  A['aj-appr'] = function () { const e = F('aj-appr', S.settings.approver).trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(e)) return setErr('aja', 'Escribe un correo válido.'); if (e === S.auth.email) return setErr('aja', 'El segundo aprobador debe ser otra persona, no tú.'); S.settings.approver = e; S.err = {}; logAudit('Superadministrador', 'Cambió el segundo aprobador'); toast('Segundo aprobador guardado.'); };
  A['aj-terms'] = function () { const p = String(S.settings.terms).split('.'); S.settings.terms = p[0] + '.' + (parseInt(p[1] || '0', 10) + 1); ['lab', 'pat', 'doc'].forEach(function (r) { notify(r, 'Actualizamos los términos de uso (v' + S.settings.terms + '). Puedes leerlos en Soporte, pestaña Legal.', { type: 'go', ref: 'soporte' }); }); logAudit('Superadministrador', 'Publicó términos v' + S.settings.terms); toast('Términos v' + S.settings.terms + ' publicados. Todos recibieron un aviso.'); };

  /* ---------- Soporte (bandeja) ---------- */
  const MACROS = [['Pedir captura', 'Hola. Para ayudarte mejor, ¿puedes decirnos en qué pantalla estabas y qué pasó justo antes? Gracias.'], ['Ya está corregido', 'Gracias por avisarnos. Ya quedó corregido. Si vuelve a pasar, responde aquí y lo revisamos de inmediato.'], ['Cómo cambiar la clave', 'Entra a Mi cuenta, elige Cambiar clave y sigue los pasos. Si no recuerdas la actual, usa “Olvidé mi clave” al entrar.']];
  V.soporte = function () {
    if (S.sup.open) { const tk = S.tickets.filter(function (t) { return t.id === S.sup.open; })[0]; if (tk) return X.threadView(tk, true) + '<div class="card"><h2>Herramientas</h2><p class="small muted">Respuestas rápidas</p><div class="row">' + MACROS.map(function (m, i) { return '<button class="btn ghost sm" type="button" data-a="tk-macro" data-v="' + i + '">' + m[0] + '</button>'; }).join('') + '</div><p class="small muted">Estado del ticket</p><div class="row">' + ['En revisión', 'Resuelto', 'Cerrado'].map(function (s) { return '<button class="btn ghost sm" type="button" data-a="tk-st" data-v="' + tk.id + '|' + s + '" aria-pressed="' + (tk.status === s) + '">Marcar ' + s.toLowerCase() + '</button>'; }).join('') + '</div></div>'; }
    const f = F('sp-f', 'todos'), q = F('sp-q').trim().toLowerCase(); let list = S.tickets.filter(function (t) { return f === 'todos' || (f === 'abiertos' ? (t.status === 'Abierto' || t.status === 'En revisión') : t.status === 'Resuelto' || t.status === 'Cerrado'); });
    if (q) list = list.filter(function (t) { return (t.id + ' ' + t.subject + ' ' + t.who).toLowerCase().indexOf(q) >= 0; });
    return '<div class="head"><div><h1>Soporte</h1><p>Los tickets de laboratorios, pacientes y médicos.</p></div></div><div class="card"><div class="grid two">' + fld('Buscar', 'sp-q', { ph: 'Número, asunto o persona' }) + fld('Mostrar', 'sp-f', { type: 'select', r: true, options: [{ v: 'todos', l: 'Todos' }, { v: 'abiertos', l: 'Abiertos' }, { v: 'cerrados', l: 'Resueltos o cerrados' }] }) + '</div>' +
      (list.length ? '<div class="tw"><table style="min-width:640px"><thead><tr><th>Ticket</th><th>Persona</th><th>Estado</th><th>Creado</th><th></th></tr></thead><tbody>' + list.map(function (t) { return '<tr><td><b>' + t.id + '</b><div class="small">' + esc(t.subject) + '</div></td><td>' + esc(t.who) + '<div class="small muted">' + ROLE[t.role] + '</div></td><td>' + X.ticketChip(t.status) + '</td><td>' + esc(t.created) + '</td><td><button class="btn sm" type="button" data-a="sup-open" data-v="' + t.id + '">Abrir</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No hay tickets con ese filtro.</p>') + '</div>';
  };
  A['tk-macro'] = function (v) { S.f['tk-reply'] = MACROS[parseInt(v, 10)][1]; render(); };
  A['tk-st'] = function (v) { const p = v.split('|'); const tk = S.tickets.filter(function (t) { return t.id === p[0]; })[0]; tk.status = p[1]; if (p[1] !== 'En revisión') notify(tk.role, 'Tu ticket ' + tk.id + ' ahora está: ' + p[1].toLowerCase() + '.', { type: 'go', ref: 'soporte' }, tk.role === 'pat' ? (acct(tk.acct) || {}).pid : null); toast('Ticket ' + tk.id + ': ' + p[1].toLowerCase() + '.'); };

  /* ---------- Mi cuenta ---------- */
  V.perfil = function () {
    return '<div class="head"><div><h1>Mi cuenta</h1><p>' + esc(S.auth.name) + ' · ' + esc(S.auth.email) + '</p></div></div><div class="card"><h2>Cambiar mi clave</h2>' + fld('Clave actual', 'pw-old', { type: 'password' }) + fld('Clave nueva', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + X.meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave nueva', 'pw-new2', { type: 'password' }) + errBox('pw') + '<div class="row"><button class="btn" type="button" data-a="pw-save">Cambiar clave</button></div></div>';
  };

  /* ---------- Reglas de entrada ---------- */
  const lg = A['lg-go'];
  A['lg-go'] = function (v, el) {
    const email = F('lg-email').trim().toLowerCase(); const a = S.accounts.filter(function (x) { return x.email === email; })[0];
    if (a && a.role === 'lab' && S.labs[0].status === 'Suspendido' && a.pass === F('lg-pass')) return setErr('lg', 'La suscripción de tu laboratorio está suspendida. Escribe a soporte@labs.demo o reporta tu pago.');
    return lg(v, el);
  };

  /* Búsquedas en vivo: al escribir se actualiza la lista sin perder el cursor */
  ['no-q', 'o-q', 'pc-q', 'us-q', 'ct-q', 'npk-q', 'no-ex-q', 'sp-q', 'pg-q'].forEach(function (name) {
    EXT.onInput[name] = function (t) {
      const pos = t.selectionStart; render();
      const el = document.querySelector('[data-c="f-' + name + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { } }
    };
  });

  window.render();
})();
