/* LABS demo · barra inferior con botón QR, escáner, QR de pago, elegir laboratorio, autocompletar paciente */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, QRT = window.QRT;
  const esc = U.esc, toast = U.toast, logAudit = U.logAudit, A = EXT.actions, V = EXT.views;
  function render() { window.render(); }
  function isMob() { return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); }
  const PM = EXT.pm;

  /* ---------- Datos nuevos: direcciones, orden en curso, orden en otro laboratorio ---------- */
  const ADDR = { p1: 'Urb. La Viña, calle 3, casa 12, Valencia', p2: 'Av. Bolívar Norte, edif. Sol, apto 4B, Valencia', p3: 'Urb. Los Samanes, Maracay', p4: 'Calle Carabobo, casa 8, Naguanagua', p5: 'Urb. Prebo, torre B, piso 2, Valencia', p6: 'Av. Lara, res. Alba, Barquisimeto' };
  S.patients.forEach(function (p) { if (ADDR[p.id]) p.address = ADDR[p.id]; });
  (function () { const e = ['hem'], usd = e.reduce(function (s, id) { return s + D.BY_ID[id].price; }, 0), cost = e.reduce(function (s, id) { return s + D.BY_ID[id].cost; }, 0); S.orders.push({ id: 'LAB-0190', pid: 'p1', exams: e, usd: usd, cost: cost, cur: 'bcv', rate: D.RATES.bcv.value, method: 'Efectivo USD', paid: false, status: 'Por procesar', when: 'Hoy 09:05', by: 'Gabriela Ruiz', doctor: '', via: 'QR', resultIdx: null }); })();
  S.extOrders = [{ id: 'BV-0071', labId: 'l3', pid: 'p1', desc: 'Perfil tiroideo', usd: 18, status: 'En proceso', paid: false }];
  function personOf(pid) { return X.personOf(pid); }
  function split(p) { if (p.first) return [p.first, p.last || '']; const a = p.name.split(' '); return [a[0], a.slice(1).join(' ')]; }

  /* ---------- Ventana del QR de pago ---------- */
  const lbl = { lab: function () { return S.lcfg.name; }, adm: function () { return 'LABS'; }, x3: function () { return 'Bioanálisis Valencia Sur'; } };
  function qrDlg(v) {
    const a = v.split('|'); const m = PM.find(a[0], a[1]); const res = S.qrRes && S.qrRes.key === v ? S.qrRes : null;
    X.dlg((lbl[a[0]] ? lbl[a[0]]() : '') + ' · ' + m.name,
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><img src="' + m.qr + '" alt="Código QR de ' + esc(m.name) + '" style="width:min(280px,80vw);height:auto;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(20,25,58,.2)"></div>' +
      '<div class="row" style="justify-content:center"><button class="btn" type="button" data-a="qr-dl" data-v="' + v + '">Descargar QR</button><button class="btn ghost" type="button" data-a="qr-scan" data-v="' + v + '">Escanear QR</button></div>' +
      (res ? (res.text ? '<div class="okmsg" role="status"><b>QR leído.</b> Datos que contiene:<div class="payv" style="margin-top:4px">' + esc(res.text) + '</div><div class="row" style="margin-top:6px"><button class="btn ghost sm" type="button" data-a="copy" data-v="' + esc(res.text) + '">Copiar datos del QR</button></div><div class="small muted" style="margin-top:4px">En la app real, estos datos se abren directo en tu banco.</div></div>' : '<div class="err" role="alert">No pudimos leer este QR aquí. Puedes descargarlo y abrirlo con tu banco, o pagar con los datos de abajo.</div>') : '') +
      '<div class="card" style="box-shadow:none;background:rgba(255,255,255,.6)"><b>Datos para pagar</b>' + m.f.map(function (x) { return '<div class="payrow"><div><div class="small muted">' + esc(x.k) + '</div><div class="payv">' + esc(x.v) + '</div></div>' + PM.cbtn(x.k, x.v) + '</div>'; }).join('') + '</div>', null);
  }
  A['qr-open'] = function (v) { S.qrRes = null; qrDlg(v); };
  A['qr-dl'] = function (v) { const a = v.split('|'); const m = PM.find(a[0], a[1]); const el = document.createElement('a'); el.href = m.qr; el.download = 'QR-' + (lbl[a[0]] ? lbl[a[0]]() : 'pago').replace(/\s+/g, '-') + '-' + m.name.replace(/\s+/g, '-') + '.png'; document.body.appendChild(el); el.click(); el.remove(); toast('QR descargado.'); };
  A['qr-scan'] = function (v) { const a = v.split('|'); const m = PM.find(a[0], a[1]); QRT.decodeUrl(m.qr).then(function (t) { S.qrRes = { key: v, text: t }; qrDlg(v); }); };

  /* ---------- Cómo pagar (paciente): elegir el laboratorio ---------- */
  function payLabs(pid) {
    const out = []; const mine = S.orders.filter(function (o) { return o.pid === pid && o.status !== 'Enviada' && o.status !== 'Anulada'; });
    if (mine.length) out.push({ id: 'l1', scope: 'lab', name: S.lcfg.name, n: mine.length, due: mine.filter(function (o) { return !o.paid; }).reduce(function (s, o) { return s + o.usd; }, 0), what: mine.map(function (o) { return o.id; }).join(', ') });
    S.extOrders.filter(function (o) { return o.pid === pid && o.status !== 'Enviada'; }).forEach(function (o) { const lab = S.labs.filter(function (l) { return l.id === o.labId; })[0]; out.push({ id: o.labId, scope: 'x3', name: lab ? lab.name : 'Laboratorio', n: 1, due: o.paid ? 0 : o.usd, what: o.id }); });
    return out;
  }
  EXT.payLabs = payLabs;
  V.pat.pagar = function () {
    const list = payLabs(X.myPid()); const head = '<div class="head"><div><h1>Cómo pagar</h1><p>Elige el laboratorio al que le vas a pagar.</p></div></div>';
    if (!list.length) return head + '<div class="card"><p class="muted">No tienes exámenes en curso en ningún laboratorio. Cuando uno empiece a atenderte, aparecerá aquí con sus formas de pago.</p></div>';
    if (!S.payLab || !list.some(function (l) { return l.id === S.payLab; })) S.payLab = list[0].id; const cur = list.filter(function (l) { return l.id === S.payLab; })[0];
    return head + '<div class="card"><h2>Mis laboratorios con exámenes en curso</h2><div class="labpick">' + list.map(function (l) { return '<button type="button" class="labopt" data-a="paylab" data-v="' + l.id + '" aria-pressed="' + (l.id === S.payLab) + '"><b>' + esc(l.name) + '</b><span>' + l.n + (l.n === 1 ? ' examen en curso' : ' exámenes en curso') + ' · ' + (l.due ? 'por pagar ' + L.fmtUsd(l.due) : 'todo pagado') + '</span></button>'; }).join('') + '</div></div>' +
      '<div class="card"><h2>Datos para pagar a ' + esc(cur.name) + '</h2><p class="small muted">Orden ' + esc(cur.what) + (cur.due ? ' · ' + L.fmtUsd(cur.due) + ' (' + L.fmtBs(cur.due * D.RATES.bcv.value) + ' a la tasa BCV de hoy)' : '') + '. Toca el icono de las dos hojas para copiar cada dato, o toca el QR.</p>' + PM.methodsView(cur.scope, false) + '<p class="small muted">Después de pagar, muestra el comprobante en el laboratorio.</p></div>';
  };
  A['paylab'] = function (v) { S.payLab = v; render(); };

  /* ---------- Barra inferior ---------- */
  const IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    plus: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 4.5 5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    qr: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="3" height="3"/><rect x="8" y="13" width="3" height="3"/><path d="M14 14h2v2h-2z"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    inbox: '<path d="M4 13l2-8h12l2 8v6H4z"/><path d="M4 13h5a3 3 0 0 0 6 0h5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    build: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2"/>'
  };
  function ico(n) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; }
  function dockCfg() {
    const r = S.role, recep = r === 'lab' && S.auth && S.auth.sub === 'recep';
    if (r === 'lab') return [['Inicio', 'home', 'page:inicio'], [recep ? 'Nueva orden' : 'Órdenes', recep ? 'plus' : 'list', recep ? 'page:nueva' : 'page:ordenes'], ['Escanear', 'qr', 'qr'], ['Menú', 'menu', 'page:menu'], ['Yo', 'user', 'page:perfil']];
    if (r === 'pat') return [['Inicio', 'home', 'page:inicio'], ['Resultados', 'file', 'page:lista'], ['Mi QR', 'qr', 'qr'], ['Menú', 'menu', 'page:menu'], ['Yo', 'user', 'page:perfil']];
    if (r === 'doc') return [['Inicio', 'home', 'page:inicio'], ['Pacientes', 'users', 'page:lista'], ['QR', 'qr', 'qr'], ['Menú', 'menu', 'page:menu'], ['Yo', 'user', 'page:perfil']];
    return [['Inicio', 'home', 'page:inicio'], ['Labs', 'build', 'page:labs'], ['Pagos', 'wallet', 'page:pagos'], ['Menú', 'menu', 'page:menu'], ['Yo', 'user', 'page:perfil']];
  }
  window.UI_dock = function () {
    const el = document.getElementById('dock'); if (!el) return;
    if (!S.auth || !isMob()) { el.hidden = true; document.body.classList.remove('has-dock'); el.innerHTML = ''; return; }
    el.hidden = false; document.body.classList.add('has-dock');
    const cfg = dockCfg(); const page = S[S.role]; const badge = { menu: 0, avisos: 0 };
    const menuN = X.unread(S.role) + (S.role === 'doc' ? S.requests.length : 0) + (S.role === 'adm' ? S.payments.filter(function (p) { return p.status === 'Pendiente'; }).length : 0);
    el.innerHTML = '<div class="dock-in"><div class="dock-bg"><i></i></div>' + cfg.map(function (c, i) {
      const v = c[2]; const center = i === 2; const pg = v.indexOf('page:') === 0 ? v.slice(5) : null; const active = pg ? page === pg : (S.role === 'pat' && page === 'qr');
      const n = pg === 'menu' ? menuN : 0; const b = n ? '<em class="dbadge">' + n + '</em>' : '';
      return '<button type="button" class="dk' + (center ? ' dk-c' : '') + (active ? ' on' : '') + '" data-a="dock" data-v="' + v + '"' + (active ? ' aria-current="page"' : '') + ' aria-label="' + esc(c[0]) + '">' + ico(c[1]) + '<span>' + esc(c[0]) + '</span>' + b + '</button>';
    }).join('') + '</div>';
  };
  A['dock'] = function (v) {
    if (v === 'qr') { if (S.role === 'pat') { S.hub = false; S.pat = 'qr'; S.resIdx = null; render(); window.scrollTo(0, 0); return; } openScanner(S.role === 'doc' ? 'doc' : 'lab'); return; }
    A['nav'](v.slice(5));
  };

  /* ---------- Escáner (cámara, foto o demostración) ---------- */
  let scn = null;
  function stopCam() { if (!scn) return; if (scn.raf) cancelAnimationFrame(scn.raf); scn.raf = 0; if (scn.stream) { scn.stream.getTracks().forEach(function (t) { t.stop(); }); scn.stream = null; } }
  function closeScanner() { stopCam(); const ov = document.getElementById('scanner'); if (ov) ov.remove(); scn = null; }
  function status(t, bad) { const e = document.getElementById('scs'); if (e) { e.textContent = t; e.className = 'small ' + (bad ? 'scerr' : 'muted'); } }
  function grantDoctor(pid) {
    const p = personOf(pid); const ex = S.docPatients.filter(function (x) { return x.pid === pid; })[0];
    if (!ex) {
      const rs = D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid; });
      S.docPatients.push({ pid: pid, name: 'Paciente ' + p.name.split(' ').map(function (w) { return w[0] + '.'; }).join(' '), ci: X.maskCi(p.ci), exam: rs.length ? rs[rs.length - 1].title : 'Sin resultados', date: rs.length ? rs[rs.length - 1].date.split(' de ')[0] + ' ' + rs[rs.length - 1].date.split(' de ')[1].slice(0, 3) : '—', alerts: 0, until: 'en 3 meses', scope: 'Todos los resultados', flag: '' });
      S.access.push({ id: X.uid('ac'), pid: pid, doc: 'Dra. Marisol Pérez', until: 'en 3 meses', scope: 'Todos los resultados', on: true });
      X.notify('pat', 'La Dra. Marisol Pérez ahora puede ver tus resultados por 3 meses. Puedes quitarle el acceso cuando quieras.', { type: 'go', ref: 'qr' }, pid);
    }
    return S.docPatients.map(function (x) { return x.pid; }).indexOf(pid);
  }
  function handle(mode, raw) {
    const text = String(raw || '').trim(); if (!text) return { ok: false, msg: 'No pude leer ese QR.' };
    if (mode === 'pdoc') {
      if (!/^LABS-DOC-/i.test(text)) return { ok: false, msg: 'Ese QR no es de un médico de LABS.' };
      grantDoctor(X.myPid()); logAudit(S.auth.name, 'Escaneó el QR de su médico'); closeScanner(); S.hub = false; S.pat = 'qr'; toast('Listo. Tu médico ya puede ver tus resultados.'); render(); return { ok: true };
    }
    const p = S.patients.filter(function (x) { return x.id !== 'p7' && !x.deleted && x.name !== 'Cuenta eliminada' && !x.labOnly && EXT.qrCodeOf(x.id) === text.toUpperCase(); })[0];
    if (!p) return { ok: false, msg: 'Ese QR no es de un paciente de LABS, o ya venció. Pídele que muestre uno nuevo.' };
    if (mode === 'doc') { const i = grantDoctor(p.id); closeScanner(); S.qrN++; S.hub = false; S.doc = 'lista'; S.docOpen = i; S.docSel = i; toast('Acceso recibido. Ya ves los exámenes de ' + p.name.split(' ')[0] + '.'); render(); window.scrollTo(0, 0); return { ok: true }; }
    S.f['no-qr'] = text; S.qrEnds = Date.now() + 300000; S.err = {}; A['no-qrok'](); if (S.err.noqr) { const m = S.err.noqr; S.err = {}; return { ok: false, msg: m }; }
    closeScanner(); S.hub = false; S.lab = 'nueva'; render(); window.scrollTo(0, 0); toast('Paciente escaneado. Sus datos se completaron solos.'); return { ok: true };
  }
  function demoList(mode) {
    if (mode === 'pdoc') return '<button type="button" class="btn ghost sm" data-s="sim" data-v="LABS-DOC-12345">Escanear el QR de la Dra. Marisol Pérez</button>';
    return S.patients.filter(function (p) { return p.id !== 'p7' && !p.deleted && !p.labOnly && p.name !== 'Cuenta eliminada'; }).map(function (p) { return '<button type="button" class="btn ghost sm" data-s="sim" data-v="' + p.id + '">' + esc(p.name) + '</button>'; }).join('');
  }
  function drawScan() {
    const ov = document.getElementById('scanner'); if (!ov || !scn) return; const mode = scn.mode;
    const title = mode === 'pdoc' ? 'Escanear el QR de mi médico' : 'Escanear al paciente'; const desc = mode === 'lab' ? 'Al escanear, la planilla se llena sola con los datos que el paciente autoriza compartir: nombre, apellido, cédula, teléfono, correo y dirección.' : mode === 'doc' ? 'Al escanear, el paciente te da acceso a sus exámenes por 3 meses. Él puede quitarlo cuando quiera.' : 'Escanea el QR de tu médico para darle acceso a tus resultados.';
    const tabs = mode === 'doc' ? '<div class="seg" role="group" aria-label="Opciones del QR"><button type="button" data-s="tab" data-v="scan" aria-pressed="' + (scn.tab === 'scan') + '">Escanear paciente</button><button type="button" data-s="tab" data-v="mine" aria-pressed="' + (scn.tab === 'mine') + '">Mi QR</button></div>' : '';
    let body;
    if (mode === 'doc' && scn.tab === 'mine') body = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center">' + QRT.svg('LABS-DOC-12345', 240) + '<b>Dra. Marisol Pérez</b><span class="small muted">MPPS 12345 · LABS-DOC-12345</span><p class="small muted">Muéstrale este QR al paciente que quiera ser evaluado por ti. Él lo escanea desde su teléfono y te da acceso.</p></div>';
    else body = '<p class="small muted">' + desc + '</p><div class="scanbox"><video id="scv" playsinline muted autoplay></video><div class="scanframe"></div></div><p id="scs" class="small muted">Abriendo la cámara…</p><div class="row"><button type="button" class="btn ghost sm" data-s="cam">Abrir cámara</button><label class="btn ghost sm" style="cursor:pointer">Subir foto del QR<input type="file" accept="image/*" data-s-file hidden></label></div><h3>Demostración sin cámara</h3><p class="small muted">Elige a quién “escanear”:</p><div class="pill-row">' + demoList(mode) + '</div>';
    ov.innerHTML = '<div class="scan-in"><div class="row between"><h2>' + title + '</h2><button type="button" class="btn sm" data-s="close">Cerrar</button></div>' + tabs + body + '</div>';
    if (window.UI_segs) window.UI_segs(ov);
    if (!(mode === 'doc' && scn.tab === 'mine')) startCam();
  }
  function startCam() {
    stopCam(); const v = document.getElementById('scv'); if (!v) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return status('Aquí no se puede abrir la cámara. Usa “Subir foto del QR” o la demostración.', true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (st) {
      if (!scn || !document.getElementById('scv')) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
      scn.stream = st; v.srcObject = st; v.play().catch(function () { }); status('Apunta la cámara al QR. Se lee solo.');
      const cv = document.createElement('canvas'); let last = 0;
      (function loop() { if (!scn || !scn.stream) return; scn.raf = requestAnimationFrame(loop); if (v.readyState !== 4) return; const now = Date.now(); if (now - last < 160) return; last = now; cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext('2d').drawImage(v, 0, 0); const t = QRT.decodeCanvas(cv); if (t) { const r = handle(scn.mode, t); if (!r.ok) { status(r.msg, true); last = now + 1800; } } })();
    }).catch(function () { status('No pudimos abrir la cámara (permiso negado o sin cámara). Usa “Subir foto del QR” o la demostración.', true); });
  }
  function openScanner(mode) {
    closeScanner(); const ov = document.createElement('div'); ov.id = 'scanner'; ov.className = 'scan-bg'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.appendChild(ov); scn = { mode: mode, tab: 'scan', stream: null, raf: 0 };
    ov.addEventListener('click', function (ev) {
      const t = ev.target.closest('[data-s]'); if (!t) { if (ev.target === ov) closeScanner(); return; } const a = t.getAttribute('data-s'), v = t.getAttribute('data-v');
      if (a === 'close') closeScanner(); else if (a === 'cam') startCam(); else if (a === 'tab') { scn.tab = v; stopCam(); drawScan(); }
      else if (a === 'sim') { const code = scn.mode === 'pdoc' ? v : EXT.qrCodeOf(v); const r = handle(scn.mode, code); if (!r.ok) status(r.msg, true); }
    });
    ov.addEventListener('change', function (ev) { const t = ev.target; if (!t.matches || !t.matches('input[data-s-file]') || !t.files[0]) return; QRT.fileToQr(t.files[0]).then(function (r) { if (!r || !r.text) return status('No pude leer un QR en esa foto. Prueba con otra más clara.', true); const h = handle(scn && scn.mode, r.text); if (!h.ok) status(h.msg, true); }); });
    drawScan();
  }
  EXT.openScanner = openScanner;
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && scn) closeScanner(); });
  window.addEventListener('resize', function () { UI_dockSafe(); }); function UI_dockSafe() { if (window.UI_dock) window.UI_dock(); }

  /* ---------- Planilla: autocompletar con los datos del paciente ---------- */
  const nu0 = V.lab.nueva;
  V.lab.nueva = function () {
    let h = nu0(); const n = S.no; if (!n.pid) return h; const p = personOf(n.pid); if (!p || (n.via !== 'QR' && n.via !== 'Registro')) return h; const nm = split(p);
    const row = function (k, v) { return '<div><div class="small muted">' + k + '</div><b>' + (v ? esc(v) : '—') + '</b></div>'; };
    const card = '<div class="autodata"><div class="small muted">' + (n.via === 'QR' ? 'Completado con su QR. El paciente autorizó compartir estos datos.' : 'Datos guardados por este laboratorio.') + '</div><div class="grid">' + row('Nombre', nm[0]) + row('Apellido', nm[1]) + row('Cédula', p.ci) + row('Teléfono', p.phone) + row('Correo', p.email) + row('Dirección', p.address) + '</div></div>';
    const k = h.indexOf('<h2>1. Paciente</h2>'); return k < 0 ? h : h.slice(0, k + 20) + card + h.slice(k + 20);
  };
  // el botón QR de la pantalla de nueva orden también abre la cámara
  const nuQ = V.lab.nueva; V.lab.nueva = function () { const h = nuQ(); return h.replace('<button class="btn ghost sm" type="button" data-a="no-qrok">Validar código QR</button>', '<button class="btn ghost sm" type="button" data-a="no-qrok">Validar código QR</button><button class="btn sm" type="button" data-a="dock" data-v="qr">Escanear con la cámara</button>'); };

  /* ---------- Paciente: dirección y QR ---------- */
  const pp0 = V.pat.perfil; V.pat.perfil = function () { let h = pp0(); const p = personOf(X.myPid()); if (p && (S.prof || 'datos') === 'datos') h = h.replace('<p class="small muted">El nombre y la cédula no se cambian aquí', X.fld('Dirección', 'pf-addr', { def: p.address || '', ph: 'Urbanización, calle, ciudad' }) + '<p class="small muted">El nombre y la cédula no se cambian aquí'); return h + more('pat'); };
  const ps0 = A['p-save']; A['p-save'] = function () { const p = personOf(X.myPid()); if (p) p.address = X.F('pf-addr', p.address || '').trim(); ps0(); };
  const pq0 = V.pat.qr; V.pat.qr = function () { return pq0() + '<div class="card"><h2>Lo que compartes al mostrar tu QR</h2><p class="small muted">Nombre, apellido, cédula, teléfono, correo y dirección. Solo los ve el laboratorio que escanea tu código, y solo esa vez.</p></div><div class="card"><h2>Dar acceso a mi médico</h2><p class="small muted">Escanea el QR de tu médico para que pueda ver tus resultados por 3 meses.</p><div class="row"><button class="btn" type="button" data-a="sc-doc">Escanear QR de mi médico</button></div></div>'; };
  A['sc-doc'] = function () { openScanner('pdoc'); };

  /* ---------- Perfil de todos: "Más opciones" y Configuración ---------- */
  function more(role) {
    const own = !S.auth.sub || S.auth.sub === 'owner';
    const t = role === 'lab' && own ? ['config', 'Configuración'] : role === 'adm' ? ['ajustes', 'Ajustes de LABS'] : null; if (!t) return '';
    return '<div class="card"><h2>Configuración</h2><div class="hub"><button type="button" class="tile" data-a="nav" data-v="' + t[0] + '"><span>' + t[1] + '</span></button></div></div>';
  }
  ['lab', 'doc', 'adm'].forEach(function (r) { const f = V[r].perfil; V[r].perfil = function () { return f() + more(r); }; });
  render();
})();
