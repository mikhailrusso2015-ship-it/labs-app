/* LABS demo · rediseño v2 (parte 2): pantallas del laboratorio L1 a L4 */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views, B = window.BOTS;
  const esc = U.esc, F = X.F; const ic = window.RDI.ic;
  function render() { window.render(); }
  function isMob() { return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches); }
  function isOwner() { return !S.auth || (S.auth.sub || 'owner') === 'owner'; }
  function findOrder(id) { return S.orders.filter(function (o) { return o.id === id; })[0]; }
  function live(o) { return o.status === 'Por procesar' || o.status === 'En proceso'; }
  function canLoad(o) { return o.paid && live(o) && (isOwner() || (S.auto && S.auto.on)); }
  function pname(pid) { const p = X.personOf(pid); return p ? p.name : '—'; }
  function exNames(ids) { return ids.map(function (e) { return D.BY_ID[e] ? D.BY_ID[e].name : e; }).join(', '); }

  /* Datos de ejemplo: dos órdenes con valores ya escritos, para que el bot tenga algo que mostrar */
  (function () {
    const a = findOrder('LAB-0143'); if (a && !a.draft) { a.draft = { 'rv-glu': '95', 'rv-col': '212' }; a.status = 'En proceso'; }
    const b = findOrder('LAB-0146'); if (b && !b.draft) { b.draft = { 'rv-tsh': '6.8' }; b.status = 'En proceso'; }
  })();

  /* ---------- Revisión del bot sobre lo que ya se escribió ---------- */
  function draftCol(o) {
    const d = o.draft || {}; const values = [];
    o.exams.forEach(function (id) { const c = D.BY_ID[id]; if (!c || ['range', 'max', 'min'].indexOf(c.kind) < 0) return; const x = parseFloat(d['rv-' + id]); if (isFinite(x) && x > 0) values.push({ id: id, v: x }); });
    return { values: values, pos: {}, texts: {}, cult: {}, reports: {}, errs: [] };
  }
  function botQueue() {
    const out = [];
    S.orders.forEach(function (o) {
      if (!live(o) || !o.draft) return; const col = draftCol(o); if (!col.values.length && !o.botHold) return;
      const rv = B.bio.review(o, X.personOf(o.pid), col, S.auto); const al = rv.checks.filter(function (c) { return c.k === 'critico' || c.k === 'revisar'; });
      if (!al.length && !o.botHold) return; const crit = al.some(function (c) { return c.k === 'critico'; });
      out.push({ o: o, crit: crit, t: al.length ? al[0].t : 'Marcada para revisión del bioanalista', n: al.length });
    });
    return out.sort(function (a, b) { return (b.crit ? 1 : 0) - (a.crit ? 1 : 0); });
  }
  const tob0 = A['res-tobio']; A['res-tobio'] = function () { const o = findOrder(S.ordSel); if (o) o.botHold = true; tob0(); };

  /* ---------- L1: tarjeta “El bot te pide revisar” en el Inicio ---------- */
  function botCard() {
    const q = botQueue();
    const rows = q.length ? q.slice(0, 4).map(function (x) {
      const o = x.o; const act = o.paid ? '<button class="btn ghost sm" type="button" data-a="o-open" data-v="' + o.id + '">Abrir</button>' : '<button class="btn ghost sm" type="button" data-a="o-pay" data-v="' + o.id + '">Cobrar primero</button>';
      return '<div class="qrow"><span class="qic ' + (x.crit ? 'crit' : 'warn') + '">' + ic(x.crit ? 'alert' : 'bot') + '</span><div class="qt"><b>' + esc(x.t) + '</b><div class="small muted">' + esc(o.id + ' · ' + pname(o.pid)) + (x.n > 1 ? ' · ' + x.n + ' alertas' : '') + '</div></div>' + act + '</div>';
    }).join('') : '<p class="small muted" style="margin:6px 0 0">Nada pendiente. Cuando el bot marque un resultado para revisar, aparece aquí.</p>';
    return '<div class="card botq" id="botq"><div class="row between"><h2>El bot te pide revisar</h2><span class="chip ' + (q.length ? (q.some(function (x) { return x.crit; }) ? 'crit' : 'warn') : 'ok') + '">' + (q.length ? q.length + (q.length === 1 ? ' pendiente' : ' pendientes') : 'Al día') + '</span></div>' + rows + '</div>';
  }
  const ini0 = V.lab.inicio;
  V.lab.inicio = function () {
    const h = ini0(); if (!isOwner()) return h;
    const k = h.indexOf('<div class="perrow">'); return k >= 0 ? h.slice(0, k) + botCard() + h.slice(k) : botCard() + h;
  };

  /* ---------- L2: órdenes compactas, con la acción principal a la vista ---------- */
  function mainAct(o) {
    if (!o.paid && o.status !== 'Anulada') return o.payRep ? ['rcpt-view', 'Ver comprobante', ''] : ['o-pay', 'Cobrar primero', ''];
    if (canLoad(o)) return ['o-open', o.status === 'En proceso' ? 'Continuar' : 'Cargar resultados', ''];
    if (o.status === 'Enviada') return ['o-view', 'Ver resultado', 'ghost'];
    if (o.status === 'Esperando paciente') return ['o-remind', 'Recordar', 'ghost'];
    return null;
  }
  function stateChip(o) {
    if (o.status === 'Anulada') return '<span class="chip crit">Anulada</span>';
    if (!o.paid) return o.payRep ? '<span class="chip warn">Pago por confirmar</span>' : '<span class="chip warn">Sin pagar</span>';
    const m = { 'Esperando paciente': ['gray', 'Esperando al paciente'], 'Por procesar': ['warn', 'Por cargar'], 'En proceso': ['warn', 'Cargando valores'], 'Enviada': ['ok', 'Enviada'] }[o.status] || ['gray', o.status];
    return '<span class="chip ' + m[0] + '">' + esc(m[1]) + '</span>';
  }
  function compactOrders() {
    if (S.role !== 'lab' || S.lab !== 'ordenes' || isMob()) return;
    document.querySelectorAll('#app .tcards.desk .acc').forEach(function (acc) {
      const b = acc.querySelector('.acch.dk .dk1 b'); if (!b) return; const o = findOrder(b.textContent.trim()); if (!o) return; const m = mainAct(o); if (!m) return;
      const d3 = acc.querySelector('.acch.dk .dk3'); if (d3) d3.innerHTML = stateChip(o);
      acc.classList.add('oa'); const d = document.createElement('div'); d.className = 'oact';
      d.innerHTML = '<button class="btn ' + m[2] + ' sm" type="button" data-a="' + m[0] + '" data-v="' + o.id + '">' + esc(m[1]) + '</button>'; acc.appendChild(d);
    });
  }

  /* ---------- L3: cargar valores en una sola pantalla ---------- */
  function prevVal(pid, id, skip) {
    const list = D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid && r.id !== skip && r.values.some(function (v) { return v.id === id; }); }); if (!list.length) return null;
    const r = list[0]; const x = r.values.filter(function (v) { return v.id === id; })[0]; return { v: x.v, when: (r.date.split(' de ')[1] || '').slice(0, 3) };
  }
  function pendList() {
    const cur = S.ordSel; const os = S.orders.filter(function (o) { return canLoad(o); });
    return '<div class="card pend"><div class="row between"><h2 style="font-size:17px">Por cargar</h2><span class="chip warn">' + os.length + '</span></div>' + (os.length ? os.map(function (o) {
      return '<button type="button" class="pi' + (o.id === cur ? ' on' : '') + '" data-a="o-open" data-v="' + o.id + '"' + (o.id === cur ? ' aria-current="true"' : '') + '><b>' + esc(o.id + ' · ' + pname(o.pid)) + '</b><span class="small muted">' + esc(exNames(o.exams).slice(0, 34) + ' · ' + o.when) + '</span></button>';
    }).join('') : '<p class="small muted">No hay más órdenes por cargar.</p>') + '</div>';
  }
  function steps(o) {
    const s = o.draft || Object.keys(S.f).some(function (k) { return /^rv-/.test(k) && S.f[k] !== ''; });
    return '<div class="pill-row"><span class="chip ' + (o.paid ? 'ok' : 'warn') + '">' + (o.paid ? '✓ Cobrada' : 'Sin cobrar') + '</span>' + (o.sample ? '<span class="chip ok" title="' + esc('Muestra ' + o.sample.type + ' · ' + o.sample.code + ' · ' + o.sample.when) + '">✓ Muestra ' + esc(o.sample.code) + '</span>' : '') +
      '<span class="chip" style="background:#fff;color:var(--deep)">' + (s ? '2 · Cargando valores' : '2 · Cargar valores') + '</span><span class="chip gray">3 · Enviar</span></div>';
  }
  function layoutResult() {
    if (S.role !== 'lab' || S.lab !== 'resultado') return; const o = findOrder(S.ordSel); const main = document.querySelector('#app .main'); if (!o || !main || main.querySelector('.rs2')) return; const p = X.personOf(o.pid) || {};
    /* Fuera la tarjeta de avance (pasa a la cabecera) y el “Volver” suelto */
    Array.prototype.slice.call(main.querySelectorAll(':scope > .card')).forEach(function (c) { const h = c.querySelector('h3'); if (h && /^Avance de la orden/.test(h.textContent)) c.remove(); });
    const hd = main.querySelector(':scope > .head'); if (hd && hd.querySelector('[data-v="ordenes"]')) hd.remove();
    const t = Array.prototype.slice.call(main.querySelectorAll(':scope > div')).filter(function (d) { const h = d.querySelector(':scope > h1'); return h && /^Resultados de la orden/.test(h.textContent); })[0];
    const top = document.createElement('div'); top.className = 'row between rhead'; top.style.marginBottom = '4px';
    top.innerHTML = '<div class="row">' + (isMob() ? '' : '<button class="btn ghost sm" type="button" data-a="nav" data-v="ordenes">‹ Órdenes</button>') + '<h1 style="font-size:24px;margin:0 0 0 6px">' + esc(o.id + ' · ' + (p.name || '')) + '</h1><span class="chip gray">' + esc((p.ci || '') + (p.age ? ' · ' + p.age + ' años' : '')) + '</span></div>' + steps(o);
    const bk = main.querySelector(':scope > .backbar');
    if (t) t.replaceWith(top); else main.insertBefore(top, main.firstChild); if (bk) main.insertBefore(bk, main.firstChild);
    /* Valores numéricos: una fila por examen */
    const ins = Array.prototype.slice.call(main.querySelectorAll('input[data-c^="f-rv-"]'));
    if (ins.length) {
      const cap = document.createElement('div'); cap.id = 'cap';
      let first = null;
      ins.forEach(function (inp) {
        const id = inp.getAttribute('data-c').slice(5); const c = D.BY_ID[id]; const card = inp.closest('.card'); if (!c || !card) return; if (!first) first = card;
        const chip = card.querySelector('#chip-' + id); const pv = prevVal(o.pid, id, o.id);
        const row = document.createElement('div'); row.className = 'lvrow';
        row.innerHTML = '<div><b style="font-size:15px">' + esc(c.name) + '</b><div class="small muted">' + (pv ? 'Anterior: ' + String(pv.v).replace('.', ',') + (pv.when ? ' (' + esc(pv.when) + ')' : '') : 'Sin resultado anterior') + '</div></div><label class="vin" aria-label="' + esc(c.name + ' en ' + c.unit) + '"></label><div class="small muted">Normal: ' + esc(U.normalText(c)) + '</div><div class="vchip"></div>';
        inp.setAttribute('aria-label', c.name + ' (' + c.unit + ')'); inp.setAttribute('data-vnext', '1');
        row.querySelector('.vin').appendChild(inp); const u = document.createElement('span'); u.className = 'u'; u.textContent = c.unit; row.querySelector('.vin').appendChild(u);
        if (chip) row.querySelector('.vchip').appendChild(chip);
        cap.appendChild(row); if (card !== first) card.remove(); else card.setAttribute('data-gone', '1');
      });
      if (first) {
        const outer = first.parentNode.closest('.card'); first.parentNode.insertBefore(cap, first); first.remove();
        if (outer) { const h2 = outer.querySelector(':scope > h2'); if (h2) { const r = document.createElement('div'); r.className = 'row between'; r.innerHTML = '<h2>Escribe los valores</h2><span class="small muted"><b class="kbd">Enter</b> pasa al siguiente · <span id="autosv">se guarda solo</span></span>'; h2.replaceWith(r); }
          const dr = outer.querySelector('[data-a="res-draft"]'); if (dr) { const rw = dr.closest('.row'); (rw || dr).remove(); } }
      }
    }
    /* Dos columnas: pendientes a la izquierda, trabajo a la derecha */
    const grid = document.createElement('div'); grid.className = 'rs2'; const left = document.createElement('div'); left.innerHTML = pendList(); const right = document.createElement('div'); right.className = 'rcol'; right.style.cssText = 'display:flex;flex-direction:column;gap:14px;min-width:0';
    Array.prototype.slice.call(main.children).forEach(function (ch) { if (ch !== top && ch !== bk && !ch.classList.contains('subtabs')) right.appendChild(ch); });
    grid.appendChild(left.firstChild); grid.appendChild(right); main.appendChild(grid);
  }
  /* Enter = siguiente valor; se guarda solo */
  document.addEventListener('keydown', function (ev) {
    const t = ev.target; if (ev.key !== 'Enter' || !t.getAttribute || !t.getAttribute('data-vnext')) return; ev.preventDefault();
    const all = Array.prototype.slice.call(document.querySelectorAll('input[data-vnext]')); const i = all.indexOf(t);
    if (i >= 0 && i < all.length - 1) { all[i + 1].focus(); all[i + 1].select(); } else { const bb = document.getElementById('botbio'); if (bb) bb.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.blur(); }
  });
  let saveT = null;
  function autosave() {
    const o = findOrder(S.ordSel); if (!o || S.lab !== 'resultado') return; o.draft = {};
    Object.keys(S.f).forEach(function (k) { if (/^(rv|rt|rh|rc|ri|rby|rp|rd|ro|rn|ra)-/.test(k)) o.draft[k] = S.f[k]; });
    if (o.status === 'Por procesar') o.status = 'En proceso'; const s = document.getElementById('autosv'); if (s) s.textContent = 'Guardado ' + U.nowTime();
  }
  const fill0 = A['res-fill']; A['res-fill'] = function (v) { fill0(v); autosave(); };
  const op = EXT.onInputP; EXT.onInputP = function (n, t) { if (op) op(n, t); if (/^(rv|rt|rp|rd|ro|rh|rc|rn|ra)-/.test(n)) { clearTimeout(saveT); saveT = setTimeout(autosave, 600); } };

  /* Bot bioanalista más corto: lo que importa arriba, el detalle plegado si todo está bien */
  function compactBot() {
    const bb = document.getElementById('botbio'); if (!bb || bb.getAttribute('data-c2')) return; bb.setAttribute('data-c2', '1');
    const ul = bb.querySelector('ul.bl'); const ok = !!bb.querySelector('[data-a="res-send"][data-v="auto"]');
    if (ul && ok) { const d = document.createElement('details'); d.className = 'bdet'; d.innerHTML = '<summary>Ver lo que revisó el bot (' + ul.children.length + ')</summary>'; ul.parentNode.insertBefore(d, ul); d.appendChild(ul); }
    const rel = bb.querySelector('[data-a="res-send"][data-v="auto"]'); if (rel) rel.innerHTML = '⚡ Liberar resultado';
    const h2 = bb.querySelector('h2'); if (h2 && !bb.querySelector('.tgic')) { const s = document.createElement('span'); s.className = 'tgic'; s.style.cssText = 'width:36px;height:36px;border-radius:12px;background:var(--tint);color:var(--deep);display:inline-flex;align-items:center;justify-content:center;flex:none'; s.innerHTML = ic('bot'); h2.parentNode.insertBefore(s, h2); }
  }
  const rb0 = EXT.onInputP; EXT.onInputP = function (n, t) { if (rb0) rb0(n, t); setTimeout(compactBot, 0); };
  document.addEventListener('change', function () { setTimeout(compactBot, 0); });

  /* ---------- L4: nueva orden con barra de total fija y un solo botón de QR ---------- */
  function effEx(n) { const s = []; (n.pkgs || []).forEach(function (id) { const p = D.PACKAGES.filter(function (x) { return x.id === id; })[0]; if (p) p.items.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); }); n.exams.forEach(function (e) { if (s.indexOf(e) < 0) s.push(e); }); return s; }
  function priceNo(n) { let t = 0; const cov = []; (n.pkgs || []).forEach(function (id) { const p = D.PACKAGES.filter(function (x) { return x.id === id; })[0]; if (!p) return; t += p.price; p.items.forEach(function (e) { cov.push(e); }); }); n.exams.forEach(function (e) { if (cov.indexOf(e) < 0) t += D.BY_ID[e].price; }); return t; }
  function totBar() {
    let bar = document.getElementById('totbar'); const on = S.auth && S.role === 'lab' && S.lab === 'nueva' && !S.modal;
    document.body.classList.toggle('has-bar', !!on); if (!on) { if (bar) bar.remove(); return; }
    const main = document.querySelector('#app .main'); if (!main) return;
    const qb = main.querySelector('button[data-a="no-qrok"]'); if (qb) qb.remove();
    const crt = main.querySelector('button[data-a="no-create"]'); const tc = crt && crt.closest('.card'); if (tc) tc.style.display = 'none';
    const paid = main.querySelector('input[data-c="f-no-paid"]'); if (paid) { const lb = paid.closest('label'); if (lb) lb.style.display = 'none'; }
    const qi = main.querySelector('input[data-c="f-no-qr"]'); if (qi) { qi.setAttribute('data-enter', 'no-qrok'); const hint = qi.closest('label'); if (hint && !hint.getAttribute('data-h')) { hint.setAttribute('data-h', '1'); hint.firstChild.textContent = 'O escribe el código QR del paciente y pulsa Enter'; } }
    const n = S.no; const ex = effEx(n); const usd = priceNo(n); const cur = F('no-cur', 'bcv'); const rate = cur === 'usd' ? 1 : cur === 'manual' ? S.manualRate : D.RATES[cur].value; const p = n.pid ? X.personOf(n.pid) : null;
    const err = S.err.no ? '<div class="err" role="alert">' + esc(S.err.no) + '</div>' : '';
    if (!bar) { bar = document.createElement('div'); bar.id = 'totbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Total de la orden'); document.body.appendChild(bar); }
    const sd = document.querySelector('#app .side'); const mob = isMob();
    if (mob) { bar.style.left = '10px'; bar.style.right = '10px'; bar.style.bottom = (document.body.classList.contains('has-dock') ? 96 : 12) + 'px'; }
    else { const r = sd ? sd.getBoundingClientRect() : null; bar.style.left = (r ? Math.round(r.right + 18) : 24) + 'px'; const mr = main.getBoundingClientRect(); bar.style.right = Math.max(12, Math.round(document.documentElement.clientWidth - mr.right)) + 'px'; bar.style.bottom = '14px'; }
    bar.innerHTML = '<div class="tb1"><b>' + (ex.length ? ex.length + (ex.length === 1 ? ' examen' : ' exámenes') + ' · ' + L.fmtUsd(usd) : 'Marca los exámenes') + '</b><div class="small muted">' + (ex.length && cur !== 'usd' ? L.fmtBs(usd * rate) + ' a la tasa elegida · ' : '') + (p ? esc(p.name) : 'Falta elegir al paciente') + '</div></div>' +
      '<button class="btn ghost" type="button" data-a="no-make" data-v="0">' + (mob ? 'Sin cobrar' : 'Guardar sin cobrar') + '</button><button class="btn" type="button" data-a="no-make" data-v="1">' + (mob ? 'Cobrar y crear' : 'Cobrar y crear la orden') + '</button>' + err;
  }
  A['no-make'] = function (v) { S.f['no-paid'] = v === '1'; A['no-create'](); };
  /* El código QR se valida solo cuando está completo */
  const oi0 = EXT.onInput['no-qr']; EXT.onInput['no-qr'] = function (t) { if (oi0) oi0(t); if (/^LABS-\d{4}-[A-Z0-9]{4}$/i.test(String(t.value).trim())) { S.f['no-qr'] = String(t.value).trim(); A['no-qrok'](); } };

  /* ---------- Enganche ---------- */
  const ap0 = window.RDI.afterPost;
  window.RDI.afterPost = function () { if (ap0) ap0(); try { compactOrders(); layoutResult(); compactBot(); } catch (e) { console.error(e); } totBar(); };
  render();
})();
