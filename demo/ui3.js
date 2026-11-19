/* LABS demo · núcleo: sesión, avisos, soporte, paciente y médico */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, U2 = window.UI2;
  const esc = U.esc, toast = U.toast, chipFor = U.chipFor, logAudit = U.logAudit;
  const EXT = window.EXT = { nav: { lab: [], pat: [], doc: [], adm: [] }, views: { lab: {}, pat: {}, doc: {}, adm: {} }, actions: {}, onInput: {} };

  /* ---------- Utilidades ---------- */
  let SEQ = 2000; function uid(p) { SEQ++; return p + SEQ; }
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function longDate(d) { d = d || new Date(); return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
  function when() { return 'Hoy ' + U.nowTime(); }
  function maskCi(ci) { const d = String(ci).replace(/\D/g, ''); return String(ci).charAt(0).toUpperCase() + '-••.•••.•' + d.slice(-2); }
  function ageOf(dob) { const b = new Date(dob); if (isNaN(b)) return 0; const n = new Date(); let a = n.getFullYear() - b.getFullYear(); const m = n.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--; return a; }
  function pwScore(p) { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++; return s; }
  function meterHtml(p) { const s = pwScore(p || ''); const cls = s <= 1 ? 'on1' : s === 2 ? 'on2' : 'on3'; let h = '<div class="meter" id="pwm" aria-label="Fuerza de la clave: ' + ['muy débil', 'débil', 'aceptable', 'buena', 'muy buena'][s] + '">'; for (let i = 0; i < 4; i++) h += '<i class="' + (i < s ? cls : '') + '"></i>'; return h + '</div><span class="small muted" id="pwt">' + ['Escribe una clave', 'Muy débil', 'Débil: agrega mayúsculas y números', 'Aceptable', 'Muy buena'][s === 4 ? 4 : s] + '</span>'; }
  function pwOk(p) { return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p); }
  S.f = {}; S.err = {};
  function F(n, d) { return S.f[n] !== undefined ? S.f[n] : (d === undefined ? '' : d); }
  function clearF(prefix) { Object.keys(S.f).forEach(function (k) { if (k.indexOf(prefix) === 0) delete S.f[k]; }); }
  function errBox(k) { return '<div class="err" role="alert" data-ek="' + k + '"' + (S.err[k] ? '' : ' hidden') + '>' + (S.err[k] ? esc(S.err[k]) : '') + '</div>'; }
  function setErr(k, m) { S.err[k] = m; render(); }
  function fld(label, name, o) {
    o = o || {}; const type = o.type || 'text'; const v = F(name, o.def);
    if (type === 'select') return '<label class="f">' + label + '<select data-c="f-' + name + '"' + (o.r ? ' data-r="1"' : '') + '>' + o.options.map(function (x) { const val = typeof x === 'object' ? x.v : x, lab = typeof x === 'object' ? x.l : x; const cur = v === '' || v === undefined ? o.options[0] && (typeof o.options[0] === 'object' ? o.options[0].v : o.options[0]) : v; return '<option value="' + esc(val) + '"' + (String(cur) === String(val) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('') + '</select></label>';
    if (type === 'textarea') return '<label class="f">' + label + '<textarea data-c="f-' + name + '" placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea></label>';
    if (type === 'checkbox') return '<label class="row small" style="cursor:pointer;color:var(--ink)"><input type="checkbox" data-c="f-' + name + '"' + (v ? ' checked' : '') + (o.r ? ' data-r="1"' : '') + ' style="width:22px;height:22px;min-height:0"> <span>' + label + '</span></label>';
    return '<label class="f">' + label + '<input type="' + type + '" data-c="f-' + name + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.enter ? ' data-enter="' + o.enter + '"' : '') + (o.ro ? ' disabled' : '') + ' autocomplete="off"></label>';
  }
  function dlg(title, html, ok, extra) { S.modal = { type: 'dlg', title: title, html: html, ok: ok, extra: extra || null, fresh: true }; render(); }
  function closeDlg() { S.modal = null; render(); }
  function refreshErr(h) { return String(h).replace(/<div class="err" role="alert" data-ek="([^"]+)"[^>]*>[\s\S]*?<\/div>/g, function (x, k) { return errBox(k); }); }
  function syncModal() { document.querySelectorAll('.modal [data-c^="f-"]').forEach(function (el) { const n = el.getAttribute('data-c').slice(2); if (S.f[n] === undefined) return; if (el.type === 'checkbox') el.checked = !!S.f[n]; else if (el.value !== String(S.f[n])) el.value = S.f[n]; }); }
  function dlgHtml() {
    const m = S.modal; if (!m || m.type !== 'dlg') return '';
    return '<div class="modal-bg" data-a="closebg"><div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(m.title) + '" style="max-width:520px"><h2>' + esc(m.title) + '</h2>' + refreshErr(m.html) + '<div class="row" style="justify-content:flex-end">' + '<button class="btn ghost sm" type="button" data-a="close">' + (m.ok ? (m.ok.closeLabel || 'Cancelar') : 'Cerrar') + '</button>' + (m.ok ? '<button class="btn sm" type="button" data-a="' + m.ok.a + '" data-v="' + esc(m.ok.v || '') + '">' + esc(m.ok.label) + '</button>' : '') + '</div></div></div>';
  }
  function dlgInfo(title, html) { S.modal = { type: 'dlg', title: title, html: html, ok: null, fresh: true }; render(); }

  /* ---------- Datos compartidos ---------- */
  S.accounts = [
    { id: 'a1', email: 'lab@demo.com', pass: 'demo1234', role: 'lab', sub: 'owner', name: 'Lic. Carla Mendoza', status: 'activo', last: 'Hoy 08:02' },
    { id: 'a2', email: 'recep@demo.com', pass: 'demo1234', role: 'lab', sub: 'recep', name: 'Gabriela Ruiz (recepción)', status: 'activo', last: 'Ayer 16:40' },
    { id: 'a3', email: 'pat@demo.com', pass: 'demo1234', role: 'pat', pid: 'p1', name: 'Ana Rodríguez', status: 'activo', last: 'Hoy 07:15' },
    { id: 'a4', email: 'doc@demo.com', pass: 'demo1234', role: 'doc', name: 'Dra. Marisol Pérez', status: 'activo', last: 'Ayer 18:02' },
    { id: 'a5', email: 'adm@demo.com', pass: 'demo1234', role: 'adm', name: 'Superadministrador', status: 'activo', last: 'Hoy 08:14' },
    { id: 'a6', email: 'luis@correo.com', pass: 'demo1234', role: 'pat', pid: 'p2', name: 'Luis Gómez', status: 'activo', last: '12 nov' }
  ];
  S.patients = [
    { id: 'p1', name: 'Ana Rodríguez', ci: 'V-12.345.645', phone: '0414-5554521', email: 'pat@demo.com', age: 41, sex: 'F', dob: '1985-06-12', created: 'ene 2026' },
    { id: 'p2', name: 'Luis Gómez', ci: 'V-18.221.318', phone: '0424-5553318', email: 'luis@correo.com', age: 52, sex: 'M', dob: '1974-02-20', created: 'feb 2026' },
    { id: 'p3', name: 'Marta Salazar', ci: 'V-9.115.107', phone: '0412-5550107', email: 'marta@correo.com', age: 67, sex: 'F', dob: '1959-09-03', created: 'mar 2026' },
    { id: 'p4', name: 'Jesús Torres', ci: 'V-27.440.292', phone: '0416-5550292', email: 'jesus@correo.com', age: 22, sex: 'M', dob: '2004-11-30', created: 'abr 2026' },
    { id: 'p5', name: 'Mariela García', ci: 'V-14.880.118', phone: '0414-5550118', email: 'mariela@correo.com', age: 35, sex: 'F', dob: '1991-04-08', created: 'may 2026' },
    { id: 'p6', name: 'Diego Castro', ci: 'V-20.314.455', phone: '0426-5550455', email: 'diego@correo.com', age: 30, sex: 'M', dob: '1996-01-17', created: 'jun 2026' },
    { id: 'p7', name: 'Marisol Pérez (como paciente)', ci: 'V-11.050.730', phone: '0414-5550730', email: 'doc@demo.com', age: 49, sex: 'F', dob: '1977-07-25', created: 'ene 2026' }
  ];
  S.deps = [{ id: 'd1', parent: 'p1', name: 'Sofía Rodríguez', dob: '2018-03-14', rel: 'Hija', age: 8, sex: 'F' }];
  function personOf(pid) { return S.patients.filter(function (p) { return p.id === pid; })[0] || S.deps.filter(function (p) { return p.id === pid; })[0] || null; }
  function mkResult(pid, id, title, date, values, extra) {
    const p = personOf(pid); const r = { id: id, title: title, lab: 'Laboratorio Ejemplo', date: date, patient: p.name, ci: p.ci ? maskCi(p.ci) : 'Dependiente', age: p.age, sex: p.sex, values: values, history: null, pid: pid };
    return Object.assign(r, extra || {});
  }
  D.PATIENT_RESULTS.forEach(function (r) { r.pid = r.pid || 'p1'; });
  D.PATIENT_RESULTS.push(
    mkResult('p5', 'LAB-0121', 'Hematología completa', '12 de noviembre de 2026', [{ id: 'hem', v: 10.9 }, { id: 'cre', v: 0.8 }, { id: 'ure', v: 30 }]),
    mkResult('p4', 'LAB-0110', 'Función del riñón', '2 de noviembre de 2026', [{ id: 'cre', v: 1.6 }, { id: 'ure', v: 58 }]),
    mkResult('p2', 'LAB-0125', 'Azúcar y colesterol', '9 de noviembre de 2026', [{ id: 'glu', v: 92 }, { id: 'col', v: 180 }]),
    mkResult('d1', 'LAB-0089', 'Hematología (niña)', '4 de octubre de 2026', [{ id: 'hem', v: 12.8 }, { id: 'ure', v: 24 }])
  );
  S.seen.forEach(function (x) { x.pid = 'p1'; });
  S.access = [{ id: 'ac1', pid: 'p1', doc: 'Dra. Marisol Pérez', until: '14 feb 2027', scope: 'Todos los resultados', on: true }];
  S.docPatients = D.DOCTOR_PATIENTS.map(function (x) { return Object.assign({}, x); });
  S.docReqOut = [];
  S.requests = [{ id: 'q1', pid: 'p3', name: 'Paciente M. S.', note: 'Te envió acceso a sus resultados por 3 meses.' }, { id: 'q2', pid: 'p6', name: 'Paciente D. C.', note: 'Te envió acceso a sus resultados de hematología.' }];
  S.prefs = {};
  function prefsOf(pid) { if (!S.prefs[pid]) S.prefs[pid] = { wa: true, mail: false, sms: false, discreet: false, pin: '', pinOk: false, sessions: [{ id: 's1', dev: 'Este navegador', when: 'Ahora' }, { id: 's2', dev: 'Teléfono Android', when: 'Ayer 21:10' }] }; return S.prefs[pid]; }
  S.settings = { maint: false, maintMsg: 'Mantenimiento programado esta noche de 2:00 a 3:00 a. m. El servicio puede fallar unos minutos.', ratesAt: 'Hoy 06:00' };
  S.notifs = { lab: [], pat: [], doc: [], adm: [] };
  function notify(role, text, action, pid) { S.notifs[role].unshift({ id: uid('n'), when: when(), text: text, action: action || null, read: false, pid: pid || null, done: '' }); }
  notify('pat', 'Tienes un documento nuevo en LABS: resultado LAB-0142.', { type: 'res', ref: 0 }, 'p1');
  notify('doc', 'La paciente Ana R. actualizó tu acceso hasta el 14 feb 2027.', null);
  notify('lab', 'Tu suscripción vence en 12 días. Puedes reportar el pago desde Configuración.', { type: 'go', ref: 'suscripcion' });
  notify('adm', 'Alerta de la red en Carabobo pendiente de revisión.', { type: 'go', ref: 'red' });
  notify('adm', 'Bioanálisis Valencia Sur vence en 3 días.', { type: 'go', ref: 'labs' });
  S.notifs.pat[0].read = true;
  function unread(role) { return S.notifs[role].filter(function (n) { return !n.read && (role !== 'pat' || !n.pid || n.pid === curPid()); }).length; }
  function curPid() { return S.viewAs || (S.auth && S.auth.pid) || null; }
  function myPid() { return S.auth && S.auth.pid; }

  /* ---------- Soporte: ayuda, chat, tickets ---------- */
  const FAQ = [
    { r: ['all'], c: 'Cuenta', q: 'Olvidé mi clave. ¿Qué hago?', a: 'En la pantalla de inicio pulsa “Olvidé mi clave”, escribe tu correo y abre el enlace que te llega. Si no te llega, crea un ticket y soporte te ayuda.', k: ['clave', 'olvide', 'contrasena', 'password', 'entrar'] },
    { r: ['all'], c: 'Cuenta', q: '¿Por qué me piden un código de seguridad?', a: 'Es un segundo paso para que nadie entre a tu cuenta solo con tu clave. El código llega al teléfono o correo que registraste.', k: ['codigo', 'seguridad', 'sms', 'verificacion'] },
    { r: ['all'], c: 'Privacidad', q: '¿Quién puede ver mis resultados?', a: 'Solo tú, el laboratorio que los hizo y los médicos a quienes tú les diste permiso. Todo acceso queda anotado en “Quién me vio”.', k: ['quien', 'ver', 'privacidad', 'permiso', 'resultados'] },
    { r: ['pat'], c: 'Resultados', q: '¿Cómo entiendo mis resultados?', a: 'Cada valor muestra una barra con la zona normal. Las recomendaciones son generales. Solo un médico puede decidir qué hacer con tu resultado.', k: ['entender', 'resultado', 'normal', 'alto', 'recomendacion'] },
    { r: ['pat'], c: 'QR', q: '¿Para qué sirve mi código QR?', a: 'Se lo muestras al laboratorio para que cree tu orden. Cambia cada 5 minutos y sirve una sola vez, así que una captura vieja no funciona.', k: ['qr', 'codigo', 'laboratorio', 'orden'] },
    { r: ['pat'], c: 'Resultados', q: 'No me llegó mi resultado', a: 'Revisa “Avisos”. Si el laboratorio ya lo envió y no aparece, crea un ticket con el número de orden (sin escribir datos médicos).', k: ['llego', 'resultado', 'no aparece', 'orden'] },
    { r: ['pat'], c: 'Privacidad', q: '¿Cómo borro mi cuenta?', a: 'En Mi perfil, pestaña Privacidad, pulsa “Borrar mi cuenta” y escribe BORRAR. Tus datos se eliminan.', k: ['borrar', 'eliminar', 'cuenta', 'datos'] },
    { r: ['doc'], c: 'Acceso', q: '¿Cómo veo los resultados de un paciente?', a: 'En “Pedir acceso” escribe su cédula. El paciente recibe la solicitud y, si la acepta, aparece en Mis pacientes hasta que venza el permiso.', k: ['acceso', 'paciente', 'pedir', 'cedula', 'permiso'] },
    { r: ['lab'], c: 'Órdenes', q: '¿Cómo creo una orden?', a: 'En Nueva orden busca al paciente por cédula o con su código QR, marca los exámenes, elige cómo pagó y pulsa Crear orden.', k: ['orden', 'crear', 'nueva', 'paciente', 'qr'] },
    { r: ['lab'], c: 'Resultados', q: '¿Cómo envío un resultado firmado?', a: 'Abre la orden, carga los valores, revisa, escribe tu código de seguridad y pulsa Firmar, sellar y enviar. Si hay un valor crítico, antes debes llamar al paciente o a su médico.', k: ['enviar', 'firmar', 'resultado', 'sello', 'critico'] },
    { r: ['lab'], c: 'Dinero', q: '¿Cómo se calculan los precios en bolívares?', a: 'Los precios se guardan en dólares. Puedes verlos con la tasa BCV, la USDT o una tasa propia. Cada orden guarda la tasa del día en que se hizo.', k: ['precio', 'bolivares', 'tasa', 'bcv', 'usdt', 'dolar'] },
    { r: ['lab'], c: 'Suscripción', q: '¿Cómo pago mi suscripción?', a: 'En Configuración, en Mi suscripción, pulsa “Reportar un pago”, escribe el método y la referencia. LABS lo confirma y tu cuenta queda al día.', k: ['pagar', 'suscripcion', 'plan', 'pago', 'referencia'] },
    { r: ['lab'], c: 'Estudios', q: '¿Puedo ofrecer rayos X, ecos o electrocardiogramas?', a: 'Sí. En Exámenes y precios agrega el estudio. Su resultado es un informe del especialista con hallazgos, conclusión e imagen adjunta.', k: ['rayos', 'eco', 'resonancia', 'electrocardiograma', 'informe', 'imagen'] },
    { r: ['adm'], c: 'Pagos', q: '¿Cómo confirmo el pago de un laboratorio?', a: 'En Pagos revisa la referencia y pulsa Confirmar. El laboratorio pasa a “Al día” y se anota en el registro.', k: ['pago', 'confirmar', 'laboratorio', 'referencia'] },
    { r: ['adm'], c: 'Claves', q: '¿Puedo ver la clave de un usuario?', a: 'No. Nadie puede verla. Solo puedes enviar un enlace al contacto registrado para que la persona elija otra.', k: ['clave', 'ver', 'reiniciar', 'enlace'] }
  ];
  function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  S.sup = { tab: 'ayuda', open: null };
  S.chat = [{ from: 'bot', text: 'Hola, soy el asistente de LABS. Pregúntame algo o elige una de las preguntas de abajo.' }];
  S.tickets = [
    { id: 'T-1038', acct: 'a1', role: 'lab', who: 'Lic. Carla Mendoza', subject: 'No puedo cambiar el precio de una prueba', cat: 'Consulta', status: 'Resuelto', created: '8 nov', msgs: [{ from: 'user', who: 'Lic. Carla Mendoza', text: 'Cuando cambio el precio de la glucosa no se actualiza en pantalla.', when: '8 nov 10:02' }, { from: 'soporte', who: 'Soporte LABS', text: 'Gracias. Ya quedó corregido. Pulsa fuera del campo para guardar el precio.', when: '8 nov 11:30' }] },
    { id: 'T-1041', acct: 'a3', role: 'pat', who: 'Ana Rodríguez', subject: 'Quiero que mi médico vea solo un examen', cat: 'Consulta', status: 'En revisión', created: '15 nov', msgs: [{ from: 'user', who: 'Ana Rodríguez', text: '¿Puedo darle permiso a mi médico solo para el examen de azúcar?', when: '15 nov 09:40' }] }
  ];
  S.tseq = 1042;
  function answerFor(text) {
    const t = norm(text); const words = t.split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2; }); let best = null, bs = 0;
    FAQ.forEach(function (f) { let sc = 0; f.k.forEach(function (k) { if (t.indexOf(norm(k)) >= 0) sc += 2; }); words.forEach(function (w) { if (norm(f.q).indexOf(w) >= 0) sc++; }); if (f.r.indexOf('all') < 0 && f.r.indexOf(S.role) < 0) sc = 0; if (sc > bs) { bs = sc; best = f; } });
    return bs >= 2 ? best : null;
  }
  function visibleFaq() { return FAQ.filter(function (f) { return f.r.indexOf('all') >= 0 || f.r.indexOf(S.role) >= 0; }); }
  function supportView() {
    const tabs = [['ayuda', 'Ayuda'], ['chat', 'Chat'], ['tickets', 'Mis tickets'], ['estado', 'Estado del sistema'], ['legal', 'Legal y versión']];
    let body = '';
    const t = S.sup.tab;
    if (t === 'ayuda') {
      const q = norm(F('faq-q')); const list = visibleFaq().filter(function (f) { return !q || norm(f.q + ' ' + f.a + ' ' + f.c).indexOf(q) >= 0; });
      body = '<div class="card"><label class="f">Buscar en la ayuda<input type="text" data-c="f-faq-q" value="' + esc(F('faq-q')) + '" placeholder="Por ejemplo: clave, QR, pago" data-enter="faq-go" autocomplete="off"></label><div id="faqlist" style="display:flex;flex-direction:column;gap:8px">' + faqItems(list) + '</div><div class="row"><span class="small muted">¿No encontraste lo que buscabas?</span><button class="btn ghost sm" type="button" data-a="sup-tab" data-v="tickets">Crear un ticket</button><button class="btn ghost sm" type="button" data-a="sup-tab" data-v="chat">Hablar con el chat</button></div></div>';
    } else if (t === 'chat') {
      body = '<div class="card"><div class="thread" id="chatbox" aria-live="polite">' + S.chat.map(function (m) { return '<div class="bub' + (m.from === 'me' ? ' me' : '') + '">' + esc(m.text) + '</div>'; }).join('') + '</div><div class="pill-row">' + visibleFaq().slice(0, 4).map(function (f) { return '<button class="btn ghost sm" type="button" data-a="chat-q" data-v="' + esc(f.q) + '">' + esc(f.q) + '</button>'; }).join('') + '</div><div class="row" style="flex-wrap:nowrap"><div style="flex:1"><label class="f"><span class="sr">Tu mensaje</span><input type="text" data-c="f-chatin" value="' + esc(F('chatin')) + '" placeholder="Escribe tu pregunta" data-enter="chat-send" autocomplete="off"></label></div><button class="btn" type="button" data-a="chat-send">Enviar</button></div><div class="row"><button class="btn ghost sm" type="button" data-a="chat-ticket">Hablar con una persona (crear ticket con esta conversación)</button></div></div>';
    } else if (t === 'tickets') body = ticketsView();
    else if (t === 'estado') body = estadoView();
    else body = legalView();
    return '<div class="head"><div><h1>Soporte técnico</h1><p>Ayuda, chat y tickets. Una persona te responde en horario de atención.</p></div></div><div class="seg" role="tablist" aria-label="Soporte">' + tabs.map(function (x) { return '<button type="button" role="tab" data-a="sup-tab" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' + body;
  }
  function faqItems(list) { return list.length ? list.map(function (f) { return '<details class="acc"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p><span class="chip gray">' + esc(f.c) + '</span></details>'; }).join('') : '<p class="muted">No hay resultados para esa búsqueda.</p>'; }
  function myTickets() { return S.tickets.filter(function (x) { return x.acct === S.auth.id; }); }
  function ticketsView() {
    if (S.sup.open) { const tk = S.tickets.filter(function (x) { return x.id === S.sup.open; })[0]; if (tk) return threadView(tk, false); }
    const list = myTickets(); const nt = S.sup.newt;
    return (nt ? '' : '<div class="row"><button class="btn" type="button" data-a="sup-new">Crear ticket nuevo</button></div>') +
      (nt ? '<div class="card"><h2>Ticket nuevo</h2>' + fld('Asunto', 'tk-sub', { ph: 'Resumen en una frase' }) + fld('Tipo de problema', 'tk-cat', { type: 'select', options: ['Consulta', 'Error en la aplicación', 'Pagos y suscripción', 'Cuenta y clave', 'Sugerencia'] }) + fld('Cuéntanos qué pasó', 'tk-msg', { type: 'textarea', ph: 'Qué hacías, qué esperabas y qué pasó' }) + '<div class="card note small"><p><b>No escribas datos médicos</b> (valores de exámenes, diagnósticos). Si necesitas hablar de un resultado, usa solo el número de orden.</p></div>' + errBox('tk') + '<div class="row"><button class="btn" type="button" data-a="sup-send">Enviar ticket</button><button class="btn ghost" type="button" data-a="sup-cancel">Cancelar</button></div></div>' : '') +
      '<div class="card"><h2>Mis tickets</h2>' + (list.length ? '<div class="tw"><table><thead><tr><th>Número</th><th>Asunto</th><th>Estado</th><th>Fecha</th><th></th></tr></thead><tbody>' + list.map(function (x) { return '<tr><td>' + x.id + '</td><td>' + esc(x.subject) + '</td><td>' + ticketChip(x.status) + '</td><td>' + esc(x.created) + '</td><td><button class="btn ghost sm" type="button" data-a="sup-open" data-v="' + x.id + '">Abrir</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Todavía no tienes tickets. Si algo falla, crea uno y te respondemos.</p>') + '</div>';
  }
  function ticketChip(s) { return '<span class="chip ' + (s === 'Resuelto' || s === 'Cerrado' ? 'ok' : s === 'En revisión' ? 'warn' : 'gray') + '">' + s + '</span>'; }
  function threadView(tk, admin) {
    return '<div class="card"><div class="row between"><div><button class="btn ghost sm" type="button" data-a="sup-back">Volver</button></div>' + ticketChip(tk.status) + '</div><h2>' + tk.id + ' · ' + esc(tk.subject) + '</h2><p class="small muted">' + esc(tk.cat) + ' · ' + esc(tk.who) + ' (' + { lab: 'Laboratorio', pat: 'Paciente', doc: 'Médico', adm: 'Admin' }[tk.role] + ') · ' + esc(tk.created) + '</p><div class="thread">' + tk.msgs.map(function (m) { const mine = admin ? m.from === 'soporte' : m.from === 'user'; return '<div class="bub' + (mine ? ' me' : '') + '"><b class="small">' + esc(m.who) + '</b><div>' + esc(m.text) + '</div><small>' + esc(m.when) + '</small></div>'; }).join('') + '</div>' +
      (tk.status === 'Cerrado' ? '<p class="muted small">Este ticket está cerrado.</p><div class="row"><button class="btn ghost sm" type="button" data-a="tk-reopen" data-v="' + tk.id + '">Reabrir</button></div>' : fld('Tu respuesta', 'tk-reply', { type: 'textarea' }) + errBox('tkr') + '<div class="row"><button class="btn" type="button" data-a="tk-reply" data-v="' + tk.id + '" data-admin="' + (admin ? 1 : 0) + '">Enviar respuesta</button>' + (admin ? '' : '<button class="btn ghost" type="button" data-a="tk-close" data-v="' + tk.id + '">Cerrar ticket</button>') + '</div>') + '</div>';
  }
  function estadoView() {
    const svcs = [['Inicio de sesión', true], ['Envío de resultados', true], ['Avisos por WhatsApp (simulado)', true], ['Lectura de firmas y sellos', true], ['Red de alertas', true], ['Pagos y suscripciones', true]];
    return '<div class="card"><div class="row between"><h2>Estado del sistema</h2><span class="chip ' + (S.settings.maint ? 'warn' : 'ok') + '">' + (S.settings.maint ? 'Mantenimiento programado' : 'Todo funciona') + '</span></div>' + svcs.map(function (s) { return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span>' + s[0] + '</span><span class="chip ok">Operativo</span></div>'; }).join('') + '<p class="small muted">Última revisión: ' + esc(S.statusAt || when()) + '</p><button class="btn ghost sm" type="button" data-a="svc-refresh">Revisar ahora</button></div>' +
      '<div class="card"><h2>Últimos incidentes</h2><div class="tw"><table><thead><tr><th>Fecha</th><th>Qué pasó</th><th>Estado</th></tr></thead><tbody><tr><td>10 nov</td><td>Los avisos tardaron más de lo normal (40 min).</td><td><span class="chip ok">Resuelto</span></td></tr><tr><td>28 oct</td><td>Mantenimiento programado de 2 a 3 a. m.</td><td><span class="chip ok">Resuelto</span></td></tr></tbody></table></div></div>';
  }
  function legalView() {
    return '<div class="card"><h2>Legal y versión</h2><details class="acc"><summary>Términos de uso</summary><p>LABS conecta a laboratorios, pacientes y médicos. El laboratorio es responsable del contenido y la validez de sus resultados. LABS no emite diagnósticos ni reemplaza a un médico.</p></details><details class="acc"><summary>Privacidad</summary><p>Tus resultados son tuyos. Solo los ven quienes tú autorices y cada acceso se anota. LABS no vende datos. Los reportes de la red se hacen con conteos juntos, nunca con personas.</p></details><details class="acc"><summary>Firma y sellos</summary><p>La imagen de la firma no es una firma electrónica certificada. LABS agrega un código QR para comprobar que el documento es auténtico y no se modificó.</p></details><div class="row"><span class="chip gray">LABS demo 0.9</span><span class="chip gray">Términos v' + (S.settings.terms || '1.2') + '</span><button class="btn ghost sm" type="button" data-a="legal-dl">Descargar términos</button></div><p class="small muted">Contacto de soporte: soporte@labs.demo · WhatsApp +58 000 000 0000 · Lunes a sábado, 8 a. m. a 6 p. m. (datos de ejemplo).</p></div>';
  }

  /* ---------- Avisos ---------- */
  function avisosView() {
    const role = S.role; const list = S.notifs[role].filter(function (n) { return role !== 'pat' || !n.pid || n.pid === curPid(); });
    return '<div class="head"><div><h1>Avisos</h1><p>Lo importante de tu cuenta, en un solo lugar.</p></div><button class="btn ghost sm" type="button" data-a="markall">Marcar todos como leídos</button></div><div class="card">' + (list.length ? list.map(function (n) {
      let acts = '';
      if (!n.done && n.action) {
        const a = n.action;
        if (a.type === 'ordconf') acts = '<button class="btn sm" type="button" data-a="ordok" data-v="' + n.id + '">Confirmar la orden</button><button class="btn ghost sm" type="button" data-a="ordno" data-v="' + n.id + '">No es mía</button>';
        else if (a.type === 'accreq') acts = '<button class="btn sm" type="button" data-a="accok" data-v="' + n.id + '">Aceptar</button><button class="btn ghost sm" type="button" data-a="accno" data-v="' + n.id + '">Rechazar</button>';
        else if (a.type === 'res') acts = '<button class="btn sm" type="button" data-a="n-openres" data-v="' + n.id + '">Ver resultado</button>';
        else if (a.type === 'go') acts = '<button class="btn sm" type="button" data-a="n-go" data-v="' + n.id + '">Abrir</button>';
      }
      return '<div style="padding:12px 0;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px"><div class="row between"><span>' + esc(n.text) + '</span>' + (n.read ? '' : '<span class="chip warn">Nuevo</span>') + '</div><div class="small muted">' + esc(n.when) + (n.done ? ' · ' + esc(n.done) : '') + '</div><div class="row">' + acts + (n.read ? '' : '<button class="btn ghost sm" type="button" data-a="markread" data-v="' + n.id + '">Marcar como leído</button>') + '</div></div>';
    }).join('') : '<p class="muted">No tienes avisos.</p>') + '</div>';
  }
  function findNotif(id) { return S.notifs[S.role].filter(function (n) { return n.id === id; })[0]; }

  /* ---------- Paciente ---------- */
  EXT.nav.pat = [
    { id: 'lista', label: 'Mis resultados' }, { id: 'qr', label: 'Mi código QR' }, { id: 'vistas', label: 'Quién me vio' }, { id: 'avisos', label: 'Avisos', badge: function () { return unread('pat') || ''; } }, { id: 'perfil', label: 'Mi perfil' }, { id: 'soporte', label: 'Soporte' }
  ];
  function myResults() { const pid = curPid(); return D.PATIENT_RESULTS.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.pid === pid; }); }
  function viewAsBanner() {
    let h = '';
    if (S.viewAs) { const d = personOf(S.viewAs); h += '<div class="banner" role="status">Estás viendo a ' + esc(d.name) + ' (dependiente). <button class="btn ghost sm" type="button" data-a="p-dep-back">Volver a mis resultados</button></div>'; }
    if (S.returnRole) h += '<div class="banner" role="status">Estás en modo paciente. <button class="btn ghost sm" type="button" data-a="mode2" data-v="' + S.returnRole + '">Volver a modo médico</button></div>';
    return h;
  }
  EXT.views.pat.lista = function () {
    if (S.resIdx !== null && D.PATIENT_RESULTS[S.resIdx]) return viewAsBanner() + patDetalle();
    const pr = prefsOf(curPid()); const list = myResults();
    return viewAsBanner() + '<div class="head"><div><h1>Mis resultados</h1><p>Todo tu historial en un solo lugar.</p></div></div>' + (list.length ? list.map(function (x) {
      const s = L.summarize(x.r.values); const rep = !x.r.values.length;
      return '<button type="button" class="card" data-a="p-open" data-i="' + x.i + '" style="text-align:left;cursor:pointer;border:0;font:inherit;color:inherit"><div class="row between"><b>' + esc(x.r.title) + '</b>' + (pr.discreet ? '<span class="chip gray">Toca para ver</span>' : rep ? '<span class="chip gray">Informe</span>' : s.worst === 'normal' ? '<span class="chip ok">Todo normal</span>' : chipFor(s.worst, s.watch + (s.watch === 1 ? ' valor para vigilar' : ' valores para vigilar'))) + '</div><div class="small muted">' + esc(x.r.lab) + ' · ' + esc(x.r.date) + ' · ' + esc(x.r.id) + '</div>' + (pr.discreet ? '' : '<div class="small">' + esc(rep ? 'Es un informe de tu especialista. Llévalo a tu médico.' : s.lead) + '</div>') + '</button>';
    }).join('') : '<div class="card"><h2>Todavía no tienes resultados</h2><p>Cuando un laboratorio envíe uno, te llega un aviso y aparece aquí. Para que el laboratorio cree tu orden, muéstrale tu código QR.</p><div class="row"><button class="btn" type="button" data-a="nav" data-v="qr">Ver mi código QR</button></div></div>') + '<div class="card note small"><p><b>Estas recomendaciones son generales.</b> Las genera una regla simple del sistema y no reemplazan a un médico. Solo un médico puede decidir qué hacer con tu resultado.</p></div>';
  };
  function patDetalle() {
    const r = D.PATIENT_RESULTS[S.resIdx]; const s = L.summarize(r.values); const rep = !r.values.length;
    const bg = rep ? 'var(--ok-bg);color:var(--ok-ink)' : s.worst === 'normal' ? 'var(--ok-bg);color:var(--ok-ink)' : s.worst === 'urgente' ? 'var(--crit-bg);color:var(--crit-ink)' : 'var(--warn-bg);color:var(--warn-ink)';
    let h = '<div><button class="btn ghost sm" type="button" data-a="p-back">Volver</button></div><div><h1>' + esc(r.title) + '</h1><p class="small muted">' + esc(r.lab) + ' · ' + esc(r.date) + ' · ' + esc(r.id) + '</p></div>' +
      '<div class="card" style="background:' + bg + '"><h2>' + esc(rep ? (r.reports ? 'Este documento es un informe de tu especialista. Llévalo a tu médico.' : 'Estos son los resultados de tus pruebas. Llévalos a tu médico: solo él puede decir qué significan.') : s.lead) + '</h2>' + (rep ? '' : '<p class="small">' + s.normal + ' de ' + s.rows.length + ' valores están en el margen normal.</p>') + '</div>';
    if (!rep) h += '<div class="card"><h2>Tus valores</h2>' + s.rows.map(function (x) { return '<div style="display:flex;flex-direction:column;gap:2px;padding:6px 0;border-top:1px solid var(--line)"><div class="row between"><b>' + esc(x.name) + '</b>' + chipFor(x.level, x.label) + '</div><div><b style="font-size:20px">' + esc(x.v) + '</b> <span class="small muted">' + esc(x.unit) + (x.c.kind === 'none' ? '' : ' · normal: ' + U.normalText(x.c)) + '</span></div>' + (x.c.kind === 'none' || x.c.kind === 'report' ? '' : U.rangeBar(x.c, x.v, x.level)) + '</div>'; }).join('') + '</div>';
    if (r.pos) h += '<div class="card"><h2>Pruebas de infecciones</h2>' + (r.sens ? '<p class="small muted">Resultado sensible: solo lo ves tú. Un positivo no es un diagnóstico: tu médico debe explicártelo.</p>' : '') + Object.keys(r.pos).map(function (k) { const x = r.pos[k]; const c = D.BY_ID[k] || {}; return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><span><b>' + esc(c.name || k) + '</b>' + (x.detail ? '<div class="small muted">' + esc(x.detail) + '</div>' : '') + '</span><span class="chip ' + (x.res === 'Negativo' ? 'ok' : x.res === 'Positivo' ? 'warn' : 'gray') + '">' + esc(x.res) + '</span></div>'; }).join('') + (Object.keys(r.pos).some(function (k) { return r.pos[k].res === 'Positivo'; }) ? '<div class="card note small"><p>Un resultado positivo no es un diagnóstico. Llévale este documento a tu médico: solo él decide qué hacer.</p></div>' : '') + '</div>';
    if (r.cult) Object.keys(r.cult).forEach(function (k) { const x = r.cult[k]; h += '<div class="card"><h2>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + '</h2>' + (x.none ? '<p>Sin desarrollo de bacterias.</p>' : '<p><b>Bacteria encontrada:</b> ' + esc(x.org) + '</p><div class="tw"><table><thead><tr><th>Antibiótico</th><th>¿Sirve?</th></tr></thead><tbody>' + x.rows.map(function (a) { return '<tr><td>' + esc(a.ab) + '</td><td><span class="chip ' + (a.r === 'S' ? 'ok' : a.r === 'R' ? 'crit' : 'warn') + '">' + ({ S: 'Sirve', I: 'A veces', R: 'No sirve' })[a.r] + '</span></td></tr>'; }).join('') + '</tbody></table></div><p class="small muted">Tu médico escoge el antibiótico. No te automediques.</p>') + '</div>'; });
    if (r.texts) h += '<div class="card"><h2>Otros resultados</h2>' + Object.keys(r.texts).map(function (k) { return '<p><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + ':</b> ' + esc(r.texts[k]) + '</p>'; }).join('') + '</div>';
    if (r.reports) Object.keys(r.reports).forEach(function (k) { const x = r.reports[k]; h += '<div class="card"><h2>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + '</h2><p><b>Hallazgos:</b> ' + esc(x.hallazgos) + '</p><p><b>Conclusión:</b> ' + esc(x.conclusion) + '</p>' + (x.img ? '<img src="' + x.img + '" alt="Imagen del estudio" style="max-width:100%;border-radius:14px">' : '') + '<p class="small muted">Interpretó: ' + esc(x.by || 'Especialista') + '</p></div>'; });
    if (r.history) { const c = D.BY_ID[r.history.id]; h += '<div class="card"><h2>' + esc(c.name) + ' en el tiempo</h2><p class="small muted">La franja azul es la zona normal.</p>' + U.lineBand(r.history.points, c.lo, c.hi, c.unit) + '<p class="small">Sube poco a poco en cada examen. Conviene comentarlo con tu médico.</p></div>'; }
    h += '<div class="card"><h2>Qué puedes hacer</h2>' + (rep ? '<p>Un informe de imágenes o de un estudio del corazón o del cerebro lo debe interpretar tu médico. Pide cita y llévale este documento.</p>' : s.tips.length ? '<ul class="clean">' + s.tips.map(function (t) { return '<li><b>' + esc(t.name) + ':</b> ' + esc(t.tip) + '</li>'; }).join('') + '</ul>' : '<p>Todo está bien. Sigue con tus buenos hábitos: comer variado, moverte y dormir bien.</p>') + '<div class="card" style="background:rgba(76,95,213,0.1);box-shadow:none"><p><b>Importante:</b> esto es información general, no un diagnóstico. Un médico de verdad debe revisar tu resultado y decidir qué hacer contigo.</p></div></div>' +
      '<div class="row"><button class="btn" type="button" data-a="p-pdf" data-i="' + S.resIdx + '">Ver documento firmado</button><button class="btn ghost" type="button" data-a="p-share" data-i="' + S.resIdx + '">Compartir con mi médico</button></div>';
    return h;
  }
  EXT.views.pat.qr = function () {
    const pid = curPid(); const n = S.qrN + parseInt(String(myPid()).replace(/\D/g, '') || 1, 10); const code = qrCodeOf(myPid());
    const acc = S.access.filter(function (a) { return a.pid === myPid(); });
    return viewAsBanner() + '<div class="head"><div><h1>Mi código QR</h1><p>Muéstralo en el laboratorio. Es solo tuyo.</p></div></div>' +
      '<div class="grid two"><div class="card" style="align-items:center;text-align:center">' + L.qrSvg(code, 200) + '<b>' + code + '</b><div class="chip warn" id="qrcount" role="timer">Vence en 5:00</div><p class="small muted">Se cambia solo cada 5 minutos y sirve una sola vez. Una captura de pantalla vieja no funciona.</p><button class="btn ghost sm" type="button" data-a="p-qrnew">Generar otro ahora</button></div>' +
      '<div class="card"><h2>Quién puede ver lo tuyo</h2>' + (acc.length ? acc.map(function (a) { return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><div><b>' + esc(a.doc) + '</b><div class="small muted">Hasta el ' + esc(a.until) + ' · ' + esc(a.scope) + '</div><div class="small ' + (a.on ? 'up' : 'muted') + '" role="status">' + (a.on ? 'Puede ver tus resultados.' : 'Acceso quitado.') + '</div></div><button class="btn ' + (a.on ? 'warn' : 'ghost') + ' sm" type="button" data-a="p-acc" data-v="' + a.id + '">' + (a.on ? 'Quitar acceso' : 'Dar acceso') + '</button></div>'; }).join('') : '<p class="muted">Ningún médico tiene acceso. Cuando uno te lo pida, te llega un aviso para aceptar o rechazar.</p>') + '</div></div>';
  };
  function qrCodeOf(pid) { const n = S.qrN + (parseInt(String(pid).replace(/\D/g, ''), 10) || 1); return 'LABS-' + ('0000' + (4821 + n * 37)).slice(-4) + '-' + ['KQ7P', 'M2XD', 'R9TC', 'H4VN', 'B8WZ'][n % 5]; }
  EXT.qrCodeOf = qrCodeOf;
  EXT.views.pat.vistas = function () {
    const pid = myPid(); const rows = S.seen.filter(function (x) { return x.pid === pid; });
    return viewAsBanner() + '<div class="head"><div><h1>Quién me vio</h1><p>Cada vez que alguien abre algo tuyo queda aquí. Nadie puede borrarlo.</p></div></div><div class="card">' + (rows.length ? '<div class="tw"><table><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué hizo</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><td>' + esc(x.when) + '</td><td>' + esc(x.who) + '</td><td>' + esc(x.what) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Todavía nadie ha abierto tus documentos.</p>') + '</div>';
  };
  EXT.views.pat.avisos = avisosView;
  EXT.views.pat.soporte = supportView;
  EXT.views.pat.perfil = function () {
    const tab = S.prof || 'datos'; const pid = myPid(); const p = personOf(pid); const pr = prefsOf(pid);
    const tabs = [['datos', 'Mis datos'], ['seguridad', 'Seguridad'], ['avisos', 'Avisos'], ['privacidad', 'Privacidad'], ['deps', 'Dependientes']];
    let b = '';
    if (tab === 'datos') b = '<div class="card"><h2>Mis datos</h2>' + fld('Nombre', 'pf-name', { def: p.name, ro: true }) + fld('Cédula', 'pf-ci', { def: maskCi(p.ci), ro: true }) + fld('Teléfono', 'pf-phone', { def: p.phone, type: 'tel', mode: 'tel' }) + fld('Correo', 'pf-mail', { def: p.email, type: 'email' }) + '<p class="small muted">El nombre y la cédula no se cambian aquí. Si hay un error, escribe a soporte.</p>' + errBox('pf') + '<div class="row"><button class="btn" type="button" data-a="p-save">Guardar</button></div></div>';
    else if (tab === 'seguridad') b = '<div class="card"><h2>Cambiar mi clave</h2>' + fld('Clave actual', 'pw-old', { type: 'password' }) + fld('Clave nueva', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave nueva', 'pw-new2', { type: 'password' }) + errBox('pw') + '<div class="row"><button class="btn" type="button" data-a="pw-save">Cambiar clave</button></div></div>' +
      '<div class="card"><h2>PIN para abrir resultados</h2><p class="small muted">Con un PIN de 4 números, nadie que tenga tu teléfono desbloqueado puede abrir tus resultados.</p><div class="row"><span class="chip ' + (pr.pin ? 'ok' : 'gray') + '">' + (pr.pin ? 'PIN activo' : 'Sin PIN') + '</span></div>' + (pr.pin ? '<div class="row"><button class="btn ghost" type="button" data-a="p-pin-off">Quitar PIN</button></div>' : fld('Nuevo PIN (4 números)', 'pin-new', { max: 4, mode: 'numeric' }) + errBox('pin') + '<div class="row"><button class="btn" type="button" data-a="p-pin-set">Activar PIN</button></div>') + '</div>' +
      '<div class="card"><h2>Sesiones abiertas</h2>' + pr.sessions.map(function (s) { return '<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><div><b>' + esc(s.dev) + '</b><div class="small muted">' + esc(s.when) + '</div></div>' + (s.id === 's1' ? '<span class="chip ok">Esta sesión</span>' : '<button class="btn ghost sm" type="button" data-a="p-sess" data-v="' + s.id + '">Cerrar sesión ahí</button>') + '</div>'; }).join('') + '</div>';
    else if (tab === 'avisos') b = '<div class="card"><h2>Cómo quiero recibir avisos</h2>' + fld('WhatsApp', 'pr-wa', { type: 'checkbox', def: pr.wa }) + fld('Correo', 'pr-mail', { type: 'checkbox', def: pr.mail }) + fld('Mensaje de texto (SMS)', 'pr-sms', { type: 'checkbox', def: pr.sms }) + '<p class="small muted">Los avisos nunca llevan el nombre del examen ni valores. Solo dicen: “Tienes un documento nuevo en LABS”.</p><div class="row"><button class="btn" type="button" data-a="p-prefs">Guardar</button></div></div>';
    else if (tab === 'privacidad') b = '<div class="card"><h2>Modo discreto</h2><p class="small muted">Oculta el estado de tus resultados en la lista hasta que toques uno.</p>' + fld('Activar modo discreto', 'pr-disc', { type: 'checkbox', def: pr.discreet, r: true }) + '</div><div class="card"><h2>Mis datos</h2><p class="small muted">Descarga una copia de lo que LABS guarda de ti.</p><div class="row"><button class="btn ghost" type="button" data-a="p-export">Descargar mis datos</button></div></div><div class="card"><h2>Borrar mi cuenta</h2><p class="small muted">Se eliminan tu perfil, tus accesos y tus resultados. Esto no se puede deshacer.</p><div class="row"><button class="btn warn" type="button" data-a="p-delete">Borrar mi cuenta</button></div></div>';
    else b = '<div class="card"><h2>Mis dependientes</h2>' + (S.deps.filter(function (d) { return d.parent === pid; }).map(function (d) { return '<div class="row between" style="padding:8px 0;border-top:1px solid var(--line)"><div><b>' + esc(d.name) + '</b><div class="small muted">' + esc(d.rel) + ' · ' + d.age + ' años</div></div><div class="row"><button class="btn ghost sm" type="button" data-a="p-dep-view" data-v="' + d.id + '">Ver como ' + (d.sex === 'F' ? 'ella' : 'él') + '</button><button class="btn ghost sm" type="button" data-a="p-dep-del" data-v="' + d.id + '">Quitar</button></div></div>'; }).join('') || '<p class="muted">No tienes dependientes.</p>') + '</div><div class="card"><h2>Agregar dependiente</h2>' + fld('Nombre completo', 'dp-name') + fld('Fecha de nacimiento', 'dp-dob', { type: 'date' }) + fld('Relación', 'dp-rel', { type: 'select', options: ['Hijo/a', 'Padre/madre', 'Pareja', 'Otro familiar'] }) + fld('Sexo', 'dp-sex', { type: 'select', options: [{ v: 'F', l: 'Femenino' }, { v: 'M', l: 'Masculino' }] }) + errBox('dp') + '<div class="row"><button class="btn" type="button" data-a="p-dep-add">Agregar</button></div></div>';
    return viewAsBanner() + '<div class="head"><div><h1>Mi perfil</h1><p>' + esc(p.name) + ' · ' + esc(maskCi(p.ci)) + '</p></div></div><div class="seg" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-a="prof-tab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' + b;
  };

  /* ---------- Médico ---------- */
  EXT.nav.doc = [{ id: 'lista', label: 'Mis pacientes' }, { id: 'sol', label: 'Solicitudes recibidas', badge: function () { return S.requests.length || ''; } }, { id: 'pedir', label: 'Pedir acceso' }, { id: 'avisos', label: 'Avisos', badge: function () { return unread('doc') || ''; } }, { id: 'perfil', label: 'Mi perfil' }, { id: 'soporte', label: 'Soporte' }];
  function alertsOf(pid) { const rs = D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid; }); if (!rs.length) return 0; const last = rs[rs.length - 1]; return L.summarize(last.values).watch; }
  EXT.views.doc.lista = function () {
    const P = S.docPatients;
    if (S.docOpen === null || S.docOpen === undefined || !P[S.docOpen]) {
      return '<div class="head"><div><h1>Mis pacientes</h1><p>Toca un paciente para ver su tarjeta.</p></div><button class="btn ghost sm" type="button" data-a="mode2" data-v="pat">Cambiar a modo paciente</button></div>' +
        '<div class="card"><h2>Pacientes</h2>' + P.map(function (x, i) { const al = alertsOf(x.pid); return '<button type="button" data-a="docsel" data-i="' + i + '" style="text-align:left;border:0;border-radius:16px;padding:12px;cursor:pointer;background:rgba(255,255,255,0.7);font:inherit;color:inherit;min-height:44px"><div class="row between"><b>' + esc(x.name) + '</b>' + (al ? '<span class="chip warn">' + al + (al === 1 ? ' aviso' : ' avisos') + '</span>' : '<span class="chip ok">Sin avisos</span>') + '</div><div class="small muted">' + esc(x.exam) + ' · ' + esc(x.date) + '</div></button>'; }).join('') + '</div>';
    }
    const p = P[S.docOpen]; S.docSel = S.docOpen;
    const rs = D.PATIENT_RESULTS.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.pid === p.pid; });
    const withHist = rs.filter(function (x) { return x.r.history; })[0]; const g = withHist ? D.BY_ID[withHist.r.history.id] : null;
    return '<div class="deskback"><button class="btn ghost sm" type="button" data-a="docback">‹ Volver a mis pacientes</button></div>' +
      '<div class="grid two"><div class="card"><h2>' + esc(p.name) + '</h2><div class="small muted">Cédula ' + esc(p.ci) + '</div><div class="row"><span class="chip gray">' + esc(p.scope) + '</span><span class="chip gray">Acceso hasta ' + esc(p.until) + '</span></div>' +
      (g ? '<h3>' + esc(g.name) + ' en el tiempo</h3>' + U.lineBand(withHist.r.history.points, g.lo, g.hi, g.unit) : '') +
      '<h3>Resultados compartidos</h3>' + (rs.length ? rs.map(function (x) { const s = L.summarize(x.r.values); return '<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><div><b>' + esc(x.r.title) + '</b><div class="small muted">' + esc(x.r.date) + ' · ' + esc(x.r.id) + '</div></div><div class="row">' + (x.r.values.length ? (s.worst === 'normal' ? '<span class="chip ok">Normal</span>' : chipFor(s.worst, s.watch + ' para vigilar')) : '<span class="chip gray">Informe</span>') + '<button class="btn ghost sm" type="button" data-a="d-pdf" data-i="' + x.i + '">Abrir</button></div></div>'; }).join('') : '<p class="muted">Este paciente todavía no tiene resultados.</p>') + '</div>' +
      '<div class="card"><h2>Mis notas (solo las ves tú)</h2>' + fld('Notas sobre el paciente', 'note-' + p.pid, { type: 'textarea', ph: 'Escribe una nota…' }) + '<div class="row"><button class="btn sm" type="button" data-a="d-note" data-v="' + p.pid + '">Guardar nota</button></div><p class="small muted">El paciente no ve tus notas. Cada vez que abres un resultado queda anotado en su registro.</p></div></div>';
  };
  EXT.views.doc.sol = function () {
    return '<div class="head"><div><h1>Solicitudes recibidas</h1><p>Pacientes que quieren compartir sus resultados contigo.</p></div></div><div class="card">' + (S.requests.length ? S.requests.map(function (q) { return '<div class="row between" style="padding:10px 0;border-top:1px solid var(--line)"><div><b>' + esc(q.name) + '</b><div class="small muted">' + esc(q.note) + '</div></div><div class="row"><button class="btn sm" type="button" data-a="reqok2" data-v="' + q.id + '">Aceptar</button><button class="btn ghost sm" type="button" data-a="reqno2" data-v="' + q.id + '">Rechazar</button></div></div>'; }).join('') : '<p class="muted">No tienes solicitudes nuevas.</p>') + '</div>';
  };
  EXT.views.doc.pedir = function () {
    return '<div class="head"><div><h1>Pedir acceso a un paciente</h1><p>El paciente recibe la solicitud y decide si te la da.</p></div></div><div class="card"><h2>Nueva solicitud</h2>' + fld('Cédula del paciente', 'rq-ci', { ph: 'V-12.345.645', max: 14 }) + fld('Qué quieres ver', 'rq-scope', { type: 'select', options: ['Todos los resultados', 'Solo laboratorio', 'Solo estudios por imagen'] }) + fld('Por cuánto tiempo', 'rq-months', { type: 'select', options: [{ v: '3', l: '3 meses' }, { v: '6', l: '6 meses' }, { v: '12', l: '12 meses' }] }) + errBox('rq') + '<div class="row"><button class="btn" type="button" data-a="d-req">Enviar solicitud</button></div><p class="small muted">Para probar: escribe V-12.345.645 (Ana) o V-18.221.318 (Luis).</p></div>' +
      '<div class="card"><h2>Solicitudes enviadas</h2>' + (S.docReqOut.length ? '<div class="tw"><table><thead><tr><th>Paciente</th><th>Alcance</th><th>Tiempo</th><th>Estado</th></tr></thead><tbody>' + S.docReqOut.map(function (q) { return '<tr><td>' + esc(q.name) + '</td><td>' + esc(q.scope) + '</td><td>' + q.months + ' meses</td><td><span class="chip ' + (q.state === 'Aceptada' ? 'ok' : q.state === 'Rechazada' ? 'crit' : 'warn') + '">' + q.state + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Todavía no has enviado solicitudes.</p>') + '</div>';
  };
  EXT.views.doc.avisos = avisosView; EXT.views.doc.soporte = supportView;
  EXT.views.doc.perfil = function () {
    const tab = S.prof || 'datos'; const tabs = [['datos', 'Mis datos'], ['seguridad', 'Seguridad'], ['avisos', 'Avisos']]; const d = S.docProfile = S.docProfile || { name: 'Dra. Marisol Pérez', mpps: '12345', esp: 'Medicina interna', phone: '0414-5550730', verified: true };
    let b;
    if (tab === 'datos') b = '<div class="card"><h2>Mis datos</h2>' + fld('Nombre', 'dp-name2', { def: d.name }) + fld('N.º de MPPS', 'dp-mpps', { def: d.mpps, ro: true }) + fld('Especialidad', 'dp-esp', { def: d.esp }) + fld('Teléfono', 'dp-phone', { def: d.phone, type: 'tel', mode: 'tel' }) + '<div class="row"><span class="chip ok">MPPS verificado</span></div>' + errBox('dpf') + '<div class="row"><button class="btn" type="button" data-a="d-save">Guardar</button></div></div>';
    else if (tab === 'seguridad') b = '<div class="card"><h2>Cambiar mi clave</h2>' + fld('Clave actual', 'pw-old', { type: 'password' }) + fld('Clave nueva', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave nueva', 'pw-new2', { type: 'password' }) + errBox('pw') + '<div class="row"><button class="btn" type="button" data-a="pw-save">Cambiar clave</button></div></div>';
    else b = '<div class="card"><h2>Cómo quiero recibir avisos</h2>' + fld('Correo', 'dpr-mail', { type: 'checkbox', def: true }) + fld('WhatsApp', 'dpr-wa', { type: 'checkbox', def: false }) + '<div class="row"><button class="btn" type="button" data-a="d-prefs">Guardar</button></div></div>';
    return '<div class="head"><div><h1>Mi perfil</h1><p>' + esc(d.name) + ' · MPPS ' + esc(d.mpps) + '</p></div></div><div class="seg" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-a="prof-tab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' + b;
  };

  /* ---------- Inicio de sesión ---------- */
  S.login = { step: 'form', fails: 0, lockUntil: 0, cfails: 0, acct: null, note: '' };
  function loginView() {
    const g = S.login; let b = '';
    const DEMO = [['lab', 'Laboratorio', 'Dueña y bioanalista. Lo ve todo y firma.'], ['recep', 'Recepción', 'Atiende al paciente: lo registra, crea la orden y cobra.'], ['pat', 'Paciente', 'Ve sus resultados y su código QR.'], ['doc', 'Médico', 'Ve los resultados que el paciente le permite.'], ['adm', 'Superadmin', 'Dueño de LABS: suscripciones y cobros.']];
    const demos = '<div class="card note"><b>Entrar sin clave (demostración)</b><p class="small muted">Elige quién quieres ser:</p><div class="demogrid">' + DEMO.map(function (x) { return '<button class="demobtn" type="button" data-a="demo" data-v="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></button>'; }).join('') + '</div><details class="acc"><summary>Ver correos y clave</summary><span class="small muted">lab@demo.com · recep@demo.com · pat@demo.com · doc@demo.com · adm@demo.com. Clave: demo1234. Código de seguridad: 123456.</span></details></div>';
    if (g.step === 'form') b = '<div class="card"><h1>Entrar a LABS</h1><p class="muted">Tus resultados de laboratorio, en un solo lugar.</p>' + (g.note ? '<div class="okmsg" role="status">' + esc(g.note) + '</div>' : '') + fld('Correo', 'lg-email', { type: 'email', ph: 'tu@correo.com', enter: 'lg-go' }) + fld('Clave', 'lg-pass', { type: 'password', enter: 'lg-go' }) + errBox('lg') + '<button class="btn" type="button" data-a="lg-go">Entrar</button><div class="row between"><button class="btn ghost sm" type="button" data-a="lg-forgot">Olvidé mi clave</button><button class="btn ghost sm" type="button" data-a="lg-reg">Nuevo paciente</button></div></div>' + demos;
    else if (g.step === 'code') b = '<div class="card"><h1>Código de seguridad</h1><p class="muted">Te enviamos un código de 6 números al teléfono o correo registrado.</p><div class="okmsg">Para la demostración, el código es 123456.</div>' + fld('Código', 'lg-code', { max: 6, mode: 'numeric', enter: 'lg-code' }) + errBox('lg') + '<button class="btn" type="button" data-a="lg-code">Verificar</button><div class="row between"><button class="btn ghost sm" type="button" data-a="lg-resend">Reenviar código</button><button class="btn ghost sm" type="button" data-a="lg-back">Volver</button></div></div>';
    else if (g.step === 'fp1') b = '<div class="card"><h1>Recuperar mi clave</h1><p class="muted">Escribe tu correo y te enviamos un enlace.</p>' + fld('Correo', 'fp-email', { type: 'email', enter: 'fp-send' }) + errBox('fp') + '<button class="btn" type="button" data-a="fp-send">Enviar enlace</button><button class="btn ghost sm" type="button" data-a="lg-back">Volver</button></div>';
    else if (g.step === 'fp2') b = '<div class="card"><h1>Revisa tu correo</h1><p>Si el correo está registrado, te enviamos un enlace para elegir una clave nueva. Vence en 30 minutos.</p><div class="okmsg">En la demostración puedes abrir el enlace aquí:</div><button class="btn" type="button" data-a="fp-open">Abrir el enlace de ejemplo</button><button class="btn ghost sm" type="button" data-a="lg-back">Volver</button></div>';
    else if (g.step === 'fp3') b = '<div class="card"><h1>Clave nueva</h1>' + fld('Clave nueva', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave', 'pw-new2', { type: 'password', enter: 'fp-save' }) + errBox('fp') + '<button class="btn" type="button" data-a="fp-save">Guardar clave nueva</button></div>';
    else if (g.step === 'reg1') b = '<div class="card"><h1>Crear mi cuenta</h1><p class="muted">Paso 1 de 3 · Tus datos</p>' + fld('Nombre completo', 'rg-name') + fld('Cédula', 'rg-ci', { ph: 'V-12.345.678', max: 14 }) + fld('Fecha de nacimiento', 'rg-dob', { type: 'date' }) + fld('Teléfono', 'rg-phone', { type: 'tel', mode: 'tel', ph: '04141234567', max: 11 }) + fld('Correo', 'rg-mail', { type: 'email' }) + fld('Sexo', 'rg-sex', { type: 'select', options: [{ v: 'F', l: 'Femenino' }, { v: 'M', l: 'Masculino' }] }) + errBox('rg') + '<button class="btn" type="button" data-a="rg-1">Continuar</button><button class="btn ghost sm" type="button" data-a="lg-back">Ya tengo cuenta</button></div>';
    else if (g.step === 'reg2') b = '<div class="card"><h1>Crear mi cuenta</h1><p class="muted">Paso 2 de 3 · Tu clave</p>' + fld('Clave', 'pw-new', { type: 'password' }) + '<div id="pwbox">' + meterHtml(F('pw-new')) + '</div>' + fld('Repite la clave', 'pw-new2', { type: 'password' }) + fld('Acepto los <b>términos de uso</b> y la <b>política de privacidad</b>', 'rg-terms', { type: 'checkbox' }) + errBox('rg') + '<button class="btn" type="button" data-a="rg-2">Continuar</button><button class="btn ghost sm" type="button" data-a="rg-back">Atrás</button></div>';
    else b = '<div class="card"><h1>Verifica tu teléfono</h1><p class="muted">Paso 3 de 3 · Te enviamos un código de 6 números.</p><div class="okmsg">Para la demostración, el código es 123456.</div>' + fld('Código', 'rg-code', { max: 6, mode: 'numeric', enter: 'rg-3' }) + errBox('rg') + '<button class="btn" type="button" data-a="rg-3">Crear mi cuenta</button><button class="btn ghost sm" type="button" data-a="rg-back">Atrás</button></div>';
    return '<div class="login"><div style="width:100%;max-width:440px;display:flex;flex-direction:column;gap:16px">' + b + '<p class="byline">BY INSANITY MEDIA LLC<sup>®</sup> · All rights reserved</p></div></div>';
  }
  function enter(acct, silent) {
    S.hub = false; S.from = null; S.sec = {}; S.docOpen = null;
    S.auth = { id: acct.id, role: acct.role, sub: acct.sub || null, name: acct.name, pid: acct.pid || null, email: acct.email };
    S.role = acct.role; S.viewAs = null; S.returnRole = null; S.resIdx = null; S.modal = null; S.prof = 'datos'; S.sup.open = null; S.sup.newt = false; S.sup.tab = 'ayuda'; clearAllForms();
    S[acct.role] = 'inicio';
    acct.last = when(); S.login = { step: 'form', fails: 0, lockUntil: 0, cfails: 0, acct: null, note: '' };
    if (acct.role === 'lab' || acct.role === 'adm') logAudit(acct.name, 'Inició sesión');
    render(); window.scrollTo(0, 0); if (!silent) toast('Bienvenido, ' + acct.name.split(' (')[0] + '.');
  }
  function clearAllForms() { S.f = {}; S.err = {}; }
  function logout() { S.auth = null; S.modal = null; S.login = { step: 'form', fails: 0, lockUntil: 0, cfails: 0, acct: null, note: 'Cerraste la sesión.' }; clearAllForms(); render(); window.scrollTo(0, 0); }

  /* ---------- Pantalla ---------- */
  function navFor(role) { return EXT.nav[role].filter(function (i) { return !i.only || (S.auth && i.only.indexOf(S.auth.sub || 'owner') >= 0); }); }
  function subtitle() { const a = S.auth; return { lab: a.sub === 'recep' ? 'Recepción' : 'Panel del laboratorio', pat: 'Paciente · ' + (personOf(myPid()) ? maskCi(personOf(myPid()).ci) : ''), doc: 'Médico · MPPS 12345', adm: 'Dueño de LABS' }[a.role]; }
  function shell() {
    const r = S.role; const page = S[r]; const all = navFor(r); const ok = all.some(function (i) { return i.id === page; }); const nav = all.filter(function (i) { return !i.hidden; }).map(function (i) { return i.badge ? Object.assign({}, i, { badge: i.badge() }) : i; }); const view = EXT.views[r][page];
    const who = r === 'lab' ? S.labs[0].name : r === 'pat' ? S.auth.name : S.auth.name;
    const banner = S.settings.maint ? '<div class="banner" role="status">' + esc(S.settings.maintMsg) + '</div>' : '';
    if (isMob()) return mobShell(r, page, nav, view, ok, banner, who);
    return '<div class="shell">' + U.side(nav, page, who, subtitle()) + '<main class="main">' + banner + (ok && view ? view() : '<div class="card"><h2>Esta pantalla no está disponible para tu rol.</h2><button class="btn" type="button" data-a="nav" data-v="' + nav.filter(function (i) { return !i.sep; })[0].id + '">Ir al inicio</button></div>') + '</main></div>';
  }

  /* ---------- Teléfono: menú de botones, una pantalla por opción, botón atrás ---------- */
  function isMob() { return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); }
  const NO_SPLIT = { 'lab/nueva': 1, 'lab/resultado': 1, 'lab/ordenes': 1, 'lab/pacientes': 1, 'doc/lista': 1, 'doc/firma': 1 };
  function secTitle(el, n) { const h = el.querySelector('h2,h3'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Sección ' + (n + 1); }
  function sectionize(html, key) {
    if (NO_SPLIT[key] || /\/(inicio|menu|qr)$/.test(key)) return html;
    const box = document.createElement('div'); box.innerHTML = html; const pre = [], secs = [];
    Array.prototype.forEach.call(box.children, function (el) {
      if (el.classList.contains('kpi') || el.querySelector('.kpi')) pre.push(el);
      else if (el.classList.contains('card')) secs.push(el);
      else if (el.querySelector(':scope > .card')) Array.prototype.forEach.call(el.children, function (c) { if (c.classList.contains('card')) secs.push(c); else pre.push(c); });
      else pre.push(el);
    });
    if (secs.length < 4) return html;
    S.sec = S.sec || {}; const cur = S.sec[key];
    if (cur !== undefined && cur !== null && secs[cur]) {
      const keep = pre.filter(function (e) { return e.querySelector('.seg') || e.classList.contains('banner'); });
      return keep.map(function (e) { return e.outerHTML; }).join('') + secs[cur].outerHTML;
    }
    return pre.map(function (e) { return e.outerHTML; }).join('') + '<div class="card"><h2>Toca lo que quieres ver</h2><div class="secs">' + secs.map(function (e, i) { return '<button type="button" class="secbtn" data-a="sec" data-v="' + i + '"><span>' + esc(secTitle(e, i)) + '</span><i aria-hidden="true">›</i></button>'; }).join('') + '</div></div>';
  }
  function mobShell(r, page, nav, view, ok, banner, who) {
    const hub = false;
    if (hub) {
      return '<div class="shell mob"><main class="main">' + banner + '<div class="card dark hubhead"><b>' + esc(who) + '</b><small>' + esc(subtitle()) + '</small></div><div class="hub">' + nav.map(function (i) {
        if (i.sep) return '<div class="hubsep">' + esc(i.sep) + '</div>';
        return '<button type="button" class="tile" data-a="nav" data-v="' + i.id + '"><span>' + i.label + '</span>' + (i.badge ? '<em class="badge">' + i.badge + '</em>' : '') + '</button>';
      }).join('') + '</div></main></div>';
    }
    const cur = nav.filter(function (i) { return i.id === page; })[0]; const label = cur ? cur.label : '';
    const inner = ok && view ? sectionize(view(), r + '/' + page) : '<div class="card"><h2>Esta pantalla no está disponible para tu rol.</h2></div>';
    const TOP = { inicio: 1, menu: 1, perfil: 1, ordenes: 1, nueva: r === 'lab' && S.auth.sub === 'recep', lista: r !== 'lab', qr: 1, pagos: 1, labs: 1 }; const sub = (S.sup && (S.sup.open || S.sup.newt)) || (r === 'doc' && S.docOpen !== null && S.docOpen !== undefined) || (r === 'lab' && page === 'pacientes' && !!S.pcOpen) || (r === 'pat' && S.resIdx !== null && S.resIdx !== undefined) || (S.sec && S.sec[r + '/' + page] !== undefined && S.sec[r + '/' + page] !== null);
    const back = !TOP[page] || sub;
    return '<div class="shell mob"><main class="main">' + (back ? '<div class="backbar"><button class="btn ghost sm" type="button" data-a="back">‹ Atrás</button><b>' + esc(label) + '</b></div>' : '') + banner + inner + '</main></div>';
  }

  /* ---------- Hoja tamaño carta (816 x 1056) que se ajusta al ancho de la pantalla ---------- */
  function fitPapers() {
    Array.prototype.forEach.call(document.querySelectorAll('.paper-fit'), function (w) {
      const sh = w.firstElementChild; if (!sh) return; const avail = w.clientWidth; if (!avail) return;
      const big = S.pz === 'big'; let sc = Math.min(1, avail / 816); if (big) sc = Math.min(1, Math.max(sc, 0.8));
      sh.style.transformOrigin = '0 0'; sh.style.transform = sc < 1 ? 'scale(' + sc + ')' : 'none';
      w.style.height = Math.ceil(sh.offsetHeight * sc) + 'px'; w.style.overflowX = big && sc * 816 > avail ? 'auto' : 'hidden';
      if (big && sc * 816 > avail) { w.style.height = Math.ceil(sh.offsetHeight * sc) + 'px'; }
    });
  }
  let wasMob = isMob(); window.addEventListener('resize', function () { const m = isMob(); if (m !== wasMob) { wasMob = m; if (S.auth) render(); } else fitPapers(); });
  EXT.fitPapers = fitPapers;
  function header() {
    const roles = document.getElementById('roles'), tr = document.getElementById('topright');
    if (!S.auth) { roles.innerHTML = ''; tr.innerHTML = '<span class="demo-tag">Demo con datos de ejemplo</span>'; if (window.UI_dock) window.UI_dock(); return; }
    roles.innerHTML = '<span class="small muted" style="padding:0 8px;align-self:center">Demo:</span>' + [['lab', 'Laboratorio'], ['pat', 'Paciente'], ['doc', 'Médico'], ['adm', 'Superadmin']].map(function (x) { return '<button type="button" data-a="demo" data-v="' + x[0] + '" aria-pressed="' + (S.role === x[0]) + '">' + x[1] + '</button>'; }).join('');
    const n = unread(S.role);
    tr.innerHTML = '<button class="iconbtn" type="button" data-a="gopage" data-v="avisos" aria-label="Avisos' + (n ? ', ' + n + ' sin leer' : '') + '">Avisos' + (n ? '<span class="badge">' + n + '</span>' : '') + '</button><button class="iconbtn" type="button" data-a="gopage" data-v="soporte">Ayuda</button><span class="small nm" style="font-weight:600">' + esc(S.auth.name.split(' (')[0]) + '</span><button class="btn ghost sm" type="button" data-a="logout">Salir</button>';
    if (window.UI_dock) window.UI_dock();
  }
  function render() {
    const y = window.scrollY; const app = document.getElementById('app'); const act = document.activeElement; const key = act && act.getAttribute ? act.getAttribute('data-c') : null; const sel = act && act.selectionStart !== undefined ? [act.selectionStart, act.selectionEnd] : null;
    app.innerHTML = (S.auth ? shell() : loginView()) + (U2.modalHtml() || '') + dlgHtml();
    header(); if (window.UI_post) window.UI_post();
    document.getElementById('toast-host').innerHTML = S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '';
    window.scrollTo(0, y); fitPapers();
    syncModal(); if (S.modal && S.modal.fresh) { S.modal.fresh = false; const b = document.querySelector('.modal [data-a="close"]'); if (b) b.focus(); }
    else if (key) { const el = document.querySelector('[data-c="' + key + '"]'); if (el && el.tagName !== 'SELECT') { el.focus(); if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } } }
  }
  EXT.render = render; window.render = render;
  EXT.fn = { F: F, fld: fld, errBox: errBox, setErr: setErr, dlg: dlg, dlgInfo: dlgInfo, closeDlg: closeDlg, notify: notify, uid: uid, longDate: longDate, when: when, maskCi: maskCi, personOf: personOf, curPid: curPid, myPid: myPid, prefsOf: prefsOf, avisosView: avisosView, supportView: supportView, unread: unread, mkResult: mkResult, meterHtml: meterHtml, pwScore: pwScore, pwOk: pwOk, clearF: clearF, enter: enter, logout: logout, ticketChip: ticketChip, threadView: threadView, esc: esc, ageOf: ageOf, qrCodeOf: qrCodeOf, FAQ: FAQ, answerFor: answerFor, alertsOf: alertsOf };

  /* ---------- Acciones ---------- */
  function addSeen(pid, who, what) { S.seen.unshift({ when: when(), who: who, what: what, pid: pid }); }
  function download(name, mime, content) { try { const b = new Blob([content], { type: mime }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Descarga lista: ' + name); } catch (e) { toast('Aquí el navegador no permite descargar. En la versión real se descarga el archivo.'); } }
  EXT.download = download;
  const A = EXT.actions;
  A['nav'] = function (v) { S.from = S[S.role] === 'menu' ? 'menu' : null; S.hub = false; S.sec = {}; S.docOpen = null; S[S.role] = v; S.resIdx = null; S.sup.open = null; S.sup.newt = false; S.err = {}; S.ordSel = null; render(); window.scrollTo(0, 0); };
  A['gopage'] = A['nav'];
  A['hub'] = function () { S.hub = true; S.sec = {}; S.docOpen = null; S.err = {}; render(); window.scrollTo(0, 0); };
  A['sec'] = function (v) { S.sec = S.sec || {}; S.sec[S.role + '/' + S[S.role]] = parseInt(v, 10); render(); window.scrollTo(0, 0); };
  A['back'] = function () {
    const k = S.role + '/' + S[S.role];
    if (S.sec && S.sec[k] !== undefined && S.sec[k] !== null) { S.sec[k] = null; render(); window.scrollTo(0, 0); return; }
    if (S.sup && (S.sup.open || S.sup.newt)) { S.sup.open = null; S.sup.newt = false; render(); window.scrollTo(0, 0); return; }
    if (S.role === 'pat' && S.pat === 'lista' && S.resIdx !== null && S.resIdx !== undefined) { S.resIdx = null; render(); window.scrollTo(0, 0); return; }
    if (S.role === 'lab' && S.lab === 'pacientes' && S.pcOpen) { S.pcOpen = null; render(); window.scrollTo(0, 0); return; }
    if (S.role === 'doc' && S.doc === 'lista' && S.docOpen !== null && S.docOpen !== undefined) { S.docOpen = null; render(); window.scrollTo(0, 0); return; }
    S.hub = false; S[S.role] = S.from === 'menu' ? 'menu' : 'inicio'; S.from = null; S.resIdx = null; render(); window.scrollTo(0, 0);
  };
  A['pz'] = function () { S.pz = S.pz === 'big' ? 'fit' : 'big'; render(); };
  A['demo'] = function (v) { const map = { lab: 'a1', recep: 'a2', pat: 'a3', doc: 'a4', adm: 'a5' }; const a = S.accounts.filter(function (x) { return x.id === map[v]; })[0]; enter(a); };
  A['logout'] = logout;
  A['lg-go'] = function () {
    const g = S.login; const now = Date.now(); if (now < g.lockUntil) return setErr('lg', 'Demasiados intentos. Espera ' + Math.ceil((g.lockUntil - now) / 1000) + ' segundos.');
    const email = F('lg-email').trim().toLowerCase(), pass = F('lg-pass'); if (!email || !pass) return setErr('lg', 'Escribe tu correo y tu clave.');
    const a = S.accounts.filter(function (x) { return x.email === email; })[0];
    if (!a || a.pass !== pass) { g.fails++; if (g.fails >= 5) { g.lockUntil = now + 30000; g.fails = 0; return setErr('lg', 'Demasiados intentos. Espera 30 segundos.'); } return setErr('lg', 'Correo o clave incorrectos. Te quedan ' + (5 - g.fails) + ' intentos.'); }
    if (a.status === 'suspendido') return setErr('lg', 'Esta cuenta está suspendida. Escribe a soporte@labs.demo.');
    if (a.status === 'eliminada') return setErr('lg', 'Esta cuenta fue eliminada.');
    g.acct = a; g.step = 'code'; S.err = {}; delete S.f['lg-pass']; render();
  };
  A['lg-code'] = function () { const g = S.login; if (F('lg-code') === '123456') { clearF('lg-'); enter(g.acct); } else { g.cfails++; if (g.cfails >= 3) { g.step = 'form'; g.cfails = 0; return setErr('lg', 'Demasiados códigos incorrectos. Entra otra vez.'); } setErr('lg', 'Código incorrecto. Te quedan ' + (3 - g.cfails) + ' intentos.'); } };
  A['lg-resend'] = function () { toast('Código reenviado (demostración: 123456).'); };
  A['lg-back'] = function () { S.login.step = 'form'; S.err = {}; render(); };
  A['lg-forgot'] = function () { S.login.step = 'fp1'; S.err = {}; render(); };
  A['fp-send'] = function () { const e = F('fp-email').trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(e)) return setErr('fp', 'Escribe un correo válido.'); S.login.acct = S.accounts.filter(function (x) { return x.email === e; })[0] || null; S.login.step = 'fp2'; S.err = {}; render(); };
  A['fp-open'] = function () { if (!S.login.acct) { S.login.step = 'form'; S.login.note = 'Ese correo no tiene cuenta. Revisa que esté bien escrito.'; return render(); } S.login.step = 'fp3'; clearF('pw-'); render(); };
  A['fp-save'] = function () { const p = F('pw-new'), p2 = F('pw-new2'); if (!pwOk(p)) return setErr('fp', 'La clave debe tener 8 o más caracteres, con letras y números.'); if (p !== p2) return setErr('fp', 'Las dos claves no coinciden.'); S.login.acct.pass = p; S.login.step = 'form'; S.login.note = 'Listo, tu clave nueva está guardada. Ya puedes entrar.'; clearF('pw-'); clearF('fp-'); S.err = {}; render(); };
  A['lg-reg'] = function () { S.login.step = 'reg1'; S.err = {}; render(); };
  A['rg-back'] = function () { S.login.step = S.login.step === 'reg3' ? 'reg2' : S.login.step === 'reg2' ? 'reg1' : 'form'; S.err = {}; render(); };
  A['rg-1'] = function () {
    const n = F('rg-name').trim(), ci = F('rg-ci').trim(), dob = F('rg-dob'), ph = F('rg-phone').trim(), em = F('rg-mail').trim().toLowerCase();
    if (n.split(/\s+/).length < 2 || n.length < 5) return setErr('rg', 'Escribe tu nombre y apellido.');
    if (!/^[VvEe]-?\d{1,2}\.?\d{3}\.?\d{3}$/.test(ci)) return setErr('rg', 'La cédula debe verse así: V-12.345.678.');
    if (!dob) return setErr('rg', 'Escribe tu fecha de nacimiento.'); if (ageOf(dob) < 18) return setErr('rg', 'Eres menor de 18 años. Un adulto debe crear tu cuenta y agregarte como dependiente.');
    if (!/^04\d{9}$/.test(ph)) return setErr('rg', 'El teléfono debe tener 11 números y empezar por 04.');
    if (!/^\S+@\S+\.\S+$/.test(em)) return setErr('rg', 'Escribe un correo válido.');
    if (S.accounts.some(function (a) { return a.email === em; })) return setErr('rg', 'Ya existe una cuenta con ese correo.');
    const cn = ci.replace(/\D/g, ''); if (S.patients.some(function (p) { return p.ci.replace(/\D/g, '') === cn; })) return setErr('rg', 'Ya existe una cuenta con esa cédula.');
    S.login.step = 'reg2'; S.err = {}; render();
  };
  A['rg-2'] = function () { const p = F('pw-new'), p2 = F('pw-new2'); if (!pwOk(p)) return setErr('rg', 'La clave debe tener 8 o más caracteres, con letras y números.'); if (p !== p2) return setErr('rg', 'Las dos claves no coinciden.'); if (!F('rg-terms')) return setErr('rg', 'Debes aceptar los términos y la privacidad para continuar.'); S.login.step = 'reg3'; S.err = {}; render(); };
  A['rg-3'] = function () {
    if (F('rg-code') !== '123456') return setErr('rg', 'Código incorrecto. En la demostración es 123456.');
    const id = 'p' + (S.patients.length + 1); const ci0 = F('rg-ci').trim().toUpperCase(); const d = ci0.replace(/\D/g, ''); const ci = ci0.charAt(0) + '-' + d.replace(/(\d)(?=(\d{3})+$)/g, '$1.');
    const p = { id: id, name: F('rg-name').trim(), ci: ci, phone: F('rg-phone').trim(), email: F('rg-mail').trim().toLowerCase(), age: ageOf(F('rg-dob')), sex: F('rg-sex', 'F'), dob: F('rg-dob'), created: 'nov 2026' };
    S.patients.push(p); const a = { id: 'a' + (S.accounts.length + 1), email: p.email, pass: F('pw-new'), role: 'pat', pid: id, name: p.name, status: 'activo', last: when() };
    S.accounts.push(a); logAudit('Sistema', 'Nueva cuenta de paciente creada'); notify('pat', 'Bienvenido a LABS. Muestra tu código QR en el laboratorio para que creen tu orden.', null, id); clearF('rg-'); clearF('pw-'); enter(a);
  };
  A['markall'] = function () { S.notifs[S.role].forEach(function (n) { if (S.role !== 'pat' || !n.pid || n.pid === curPid()) n.read = true; }); render(); };
  A['markread'] = function (v) { const n = findNotif(v); if (n) n.read = true; render(); };
  A['n-go'] = function (v) { const n = findNotif(v); n.read = true; S[S.role] = n.action.ref; render(); window.scrollTo(0, 0); };
  A['n-openres'] = function (v) { const n = findNotif(v); n.read = true; S.pat = 'lista'; S.resIdx = n.action.ref; openSeen(n.action.ref); render(); window.scrollTo(0, 0); };
  function openSeen(i) { const r = D.PATIENT_RESULTS[i]; addSeen(r.pid, 'Tú', 'Abriste el resultado ' + r.id); }
  A['ordok'] = function (v) { const n = findNotif(v); const o = S.orders.filter(function (x) { return x.id === n.action.ref; })[0]; if (o) { o.status = 'Por procesar'; } n.done = 'Confirmada'; n.read = true; notify('lab', 'El paciente confirmó la orden ' + n.action.ref + '. Ya puedes cargar los resultados.', { type: 'go', ref: 'ordenes' }); toast('Orden confirmada. El laboratorio ya puede trabajar con ella.'); };
  A['ordno'] = function (v) { const n = findNotif(v); const o = S.orders.filter(function (x) { return x.id === n.action.ref; })[0]; if (o) { o.status = 'Anulada'; o.reason = 'El paciente dijo que no era suya'; } n.done = 'Rechazada'; n.read = true; notify('lab', 'El paciente rechazó la orden ' + n.action.ref + '. Quedó anulada.', { type: 'go', ref: 'ordenes' }); toast('Orden rechazada. El laboratorio fue avisado.'); };
  A['accok'] = function (v) { const n = findNotif(v); const q = S.docReqOut.filter(function (x) { return x.id === n.action.ref; })[0]; if (q) { q.state = 'Aceptada'; const p = personOf(q.pid); const until = new Date(); until.setMonth(until.getMonth() + parseInt(q.months, 10)); const ds = until.getDate() + ' ' + MESES[until.getMonth()].slice(0, 3) + ' ' + until.getFullYear(); S.access.push({ id: uid('ac'), pid: q.pid, doc: 'Dra. Marisol Pérez', until: ds, scope: q.scope, on: true }); const rs = D.PATIENT_RESULTS.filter(function (r) { return r.pid === q.pid; }); S.docPatients.push({ pid: q.pid, name: 'Paciente ' + p.name.split(' ').map(function (w) { return w[0] + '.'; }).join(' '), ci: maskCi(p.ci), exam: rs.length ? rs[rs.length - 1].title : 'Sin resultados', date: rs.length ? rs[rs.length - 1].date.split(' de ')[0] + ' ' + rs[rs.length - 1].date.split(' de ')[1].slice(0, 3) : '—', alerts: 0, until: ds, scope: q.scope, flag: '' }); notify('doc', p.name.split(' ')[0] + ' ' + p.name.split(' ')[1][0] + '. aceptó tu solicitud. Ya aparece en Mis pacientes.', { type: 'go', ref: 'lista' }); addSeen(q.pid, 'Dra. Marisol Pérez', 'Recibió acceso a tus resultados'); } n.done = 'Aceptada'; n.read = true; toast('Listo. Tu médico ya puede ver tus resultados hasta que venza el permiso.'); };
  A['accno'] = function (v) { const n = findNotif(v); const q = S.docReqOut.filter(function (x) { return x.id === n.action.ref; })[0]; if (q) { q.state = 'Rechazada'; notify('doc', 'Un paciente rechazó tu solicitud de acceso.', null); } n.done = 'Rechazada'; n.read = true; toast('Solicitud rechazada.'); };
  A['sup-tab'] = function (v) { S.sup.tab = v; S.sup.open = null; S.sup.newt = false; S.err = {}; render(); };
  A['sup-new'] = function () { S.sup.newt = true; render(); };
  A['sup-cancel'] = function () { S.sup.newt = false; S.err = {}; clearF('tk-'); render(); };
  A['sup-open'] = function (v) { S.sup.open = v; clearF('tk-'); render(); };
  A['sup-back'] = function () { S.sup.open = null; render(); };
  A['sup-send'] = function () {
    const s = F('tk-sub').trim(), m = F('tk-msg').trim(); if (s.length < 5) return setErr('tk', 'Escribe un asunto de al menos 5 letras.'); if (m.length < 10) return setErr('tk', 'Cuéntanos un poco más (al menos 10 letras).');
    const id = 'T-' + (S.tseq++); S.tickets.unshift({ id: id, acct: S.auth.id, role: S.role, who: S.auth.name, subject: s, cat: F('tk-cat', 'Consulta'), status: 'Abierto', created: 'Hoy', msgs: [{ from: 'user', who: S.auth.name, text: m, when: when() }, { from: 'soporte', who: 'Soporte LABS (automático)', text: 'Recibimos tu ticket. Una persona te responde en horario de atención (lunes a sábado, 8 a. m. a 6 p. m.).', when: when() }] });
    notify('adm', 'Ticket nuevo ' + id + ': ' + s, { type: 'go', ref: 'soporte' }); clearF('tk-'); S.err = {}; S.sup.newt = false; S.sup.open = id; toast('Ticket ' + id + ' creado.');
  };
  A['tk-reply'] = function (v, el) {
    const tk = S.tickets.filter(function (x) { return x.id === v; })[0]; const m = F('tk-reply').trim(); if (m.length < 2) return setErr('tkr', 'Escribe tu respuesta.'); const admin = el && el.getAttribute('data-admin') === '1';
    tk.msgs.push({ from: admin ? 'soporte' : 'user', who: admin ? 'Soporte LABS' : S.auth.name, text: m, when: when() }); if (admin && tk.status === 'Abierto') tk.status = 'En revisión'; if (!admin && tk.status === 'Resuelto') tk.status = 'En revisión'; clearF('tk-reply'); S.err = {};
    if (admin) { const roleN = tk.role; notify(roleN, 'Soporte respondió tu ticket ' + tk.id + '.', { type: 'go', ref: 'soporte' }, roleN === 'pat' ? (S.accounts.filter(function (a) { return a.id === tk.acct; })[0] || {}).pid : null); }
    toast('Respuesta enviada.');
  };
  A['tk-close'] = function (v) { const tk = S.tickets.filter(function (x) { return x.id === v; })[0]; tk.status = 'Cerrado'; toast('Ticket cerrado.'); };
  A['tk-reopen'] = function (v) { const tk = S.tickets.filter(function (x) { return x.id === v; })[0]; tk.status = 'Abierto'; toast('Ticket reabierto.'); };
  A['svc-refresh'] = function () { S.statusAt = when(); toast('Todos los servicios operativos.'); };
  A['legal-dl'] = function () { download('terminos-labs.txt', 'text/plain', 'LABS · Términos de uso v1.2 (demostración)\n\nLABS conecta a laboratorios, pacientes y médicos. No emite diagnósticos.'); };
  function botReply(text) { const f = answerFor(text); S.chat.push({ from: 'me', text: text }); render(); setTimeout(function () { S.chat.push({ from: 'bot', text: f ? f.a : 'No encontré eso en la ayuda. Puedo pasar tu pregunta a una persona: pulsa “Hablar con una persona”.' }); render(); const b = document.getElementById('chatbox'); if (b) b.scrollTop = b.scrollHeight; }, 450); }
  A['chat-send'] = function () { const t = F('chatin').trim(); if (!t) return toast('Escribe tu pregunta.'); delete S.f['chatin']; botReply(t); };
  A['chat-q'] = function (v) { botReply(v); };
  A['chat-ticket'] = function () { const mine = S.chat.filter(function (m) { return m.from === 'me'; }); const last = mine.length ? mine[mine.length - 1].text : 'Necesito ayuda'; const id = 'T-' + (S.tseq++); S.tickets.unshift({ id: id, acct: S.auth.id, role: S.role, who: S.auth.name, subject: 'Desde el chat: ' + last.slice(0, 50), cat: 'Consulta', status: 'Abierto', created: 'Hoy', msgs: [{ from: 'user', who: S.auth.name, text: S.chat.map(function (m) { return (m.from === 'me' ? 'Yo: ' : 'Asistente: ') + m.text; }).join('\n'), when: when() }] }); notify('adm', 'Ticket nuevo ' + id + ' (desde el chat)', { type: 'go', ref: 'soporte' }); S.sup.tab = 'tickets'; S.sup.open = id; toast('Pasamos la conversación a una persona. Ticket ' + id + '.'); };
  /* paciente */
  A['p-open'] = function (v) {
    const i = parseInt(v, 10); const pr = prefsOf(curPid()); const go = function () { S.resIdx = i; openSeen(i); render(); window.scrollTo(0, 0); };
    if (pr.pin && !pr.pinOk) { S.pendingOpen = i; dlg('Escribe tu PIN', fld('PIN de 4 números', 'pin-ask', { max: 4, mode: 'numeric', type: 'password', enter: 'p-pin-ok' }) + errBox('pina'), { label: 'Abrir', a: 'p-pin-ok' }); return; } go();
  };
  A['p-pin-ok'] = function () { const pr = prefsOf(curPid()); if (F('pin-ask') !== pr.pin) { S.err.pina = 'PIN incorrecto.'; return render(); } pr.pinOk = true; clearF('pin-ask'); S.err = {}; S.modal = null; S.resIdx = S.pendingOpen; openSeen(S.pendingOpen); render(); window.scrollTo(0, 0); };
  A['p-back'] = function () { S.resIdx = null; render(); window.scrollTo(0, 0); };
  A['p-pdf'] = function (v) { const i = parseInt(v, 10); S.modal = { type: 'pdf', i: i, fresh: true }; addSeen(D.PATIENT_RESULTS[i].pid, 'Tú', 'Abriste el documento firmado ' + D.PATIENT_RESULTS[i].id); render(); };
  A['p-share'] = function (v) { const i = parseInt(v, 10); S.modal = { type: 'share', i: i, fresh: true }; addSeen(D.PATIENT_RESULTS[i].pid, 'Tú', 'Creaste un enlace temporal para ' + D.PATIENT_RESULTS[i].id); render(); };
  A['d-pdf'] = function (v) { const i = parseInt(v, 10); S.modal = { type: 'pdf', i: i, fresh: true }; addSeen(D.PATIENT_RESULTS[i].pid, 'Dra. Marisol Pérez', 'Abrió el resultado ' + D.PATIENT_RESULTS[i].id); render(); };
  A['dlsheet'] = function (v) { const i = parseInt(v, 10); const r = D.PATIENT_RESULTS[i]; const html = '<!doctype html><meta charset="utf-8"><title>' + r.id + '</title><body style="font-family:sans-serif;max-width:720px;margin:20px auto">' + U.sheetHtml(r, true) + '</body>'; download('resultado-' + r.id + '.html', 'text/html', html); };
  A['p-qrnew'] = function () { S.qrN++; S.qrEnds = Date.now() + 300000; render(); };
  A['p-acc'] = function (v) { const a = S.access.filter(function (x) { return x.id === v; })[0]; a.on = !a.on; addSeen(a.pid, 'Tú', (a.on ? 'Diste acceso a ' : 'Quitaste el acceso a ') + a.doc); notify('doc', 'Un paciente ' + (a.on ? 'te devolvió' : 'te quitó') + ' el acceso.', null); render(); };
  A['prof-tab'] = function (v) { S.prof = v; S.err = {}; clearF('pw-'); clearF('pin-'); render(); };
  A['p-save'] = function () { const p = personOf(myPid()); const ph = F('pf-phone', p.phone).trim(), em = F('pf-mail', p.email).trim().toLowerCase(); if (!/^04\d{9}$/.test(ph.replace(/\D/g, ''))) return setErr('pf', 'El teléfono debe tener 11 números y empezar por 04.'); if (!/^\S+@\S+\.\S+$/.test(em)) return setErr('pf', 'Escribe un correo válido.'); if (S.accounts.some(function (a) { return a.email === em && a.pid !== p.id; })) return setErr('pf', 'Ese correo ya lo usa otra cuenta.'); p.phone = ph; p.email = em; const a = S.accounts.filter(function (x) { return x.pid === p.id; })[0]; if (a) a.email = em; S.err = {}; toast('Datos guardados.'); };
  A['pw-save'] = function () { const a = S.accounts.filter(function (x) { return x.id === S.auth.id; })[0]; if (F('pw-old') !== a.pass) return setErr('pw', 'La clave actual no es correcta.'); const p = F('pw-new'); if (!pwOk(p)) return setErr('pw', 'La clave nueva debe tener 8 o más caracteres, con letras y números.'); if (p !== F('pw-new2')) return setErr('pw', 'Las dos claves nuevas no coinciden.'); if (p === a.pass) return setErr('pw', 'La clave nueva debe ser distinta a la actual.'); a.pass = p; clearF('pw-'); S.err = {}; toast('Clave cambiada. En otros dispositivos se cerró la sesión.'); };
  A['p-pin-set'] = function () { const v = F('pin-new'); if (!/^\d{4}$/.test(v)) return setErr('pin', 'El PIN debe tener exactamente 4 números.'); const pr = prefsOf(myPid()); pr.pin = v; pr.pinOk = true; clearF('pin-'); S.err = {}; toast('PIN activado.'); };
  A['p-pin-off'] = function () { const pr = prefsOf(myPid()); pr.pin = ''; pr.pinOk = false; toast('PIN quitado.'); };
  A['p-sess'] = function (v) { const pr = prefsOf(myPid()); pr.sessions = pr.sessions.filter(function (s) { return s.id !== v; }); toast('Sesión cerrada en ese dispositivo.'); };
  A['p-prefs'] = function () { const pr = prefsOf(myPid()); pr.wa = !!F('pr-wa', pr.wa); pr.mail = !!F('pr-mail', pr.mail); pr.sms = !!F('pr-sms', pr.sms); if (!pr.wa && !pr.mail && !pr.sms) { pr.wa = true; return toast('Debe quedar al menos un canal. Dejamos WhatsApp activo.'); } toast('Preferencias guardadas.'); };
  A['p-export'] = function () { const p = personOf(myPid()); const data = { perfil: { nombre: p.name, cedula: p.ci, telefono: p.phone, correo: p.email }, resultados: D.PATIENT_RESULTS.filter(function (r) { return r.pid === p.id; }).map(function (r) { return { id: r.id, titulo: r.title, fecha: r.date, valores: r.values }; }), accesos: S.access.filter(function (a) { return a.pid === p.id; }), registro: S.seen.filter(function (x) { return x.pid === p.id; }) }; download('mis-datos-labs.json', 'application/json', JSON.stringify(data, null, 2)); };
  A['p-delete'] = function () { dlg('Borrar mi cuenta', '<p>Se eliminan tu perfil, tus accesos y tus resultados. <b>No se puede deshacer.</b></p>' + fld('Escribe BORRAR para confirmar', 'del-txt') + errBox('del'), { label: 'Borrar para siempre', a: 'p-delete-ok' }); };
  A['p-delete-ok'] = function () { if (F('del-txt').trim() !== 'BORRAR') { S.err.del = 'Escribe BORRAR en mayúsculas.'; return render(); } const pid = myPid(); const a = S.accounts.filter(function (x) { return x.id === S.auth.id; })[0]; a.status = 'eliminada'; for (let i = D.PATIENT_RESULTS.length - 1; i >= 0; i--) if (D.PATIENT_RESULTS[i].pid === pid) D.PATIENT_RESULTS.splice(i, 1); S.access = S.access.filter(function (x) { return x.pid !== pid; }); S.docPatients = S.docPatients.filter(function (x) { return x.pid !== pid; }); const p = personOf(pid); if (p) p.name = 'Cuenta eliminada'; logAudit('Sistema', 'Un paciente eliminó su cuenta'); clearAllForms(); logout(); S.login.note = 'Tu cuenta fue eliminada.'; render(); };
  A['p-dep-add'] = function () { const n = F('dp-name').trim(), dob = F('dp-dob'); if (n.length < 4) return setErr('dp', 'Escribe el nombre completo.'); if (!dob) return setErr('dp', 'Escribe la fecha de nacimiento.'); if (ageOf(dob) > 17 === false && false) return; const age = ageOf(dob); if (age < 0 || age > 120) return setErr('dp', 'La fecha de nacimiento no es válida.'); S.deps.push({ id: 'd' + (S.deps.length + 1), parent: myPid(), name: n, dob: dob, rel: F('dp-rel', 'Hijo/a'), age: age, sex: F('dp-sex', 'F') }); clearF('dp-'); S.err = {}; toast('Dependiente agregado.'); };
  A['p-dep-view'] = function (v) { S.viewAs = v; S.pat = 'lista'; S.resIdx = null; render(); window.scrollTo(0, 0); };
  A['p-dep-back'] = function () { S.viewAs = null; S.resIdx = null; render(); };
  A['p-dep-del'] = function (v) { S.deps = S.deps.filter(function (d) { return d.id !== v; }); toast('Dependiente quitado.'); };
  /* médico */
  A['mode2'] = function (v) { if (v === 'pat') { S.returnRole = 'doc'; S.auth.basePid = S.auth.pid; S.auth.pid = 'p7'; S.role = 'pat'; S.pat = 'inicio'; } else { S.role = 'doc'; S.auth.pid = S.auth.basePid || null; S.returnRole = null; S.viewAs = null; } S.resIdx = null; S.hub = false; S.doc = 'inicio'; S.docOpen = null; render(); window.scrollTo(0, 0); };
  A['docsel'] = function (v) { S.docSel = parseInt(v, 10); S.docOpen = S.docSel; render(); window.scrollTo(0, 0); };
  A['docback'] = function () { S.docOpen = null; render(); window.scrollTo(0, 0); };
  A['d-note'] = function (v) { S.notes = S.notes || {}; S.notes[v] = F('note-' + v); toast('Nota guardada.'); };
  A['reqok2'] = function (v) { const q = S.requests.filter(function (x) { return x.id === v; })[0]; const p = personOf(q.pid); const rs = D.PATIENT_RESULTS.filter(function (r) { return r.pid === q.pid; }); S.docPatients.push({ pid: q.pid, name: q.name, ci: maskCi(p.ci), exam: rs.length ? rs[rs.length - 1].title : 'Sin resultados', date: 'hoy', alerts: 0, until: '3 meses', scope: 'Todos los resultados', flag: '' }); S.access.push({ id: uid('ac'), pid: q.pid, doc: 'Dra. Marisol Pérez', until: 'en 3 meses', scope: 'Todos los resultados', on: true }); S.requests = S.requests.filter(function (x) { return x.id !== v; }); toast('Aceptada. ' + q.name + ' ya está en Mis pacientes.'); };
  A['reqno2'] = function (v) { S.requests = S.requests.filter(function (x) { return x.id !== v; }); toast('Rechazada.'); };
  A['d-req'] = function () {
    const ci = F('rq-ci').trim(); const cn = ci.replace(/\D/g, ''); if (cn.length < 6) return setErr('rq', 'Escribe la cédula completa, por ejemplo V-12.345.645.');
    const p = S.patients.filter(function (x) { return x.ci.replace(/\D/g, '') === cn && x.id !== 'p7'; })[0]; if (!p) return setErr('rq', 'No encontramos un paciente con esa cédula. Revisa los números.');
    if (S.docPatients.some(function (x) { return x.pid === p.id; })) return setErr('rq', 'Ese paciente ya está en tu lista.'); if (S.docReqOut.some(function (x) { return x.pid === p.id && x.state === 'Pendiente'; })) return setErr('rq', 'Ya enviaste una solicitud a ese paciente. Espera su respuesta.');
    const id = uid('rq'); S.docReqOut.unshift({ id: id, pid: p.id, name: p.name.split(' ')[0] + ' ' + p.name.split(' ')[1][0] + '.', scope: F('rq-scope', 'Todos los resultados'), months: F('rq-months', '3'), state: 'Pendiente' });
    notify('pat', 'La Dra. Marisol Pérez pide acceso a tus resultados (' + F('rq-scope', 'Todos los resultados').toLowerCase() + ', ' + F('rq-months', '3') + ' meses).', { type: 'accreq', ref: id }, p.id); clearF('rq-'); S.err = {}; toast('Solicitud enviada. El paciente decide si te da acceso.');
  };
  A['d-save'] = function () { const d = S.docProfile; const n = F('dp-name2', d.name).trim(); if (n.length < 5) return setErr('dpf', 'Escribe tu nombre completo.'); const ph = F('dp-phone', d.phone).replace(/\D/g, ''); if (!/^04\d{9}$/.test(ph)) return setErr('dpf', 'El teléfono debe tener 11 números y empezar por 04.'); d.name = n; d.esp = F('dp-esp', d.esp).trim() || d.esp; d.phone = ph; S.auth.name = n; S.err = {}; toast('Datos guardados.'); };
  A['d-prefs'] = function () { toast('Preferencias guardadas.'); };

  /* ---------- Escuchas ---------- */
  document.addEventListener('click', function (ev) {
    const t = ev.target.closest('[data-a]'); if (!t) return; const a = t.getAttribute('data-a'); const fn = EXT.actions[a]; if (!fn) return; if (t.disabled) return;
    if (a === 'closebg') return; const dv = t.getAttribute('data-v'); fn(dv !== null ? dv : t.getAttribute('data-i'), t);
  });
  document.addEventListener('click', function (ev) { const t = ev.target.closest('[data-a]'); if (!t) return; const a = t.getAttribute('data-a'); if (a === 'close' || (a === 'closebg' && ev.target === t)) { S.modal = null; clearF('del-'); clearF('pin-ask'); } });
  document.addEventListener('input', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c'); if (!c || c.indexOf('f-') !== 0) return; const n = c.slice(2); S.f[n] = t.type === 'checkbox' ? t.checked : t.value;
    if (n === 'pw-new') { const b = document.getElementById('pwbox'); if (b) b.innerHTML = meterHtml(t.value); }
    if (EXT.onInput[n]) EXT.onInput[n](t);
    if (EXT.onInputP) EXT.onInputP(n, t);
    if (n === 'faq-q') { const q = norm(t.value); const list = visibleFaq().filter(function (f) { return !q || norm(f.q + ' ' + f.a + ' ' + f.c).indexOf(q) >= 0; }); const b = document.getElementById('faqlist'); if (b) b.innerHTML = faqItems(list); }
  });
  document.addEventListener('change', function (ev) {
    const t = ev.target; const c = t.getAttribute && t.getAttribute('data-c'); if (!c || c.indexOf('f-') !== 0) return; const n = c.slice(2); S.f[n] = t.type === 'checkbox' ? t.checked : t.value;
    if (n === 'pr-disc') { prefsOf(myPid()).discreet = t.checked; }
    if (t.getAttribute('data-r')) render();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.getAttribute && ev.target.getAttribute('data-enter')) { ev.preventDefault(); const k = ev.target.getAttribute('data-enter'); if (k === 'faq-go') return; const b = document.querySelector('[data-a="' + k + '"]'); if (b) b.click(); } });
  S.orders = S.orders || [];
})();
