/* LABS demo · rediseño v2 (parte 1): menú con iconos y menos opciones, pestañas, buscador global, conmutador flotante de la demo */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc;
  function render() { window.render(); }
  function isMob() { return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); }
  function sub() { return (S.auth && (S.auth.sub || 'owner')) || 'owner'; }

  /* ---------- Iconos ---------- */
  const IC = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    flask: '<path d="M9.5 3h5M10.5 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19L13.5 9V3"/><path d="M7.5 15h9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M19 20c-.4-1.9-1.4-3.4-2.8-4.3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95A7 7 0 0 0 14.1 5l-.35-2.5h-4L9.4 5a7 7 0 0 0-2.41 1.4l-2.35-.95-2 3.46 2 1.55a7 7 0 0 0 0 2.8l-2 1.55 2 3.46 2.35-.95A7 7 0 0 0 9.4 19l.35 2.5h4l.35-2.5a7 7 0 0 0 2.41-1.4l2.35.95 2-3.46-2-1.55c.09-.45.14-.92.14-1.4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 4h14l2 9v7H3v-7z"/>',
    user: '<circle cx="12" cy="7.5" r="3.8"/><path d="M4.5 20.5c.9-3.6 3.9-5.7 7.5-5.7s6.6 2.1 7.5 5.7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.2a2.7 2.7 0 0 1 5.3.8c0 1.8-2.6 2.2-2.6 3.8"/><circle cx="12" cy="17.2" r=".9"/>',
    bot: '<rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 7V3.5"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="13" r="1.1"/><circle cx="15" cy="13" r="1.1"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9.5V14"/><circle cx="12" cy="17" r=".9"/>',
    doc: '<path d="M6 2.5h8L19 7.5V21.5H6z"/><path d="M14 2.5V8h5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="5.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="m8.3 10.8 7-4M8.3 13.2l7 4"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4.5h6M9 11h6M9 15h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function ic(n) { return '<svg class="rdi-s" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
  window.RDI = { ic: ic, IC: IC };

  /* ---------- Grupos del menú (la pantalla real de cada opción sigue igual; solo cambia dónde vive) ---------- */
  const GROUPS = {
    lab: [
      { id: 'inicio', label: 'Inicio', ic: 'home', pages: ['inicio', 'menu'] },
      { id: 'atencion', label: 'Atender', ic: 'flask', pages: ['atencion', 'nueva', 'qrlab', 'pacientes'], tabs: ['atencion', 'nueva', 'qrlab', 'pacientes'] },
      { id: 'ordenes', label: 'Órdenes', ic: 'list', pages: ['ordenes', 'resultado'] },
      { id: 'negocio', label: 'Mi negocio', ic: 'chart', pages: ['resumen', 'catalogo', 'reportes', 'red'], tabs: ['resumen', 'catalogo', 'reportes', 'red'] },
      { id: 'mylab', label: 'Mi laboratorio', ic: 'gear', pages: ['firma', 'bots', 'equipo', 'suscripcion', 'config', 'perfil', 'soporte', 'avisos'], tabs: ['firma', 'bots', 'equipo', 'config', 'perfil', 'soporte'] }
    ],
    doc: [
      { id: 'inicio', label: 'Inicio', ic: 'home', pages: ['inicio', 'menu'] },
      { id: 'pacientes', label: 'Pacientes', ic: 'users', pages: ['lista', 'pedir'], tabs: ['lista', 'pedir'] },
      { id: 'sol', label: 'Solicitudes', ic: 'inbox', pages: ['sol'] },
      { id: 'cobros', label: 'Cobros', ic: 'wallet', pages: ['cobros'] },
      { id: 'perfil', label: 'Mi perfil', ic: 'user', pages: ['perfil', 'firma', 'carnet', 'avisos', 'soporte'], tabs: ['perfil', 'firma', 'carnet', 'soporte'] }
    ],
    adm: [
      { id: 'inicio', label: 'Inicio', ic: 'home', pages: ['inicio', 'menu', 'resumen'], tabs: null },
      { id: 'labs', label: 'Laboratorios', ic: 'flask', pages: ['labs', 'planes', 'usuarios', 'claves'], tabs: ['labs', 'planes', 'usuarios', 'claves'] },
      { id: 'pagos', label: 'Pagos', ic: 'wallet', pages: ['pagos'] },
      { id: 'red', label: 'Red', ic: 'globe', pages: ['red'] },
      { id: 'encuestas', label: 'Encuestas', ic: 'clip', pages: ['encuestas'] },
      { id: 'ajustes', label: 'Ajustes', ic: 'gear', pages: ['ajustes', 'registro', 'perfil', 'avisos'], tabs: ['ajustes', 'registro', 'perfil'] },
      { id: 'soporte', label: 'Soporte', ic: 'help', pages: ['soporte'] }
    ]
  };
  const TABLABEL = { atencion: 'Atender', nueva: 'Nueva orden', qrlab: 'QR para pacientes', pacientes: 'Mis pacientes', resumen: 'Resumen', catalogo: 'Exámenes y precios', reportes: 'Reportes', red: 'Red de laboratorios', firma: 'Firma y sello', bots: 'Bots de IA', equipo: 'Mi equipo', config: 'Configuración', perfil: 'Mi cuenta', soporte: 'Soporte', lista: 'Mis pacientes', pedir: 'Pedir acceso', carnet: 'Carnet del colegio', labs: 'Laboratorios', planes: 'Planes', usuarios: 'Usuarios', claves: 'Claves', ajustes: 'Ajustes', registro: 'Registro' };
  function visibleIds(role) { const s = sub(); return EXT.nav[role].filter(function (i) { return !i.sep && (!i.only || i.only.indexOf(s) >= 0); }).map(function (i) { return i.id; }); }
  function groupOf(role, page) { const g = GROUPS[role]; if (!g) return null; return g.filter(function (x) { return x.pages.indexOf(page) >= 0; })[0] || null; }
  function groupLabel(role, g) { if (role === 'lab' && sub() === 'recep' && g.id === 'mylab') return 'Mi cuenta'; return g.label; }
  function firstPage(role, g) { const vis = visibleIds(role); return g.pages.filter(function (p) { return vis.indexOf(p) >= 0 && p !== 'menu'; })[0] || g.pages[0]; }
  function groupTarget(role, g) { if (role === 'lab' && g.id === 'mylab' && sub() === 'recep') return 'perfil'; return firstPage(role, g); }

  A['gnav'] = function (v) { const p = v.split(':'); A['nav'](p[0]); };

  const side0 = U.side;
  U.side = function (items, cur, who, subt) {
    const role = S.role; const groups = GROUPS[role];
    if (!groups) return side0(items, cur, who, subt);
    const vis = visibleIds(role); const bad = {}; items.forEach(function (i) { if (!i.sep && i.badge) bad[i.id] = (bad[i.id] || 0) + (parseInt(i.badge, 10) || 0); });
    const mini = role === 'lab' && cur === 'resultado' && !isMob();
    const curG = groupOf(role, cur);
    const list = groups.filter(function (g) { return g.pages.some(function (p) { return vis.indexOf(p) >= 0; }); });
    const initials = String(who).split(/\s+/).filter(function (w) { return /^[A-Za-zÁÉÍÓÚÑ]/.test(w); }).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
    const head = mini ? '<div class="who"><div class="avatar" title="' + esc(who) + '">' + esc(initials) + '</div></div>' : '<div class="who"><b>' + esc(who) + '</b><small>' + esc(subt) + '</small></div>';
    return '<nav class="side' + (mini ? ' mini' : '') + '" aria-label="Menú">' + head + list.map(function (g) {
      const n = g.pages.reduce(function (s, p) { return s + (bad[p] || 0); }, 0); const on = curG && curG.id === g.id; const lab = groupLabel(role, g);
      return '<button type="button" data-a="nav" data-v="' + groupTarget(role, g) + '"' + (on ? ' aria-current="page"' : '') + (mini ? ' title="' + esc(lab) + '" aria-label="' + esc(lab) + '"' : '') + '>' +
        (mini ? ic(g.ic) : '<span class="sidei">' + ic(g.ic) + '<span>' + esc(lab) + '</span></span>') + (n ? '<span class="badge">' + n + '</span>' : '') + '</button>';
    }).join('') + '</nav>';
  };

  /* ---------- Pestañas dentro del grupo ---------- */
  function injectTabs() {
    const role = S.role; const g = S.auth ? groupOf(role, S[role]) : null; const main = document.querySelector('.shell:not(.mob) .main'); if (!g || !g.tabs || !main || isMob()) return;
    const vis = visibleIds(role); const tabs = g.tabs.filter(function (p) { return vis.indexOf(p) >= 0; }); if (tabs.length < 2) return; const page = S[role];
    const cur = tabs.indexOf(page) >= 0 ? page : (page === 'resultado' ? 'ordenes' : page);
    const html = '<div class="subtabs"><div class="seg" role="group" aria-label="Secciones">' + tabs.map(function (p) { return '<button type="button" data-a="nav" data-v="' + p + '" aria-pressed="' + (cur === p) + '">' + esc(TABLABEL[p] || p) + '</button>'; }).join('') + '</div></div>';
    const d = document.createElement('div'); d.innerHTML = html; main.insertBefore(d.firstChild, main.firstChild);
  }

  /* ---------- Buscador global (Ctrl K) ---------- */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  let gsEl = null, gsIn = null, gsRes = null, gsSel = [];
  function examNames(ids) { return ids.map(function (e) { return D.BY_ID[e] ? D.BY_ID[e].name : e; }).join(', '); }
  function openOrder(o) {
    const own = sub() === 'owner';
    if (o.paid && (o.status === 'Por procesar' || o.status === 'En proceso') && (own || (S.auto && S.auto.on))) return A['o-open'](o.id);
    if (o.status === 'Enviada') { A['nav']('ordenes'); S.f['o-q'] = o.id; S.ofilter = 'todas'; render(); return A['o-view'](o.id); }
    A['nav']('ordenes'); S.f['o-q'] = o.id; S.ofilter = 'todas'; render(); window.scrollTo(0, 0);
  }
  function searchAll(raw) {
    const q = norm(raw.trim()); if (q.length < 2) return []; const qd = q.replace(/\D/g, ''); const out = []; const role = S.role;
    function hit(t) { return norm(t).indexOf(q) >= 0; } function ciHit(p) { return qd.length >= 3 && String(p.ci || '').replace(/\D/g, '').indexOf(qd) >= 0; }
    if (role === 'lab') {
      S.orders.forEach(function (o) { const p = X.personOf(o.pid) || {}; const ex = examNames(o.exams); if (hit(o.id + ' ' + (p.name || '') + ' ' + ex) || ciHit(p)) out.push({ g: 'Órdenes', t: o.id + ' · ' + (p.name || ''), s: ex + ' · ' + o.status, go: function () { openOrder(o); } }); });
      S.patients.forEach(function (p) { if (p.name === 'Cuenta eliminada' || p.id === 'p7' || !S.orders.some(function (o) { return o.pid === p.id; })) return; if (hit(p.name) || ciHit(p)) out.push({ g: 'Pacientes', t: p.name, s: p.ci + (p.age ? ' · ' + p.age + ' años' : ''), go: function () { S.lab = 'pacientes'; A['pc-open'](p.id); } }); });
    }
    if (role === 'doc') { (S.docPatients || []).forEach(function (p, i) { if (hit(p.name + ' ' + p.exam) || ciHit({ ci: p.ci })) out.push({ g: 'Pacientes', t: p.name, s: p.ci + ' · ' + p.exam, go: function () { A['docopen'](i); } }); }); }
    if (role === 'adm') {
      S.labs.forEach(function (l, i) { if (hit(l.name + ' ' + l.city)) out.push({ g: 'Laboratorios', t: l.name, s: l.city + ' · ' + l.status, go: function () { A['nav']('labs'); } }); });
    }
    const vis = EXT.nav[role].filter(function (i) { return !i.sep && !i.hidden && i.id !== 'menu' && (!i.only || i.only.indexOf(sub()) >= 0); });
    vis.forEach(function (i) { if (hit(i.label) || (TABLABEL[i.id] && hit(TABLABEL[i.id]))) out.push({ g: 'Ir a', t: i.label, s: '', go: function () { A['nav'](i.id); } }); });
    if (role === 'adm' && (hit('encuesta') || hit('supuesto'))) out.push({ g: 'Ir a', t: 'Encuestas', s: 'Validar los supuestos del negocio', go: function () { A['nav']('encuestas'); } });
    return out.slice(0, 9);
  }
  function drawRes() {
    const q = gsIn.value; gsSel = searchAll(q);
    if (q.trim().length < 2) { gsRes.hidden = true; gsRes.innerHTML = ''; return; }
    let h = '', last = '';
    gsSel.forEach(function (r, i) { if (r.g !== last) { h += '<div class="gt">' + esc(r.g) + '</div>'; last = r.g; } h += '<button type="button" data-gs="' + i + '"' + (i === 0 ? ' class="on"' : '') + '><span><b>' + esc(r.t) + '</b>' + (r.s ? '<small>' + esc(r.s) + '</small>' : '') + '</span></button>'; });
    gsRes.innerHTML = h || '<div class="none">No encontré nada con “' + esc(q) + '”.</div>'; gsRes.hidden = false;
  }
  function pick(i) { const r = gsSel[i]; if (!r) return; gsIn.value = ''; gsRes.hidden = true; gsRes.innerHTML = ''; gsIn.blur(); r.go(); }
  function buildSearch() {
    if (gsEl) return; gsEl = document.createElement('div'); gsEl.className = 'gsearch-wrap'; gsEl.style.cssText = 'position:relative;width:100%';
    gsEl.innerHTML = '<div class="gsearch" role="search">' + ic('search') + '<input id="gs-in" type="search" autocomplete="off" placeholder="Buscar paciente, cédula u orden" aria-label="Buscar paciente, cédula u orden"><kbd>Ctrl K</kbd></div><div class="gs-res" id="gs-res" hidden></div>';
    gsIn = gsEl.querySelector('#gs-in'); gsRes = gsEl.querySelector('#gs-res');
    gsIn.addEventListener('input', drawRes);
    gsIn.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); const on = gsRes.querySelector('button.on'); pick(on ? parseInt(on.getAttribute('data-gs'), 10) : 0); }
      else if (ev.key === 'Escape') { gsIn.value = ''; gsRes.hidden = true; gsIn.blur(); }
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const bs = Array.prototype.slice.call(gsRes.querySelectorAll('button')); if (!bs.length) return; let k = bs.findIndex(function (b) { return b.classList.contains('on'); }); bs.forEach(function (b) { b.classList.remove('on'); }); k = (k + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs[k].classList.add('on'); }
    });
    gsRes.addEventListener('mousedown', function (ev) { const b = ev.target.closest('button[data-gs]'); if (b) { ev.preventDefault(); pick(parseInt(b.getAttribute('data-gs'), 10)); } });
    gsIn.addEventListener('focus', function () { if (gsIn.value.trim().length >= 2) drawRes(); });
    gsIn.addEventListener('blur', function () { setTimeout(function () { if (gsRes) gsRes.hidden = true; }, 120); });
  }
  document.addEventListener('keydown', function (ev) { if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K')) { if (gsIn && document.getElementById('gs-in')) { ev.preventDefault(); gsIn.focus(); gsIn.select(); } } });

  /* ---------- Conmutador flotante de la demo ---------- */
  const ROLES = [['lab', 'Laboratorio'], ['pat', 'Paciente'], ['doc', 'Médico'], ['adm', 'Superadmin']];
  function pill() {
    let el = document.getElementById('demopill');
    if (!S.auth) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'demopill'; document.body.appendChild(el); }
    const cur = ROLES.filter(function (r) { return r[0] === S.role; })[0] || ROLES[0];
    el.innerHTML = '<button type="button" class="dp" data-a="demo-menu" aria-haspopup="menu" aria-expanded="' + !!S.demoOpen + '" aria-label="Demo: viendo como ' + cur[1] + '. Cambiar">' + (isMob() ? 'Demo ▾' : 'Demo · ' + cur[1] + ' <span>Cambiar ▾</span>') + '</button>' +
      (S.demoOpen ? '<div class="dm" role="menu"><small>Ver la demo como…</small>' + ROLES.map(function (r) { return '<button type="button" role="menuitem" data-a="demo-go" data-v="' + r[0] + '" aria-pressed="' + (r[0] === S.role) + '">' + r[1] + '</button>'; }).join('') + '</div>' : '');
  }
  A['demo-menu'] = function () { S.demoOpen = !S.demoOpen; pill(); };
  A['demo-go'] = function (v) { S.demoOpen = false; A['demo'](v); };
  document.addEventListener('click', function (ev) { if (S.demoOpen && ev.target.isConnected && !ev.target.closest('#demopill')) { S.demoOpen = false; pill(); } });

  /* ---------- Enganche después de cada pintado ---------- */
  const post0 = window.UI_post;
  window.UI_post = function () {
    if (post0) post0();
    const roles = document.getElementById('roles');
    if (roles && S.auth) {
      if (!isMob() && S.role !== 'pat') { buildSearch(); roles.className = 'roles gs'; roles.innerHTML = ''; roles.appendChild(gsEl); }
      else { roles.className = 'roles'; roles.innerHTML = ''; }
    }
    pill(); injectTabs();
    if (window.RDI.afterPost) window.RDI.afterPost();
  };
  window.addEventListener('resize', function () { if (window.RDI.afterPost) window.RDI.afterPost(); });
  render();
})();
