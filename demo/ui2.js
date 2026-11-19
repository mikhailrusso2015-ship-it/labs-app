/* LABS demo · paciente, médico, superadmin, y el motor de pantalla */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI;
  const esc = U.esc, chipFor = U.chipFor, logAudit = U.logAudit, toast = U.toast, side = U.side;

  S.seen = [
    { when: 'Hoy 09:20', who: 'Laboratorio Ejemplo', what: 'Subió el resultado LAB-0142' },
    { when: '15 nov 18:02', who: 'Dra. [MÉDICO]', what: 'Abrió el resultado LAB-0142' },
    { when: '3 ago 10:11', who: 'Laboratorio Ejemplo', what: 'Subió el resultado LAB-0117' }
  ];
  S.requests = [{ id: 'q1', name: 'Paciente S. V.', note: 'Te envió acceso a sus resultados por 3 meses.' }, { id: 'q2', name: 'Paciente D. C.', note: 'Te envió acceso a sus resultados de hematología.' }];
  S.notes = {};
  S.qrN = 1; S.qrEnds = Date.now() + 300000;
  S.labs[0].orders30 = L.periodStats(30, 0).n;

  function sectionBadge(n) { return n ? n : ''; }

  /* ---------- Paciente ---------- */
  function patNav() {
    return side([{ id: 'lista', label: 'Mis resultados' }, { id: 'qr', label: 'Mi código QR' }, { id: 'vistas', label: 'Quién me vio' }], S.pat, '[NOMBRE DEL PACIENTE]', 'Paciente · V-••.•••.•45');
  }
  function patLista() {
    const rs = D.PATIENT_RESULTS;
    return '<div class="head"><div><h1>Mis resultados</h1><p>Todo tu historial en un solo lugar.</p></div></div>' +
      rs.map(function (r, i) {
        const s = L.summarize(r.values);
        return '<button type="button" class="card" data-a="openRes" data-i="' + i + '" style="text-align:left;cursor:pointer;border:0;font:inherit;color:inherit"><div class="row between"><b>' + esc(r.title) + '</b>' + (s.worst === 'normal' ? '<span class="chip ok">Todo normal</span>' : chipFor(s.worst, s.watch + (s.watch === 1 ? ' valor para vigilar' : ' valores para vigilar'))) + '</div><div class="small muted">' + esc(r.lab) + ' · ' + esc(r.date) + ' · ' + esc(r.id) + '</div><div class="small">' + esc(s.lead) + '</div></button>';
      }).join('') +
      '<div class="card note small"><p><b>Estas recomendaciones son generales.</b> Las genera una regla simple del sistema y no reemplazan a un médico. Solo un médico puede decidir qué hacer con tu resultado.</p></div>';
  }
  function patDetalle() {
    const r = D.PATIENT_RESULTS[S.resIdx]; const s = L.summarize(r.values);
    const bg = s.worst === 'normal' ? 'var(--ok-bg);color:var(--ok-ink)' : s.worst === 'urgente' ? 'var(--crit-bg);color:var(--crit-ink)' : 'var(--warn-bg);color:var(--warn-ink)';
    let h = '<div class="head"><div><button class="btn ghost sm" type="button" data-a="backRes">Volver</button></div></div><div><h1>' + esc(r.title) + '</h1><p class="small muted">' + esc(r.lab) + ' · ' + esc(r.date) + ' · ' + esc(r.id) + '</p></div>' +
      '<div class="card" style="background:' + bg + '"><h2>' + esc(s.lead) + '</h2><p class="small">' + s.normal + ' de ' + s.rows.length + ' valores están en el margen normal.</p></div>' +
      '<div class="card"><h2>Tus valores</h2>' + s.rows.map(function (x) {
        return '<div style="display:flex;flex-direction:column;gap:2px;padding:6px 0;border-top:1px solid var(--line)"><div class="row between"><b>' + esc(x.name) + '</b>' + chipFor(x.level, x.label) + '</div><div><b style="font-size:20px">' + x.v + '</b> <span class="small muted">' + esc(x.unit) + ' · normal: ' + U.normalText(x.c) + '</span></div>' + U.rangeBar(x.c, x.v, x.level) + '</div>';
      }).join('') + '</div>';
    if (r.history) {
      const c = D.BY_ID[r.history.id];
      h += '<div class="card"><h2>' + esc(c.name) + ' en el tiempo</h2><p class="small muted">La franja azul es la zona normal.</p>' + U.lineBand(r.history.points, c.lo, c.hi, c.unit) + '<p class="small">Sube poco a poco en cada examen. Conviene comentarlo con tu médico.</p></div>';
    }
    const tips = s.tips;
    h += '<div class="card"><h2>Qué puedes hacer</h2>' + (tips.length ? '<ul class="clean">' + tips.map(function (t) { return '<li><b>' + esc(t.name) + ':</b> ' + esc(t.tip) + '</li>'; }).join('') + '</ul>' : '<p>Todo está bien. Sigue con tus buenos hábitos: comer variado, moverte y dormir bien.</p>') +
      '<div class="card" style="background:rgba(76,95,213,0.1);box-shadow:none"><p><b>Importante:</b> esto es información general, no un diagnóstico. Un médico de verdad debe revisar tu resultado y decidir qué hacer contigo.</p></div></div>' +
      '<div class="row"><button class="btn" type="button" data-a="pdf" data-i="' + S.resIdx + '">Ver documento firmado</button><button class="btn ghost" type="button" data-a="share" data-i="' + S.resIdx + '">Compartir con mi médico</button></div>';
    return h;
  }
  function patQr() {
    const code = 'LABS-' + ('0000' + (4821 + S.qrN * 37)).slice(-4) + '-' + ['KQ7P', 'M2XD', 'R9TC', 'H4VN', 'B8WZ'][S.qrN % 5];
    return '<div class="head"><div><h1>Mi código QR</h1><p>Muéstralo en el laboratorio. Es solo tuyo.</p></div></div>' +
      '<div class="grid two"><div class="card" style="align-items:center;text-align:center">' + L.qrSvg(code, 200) + '<b>' + code + '</b><div class="chip warn" id="qrcount" role="timer">Vence en 5:00</div><p class="small muted">Se cambia solo cada 5 minutos y sirve una sola vez. Una captura de pantalla vieja no funciona.</p><button class="btn ghost sm" type="button" data-a="qrnew">Generar otro ahora</button></div>' +
      '<div style="display:flex;flex-direction:column;gap:16px"><div class="card"><h2>Quién puede ver lo tuyo</h2><div class="row between"><div><b>Dra. [MÉDICO]</b><div class="small muted">Hasta el 14 feb 2027 · todos los resultados</div></div><button class="btn ' + (S.perm.l1 ? 'warn' : 'ghost') + ' sm" type="button" data-a="permdoc">' + (S.perm.l1 ? 'Quitar acceso' : 'Dar acceso') + '</button></div><div class="small ' + (S.perm.l1 ? 'up' : 'muted') + '" role="status">' + (S.perm.l1 ? 'Tu médico puede ver tus resultados.' : 'Acceso quitado. Tu médico ya no ve nada nuevo.') + '</div></div>' +
      '<div class="card"><h2>Mis dependientes</h2><div class="row between"><div><b>[HIJO/A] · 8 años</b><div class="small muted">Tú ves sus resultados con tu cuenta</div></div><button class="btn ghost sm" type="button" data-a="dep">Ver como él/ella</button></div></div></div></div>';
  }
  function patVistas() {
    return '<div class="head"><div><h1>Quién me vio</h1><p>Cada vez que alguien abre algo tuyo queda aquí. Nadie puede borrarlo.</p></div></div><div class="card"><div class="tw"><table><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué hizo</th></tr></thead><tbody>' + S.seen.map(function (x) { return '<tr><td>' + esc(x.when) + '</td><td>' + esc(x.who) + '</td><td>' + esc(x.what) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function patView() {
    const body = S.pat === 'lista' ? (S.resIdx !== null ? patDetalle() : patLista()) : S.pat === 'qr' ? patQr() : patVistas();
    return '<div class="shell">' + patNav() + '<main class="main">' + body + '</main></div>';
  }

  /* ---------- Médico ---------- */
  function docNav() { return side([{ id: 'lista', label: 'Mis pacientes' }, { id: 'sol', label: 'Solicitudes', badge: sectionBadge(S.requests.length) }], S.doc, 'Dra. [MÉDICO]', 'Médico · MPPS [______]'); }
  function docLista() {
    const P = D.DOCTOR_PATIENTS; const p = P[S.docSel]; const first = S.docSel === 0; const g = D.BY_ID.glu;
    return '<div class="head"><div><h1>Mis pacientes</h1><p>Solo ves lo que cada paciente te permitió ver.</p></div><button class="btn ghost sm" type="button" data-a="role" data-v="pat">Cambiar a modo paciente</button></div>' +
      '<div class="grid two"><div class="card"><h2>Pacientes</h2>' + P.map(function (x, i) {
        return '<button type="button" data-a="docsel" data-i="' + i + '" aria-pressed="' + (i === S.docSel) + '" style="text-align:left;border:0;border-radius:16px;padding:12px;cursor:pointer;background:' + (i === S.docSel ? 'rgba(76,95,213,0.16)' : 'rgba(255,255,255,0.6)') + ';font:inherit;color:inherit;min-height:44px"><div class="row between"><b>' + esc(x.name) + '</b>' + (x.alerts ? '<span class="chip warn">' + x.alerts + (x.alerts === 1 ? ' aviso' : ' avisos') + '</span>' : '<span class="chip ok">Sin avisos</span>') + '</div><div class="small muted">' + esc(x.exam) + ' · ' + esc(x.date) + (x.flag ? ' · ' + esc(x.flag) : '') + '</div></button>';
      }).join('') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px"><div class="card"><h2>' + esc(p.name) + '</h2><div class="small muted">Cédula ' + esc(p.ci) + '</div><div class="row"><span class="chip gray">' + esc(p.scope) + '</span><span class="chip gray">Acceso hasta ' + esc(p.until) + '</span></div>' +
      (first ? '<h3>Glucosa en el tiempo</h3>' + U.lineBand(D.PATIENT_RESULTS[0].history.points, g.lo, g.hi, g.unit) + '<p class="small">Cuatro exámenes seguidos con subida leve. Está por encima de lo normal desde agosto.</p>' : '<p class="small muted">Esta demo trae historial de ejemplo solo para el primer paciente.</p>') + '</div>' +
      '<div class="card"><h2>Mis notas (solo las ves tú)</h2><label class="f"><span class="sr">Notas sobre el paciente</span><textarea rows="3" data-c="note" data-i="' + S.docSel + '" placeholder="Escribe una nota…" style="border-radius:14px;border:1px solid var(--line);padding:10px;background:rgba(255,255,255,0.8)">' + esc(S.notes[S.docSel] || '') + '</textarea></label><p class="small muted">El paciente no ve tus notas. Cada vez que abres un resultado queda anotado en su registro.</p></div></div></div>';
  }
  function docSol() {
    return '<div class="head"><div><h1>Solicitudes</h1><p>Pacientes que quieren compartir sus resultados contigo.</p></div></div><div class="card">' +
      (S.requests.length ? S.requests.map(function (q) { return '<div class="row between" style="padding:10px 0;border-top:1px solid var(--line)"><div><b>' + esc(q.name) + '</b><div class="small muted">' + esc(q.note) + '</div></div><div class="row"><button class="btn sm" type="button" data-a="reqok" data-v="' + q.id + '">Aceptar</button><button class="btn ghost sm" type="button" data-a="reqno" data-v="' + q.id + '">Rechazar</button></div></div>'; }).join('') : '<p class="muted">No tienes solicitudes nuevas.</p>') + '</div>';
  }
  function docView() { return '<div class="shell">' + docNav() + '<main class="main">' + (S.doc === 'lista' ? docLista() : docSol()) + '</main></div>'; }

  /* ---------- Superadmin ---------- */
  function pendingAlerts() { return L.networkSignals().filter(function (s) { return (s.state === 'fuerte' || s.state === 'vigilar') && !S.approved[s.zone] && !S.rejected[s.zone]; }).length; }
  function pendingResets() { return S.resets.filter(function (r) { return r.state === 'espera'; }).length; }
  function admNav() {
    return side([{ id: 'resumen', label: 'Resumen' }, { id: 'labs', label: 'Laboratorios' }, { id: 'claves', label: 'Claves', badge: sectionBadge(pendingResets()) }, { id: 'red', label: 'Alertas de la red', badge: sectionBadge(pendingAlerts()) }, { id: 'planes', label: 'Planes' }, { id: 'registro', label: 'Registro' }], S.adm, 'Superadministrador', 'Dueño de LABS');
  }
  function isActive(l) { return l.status === 'Al día' || l.status === 'Vence pronto'; }
  function admResumen() {
    const act = S.labs.filter(isActive); const mrr = act.reduce(function (s, l) { return s + l.price; }, 0); const risk = S.labs.filter(function (l) { return l.status === 'Atrasado' || l.status === 'Vence pronto'; });
    const orders = S.labs.reduce(function (s, l) { return s + l.orders30; }, 0);
    const byPlan = D.PLANS.map(function (p) { return { name: p.name, n: act.filter(function (l) { return l.plan === p.name; }).reduce(function (s, l) { return s + l.price; }, 0) }; });
    return '<div class="head"><div><h1>Resumen de LABS</h1><p>Cifras de ejemplo. Mira el negocio sin ver datos médicos.</p></div></div>' +
      '<div class="grid"><div class="card kpi"><small>Ingreso mensual (MRR)</small><b>' + L.fmtUsd(mrr) + '</b><small>Laboratorios que pagan al día</small></div><div class="card kpi"><small>Laboratorios activos</small><b>' + act.length + '</b><small>' + S.labs.length + ' en total</small></div><div class="card kpi"><small>Exámenes en 30 días</small><b>' + L.fmtInt(orders) + '</b><small>Toda la red</small></div><div class="card kpi"><small>En riesgo de irse</small><b>' + risk.length + '</b><small>Atrasados o por vencer</small></div></div>' +
      '<div class="grid two"><div class="card"><h2>Ingreso por plan</h2>' + U.hbars(byPlan, Math.max.apply(null, byPlan.map(function (b) { return b.n; })) || 1, L.fmtUsd) + '</div><div class="card"><h2>Hay que atender</h2>' + (risk.length ? risk.map(function (l) { return '<div class="row between"><span class="small"><b>' + esc(l.name) + '</b> · ' + esc(l.city) + '</span>' + (l.status === 'Atrasado' ? '<span class="chip crit">Atrasado ' + Math.abs(l.due) + ' días</span>' : '<span class="chip warn">Vence en ' + l.due + ' días</span>') + '</div>'; }).join('') : '<p class="muted">Nada pendiente.</p>') + '</div></div>' +
      '<div class="card dark"><h2>Lo que este panel NO muestra</h2><ul class="clean small"><li>Nombres, cédulas o teléfonos de pacientes.</li><li>Resultados ni valores de ningún examen.</li><li>Las claves de nadie. Solo puedes enviar un enlace para que cada persona elija una nueva.</li></ul></div>';
  }
  function admLabs() {
    return '<div class="head"><div><h1>Laboratorios</h1><p>Tus clientes y sus suscripciones.</p></div></div><div class="card"><div class="tw"><table style="min-width:760px"><thead><tr><th>Laboratorio</th><th>Plan</th><th>Estado</th><th>Exámenes (30 d)</th><th>Acciones</th></tr></thead><tbody>' + S.labs.map(function (l, i) {
      const chip = l.status === 'Al día' ? '<span class="chip ok">Al día · ' + l.due + ' d</span>' : l.status === 'Atrasado' ? '<span class="chip crit">Atrasado ' + Math.abs(l.due) + ' d</span>' : l.status === 'Suspendido' ? '<span class="chip gray">Suspendido</span>' : l.status === 'Prueba gratis' ? '<span class="chip gray">Prueba · ' + l.due + ' d</span>' : '<span class="chip warn">Vence en ' + l.due + ' d</span>';
      return '<tr><td><b>' + esc(l.name) + '</b><div class="small muted">' + esc(l.city) + ', ' + esc(l.state) + ' · desde ' + esc(l.since) + '</div></td><td>' + esc(l.plan) + ' · ' + L.fmtUsd(l.price) + '</td><td>' + chip + '</td><td>' + L.fmtInt(l.orders30) + '</td><td><div class="row"><button class="btn ghost sm" type="button" data-a="labpay" data-i="' + i + '">Registrar pago</button><button class="btn ghost sm" type="button" data-a="labsusp" data-i="' + i + '">' + (l.status === 'Suspendido' ? 'Reactivar' : 'Suspender') + '</button><button class="btn ghost sm" type="button" data-a="labreset" data-i="' + i + '">Reiniciar clave</button></div></td></tr>';
    }).join('') + '</tbody></table></div></div>' +
      '<div class="card"><h2>Nuevo laboratorio</h2><div class="grid"><label class="f">Nombre<input type="text" data-c="newname" value="' + esc(S.newLab.name) + '" placeholder="Laboratorio …"></label><label class="f">Ciudad<input type="text" data-c="newcity" value="' + esc(S.newLab.city) + '" placeholder="Ciudad"></label><label class="f">Plan<select data-c="newplan">' + D.PLANS.map(function (p) { return '<option' + (S.newLab.plan === p.name ? ' selected' : '') + '>' + p.name + '</option>'; }).join('') + '</select></label></div><div class="row"><button class="btn" type="button" data-a="addlab" ' + (S.newLab.name.trim() && S.newLab.city.trim() ? '' : 'disabled') + '>Crear con 14 días de prueba</button></div></div>';
  }
  function admClaves() {
    const isLab = S.resetType === 'Laboratorio';
    return '<div class="head"><div><h1>Claves</h1><p>Nunca ves ni cambias una clave. Envías un enlace al contacto ya registrado.</p></div></div>' +
      '<div class="grid two"><div class="card"><h2>Enviar enlace de nueva clave</h2><label class="f">Tipo de usuario<select data-c="resetType">' + ['Paciente', 'Médico', 'Laboratorio'].map(function (t) { return '<option' + (S.resetType === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      (isLab ? '<label class="f">Laboratorio<select data-c="resetWho">' + S.labs.map(function (l, i) { return '<option value="' + i + '"' + (S.resetWho === i ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select></label>' : '<label class="f">Cédula o correo registrado<input type="text" value="V-••.•••.•45" disabled></label>') +
      '<button class="btn" type="button" data-a="resetgo">' + (isLab ? 'Pedir enlace (necesita segundo aprobador)' : 'Enviar enlace al contacto registrado') + '</button>' +
      '<p class="small muted">' + (isLab ? 'Para un laboratorio, otra persona de LABS debe aprobarlo y hay una espera de 24 horas. Así nadie puede robar una cuenta con una sola llamada.' : 'El enlace llega al teléfono o correo que la persona ya tenía registrado, y vence en 30 minutos.') + '</p></div>' +
      '<div class="card"><h2>Pedidos recientes</h2>' + (S.resets.length ? S.resets.map(function (r, i) { return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><div><b>' + esc(r.who) + '</b><div class="small muted">' + esc(r.type) + ' · ' + esc(r.when) + '</div></div>' + (r.state === 'espera' ? '<div class="row"><span class="chip warn">Espera 2.º aprobador</span><button class="btn ghost sm" type="button" data-a="resetok" data-i="' + i + '">Aprobar (2.º aprobador)</button></div>' : '<span class="chip ok">' + esc(r.msg) + '</span>') + '</div>'; }).join('') : '<p class="muted">Todavía no has enviado ninguno.</p>') + '</div></div>';
  }
  function admRed() {
    const sig = L.networkSignals();
    const cand = sig.filter(function (s) { return s.state === 'fuerte' || s.state === 'vigilar'; }); const hidden = sig.filter(function (s) { return s.state === 'oculto'; });
    return '<div class="head"><div><h1>Alertas de la red</h1><p>El sistema propone. Tú decides qué ven los laboratorios.</p></div></div>' +
      cand.map(function (s) {
        const done = S.approved[s.zone] ? '<span class="chip ok">Aprobada: la ven los laboratorios</span>' : S.rejected[s.zone] ? '<span class="chip gray">Descartada</span>' : '';
        return '<div class="card"><div class="row between"><h2>' + esc(s.zone) + ' · ' + (s.state === 'fuerte' ? 'señal fuerte' : 'para vigilar') + '</h2>' + done + '</div><div class="row">' + U.spark(s.counts, s.state === 'fuerte' ? '#B45309' : '#4C5FD5') + '<div class="small"><b>' + s.last + ' casos</b> esta semana frente a ' + s.base.toFixed(1) + ' en promedio antes (' + s.ratio.toFixed(1) + ' veces más) · ' + s.labs + ' laboratorios</div></div><p class="small">' + esc(s.why) + ' ' + esc(D.NETWORK.marker) + '.</p>' +
          (done ? '' : '<div class="row"><button class="btn sm" type="button" data-a="approve" data-v="' + esc(s.zone) + '">Aprobar y enviar a los laboratorios</button><button class="btn ghost sm" type="button" data-a="reject" data-v="' + esc(s.zone) + '">Descartar</button></div>') + '</div>';
      }).join('') +
      (hidden.length ? '<div class="card note"><h2>Zonas ocultas</h2>' + hidden.map(function (s) { return '<div class="small"><b>' + esc(s.zone) + '</b>: ' + esc(s.why) + '</div>'; }).join('') + '</div>' : '') +
      '<div class="card note small"><p><b>Reglas:</b> solo conteos juntos por semana y zona, nunca personas. Una alerta es una señal para vigilar, no un diagnóstico, y no reemplaza la notificación al Ministerio de Salud.</p></div>';
  }
  function admPlanes() {
    return '<div class="head"><div><h1>Planes</h1><p>Lo que ofreces a los laboratorios.</p></div></div><div class="grid">' + D.PLANS.map(function (p) {
      const n = S.labs.filter(function (l) { return l.plan === p.name; }).length; return '<div class="card"><h2>' + p.name + '</h2><div style="font-size:28px;font-weight:700">' + L.fmtUsd(p.price) + '<span class="small muted"> al mes</span></div><p class="small">' + esc(p.text) + '</p><span class="chip gray">' + n + ' laboratorios</span></div>';
    }).join('') + '</div><div class="card note small">LABS cobra la suscripción y no emite factura al paciente. El laboratorio sigue emitiendo sus propias facturas.</div>';
  }
  function admRegistro() {
    return '<div class="head"><div><h1>Registro</h1><p>Todo lo que se hace en LABS queda anotado. Nadie puede editarlo ni borrarlo.</p></div></div><div class="card"><div class="tw"><table><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué pasó</th></tr></thead><tbody>' + S.audit.map(function (a) { return '<tr><td>' + esc(a.when) + '</td><td>' + esc(a.who) + '</td><td>' + esc(a.what) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function admView() {
    const v = { resumen: admResumen, labs: admLabs, claves: admClaves, red: admRed, planes: admPlanes, registro: admRegistro }[S.adm]();
    return '<div class="shell">' + admNav() + '<main class="main">' + v + '</main></div>';
  }

  /* ---------- Ventanas ---------- */
  function modalHtml() {
    const m = S.modal; if (!m) return '';
    if (m.type === 'pdf') {
      const r = D.PATIENT_RESULTS[m.i]; const code = L.docCode(r.id, r.date);
      return '<div class="modal-bg" data-a="closebg"><div class="modal" role="dialog" aria-modal="true" aria-label="Documento firmado"><div class="row between"><h2>Documento firmado</h2><div class="row"><button class="btn ghost sm" type="button" data-a="print">Imprimir</button><button class="btn sm" type="button" data-a="close">Cerrar</button></div></div>' + U.sheetHtml(r, true) + '<p class="small muted">Código de verificación: <b>' + code + '</b>. Cualquiera puede confirmar que es auténtico escaneando el QR. En la demo el código y el QR son de ejemplo.</p></div></div>';
    }
    if (m.type === 'share') {
      return '<div class="modal-bg" data-a="closebg"><div class="modal" role="dialog" aria-modal="true" aria-label="Compartir"><div class="row between"><h2>Compartir con mi médico</h2><button class="btn sm" type="button" data-a="close">Cerrar</button></div><div class="card"><b>labs.ejemplo/c/K7P2-XM4D</b><div class="row"><span class="chip warn">Vence en 2 horas</span><span class="chip warn">Se abre máximo 3 veces</span></div><p class="small muted">Con este enlace tu médico ve solo este resultado. Puedes anularlo cuando quieras. Cada apertura queda en “Quién me vio”.</p></div></div></div>';
    }
    return '';
  }

  /* ---------- Pantalla ---------- */
  function rolesBar() {
    const rs = [['lab', 'Laboratorio'], ['pat', 'Paciente'], ['doc', 'Médico'], ['adm', 'Superadmin']];
    return rs.map(function (r) { return '<button type="button" data-a="role" data-v="' + r[0] + '" aria-pressed="' + (S.role === r[0]) + '">' + r[1] + '</button>'; }).join('');
  }
  function render() {
    const y = window.scrollY; const app = document.getElementById('app');
    app.innerHTML = (S.role === 'lab' ? U.labView() : S.role === 'pat' ? patView() : S.role === 'doc' ? docView() : admView()) + modalHtml();
    document.getElementById('roles').innerHTML = rolesBar();
    document.getElementById('toast-host').innerHTML = S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '';
    window.scrollTo(0, y);
    if (S.modal && S.modal.fresh) { S.modal.fresh = false; const b = document.querySelector('.modal [data-a="close"]'); if (b) b.focus(); }
  }
  window.render = render;
  function top() { render(); window.scrollTo(0, 0); }

  /* ---------- Firma y sello ---------- */
  function setMarks(e) {
    S.signUrl = e.sign ? e.sign.toDataURL() : ''; S.stampUrl = e.stamp ? e.stamp.toDataURL() : ''; S.overlayUrl = e.overlay.toDataURL('image/jpeg', 0.8);
  }
  function msgFor(e) {
    if (e.sign && e.stamp) return 'Detectó la firma y el sello.';
    if (e.sign) return 'Detectó la firma, pero no el sello. Prueba otra foto con el sello más separado.';
    if (e.stamp) return 'Detectó el sello, pero no la firma. Prueba otra foto con la firma más separada.';
    return 'No detectó ni firma ni sello. Usa una hoja blanca, buena luz y firma y sello sin tocarse.';
  }
  try { const dm = L.defaultMarks(); setMarks(dm); S.owner = true; S.saved = true; S.extractMsg = 'Hoja de ejemplo cargada. Detectó la firma y el sello.'; } catch (err) { S.extractMsg = 'No se pudo cargar la hoja de ejemplo.'; }

  /* ---------- Eventos ---------- */
  function sendReady() {
    const base = S.sendScenario === 'normal' ? D.PATIENT_RESULTS[1] : D.PATIENT_RESULTS[0]; const vals = JSON.parse(JSON.stringify(base.values)); if (S.sendScenario === 'critico') vals[0].v = 285;
    const crit = L.summarize(vals).worst === 'urgente'; const c = S.sendChecks; return c.review && /^\d{6}$/.test(c.code) && (!crit || c.call);
  }
  function refreshDisabled() {
    const b = document.querySelector('[data-a="send"]'); if (b) b.disabled = !sendReady();
    const a = document.querySelector('[data-a="addlab"]'); if (a) a.disabled = !(S.newLab.name.trim() && S.newLab.city.trim());
  }
  document.addEventListener('click', function (ev) {
    const t = ev.target.closest('[data-a]'); if (!t) return; const a = t.getAttribute('data-a'), v = t.getAttribute('data-v'), i = parseInt(t.getAttribute('data-i'), 10);
    if (a === 'closebg') { if (ev.target !== t) return; S.modal = null; render(); return; }
    if (t.disabled) return;
    switch (a) {
      case 'role': S.role = v; S.resIdx = null; S.modal = null; top(); return;
      case 'nav': S[S.role === 'lab' ? 'lab' : S.role === 'pat' ? 'pat' : S.role === 'doc' ? 'doc' : 'adm'] = v; if (S.role === 'pat') S.resIdx = null; top(); return;
      case 'mode': S.mode = v; render(); return;
      case 'period': S.period = v; render(); return;
      case 'sample': try { const dm = L.defaultMarks(); setMarks(dm); S.extractMsg = 'Hoja de ejemplo cargada. ' + msgFor(dm); S.owner = false; S.saved = false; } catch (e) { S.extractMsg = 'No se pudo usar la hoja de ejemplo.'; } render(); return;
      case 'swap': { const x = S.signUrl; S.signUrl = S.stampUrl; S.stampUrl = x; S.saved = false; render(); return; }
      case 'savemarks': S.saved = true; logAudit('Laboratorio Ejemplo', 'El bioanalista actualizó su firma y su sello'); toast('Firma y sello guardados. Solo se estampan al validar un resultado.'); return;
      case 'send': S.sendChecks = { review: false, call: false, code: '' }; logAudit('Laboratorio Ejemplo', 'Resultado LAB-0142 firmado, sellado y enviado'); toast('Enviado. El paciente recibe solo el aviso: “Tienes un documento nuevo en LABS”.'); return;
      case 'openRes': S.resIdx = i; top(); return;
      case 'backRes': S.resIdx = null; top(); return;
      case 'pdf': S.modal = { type: 'pdf', i: i, fresh: true }; S.seen.unshift({ when: 'Hoy ' + U.nowTime(), who: 'Tú', what: 'Abriste el documento ' + D.PATIENT_RESULTS[i].id }); render(); return;
      case 'share': S.modal = { type: 'share', i: i, fresh: true }; S.seen.unshift({ when: 'Hoy ' + U.nowTime(), who: 'Tú', what: 'Creaste un enlace temporal para ' + D.PATIENT_RESULTS[i].id }); render(); return;
      case 'close': S.modal = null; render(); return;
      case 'print': try { window.print(); } catch (e) { toast('Aquí no se puede imprimir. En la versión real se descarga el PDF.'); } return;
      case 'qrnew': S.qrN++; S.qrEnds = Date.now() + 300000; render(); return;
      case 'permdoc': S.perm.l1 = !S.perm.l1; S.seen.unshift({ when: 'Hoy ' + U.nowTime(), who: 'Tú', what: S.perm.l1 ? 'Diste acceso a Dra. [MÉDICO]' : 'Quitaste el acceso a Dra. [MÉDICO]' }); render(); return;
      case 'dep': toast('En la versión real ves los resultados de tus dependientes con tu cuenta.'); return;
      case 'docsel': S.docSel = i; render(); return;
      case 'reqok': S.requests = S.requests.filter(function (q) { return q.id !== v; }); toast('Aceptada. Verás sus resultados hasta que venza el permiso.'); return;
      case 'reqno': S.requests = S.requests.filter(function (q) { return q.id !== v; }); toast('Rechazada.'); return;
      case 'labpay': { const l = S.labs[i]; l.status = 'Al día'; l.due = 30; logAudit('Superadministrador', 'Pago registrado: ' + l.name + ', ' + l.price + ' USD'); toast('Pago registrado: ' + l.name + '.'); return; }
      case 'labsusp': { const l = S.labs[i]; if (l.status === 'Suspendido') { l.status = 'Al día'; l.due = 30; logAudit('Superadministrador', 'Reactivó a ' + l.name); toast(l.name + ' reactivado.'); } else { l.status = 'Suspendido'; logAudit('Superadministrador', 'Suspendió a ' + l.name + ' (sus pacientes siguen viendo sus resultados)'); toast(l.name + ' suspendido. Sus pacientes siguen viendo sus resultados.'); } return; }
      case 'labreset': S.resetType = 'Laboratorio'; S.resetWho = i; S.adm = 'claves'; top(); return;
      case 'addlab': { const n = { id: 'l' + (S.labs.length + 1), name: S.newLab.name.trim(), city: S.newLab.city.trim(), state: S.newLab.city.trim(), plan: S.newLab.plan, price: D.PLANS.filter(function (p) { return p.name === S.newLab.plan; })[0].price, status: 'Prueba gratis', due: 14, orders30: 0, since: 'nov 2026' }; S.labs.push(n); logAudit('Superadministrador', 'Creó el laboratorio ' + n.name + ' (14 días de prueba)'); S.newLab = { name: '', city: '', plan: 'Básico' }; toast('Laboratorio creado con 14 días de prueba.'); return; }
      case 'resetgo': {
        if (S.resetType === 'Laboratorio') { const l = S.labs[S.resetWho]; S.resets.unshift({ type: 'Laboratorio', who: l.name, when: 'Hoy ' + U.nowTime(), state: 'espera', msg: '' }); logAudit('Superadministrador', 'Pidió reiniciar la clave de ' + l.name + ' (espera 2.º aprobador)'); toast('Pedido creado. Falta el segundo aprobador y 24 horas de espera.'); }
        else { S.resets.unshift({ type: S.resetType, who: S.resetType === 'Paciente' ? 'Paciente V-••.•••.•45' : 'Médico [MPPS ____]', when: 'Hoy ' + U.nowTime(), state: 'listo', msg: 'Enlace enviado al contacto registrado' }); logAudit('Superadministrador', 'Envió enlace de nueva clave a un ' + S.resetType.toLowerCase() + ' (contacto registrado)'); toast('Enlace enviado al contacto registrado. Vence en 30 minutos.'); }
        return; }
      case 'resetok': { const r = S.resets[i]; r.state = 'listo'; r.msg = 'Aprobado. El enlace sale al pasar 24 horas'; logAudit('Segundo aprobador', 'Aprobó el reinicio de clave de ' + r.who); toast('Aprobado por el segundo aprobador. El enlace sale al pasar 24 horas.'); return; }
      case 'approve': S.approved[v] = true; logAudit('Superadministrador', 'Aprobó alerta de la red (zona ' + v + ')'); toast('Alerta aprobada. Ahora la ven los laboratorios de la zona.'); return;
      case 'reject': S.rejected[v] = true; logAudit('Superadministrador', 'Descartó alerta de la red (zona ' + v + ')'); toast('Alerta descartada.'); return;
    }
  });
  document.addEventListener('change', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c'); if (!c) return; const i = parseInt(t.getAttribute('data-i'), 10);
    switch (c) {
      case 'manual': { const n = parseFloat(t.value); if (n > 0) { S.manualRate = n; } render(); return; }
      case 'price': { const n = parseFloat(t.value); if (n >= 0) D.CATALOG[i].price = n; render(); return; }
      case 'cost': { const n = parseFloat(t.value); if (n >= 0) D.CATALOG[i].cost = n; render(); return; }
      case 'file': { const f = t.files && t.files[0]; if (!f) return; S.extractMsg = 'Procesando la foto…'; render(); L.loadImageFromFile(f, 1400).then(function (cv) { const e = L.extract(cv); setMarks(e); S.extractMsg = msgFor(e); S.owner = false; S.saved = false; render(); }).catch(function () { S.extractMsg = 'No se pudo abrir esa imagen. Usa una foto JPG o PNG.'; render(); }); return; }
      case 'owner': S.owner = t.checked; render(); return;
      case 'scenario': S.sendScenario = t.value; S.sendChecks = { review: false, call: false, code: '' }; render(); return;
      case 'review': S.sendChecks.review = t.checked; render(); return;
      case 'call': S.sendChecks.call = t.checked; render(); return;
      case 'newplan': S.newLab.plan = t.value; return;
      case 'resetType': S.resetType = t.value; render(); return;
      case 'resetWho': S.resetWho = parseInt(t.value, 10); return;
      case 'note': S.notes[i] = t.value; toast('Nota guardada.'); return;
    }
  });
  document.addEventListener('input', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c'); if (!c) return;
    if (c === 'code') { S.sendChecks.code = t.value.replace(/\D/g, '').slice(0, 6); if (t.value !== S.sendChecks.code) t.value = S.sendChecks.code; refreshDisabled(); }
    else if (c === 'newname') { S.newLab.name = t.value; refreshDisabled(); }
    else if (c === 'newcity') { S.newLab.city = t.value; refreshDisabled(); }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.modal) { S.modal = null; render(); } });

  // Cuenta regresiva del QR
  setInterval(function () {
    const el = document.getElementById('qrcount'); if (!el) return; let s = Math.round((S.qrEnds - Date.now()) / 1000);
    if (s <= 0) { S.qrN++; S.qrEnds = Date.now() + 300000; render(); return; }
    el.textContent = 'Vence en ' + Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }, 1000);

  render();
})();
