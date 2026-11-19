/* LABS demo · laboratorio: camino completo de atención + registro de pacientes con privacidad */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn;
  const esc = U.esc, toast = U.toast, logAudit = U.logAudit;
  const F = X.F, fld = X.fld, errBox = X.errBox, setErr = X.setErr, dlg = X.dlg, A = EXT.actions, V = EXT.views.lab;
  function render() { window.render(); }
  function findOrder(id) { return S.orders.filter(function (o) { return o.id === id; })[0]; }
  function isOwner() { return (S.auth && (S.auth.sub || 'owner')) === 'owner'; }
  function pname(pid) { const p = X.personOf(pid); return p ? p.name : '—'; }
  function examsShort(ids) { const n = ids.map(function (e) { return D.BY_ID[e].name; }); return n.slice(0, 2).join(', ') + (n.length > 2 ? ' y ' + (n.length - 2) + ' más' : ''); }
  function needsSample(o) { return o.exams.some(function (e) { return D.BY_ID[e].kind !== 'report'; }); }
  function stChip(s) { return '<span class="chip ' + (s === 'Enviada' ? 'ok' : s === 'Anulada' ? 'crit' : s === 'Esperando paciente' ? 'gray' : 'warn') + '">' + s + '</span>'; }
  function fmtCi(letter, digits) { return letter + '-' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  const o143 = findOrder('LAB-0143'); if (o143) o143.sample = { type: 'Sangre', code: 'M-0143-1', when: 'Hoy 08:40', by: 'Gabriela Ruiz' };

  /* ---------- Avance de una orden ---------- */
  function steps(o) {
    const sent = o.status === 'Enviada';
    return [['Paciente', true], ['Orden y cobro', !!o.paid], ['Confirmación', o.status !== 'Esperando paciente'], ['Muestra', sent || !needsSample(o) || !!o.sample], ['Resultados', sent || !!o.draft], ['Firma y envío', sent]];
  }
  function stepper(o) { return '<div class="pill-row">' + steps(o).map(function (s, i) { return '<span class="chip ' + (s[1] ? 'ok' : 'gray') + '">' + (i + 1) + '. ' + s[0] + (s[1] ? ' ✓' : '') + '</span>'; }).join('') + '</div>'; }
  const r0 = V.resultado; V.resultado = function () { const o = findOrder(S.ordSel); return (o ? '<div class="card"><h3>Avance de la orden ' + o.id + '</h3>' + stepper(o) + (o.sample ? '<p class="small muted">Muestra ' + esc(o.sample.type) + ' · código ' + esc(o.sample.code) + ' · ' + esc(o.sample.when) + '</p>' : '') + '</div>' : '') + r0(); };

  /* ---------- Atender pacientes ---------- */
  V.atencion = function () {
    const own = isOwner(); const O = S.orders.filter(function (o) { return o.status !== 'Anulada'; }); const live = function (o) { return o.status === 'Por procesar' || o.status === 'En proceso'; };
    const wait = O.filter(function (o) { return o.status === 'Esperando paciente'; });
    const toSample = O.filter(function (o) { return live(o) && needsSample(o) && !o.sample; });
    const toLoad = O.filter(function (o) { return live(o) && (!needsSample(o) || o.sample); });
    const sent = O.filter(function (o) { return o.status === 'Enviada'; }).slice(0, 5); const unpaid = O.filter(function (o) { return !o.paid; });
    function row(o, btns) { return '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row between"><div><b>' + esc(pname(o.pid)) + '</b><div class="small muted">' + o.id + ' · ' + esc(examsShort(o.exams)) + '</div></div><div class="row">' + btns + '</div></div></div>'; }
    function list(arr, fn, empty) { return arr.length ? arr.map(fn).join('') : '<p class="muted small">' + empty + '</p>'; }
    return '<div class="head"><div><h1>Atender pacientes</h1><p>El camino de cada paciente, de arriba hacia abajo.</p></div></div>' +
      '<div class="card"><h2>1. Recibir al paciente</h2><p class="small muted">Busca al paciente o regístralo con su nombre, apellido y cédula. Luego crea su orden y cóbrala.</p><div class="row"><button class="btn sm" type="button" data-a="pc-add">Registrar paciente nuevo</button><button class="btn ghost sm" type="button" data-a="nav" data-v="pacientes">Ver mis pacientes</button><button class="btn ghost sm" type="button" data-a="nav" data-v="nueva">Nueva orden</button></div></div>' +
      '<div class="card"><h2>2. Esperando al paciente (' + wait.length + ')</h2>' + list(wait, function (o) { return row(o, '<button class="btn ghost sm" type="button" data-a="o-remind" data-v="' + o.id + '">Recordar</button>'); }, 'Nadie está esperando confirmar su orden.') + '</div>' +
      '<div class="card"><h2>3. Tomar la muestra (' + toSample.length + ')</h2>' + list(toSample, function (o) { return row(o, '<button class="btn sm" type="button" data-a="o-sample" data-v="' + o.id + '">Tomar muestra</button>'); }, 'No hay muestras por tomar.') + '</div>' +
      '<div class="card"><h2>4. Cargar resultados (' + toLoad.length + ')</h2>' + list(toLoad, function (o) { return row(o, own ? '<button class="btn sm" type="button" data-a="o-open" data-v="' + o.id + '">Cargar resultados</button>' : '<span class="chip gray">Lo carga el bioanalista</span>'); }, 'No hay resultados por cargar.') + (own ? '' : '<p class="small muted">Solo el bioanalista revisa, firma y envía.</p>') + '</div>' +
      '<div class="card"><h2>5. Enviados</h2>' + list(sent, function (o) { const lo = (X.personOf(o.pid) || {}).labOnly; return row(o, (lo ? '<span class="chip warn">Entrega impresa</span>' : '<span class="chip ok">En su teléfono</span>') + '<button class="btn ghost sm" type="button" data-a="o-view" data-v="' + o.id + '">Ver / imprimir</button>'); }, 'Todavía no hay resultados enviados.') + '</div>' +
      '<div class="card"><h2>6. Cobros pendientes (' + unpaid.length + ')</h2>' + list(unpaid, function (o) { return row(o, '<button class="btn sm" type="button" data-a="o-pay" data-v="' + o.id + '">Cobrar</button>'); }, 'Todo está cobrado.') + '</div>';
  };
  EXT.nav.lab.splice(1, 0, { id: 'atencion', label: 'Atender pacientes' });
  EXT.nav.lab.forEach(function (i) { if (i.id === 'pacientes') i.label = 'Mis pacientes'; });

  /* ---------- Toma de muestra ---------- */
  function sampleDlg(v, gate) {
    const o = findOrder(v); S.sampleGo = !!gate;
    dlg('Toma de muestra · ' + o.id, '<p><b>' + esc(pname(o.pid)) + '</b></p><p class="small muted">' + esc(examsShort(o.exams)) + '</p>' + (gate ? '<p class="small">Antes de cargar los resultados hay que anotar la muestra.</p>' : '') + fld('Tipo de muestra', 'sm-type', { type: 'select', options: ['Sangre', 'Orina', 'Heces', 'Esputo', 'Hisopado', 'Otra'] }) + fld('Confirmo que la muestra está rotulada con el nombre del paciente', 'sm-ok', { type: 'checkbox' }) + errBox('sm'), { label: 'Guardar muestra', a: 'o-sample-ok', v: v });
  }
  A['o-sample'] = function (v) { sampleDlg(v, false); };
  A['o-sample-ok'] = function (v) {
    if (!F('sm-ok')) return setErr('sm', 'Marca la casilla para confirmar que la muestra está rotulada.');
    const o = findOrder(v); o.sample = { type: F('sm-type', 'Sangre'), code: 'M-' + o.id.slice(-4) + '-1', when: X.when(), by: S.auth.name }; if (o.status === 'Por procesar') o.status = 'En proceso';
    ['sm-type', 'sm-ok'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null; logAudit(S.auth.name, 'Registró la toma de muestra de ' + o.id); toast('Muestra registrada: ' + o.sample.code + '.');
    if (S.sampleGo && isOwner()) { S.sampleGo = false; const o0 = A['o-open0']; return o0(v); } render();
  };
  A['o-open0'] = A['o-open'];
  A['o-open'] = function (v) { const o = findOrder(v); if (o && o.status !== 'Enviada' && needsSample(o) && !o.sample) return sampleDlg(v, true); A['o-open0'](v); };

  /* ---------- Registro de pacientes del laboratorio ---------- */
  S.pseq = S.pseq || 100;
  function mine() { return S.patients.filter(function (p) { return p.name !== 'Cuenta eliminada' && !p.deleted && p.id !== 'p7' && (p.labOnly || S.orders.some(function (o) { return o.pid === p.id; })); }); }
  V.pacientes = function () {
    const q = F('pc-q').trim().toLowerCase(); const qd = q.replace(/\D/g, ''); const all = mine();
    const list = q ? all.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && p.ci.replace(/\D/g, '').indexOf(qd) >= 0); }) : all;
    return '<div class="head"><div><h1>Mis pacientes</h1><p>' + all.length + ' pacientes con historial en este laboratorio.</p></div><button class="btn" type="button" data-a="pc-add">Registrar paciente</button></div>' +
      '<div class="card">' + fld('Buscar por nombre o cédula', 'pc-q') + (list.length ? list.map(function (p) {
        const n = S.orders.filter(function (o) { return o.pid === p.id; }).length;
        return '<div style="padding:10px 0;border-top:1px solid var(--line)"><div class="row between"><div><b>' + esc(p.name) + '</b><div class="small muted">Cédula ' + esc(X.maskCi(p.ci)) + ' · ' + n + (n === 1 ? ' orden' : ' órdenes') + '</div>' + (S.pnotes[p.id] ? '<div class="small muted">Nota: ' + esc(S.pnotes[p.id]) + '</div>' : '') + '</div><span class="chip ' + (p.labOnly ? 'warn' : 'ok') + '">' + (p.labOnly ? 'Solo en este laboratorio' : 'Tiene cuenta LABS') + '</span></div>' +
          '<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-a="pc-new" data-v="' + p.id + '">Nueva orden</button><button class="btn ghost sm" type="button" data-a="pc-hist" data-v="' + p.id + '">Historial</button><button class="btn ghost sm" type="button" data-a="pc-ci" data-v="' + p.id + '">Ver cédula</button><button class="btn ghost sm" type="button" data-a="pc-note" data-v="' + p.id + '">Nota</button>' + (p.labOnly ? '<button class="btn ghost sm" type="button" data-a="pc-add" data-v="' + p.id + '">Corregir</button>' : '') + (p.labOnly && isOwner() ? '<button class="btn warn sm" type="button" data-a="pc-del" data-v="' + p.id + '">Borrar datos</button>' : '') + '</div></div>';
      }).join('') : '<p class="muted">No hay pacientes con ese nombre o cédula.</p>') + '</div>' +
      '<div class="card note"><h2>Cómo se cuidan estos datos</h2><ul class="clean small"><li>Solo se guarda nombre, apellido y cédula. La edad y el sexo son opcionales.</li><li>La cédula se ve oculta. Verla completa queda anotado en el registro del laboratorio.</li><li>Solo el personal de este laboratorio ve su lista. Otros laboratorios, médicos y LABS no la ven.</li><li>Cada paciente debe autorizar que lo guardes. Puede pedirte que lo borres.</li><li>Nunca ves resultados de otros laboratorios.</li></ul></div>';
  };
  A['pc-add'] = function (v) {
    const p = v ? X.personOf(v) : null; ['rl-nom', 'rl-ape', 'rl-ci', 'rl-age', 'rl-sex', 'rl-ok'].forEach(function (k) { delete S.f[k]; }); S.err = {};
    if (p) { S.f['rl-nom'] = p.first || p.name.split(' ')[0]; S.f['rl-ape'] = p.last || p.name.split(' ').slice(1).join(' '); S.f['rl-ci'] = p.ci; S.f['rl-age'] = p.age && p.age !== '—' ? String(p.age) : ''; S.f['rl-sex'] = p.sex && p.sex !== '—' ? p.sex : ''; S.f['rl-ok'] = true; }
    dlg(p ? 'Corregir datos del paciente' : 'Registrar paciente', fld('Nombre', 'rl-nom', { ph: 'Ej.: María', max: 40 }) + fld('Apellido', 'rl-ape', { ph: 'Ej.: Pérez', max: 40 }) + fld('Cédula', 'rl-ci', { ph: 'V-12345678', max: 12 }) +
      '<div class="small muted">Opcional, para interpretar los valores:</div>' + fld('Edad', 'rl-age', { type: 'number', mode: 'numeric', ph: 'Años' }) + fld('Sexo', 'rl-sex', { type: 'select', options: [{ v: '', l: 'Prefiero no indicar' }, { v: 'F', l: 'Femenino' }, { v: 'M', l: 'Masculino' }] }) +
      fld('El paciente me autorizó a guardar su nombre y cédula para su historial en este laboratorio', 'rl-ok', { type: 'checkbox' }) + errBox('rl'), { label: p ? 'Guardar cambios' : 'Guardar paciente', a: 'pc-add-ok', v: v || '' });
  };
  A['pc-add-ok'] = function (v) {
    const nom = F('rl-nom').trim().replace(/\s+/g, ' '), ape = F('rl-ape').trim().replace(/\s+/g, ' '); const name = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,}$/;
    if (!name.test(nom)) return setErr('rl', 'Escribe el nombre (solo letras).'); if (!name.test(ape)) return setErr('rl', 'Escribe el apellido (solo letras).');
    const raw = F('rl-ci').trim().toUpperCase(); const d = raw.replace(/\D/g, ''); const letter = /^E/.test(raw) ? 'E' : 'V';
    if (d.length < 6 || d.length > 9) return setErr('rl', 'La cédula debe tener entre 6 y 9 números.');
    const age = F('rl-age').trim(); if (age && (!/^\d{1,3}$/.test(age) || +age > 120)) return setErr('rl', 'La edad debe ser un número entre 0 y 120.');
    if (!F('rl-ok')) return setErr('rl', 'Marca la casilla: el paciente debe autorizar que guardes sus datos.');
    const dup = S.patients.filter(function (p) { return p.id !== v && !p.deleted && p.name !== 'Cuenta eliminada' && p.ci && p.ci.replace(/\D/g, '') === d; })[0];
    if (dup) return setErr('rl', S.orders.some(function (o) { return o.pid === dup.id; }) || dup.labOnly ? 'Esa cédula ya está en tu lista de pacientes. Búscala arriba.' : 'Esa cédula ya tiene cuenta en LABS. Búscala en “Nueva orden” con la cédula y el paciente confirma desde su teléfono.');
    const ci = fmtCi(letter, d); const sex = F('rl-sex'); let p = v ? X.personOf(v) : null;
    if (p) { p.first = nom; p.last = ape; p.name = nom + ' ' + ape; p.ci = ci; p.age = age ? +age : '—'; p.sex = sex || '—'; logAudit(S.auth.name, 'Corrigió datos de un paciente'); toast('Datos corregidos.'); }
    else { p = { id: 'r' + (++S.pseq), first: nom, last: ape, name: nom + ' ' + ape, ci: ci, phone: '', email: '', age: age ? +age : '—', sex: sex || '—', dob: '', created: 'hoy', labOnly: true, reg: { by: S.auth.name, when: X.when() } }; S.patients.push(p); logAudit(S.auth.name, 'Registró un paciente nuevo (con su autorización)'); toast(p.name + ' quedó registrado.'); if (S.lab === 'nueva') { S.no.pid = p.id; S.no.via = 'Registro'; } }
    ['rl-nom', 'rl-ape', 'rl-ci', 'rl-age', 'rl-sex', 'rl-ok'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null; render();
  };
  A['pc-ci'] = function (v) { const p = X.personOf(v); logAudit(S.auth.name, 'Vio la cédula completa de un paciente'); dlg('Cédula de ' + p.name, '<p style="font-size:22px;font-weight:700">' + esc(p.ci) + '</p><p class="small muted">Esta consulta quedó anotada en el registro del laboratorio. No la compartas ni la fotografíes.</p>', null); };
  A['pc-del'] = function (v) { const p = X.personOf(v); dlg('Borrar los datos de ' + p.name, '<p>Se borran su nombre y su cédula de tu lista. Las órdenes ya hechas se conservan pero sin su nombre. No se puede deshacer.</p>', { label: 'Sí, borrar sus datos', a: 'pc-del-ok', v: v }); };
  A['pc-del-ok'] = function (v) { const p = X.personOf(v); p.name = 'Cuenta eliminada'; p.first = p.last = ''; p.ci = ''; p.deleted = true; delete S.pnotes[v]; S.modal = null; logAudit(S.auth.name, 'Borró los datos de un paciente a su pedido'); toast('Datos borrados.'); render(); };

  /* ---------- Métodos de pago con datos copiables (laboratorio y superadmin) ---------- */
  const ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  function fields(o) { return Object.keys(o).map(function (k) { return { k: k, v: o[k] }; }); }
  S.pm = {
    lab: [
      { id: 'm1', name: 'Pago móvil', on: true, f: fields({ 'Banco': 'Banesco (0134)', 'Teléfono': '0414-5550100', 'Cédula o RIF': 'J-12345678-9' }) },
      { id: 'm2', name: 'Transferencia Bs', on: true, f: fields({ 'Banco': 'Banesco', 'Número de cuenta': '0134-0000-00-0000000000', 'Titular': 'Laboratorio Ejemplo C.A.', 'RIF': 'J-12345678-9' }) },
      { id: 'm3', name: 'Zelle', on: true, f: fields({ 'Correo': 'pagos@laboratorioejemplo.com', 'Titular': 'Laboratorio Ejemplo C.A.' }) },
      { id: 'm4', name: 'Efectivo USD', on: true, f: fields({ 'Instrucciones': 'En caja, billetes sin roturas' }) },
      { id: 'm5', name: 'USDT', on: false, f: fields({ 'Red': 'TRC20', 'Dirección': 'T-EJEMPLO-000000000000000000' }) },
      { id: 'm6', name: 'Punto de venta', on: false, f: fields({ 'Instrucciones': 'Tarjetas de débito y crédito' }) }
    ],
    adm: [
      { id: 'a1', name: 'Zelle', on: true, f: fields({ 'Correo': 'pagos@labs.demo', 'Titular': 'LABS Demo LLC' }) },
      { id: 'a2', name: 'Pago móvil', on: true, f: fields({ 'Banco': 'Banesco (0134)', 'Teléfono': '0412-5550199', 'Cédula o RIF': 'J-00000000-0' }) },
      { id: 'a3', name: 'Transferencia Bs', on: true, f: fields({ 'Banco': 'Mercantil', 'Número de cuenta': '0105-0000-00-0000000000', 'Titular': 'LABS Demo C.A.', 'RIF': 'J-00000000-0' }) },
      { id: 'a4', name: 'USDT', on: true, f: fields({ 'Red': 'TRC20', 'Dirección': 'T-EJEMPLO-111111111111111111' }) }
    ]
  };
  function syncLabPay() { const o = {}; S.pm.lab.forEach(function (m) { o[m.name] = m.on; }); S.lcfg.pay = o; }
  syncLabPay();
  function copyText(t) {
    return new Promise(function (res) {
      function fb() { try { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; } }
      try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(t).then(function () { res(true); }, function () { res(fb()); }); return; } } catch (e) { }
      res(fb());
    });
  }
  A['copy'] = function (v) { copyText(v).then(function (ok) { toast(ok ? 'Copiado: ' + (v.length > 32 ? v.slice(0, 30) + '…' : v) : 'No se pudo copiar. Mantén presionado el dato para copiarlo.'); }); };
  function find(scope, id) { return S.pm[scope].filter(function (m) { return m.id === id; })[0]; }
  A['copyall'] = function (v) { const a = v.split('|'); const m = find(a[0], a[1]); const t = m.name + '\n' + m.f.map(function (x) { return x.k + ': ' + x.v; }).join('\n'); copyText(t).then(function (ok) { toast(ok ? 'Copiados todos los datos de ' + m.name + '.' : 'No se pudo copiar.'); }); };
  function cbtn(label, value) { return '<button type="button" class="copybtn" data-a="copy" data-v="' + esc(value) + '" aria-label="Copiar ' + esc(label) + '" title="Copiar">' + ICON + '</button>'; }
  function methodBlock(scope, m, manage) {
    return '<div class="paym' + (m.on ? '' : ' off') + '"><div class="row between"><b>' + esc(m.name) + '</b><span class="chip ' + (m.on ? 'ok' : 'gray') + '">' + (m.on ? 'Activo' : 'Apagado') + '</span></div>' +
      m.f.map(function (x) { return '<div class="payrow"><div><div class="small muted">' + esc(x.k) + '</div><div class="payv">' + esc(x.v) + '</div></div>' + cbtn(x.k, x.v) + '</div>'; }).join('') +
      '<div class="row" style="margin-top:6px"><button class="btn ghost sm" type="button" data-a="copyall" data-v="' + scope + '|' + m.id + '">Copiar todo</button>' + (manage ? '<button class="btn ghost sm" type="button" data-a="pm-toggle" data-v="' + scope + '|' + m.id + '">' + (m.on ? 'Apagar' : 'Activar') + '</button><button class="btn ghost sm" type="button" data-a="pm-edit" data-v="' + scope + '|' + m.id + '">Editar datos</button><button class="btn warn sm" type="button" data-a="pm-del" data-v="' + scope + '|' + m.id + '">Quitar</button>' : '') + '</div></div>';
  }
  function methodsView(scope, manage) { const list = S.pm[scope].filter(function (m) { return manage || m.on; }); return list.length ? list.map(function (m) { return methodBlock(scope, m, manage); }).join('') : '<p class="muted">Todavía no hay métodos de pago.</p>'; }
  function pmCard(scope, title, note) { return '<div class="card"><h2>' + title + '</h2><p class="small muted">' + note + '</p>' + methodsView(scope, true) + '<div class="row"><button class="btn" type="button" data-a="pm-add" data-v="' + scope + '">Agregar método de pago</button></div></div>'; }
  A['pm-add'] = function (v) { pmDlg(v, ''); };
  A['pm-edit'] = function (v) { const a = v.split('|'); pmDlg(a[0], a[1]); };
  function pmDlg(scope, id) {
    const m = id ? find(scope, id) : null; delete S.f['pm-name']; delete S.f['pm-lines']; S.err = {};
    if (m) { S.f['pm-name'] = m.name; S.f['pm-lines'] = m.f.map(function (x) { return x.k + ': ' + x.v; }).join('\n'); }
    dlg(m ? 'Editar ' + m.name : 'Agregar método de pago', fld('Nombre del método', 'pm-name', { ph: 'Ej.: Pago móvil, Zelle, Binance' }) + fld('Datos para pagar (una línea por dato, así: Banco: Banesco)', 'pm-lines', { type: 'textarea', ph: 'Banco: Banesco\nTeléfono: 0414-5550100\nCédula o RIF: J-12345678-9' }) + errBox('pm'), { label: 'Guardar método', a: 'pm-ok', v: scope + '|' + id });
  }
  A['pm-ok'] = function (v) {
    const a = v.split('|'); const scope = a[0], id = a[1]; const name = F('pm-name').trim(); if (name.length < 3) return setErr('pm', 'Escribe el nombre del método (al menos 3 letras).');
    if (S.pm[scope].some(function (m) { return m.id !== id && m.name.toLowerCase() === name.toLowerCase(); })) return setErr('pm', 'Ya tienes un método con ese nombre.');
    const lines = F('pm-lines').split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (!lines.length) return setErr('pm', 'Escribe al menos un dato para pagar.'); if (lines.length > 8) return setErr('pm', 'Máximo 8 datos por método.');
    const f = lines.map(function (l) { const i = l.indexOf(':'); return i > 0 ? { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() } : { k: 'Dato', v: l }; });
    if (f.some(function (x) { return !x.v || x.v.length > 80; })) return setErr('pm', 'Cada dato debe tener un valor de hasta 80 letras. Ejemplo: Banco: Banesco');
    const m = id ? find(scope, id) : null;
    if (m) { m.name = name; m.f = f; } else S.pm[scope].push({ id: (scope === 'lab' ? 'm' : 'a') + Date.now().toString(36), name: name, on: true, f: f });
    if (scope === 'lab') syncLabPay(); delete S.f['pm-name']; delete S.f['pm-lines']; S.err = {}; S.modal = null; logAudit(S.auth.name, (m ? 'Editó' : 'Agregó') + ' el método de pago ' + name); toast('Método de pago guardado.'); render();
  };
  A['pm-toggle'] = function (v) {
    const a = v.split('|'); const m = find(a[0], a[1]); if (m.on && S.pm[a[0]].filter(function (x) { return x.on; }).length === 1) return toast('Debe quedar al menos un método activo.');
    m.on = !m.on; if (a[0] === 'lab') syncLabPay(); logAudit(S.auth.name, (m.on ? 'Activó' : 'Apagó') + ' el método de pago ' + m.name); render();
  };
  A['pm-del'] = function (v) { const a = v.split('|'); const m = find(a[0], a[1]); if (S.pm[a[0]].length === 1) return toast('Debe quedar al menos un método.'); dlg('Quitar ' + m.name, '<p>Los pacientes ya no verán estos datos. Puedes agregarlo de nuevo cuando quieras.</p>', { label: 'Quitar método', a: 'pm-del-ok', v: v }); };
  A['pm-del-ok'] = function (v) { const a = v.split('|'); const m = find(a[0], a[1]); S.pm[a[0]] = S.pm[a[0]].filter(function (x) { return x.id !== a[1]; }); if (a[0] === 'lab') { if (!S.pm.lab.some(function (x) { return x.on; })) S.pm.lab[0].on = true; syncLabPay(); } S.modal = null; logAudit(S.auth.name, 'Quitó el método de pago ' + m.name); toast('Método quitado.'); render(); };

  /* ---------- Configuración con Mi suscripción adentro ---------- */
  const cfg0 = V.config;
  V.config = function () {
    const lab = S.labs[0]; const mineP = S.payments.filter(function (p) { return p.labId === 'l1'; }); const pend = mineP.some(function (p) { return p.status === 'Pendiente'; });
    const old = cfg0(); const cut = function (a, b) { const i = old.indexOf(a); const j = b ? old.indexOf(b, i) : old.length; return old.slice(i, j); };
    const datos = cut('<div class="card"><h2>Datos del laboratorio</h2>', '<div class="card"><h2>Sedes</h2>'), sedes = cut('<div class="card"><h2>Sedes</h2>', '<div class="card"><h2>Métodos de pago que aceptas</h2>'), aviso = cut('<div class="card"><h2>Aviso al paciente</h2>');
    const sub = '<div class="card"><h2>Mi suscripción</h2><div class="row"><span class="chip ok">Plan ' + esc(lab.plan) + ' · ' + L.fmtUsd(lab.price) + ' al mes</span><span class="chip ' + (lab.due <= 7 ? 'warn' : 'gray') + '">Vence en ' + lab.due + ' días</span><span class="chip ' + (pend ? 'warn' : 'ok') + '">' + (pend ? 'Pago en revisión' : esc(lab.status)) + '</span></div><p class="small muted">' + (lab.cancel ? 'No se renovará.' : 'Se renueva si pagas a tiempo.') + '</p>' +
      (lab.nextPlan ? '<div class="banner" role="status">Cambio de plan programado: ' + esc(lab.plan) + ' → ' + esc(lab.nextPlan) + ' desde el próximo ciclo. <button class="btn ghost sm" type="button" data-a="sub-undo-plan">Deshacer</button></div>' : '') + (lab.cancel ? '<div class="banner" role="status">Pediste cancelar. Tu cuenta sigue activa hasta que venza. <button class="btn ghost sm" type="button" data-a="sub-undo-cancel">Reactivar</button></div>' : '') +
      '<div class="row"><button class="btn" type="button" data-a="sub-pay">Reportar un pago</button><button class="btn ghost" type="button" data-a="sub-plan">Cambiar de plan</button>' + (lab.cancel ? '' : '<button class="btn ghost" type="button" data-a="sub-cancel">Cancelar suscripción</button>') + '</div></div>' +
      '<div class="card"><h2>Cómo pagar mi suscripción a LABS</h2><p class="small muted">Paga a cualquiera de estos datos y luego pulsa “Reportar un pago” con la referencia.</p>' + methodsView('adm', false) + '</div>' +
      '<div class="card"><h2>Historial de pagos de mi suscripción</h2><div class="tw"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>' + mineP.map(function (p) { return '<tr><td>' + esc(p.when) + '</td><td>' + L.fmtUsd(p.amount) + '</td><td>' + esc(p.method) + '</td><td>' + esc(p.ref) + '</td><td><span class="chip ' + (p.status === 'Confirmado' ? 'ok' : p.status === 'Rechazado' ? 'crit' : 'warn') + '">' + p.status + '</span>' + (p.note ? '<div class="small muted">' + esc(p.note) + '</div>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    return '<div class="head"><div><h1>Configuración</h1><p>Tu laboratorio, tu suscripción y cómo te pagan.</p></div></div>' + datos + sub + sedes + pmCard('lab', 'Métodos de pago que aceptas', 'Tus pacientes ven estos datos en su teléfono, con un botón para copiar cada dato.') + aviso;
  };
  V.suscripcion = V.config;
  EXT.nav.lab.forEach(function (i) { if (i.id === 'suscripcion') i.hidden = true; });
  ['nav', 'gopage'].forEach(function (k) { const f = A[k]; A[k] = function (v) { return f(S.role === 'lab' && v === 'suscripcion' ? 'config' : v); }; });

  /* ---------- Superadmin: cómo me pagan los laboratorios ---------- */
  const AV = EXT.views.adm; const aj0 = AV.ajustes;
  AV.ajustes = function () { const h = aj0(); const k = h.indexOf('</p></div></div>'); const card = pmCard('adm', 'Cómo me pagan los laboratorios', 'Los laboratorios ven estos datos en Configuración, con un botón para copiar cada dato.'); return k < 0 ? card + h : h.slice(0, k + 16) + card + h.slice(k + 16); };

  /* ---------- Paciente: cómo pagar ---------- */
  EXT.nav.pat.splice(2, 0, { id: 'pagar', label: 'Cómo pagar' });
  EXT.views.pat.pagar = function () {
    return '<div class="head"><div><h1>Cómo pagar</h1><p>Formas de pago de ' + esc(S.lcfg.name) + '.</p></div></div><div class="card"><h2>Datos para pagar</h2><p class="small muted">Toca el icono de las dos hojas para copiar cada dato. Tasa BCV de hoy: ' + L.fmtBs(D.RATES.bcv.value) + ' por dólar.</p>' + methodsView('lab', false) + '<p class="small muted">Después de pagar, muestra el comprobante en el laboratorio.</p></div>';
  };
  render();
})();
