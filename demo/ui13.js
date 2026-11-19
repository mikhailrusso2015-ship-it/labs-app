/* LABS demo · rediseño v2 (parte 3): paciente P1 a P5 y médico M1 */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc; const ic = window.RDI.ic;
  function render() { window.render(); }
  function isMob() { return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); }
  const LVC = { normal: 'var(--primary)', vigilar: 'var(--warn)', alto: 'var(--warn)', bajo: 'var(--warn)', urgente: 'var(--crit)' };
  function tone(worst) { return worst === 'normal' ? 'ok' : worst === 'urgente' ? 'crit' : 'warn'; }
  function fmt(v) { return String(v).replace('.', ','); }

  /* ---------- P1: semáforo en anillo ---------- */
  function ring(n, tot, t) {
    const R = 27, C = 2 * Math.PI * R, f = tot ? n / tot : 1; const col = t === 'ok' ? '#1F8A5B' : t === 'crit' ? '#B3261E' : '#B45309'; const bg = t === 'ok' ? 'rgba(31,138,91,.18)' : t === 'crit' ? 'rgba(179,38,30,.16)' : 'rgba(180,83,9,.18)';
    return '<div class="rg" role="img" aria-label="' + n + ' de ' + tot + ' valores en el margen normal"><svg viewBox="0 0 66 66"><circle cx="33" cy="33" r="' + R + '" fill="none" stroke="' + bg + '" stroke-width="8"/><circle cx="33" cy="33" r="' + R + '" fill="none" stroke="' + col + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg><b>' + n + '/' + tot + '</b></div>';
  }
  function headline(s) {
    if (s.worst === 'normal') return ['Todo en el margen normal', 'Tus ' + s.rows.length + ' valores están bien. Guarda este resultado para tu próxima consulta.'];
    if (s.worst === 'urgente') return ['Atención hoy', 'Hay un valor que no debe esperar. Comunícate hoy con tu médico o ve a emergencias.'];
    const out = s.rows.length - s.normal; return ['Para vigilar, sin urgencia', out + ' de ' + s.rows.length + (out === 1 ? ' valor está' : ' valores están') + ' fuera del margen. Llévale este resultado a tu médico.'];
  }

  /* ---------- P2: valores con una barra fina ---------- */
  function scale(c, v) {
    let a, b;
    if (c.kind === 'range') { const w = (c.hi - c.lo) || 1; a = Math.max(0, c.lo - w * 0.7); b = c.hi + w * 0.7; }
    else if (c.kind === 'max') { a = 0; b = c.hi * 1.7; } else if (c.kind === 'min') { a = 0; b = c.lo * 2.2; } else return null;
    if (v > b) b = v * 1.08; if (v < a) a = v * 0.92; const pc = function (x) { return Math.max(0, Math.min(100, (x - a) / (b - a) * 100)); };
    const zl = c.kind === 'max' ? 0 : pc(c.lo), zr = c.kind === 'min' ? 100 : pc(c.hi);
    return { zl: zl, zw: Math.max(2, zr - zl), dot: pc(v) };
  }
  function valuesCard(s) {
    return '<div class="row between"><h2>Tus valores</h2><span class="small muted">la zona azul es lo normal</span></div>' + s.rows.map(function (x) {
      const sc = scale(x.c, x.v); const lv = x.level === 'normal' ? '' : x.level === 'urgente' ? 'crit' : 'warn';
      return '<div class="vr"><div><b class="nm">' + esc(x.name) + '</b>' + (sc ? '<div class="thin" aria-hidden="true"><span class="zn" style="left:' + sc.zl.toFixed(1) + '%;width:' + sc.zw.toFixed(1) + '%"></span><span class="dt" style="left:' + sc.dot.toFixed(1) + '%;background:' + (LVC[x.level] || 'var(--primary)') + '"></span></div>' : '') +
        '<span class="lv ' + lv + '">' + esc(x.label) + '</span></div><div><div class="big">' + esc(fmt(x.v)) + '</div><div class="un">' + esc(x.unit || '') + (x.c.kind === 'none' ? '' : ' · ' + esc(U.normalText(x.c))) + '</div></div></div>';
    }).join('');
  }

  /* ---------- Paciente: pantalla del resultado ---------- */
  function patResult() {
    if (S.role !== 'pat' || S.pat !== 'lista' || S.resIdx === null || S.resIdx === undefined) return false; const r = D.PATIENT_RESULTS[S.resIdx]; const main = document.querySelector('#app .main'); if (!r || !main) return false;
    /* G6: un solo “Atrás” en el teléfono; en la computadora queda uno claro */
    main.querySelectorAll('button[data-a="p-back"]').forEach(function (b) { if (isMob()) { const w = b.parentElement; if (w && w.children.length === 1) w.remove(); else b.remove(); } else b.textContent = '‹ Mis resultados'; });
    const s = r.values.length ? L.summarize(r.values) : null;
    if (s) {
      const cards = Array.prototype.slice.call(main.querySelectorAll('.card'));
      const sumC = cards.filter(function (c) { return /background:\s*var\(--(ok|warn|crit)-bg\)/.test(c.getAttribute('style') || '') && c.querySelector(':scope > h2'); })[0];
      if (sumC && !sumC.classList.contains('ringcard')) { const t = tone(s.worst); const hl = headline(s); sumC.classList.add('ringcard'); sumC.innerHTML = ring(s.normal, s.rows.length, t) + '<div><h2>' + esc(hl[0]) + '</h2><div class="small">' + esc(hl[1]) + '</div></div>'; }
      const vc = cards.filter(function (c) { const h = c.querySelector(':scope > h2'); return h && h.textContent.trim() === 'Tus valores'; })[0];
      if (vc) { vc.classList.add('pv2'); vc.innerHTML = valuesCard(s); }
    }
    /* P5: médico virtual plegado (abierto solo si hay algo urgente) */
    const mv = main.querySelector('.card.botc'); if (mv && !mv.querySelector('details.mvd')) {
      const hd = mv.querySelector(':scope > .row'); const lead = mv.querySelector(':scope > p > b'); const crit = mv.classList.contains('lv2');
      const d = document.createElement('details'); d.className = 'mvd'; if (crit) d.open = true; const sm = document.createElement('summary'); sm.className = 'mvs';
      if (hd) sm.appendChild(hd); if (lead) { const p = document.createElement('p'); p.style.margin = '6px 0 0'; p.textContent = lead.textContent; sm.appendChild(p); lead.closest('p').remove(); }
      const more = document.createElement('span'); more.className = 'mvmore'; more.textContent = 'Ver la explicación completa'; sm.appendChild(more);
      d.appendChild(sm); const body = document.createElement('div'); body.className = 'mvb'; Array.prototype.slice.call(mv.childNodes).forEach(function (n) { body.appendChild(n); }); d.appendChild(body); mv.appendChild(d);
    }
    /* P3: barra fija de acciones, encima de la barra de abajo del teléfono */
    const row = main.querySelector('button[data-a="p-pdf"]'); const rw = row && row.closest('.row'); if (rw && rw.querySelector('[data-a="p-share"]')) rw.remove();
    return true;
  }
  function actBar(on) {
    let bar = document.getElementById('actbar'); document.body.classList.toggle('has-act', !!on); if (!on || S.modal) { if (bar) bar.remove(); if (!on) return; if (S.modal) return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'actbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Acciones del resultado'); document.body.appendChild(bar); }
    const i = S.resIdx; bar.innerHTML = '<button type="button" class="ib" data-a="p-pdf" data-i="' + i + '" aria-label="Ver el documento firmado" title="Documento firmado">' + ic('doc') + '</button>' +
      '<button type="button" class="ib" data-a="bm-ver" data-v="' + i + '" aria-label="Ver el informe para tu médico sin descargarlo" title="Informe para tu médico">' + ic('eye') + '</button>' +
      '<button type="button" class="btn" data-a="p-share" data-i="' + i + '"><span class="rdi" style="display:inline-flex">' + ic('share') + '</span>Compartir con mi médico</button>';
    place(bar);
  }
  function place(bar) {
    if (!bar) return; const dock = document.querySelector('#dock:not([hidden]) .dock-in') || document.querySelector('#dock:not([hidden])');
    if (isMob() && dock) { const r = dock.getBoundingClientRect(); const top = r.top + (dock.querySelector('.dock-bg') ? 4 : 0); bar.style.bottom = Math.max(8, Math.round(window.innerHeight - top + 10)) + 'px'; }
    else bar.style.bottom = '16px';
    if (!isMob()) { const m = document.querySelector('#app .main'); if (m) { const mr = m.getBoundingClientRect(); bar.style.left = Math.round(mr.left + mr.width / 2) + 'px'; } } else bar.style.left = '50%';
  }
  window.addEventListener('resize', function () { place(document.getElementById('actbar')); });

  /* ---------- P4: inicio del paciente: el último resultado arriba; el QR del laboratorio, en una línea ---------- */
  const pin0 = V.pat.inicio;
  V.pat.inicio = function () {
    let h = pin0();
    h = h.replace(/<div class="card"><h2>¿Estás en un laboratorio\?<\/h2>[\s\S]*?data-a="sc-lab">Escanear QR del laboratorio<\/button><\/div><\/div>/, '<button type="button" class="card slimqr" data-a="sc-lab"><span class="tgic">' + ic('flask') + '</span><span class="t"><b>¿Estás en un laboratorio?</b><small>Escanea su QR y adelanta tu orden sin hacer fila</small></span><i class="chev" aria-hidden="true">›</i></button>');
    const pid = X.myPid(); const all = D.PATIENT_RESULTS.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.pid === pid; }); if (!all.length) return h;
    const last = all[0]; const s = last.r.values.length ? L.summarize(last.r.values) : null; const t = s ? tone(s.worst) : 'ok'; const lab = s ? headline(s)[0] : 'Informe';
    const card = '<div class="card lastres"><div class="row between"><h2>Tu último resultado</h2><span class="chip ' + (s ? t : 'gray') + '">' + esc(s ? (s.worst === 'normal' ? 'Todo bien' : s.worst === 'urgente' ? 'Atención hoy' : 'Para vigilar') : 'Informe') + '</span></div>' +
      '<b style="font-size:16px">' + esc(last.r.title) + '</b><div class="small muted">' + esc(last.r.lab + ' · ' + last.r.date) + (s ? ' · ' + esc(lab.toLowerCase()) : '') + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="btn" type="button" data-a="p-goto" data-v="' + last.i + '" style="flex:1;justify-content:center">Ver resultado</button>' + (all.length > 1 ? '<button class="btn ghost" type="button" data-a="nav" data-v="lista">Anteriores (' + (all.length - 1) + ')</button>' : '') + '</div></div>';
    return h.replace(/(<div class="card dark dashhero">[\s\S]*?<\/div><\/div>)/, function (m) { return m + card; });
  };
  A['p-goto'] = function (v) { S.pat = 'lista'; S.resIdx = null; A['p-open'](v); };

  /* ---------- M1: ficha del paciente compacta (médico) ---------- */
  const dl0 = V.doc.lista;
  V.doc.lista = function () {
    const h = dl0(); const P = S.docPatients; if (S.docOpen === null || S.docOpen === undefined || !P[S.docOpen]) return h; const p = P[S.docOpen];
    const ini = String(p.name).replace(/^Paciente\s+/, '').split(/[\s.]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
    const al = X.alertsOf ? X.alertsOf(p.pid) : 0;
    const card = '<div class="card"><div class="dfile"><div class="av" aria-hidden="true">' + esc(ini) + '</div><div class="nm"><div class="row"><h2 style="margin:0">' + esc(p.name) + '</h2><span class="chip gray">Cédula ' + esc(p.ci) + '</span></div>' +
      '<div class="row" style="margin-top:4px"><span class="chip gray">' + esc(p.scope) + '</span><span class="chip gray">Acceso hasta ' + esc(p.until) + '</span>' + (al ? '<span class="chip warn">' + al + (al === 1 ? ' aviso' : ' avisos') + '</span>' : '<span class="chip ok">Sin avisos</span>') + '</div></div>' +
      '<div class="row"><button class="btn" type="button" data-a="dx-new" data-v="">Pedir un examen</button><button class="btn ghost" type="button" data-a="rx-open" data-v="' + p.pid + '">Recetar</button></div></div></div>';
    return h.replace(/<div class="card"><h2>[^<]*<\/h2><div class="small muted">Cédula [^<]*<\/div><div class="row">[\s\S]*?<\/div><div class="btnrow">[\s\S]*?<\/div><\/div>/, card);
  };

  /* ---------- Enganche ---------- */
  const ap0 = window.RDI.afterPost;
  window.RDI.afterPost = function () { if (ap0) ap0(); let on = false; try { on = patResult(); } catch (e) { console.error(e); } actBar(on); };
  render();
})();
