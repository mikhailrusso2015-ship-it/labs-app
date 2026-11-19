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
    const p = v ? X.personOf(v) : null; ['rg-nom', 'rg-ape', 'rg-ci', 'rg-age', 'rg-sex', 'rg-ok'].forEach(function (k) { delete S.f[k]; }); S.err = {};
    if (p) { S.f['rg-nom'] = p.first || p.name.split(' ')[0]; S.f['rg-ape'] = p.last || p.name.split(' ').slice(1).join(' '); S.f['rg-ci'] = p.ci; S.f['rg-age'] = p.age && p.age !== '—' ? String(p.age) : ''; S.f['rg-sex'] = p.sex && p.sex !== '—' ? p.sex : ''; S.f['rg-ok'] = true; }
    dlg(p ? 'Corregir datos del paciente' : 'Registrar paciente', fld('Nombre', 'rg-nom', { ph: 'Ej.: María', max: 40 }) + fld('Apellido', 'rg-ape', { ph: 'Ej.: Pérez', max: 40 }) + fld('Cédula', 'rg-ci', { ph: 'V-12345678', max: 12 }) +
      '<div class="small muted">Opcional, para interpretar los valores:</div>' + fld('Edad', 'rg-age', { type: 'number', mode: 'numeric', ph: 'Años' }) + fld('Sexo', 'rg-sex', { type: 'select', options: [{ v: '', l: 'Prefiero no indicar' }, { v: 'F', l: 'Femenino' }, { v: 'M', l: 'Masculino' }] }) +
      fld('El paciente me autorizó a guardar su nombre y cédula para su historial en este laboratorio', 'rg-ok', { type: 'checkbox' }) + errBox('rg'), { label: p ? 'Guardar cambios' : 'Guardar paciente', a: 'pc-add-ok', v: v || '' });
  };
  A['pc-add-ok'] = function (v) {
    const nom = F('rg-nom').trim().replace(/\s+/g, ' '), ape = F('rg-ape').trim().replace(/\s+/g, ' '); const name = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,}$/;
    if (!name.test(nom)) return setErr('rg', 'Escribe el nombre (solo letras).'); if (!name.test(ape)) return setErr('rg', 'Escribe el apellido (solo letras).');
    const raw = F('rg-ci').trim().toUpperCase(); const d = raw.replace(/\D/g, ''); const letter = /^E/.test(raw) ? 'E' : 'V';
    if (d.length < 6 || d.length > 9) return setErr('rg', 'La cédula debe tener entre 6 y 9 números.');
    const age = F('rg-age').trim(); if (age && (!/^\d{1,3}$/.test(age) || +age > 120)) return setErr('rg', 'La edad debe ser un número entre 0 y 120.');
    if (!F('rg-ok')) return setErr('rg', 'Marca la casilla: el paciente debe autorizar que guardes sus datos.');
    const dup = S.patients.filter(function (p) { return p.id !== v && !p.deleted && p.name !== 'Cuenta eliminada' && p.ci && p.ci.replace(/\D/g, '') === d; })[0];
    if (dup) return setErr('rg', S.orders.some(function (o) { return o.pid === dup.id; }) || dup.labOnly ? 'Esa cédula ya está en tu lista de pacientes. Búscala arriba.' : 'Esa cédula ya tiene cuenta en LABS. Búscala en “Nueva orden” con la cédula y el paciente confirma desde su teléfono.');
    const ci = fmtCi(letter, d); const sex = F('rg-sex'); let p = v ? X.personOf(v) : null;
    if (p) { p.first = nom; p.last = ape; p.name = nom + ' ' + ape; p.ci = ci; p.age = age ? +age : '—'; p.sex = sex || '—'; logAudit(S.auth.name, 'Corrigió datos de un paciente'); toast('Datos corregidos.'); }
    else { p = { id: 'r' + (++S.pseq), first: nom, last: ape, name: nom + ' ' + ape, ci: ci, phone: '', email: '', age: age ? +age : '—', sex: sex || '—', dob: '', created: 'hoy', labOnly: true, reg: { by: S.auth.name, when: X.when() } }; S.patients.push(p); logAudit(S.auth.name, 'Registró un paciente nuevo (con su autorización)'); toast(p.name + ' quedó registrado.'); if (S.lab === 'nueva') { S.no.pid = p.id; S.no.via = 'Registro'; } }
    ['rg-nom', 'rg-ape', 'rg-ci', 'rg-age', 'rg-sex', 'rg-ok'].forEach(function (k) { delete S.f[k]; }); S.err = {}; S.modal = null; render();
  };
  A['pc-ci'] = function (v) { const p = X.personOf(v); logAudit(S.auth.name, 'Vio la cédula completa de un paciente'); dlg('Cédula de ' + p.name, '<p style="font-size:22px;font-weight:700">' + esc(p.ci) + '</p><p class="small muted">Esta consulta quedó anotada en el registro del laboratorio. No la compartas ni la fotografíes.</p>', null); };
  A['pc-del'] = function (v) { const p = X.personOf(v); dlg('Borrar los datos de ' + p.name, '<p>Se borran su nombre y su cédula de tu lista. Las órdenes ya hechas se conservan pero sin su nombre. No se puede deshacer.</p>', { label: 'Sí, borrar sus datos', a: 'pc-del-ok', v: v }); };
  A['pc-del-ok'] = function (v) { const p = X.personOf(v); p.name = 'Cuenta eliminada'; p.first = p.last = ''; p.ci = ''; p.deleted = true; delete S.pnotes[v]; S.modal = null; logAudit(S.auth.name, 'Borró los datos de un paciente a su pedido'); toast('Datos borrados.'); render(); };
  render();
})();
