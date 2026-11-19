/* LABS demo · pantallas de los 2 bots de IA (bot bioanalista y bot médico) */
(function () {
  const L = window.LABS, D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views, B = window.BOTS;
  const esc = U.esc, F = X.F, fld = X.fld, dlg = X.dlg;
  function render() { window.render(); }
  function isOwner() { return !S.auth || (S.auth.sub || 'owner') === 'owner'; }
  function findOrder(id) { return S.orders.filter(function (x) { return x.id === (id || S.ordSel); })[0]; }

  // Autoverificación: la enciende y la apaga el bioanalista. Cifras de semana: EJEMPLO.
  S.auto = { on: true, by: 'Lic. Carla Mendoza', at: '14 nov 2026', off: {}, released: 0, week: { auto: 412, review: 38, crit: 3 } };

  // Menú: la pantalla de los bots, y recepción puede cargar resultados cuando la autoverificación está encendida
  (function () {
    const nav = EXT.nav.lab; const i = nav.map(function (n) { return n.id; }).indexOf('firma');
    nav.splice(i + 1, 0, { id: 'bots', label: 'Bots de IA', only: ['owner'] });
    nav.forEach(function (n) { if (n.id === 'resultado') n.only = ['owner', 'recep']; });
  })();

  /* ---------- Bot bioanalista dentro de “Resultado” ---------- */
  const SYM = { ok: '✓', revisar: '!', critico: '✕', info: 'i' };
  function bioInner(o) {
    const p = X.personOf(o.pid); const col = EXT.resCollect(o); const done = col.errs.length === 0; const rv = B.bio.review(o, p, col, S.auto);
    const any = rv.total || Object.keys(col.pos).length || Object.keys(col.texts).length || Object.keys(col.cult).length || Object.keys(col.reports).length;
    let chip, lead = '', act = '';
    if (!done) { chip = '<span class="chip gray">Esperando los resultados</span>'; lead = 'Escribe todos los resultados. El bot los revisa mientras escribes. ' + (col.errs[0] ? '<span class="muted">Falta: ' + esc(col.errs[0]) + '</span>' : ''); }
    else if (rv.decision === 'auto') {
      chip = '<span class="chip ok">Puede salir solo</span>'; lead = 'Todo cumple las reglas que aprobó ' + esc(S.auto.by) + '. Este resultado sale sin pasar por la mano del bioanalista, con la nota “Autoverificado”.';
      act = '<div class="row"><button class="btn" type="button" data-a="res-send" data-v="auto">Liberar resultado (autoverificado)</button></div>' + (isOwner() ? '' : X.errBox('sd'));
    } else if (rv.decision === 'critico') {
      chip = '<span class="chip crit">Valor crítico</span>'; lead = 'No puede salir solo. Alguien debe avisar al paciente o a su médico antes de enviarlo.';
      act = isOwner() ? '' : '<div class="row"><button class="btn" type="button" data-a="res-tobio">Pasar al bioanalista ahora</button></div>';
    } else {
      chip = '<span class="chip warn">Lo revisa el bioanalista</span>'; lead = 'El bot encontró algo que debe ver una persona. Las alertas están abajo.';
      act = isOwner() ? '' : '<div class="row"><button class="btn" type="button" data-a="res-tobio">Pasar al bioanalista</button></div>';
    }
    const list = any ? '<ul class="bl">' + rv.checks.map(function (c) { return '<li class="bchk k-' + c.k + '"><span class="bi" aria-hidden="true">' + SYM[c.k] + '</span><div><b>' + esc(c.t) + '</b>' + (c.x ? '<div class="small muted">' + esc(c.x) + '</div>' : '') + '</div></li>'; }).join('') + '</ul>' : '';
    return '<div class="row between"><div class="bh"><h2>Bot bioanalista</h2><span class="chip gray">IA</span></div>' + chip + '</div><p class="small">' + lead + '</p>' + list + act + '<p class="small muted">El laboratorio sigue siendo el responsable de cada resultado. <button class="btn ghost sm" type="button" data-a="nav" data-v="bots">Ver las reglas</button></p>';
  }
  const rs0 = V.lab.resultado;
  V.lab.resultado = function () {
    const h = rs0(); const o = findOrder(); if (!o) return h; const mark = '<div class="card"><h2>2. Revisa y firma</h2>'; const card = '<div class="card botc" id="botbio">' + bioInner(o) + '</div>';
    if (isOwner()) return h.indexOf(mark) >= 0 ? h.replace(mark, card + mark) : h + card;
    const i = h.indexOf(mark); return (i < 0 ? h : h.slice(0, i)) + card;
  };
  function refreshBio() { if (S.role !== 'lab' || S.lab !== 'resultado') return; const el = document.getElementById('botbio'); const o = findOrder(); if (el && o) el.innerHTML = bioInner(o); }
  const op = EXT.onInputP; EXT.onInputP = function (n, t) { if (op) op(n, t); if (/^(rv|rt|rp|rd|ro|rh|rc|rn|ra)-/.test(n)) refreshBio(); };
  document.addEventListener('change', function (ev) { const c = ev.target.getAttribute && ev.target.getAttribute('data-c'); if (c && /^f-(rv|rt|rp|rd|ro|rh|rc|rn|ra)-/.test(c)) setTimeout(refreshBio, 0); });
  A['res-tobio'] = function () {
    const o = findOrder(); A['res-draft'](); X.notify('lab', 'El bot marcó la orden ' + o.id + ' para revisión del bioanalista.', { type: 'go', ref: 'ordenes' });
    U.logAudit(S.auth.name, 'Pasó la orden ' + o.id + ' al bioanalista (alerta del bot)'); S.lab = 'ordenes'; S.err = {}; U.toast('Listo. La orden pasó al bioanalista con las alertas del bot.'); render(); window.scrollTo(0, 0);
  };

  /* ---------- Pantalla “Bots de IA” del laboratorio ---------- */
  const KEY = ['glu', 'col', 'hdl', 'ldl', 'tri', 'ure', 'cre', 'hem', 'hct', 'plq', 'tgo', 'tgp', 'tsh', 'ori', 'hec'];
  function stateOf(id) { const a = B.bio.agree(id); if (!S.auto.on) return ['gray', 'Lo revisa una persona']; if (S.auto.off[id]) return ['warn', 'Apagado']; return a.ready ? ['ok', 'Sale solo'] : ['warn', 'En prueba']; }
  V.lab.bots = function () {
    const a = S.auto, cov = B.coverage();
    const rows = KEY.filter(function (id) { return D.BY_ID[id]; }).map(function (id) { const c = D.BY_ID[id], g = B.bio.agree(id), st = stateOf(id); return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + L.fmtInt(g.n) + '</td><td>' + String(g.ok).replace('.', ',') + ' %</td><td><span class="chip ' + st[0] + '">' + st[1] + '</span></td><td><button class="btn ghost sm" type="button" data-a="au-ex" data-v="' + id + '">' + (a.off[id] ? 'Encender' : 'Apagar') + '</button></td></tr>'; }).join('');
    const covRows = cov.map(function (c) { return '<tr><td><b>' + esc(c.n) + '</b></td><td>' + esc(c.bio) + '</td><td>' + esc(c.med) + '</td><td><span class="chip ' + (c.st === 'ok' ? 'ok' : c.st === 'part' ? 'warn' : 'gray') + '">' + (c.st === 'ok' ? 'Listo' : c.st === 'part' ? 'Por informe' : 'Próximo') + '</span><div class="small muted">' + esc(c.note) + '</div></td></tr>'; }).join('');
    return '<div class="head"><div><h1>Bots de IA</h1><p>Dos ayudantes que trabajan dentro de LABS, de día y de noche.</p></div></div>' +
      '<div class="card note small"><p><b>Esto es una demostración.</b> Los bots de esta versión funcionan con reglas médicas escritas a mano, para mostrar cómo trabajan. En la versión real se conectan a un modelo de inteligencia artificial y se prueban con casos reales antes de abrirlos. Las cifras de esta pantalla son de ejemplo.</p></div>' +
      '<div class="card botc"><div class="row between"><div class="bh"><h2>Bot bioanalista · autoverificación</h2><span class="chip gray">IA</span></div><span class="chip ' + (a.on ? 'ok' : 'gray') + '">' + (a.on ? 'Encendida' : 'Apagada') + '</span></div>' +
      '<p>Revisa cada resultado antes de que salga. Si cumple todas las reglas, sale solo. Si no, lo ve una persona. Las reglas las aprobó <b>' + esc(a.by) + '</b> el ' + esc(a.at) + ' y puede apagarlas cuando quiera.</p>' +
      '<div class="row"><button class="btn ' + (a.on ? 'ghost' : '') + '" type="button" data-a="au-toggle">' + (a.on ? 'Apagar la autoverificación' : 'Encender la autoverificación') + '</button></div>' +
      '<div class="grid two" style="margin-top:6px"><div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><h3>Esta semana (ejemplo)</h3><p><b style="font-size:22px">' + a.week.auto + '</b> salieron solos<br><b style="font-size:22px">' + a.week.review + '</b> pasaron al bioanalista<br><b style="font-size:22px">' + a.week.crit + '</b> valores críticos avisados</p>' + (a.released ? '<p class="small muted">En esta sesión salieron solos: ' + a.released + '.</p>' : '') + '</div>' +
      '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.55)"><h3>Las reglas, en palabras simples</h3><ul class="clean small"><li>Todos los valores dentro del margen normal.</li><li>Ningún valor imposible, crítico o con unidad rara.</li><li>Sin cambios bruscos frente al resultado anterior.</li><li>Los valores cuadran entre sí (por ejemplo, las grasas o la hemoglobina y el hematocrito).</li><li>Solo salen solos los negativos que no son sensibles.</li><li>El examen tiene al menos ' + L.fmtInt(B.bio.MIN_N) + ' revisiones y ' + B.bio.MIN_OK + ' % de coincidencia con el bioanalista.</li></ul></div></div>' +
      '<div class="card note small"><p><b>Siempre lo ve una persona:</b> valores críticos, positivos, resultados sensibles, cultivos, informes de imagen, biopsias y todo lo que el bot no entienda.</p></div></div>' +
      '<div class="card"><h2>Qué exámenes salen solos</h2><p class="small muted">Se muestran los más pedidos. Un examen sale solo cuando el bot coincide con el bioanalista en 99 de cada 100 revisiones, con al menos 1.000 revisiones.</p><div class="tw" data-keep-table="1"><table style="min-width:640px"><thead><tr><th>Examen</th><th>Revisiones (ejemplo)</th><th>Coincide con el bioanalista</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card botc"><div class="row between"><div class="bh"><h2>Bot médico · lectura del resultado</h2><span class="chip gray">IA</span></div></div>' +
      '<p>Lee todo el resultado junto y se lo explica al paciente en palabras simples. No firma nada y no cambia el resultado.</p><div class="grid two"><div><h3>Qué hace</h3><ul class="clean small"><li>Une los valores y busca patrones (por ejemplo, azúcar, grasas y riñón).</li><li>Da una orientación con semáforo: verde, amarillo o rojo.</li><li>Dice a qué especialista ver y qué preguntarle.</li><li>Lee la conclusión escrita de rayos X, ecografías y otros estudios.</li><li>Hace un informe para el médico del paciente.</li></ul></div><div><h3>Qué no hace</h3><ul class="clean small"><li>No da un diagnóstico final.</li><li>No receta ni cambia medicinas.</li><li>No reemplaza a un médico.</li><li>En rojo dice: “ve hoy a un médico”.</li></ul></div></div></div>' +
      '<div class="card"><h2>Qué sabe leer hoy</h2><p class="small muted">Según la lista de 13 grupos de exámenes. “Por informe” quiere decir que lee lo que escribió el especialista, no la imagen.</p><div class="tw"><table style="min-width:700px"><thead><tr><th>Grupo</th><th>Bot bioanalista</th><th>Bot médico</th><th>Estado</th></tr></thead><tbody>' + covRows + '</tbody></table></div></div>';
  };
  A['au-toggle'] = function () {
    const a = S.auto;
    if (a.on) { a.on = false; U.logAudit(S.auth.name, 'Apagó la autoverificación'); U.toast('Autoverificación apagada. Todo resultado lo firma el bioanalista.'); return render(); }
    S.err = {}; X.dlg('Encender la autoverificación', '<p class="small">Con la autoverificación encendida, los resultados que cumplan todas las reglas salen solos. Tú apruebas las reglas con tu código y puedes apagarlas cuando quieras.</p>' + fld('Código de seguridad del bioanalista (6 números, en la demo escribe cualquiera)', 'au-code', { mode: 'numeric', max: 6 }) + X.errBox('au'), { label: 'Encender', a: 'au-on' });
  };
  A['au-on'] = function () {
    if (!/^\d{6}$/.test(F('au-code'))) return X.setErr('au', 'El código debe tener 6 números.');
    S.auto.on = true; S.auto.by = S.auth && S.auth.name ? S.auth.name : S.auto.by; S.auto.at = X.longDate ? X.longDate() : S.auto.at; S.modal = null; delete S.f['au-code']; S.err = {}; U.logAudit(S.auth.name, 'Encendió la autoverificación y aprobó las reglas'); U.toast('Autoverificación encendida.'); render();
  };
  A['au-ex'] = function (v) { S.auto.off[v] = !S.auto.off[v]; U.logAudit(S.auth.name, (S.auto.off[v] ? 'Apagó' : 'Encendió') + ' la autoverificación de ' + D.BY_ID[v].name); render(); };

  /* ---------- Bot médico dentro del resultado del paciente ---------- */
  const LV = [['ok', 'Todo bien'], ['warn', 'Para vigilar'], ['crit', 'Atención hoy']];
  function medCard(r, idx) {
    const x = B.med.read(r); const sh = x.findings.slice(0, 7);
    return '<div class="card botc lv' + x.level + '"><div class="row between"><div class="bh"><h2>Tu médico virtual</h2><span class="chip gray">IA</span></div><span class="chip ' + LV[x.level][0] + '">' + LV[x.level][1] + '</span></div>' +
      (r.auto ? '<p class="small muted">Este resultado salió por autoverificación: el sistema lo revisó con las reglas que aprobó el bioanalista de ' + esc(r.lab) + '.</p>' : '') +
      '<p><b>' + esc(x.lead) + '</b></p>' + sh.map(function (f) { return '<div class="fnd f' + f.lv + '"><b>' + esc(f.title) + '</b><div class="small">' + esc(f.text) + '</div></div>'; }).join('') +
      (x.specialists.length ? '<p><b>A quién ver:</b> ' + esc(x.specialists.slice(0, 3).join(' · ')) + '</p>' : '') +
      (x.ask.length ? '<div><b>Qué preguntarle a tu médico</b><ul class="clean small">' + x.ask.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="row"><button class="btn ghost sm" type="button" data-a="bm-informe" data-v="' + idx + '">Informe para mi médico</button></div>' +
      '<p class="small muted">Es una orientación automática. No es un diagnóstico, no receta y no reemplaza a tu médico. Si te sientes mal, ve a emergencias sin esperar el resultado de esta lectura.</p></div>';
  }
  const pl0 = V.pat.lista;
  V.pat.lista = function () {
    const h = pl0(); if (S.resIdx === null || S.resIdx === undefined || !D.PATIENT_RESULTS[S.resIdx]) return h; const mark = '<div class="card"><h2>Qué puedes hacer</h2>'; const r = D.PATIENT_RESULTS[S.resIdx];
    return h.indexOf(mark) >= 0 ? h.replace(mark, medCard(r, S.resIdx) + mark) : h + medCard(r, S.resIdx);
  };
  function reportText(r) {
    const x = B.med.read(r); const t = [];
    t.push('INFORME DE ORIENTACIÓN · LABS'); t.push('Generado por el médico virtual (demostración). No es un diagnóstico.'); t.push('');
    t.push('Paciente: ' + r.patient + ' · ' + r.age + ' años · sexo ' + r.sex); t.push('Orden ' + r.id + ' · ' + r.lab + ' · ' + r.date); t.push('');
    t.push('RESUMEN: ' + x.lead); t.push('');
    t.push('DATOS TÉCNICOS'); x.doctor.forEach(function (d) { t.push('- ' + d); }); t.push('');
    t.push('LECTURA'); x.findings.forEach(function (f) { t.push('- [' + ['normal', 'vigilar', 'urgente'][f.lv] + '] ' + f.title + ': ' + f.text); });
    if (x.missing.length) { t.push(''); t.push('PRUEBAS QUE AYUDARÍAN A AFINAR'); x.missing.forEach(function (m) { t.push('- ' + m); }); }
    if (x.specialists.length) { t.push(''); t.push('SUGERENCIA DE ESPECIALISTA: ' + x.specialists.join('; ')); }
    t.push(''); t.push('Este informe fue generado con reglas automáticas y debe ser interpretado por un médico. No sustituye la evaluación clínica.');
    return t.join('\n');
  }
  A['bm-informe'] = function (v) {
    const r = D.PATIENT_RESULTS[parseInt(v, 10)]; const x = B.med.read(r);
    dlg('Informe para tu médico', '<p class="small muted">Esto es lo que verá tu médico si se lo compartes. Lo generó el médico virtual y no es un diagnóstico.</p><p><b>' + esc(x.lead) + '</b></p>' + (x.doctor.length ? '<ul class="clean small">' + x.doctor.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') + (x.missing.length ? '<p class="small"><b>Pruebas que ayudarían:</b> ' + esc(x.missing.join('; ')) + '</p>' : ''), { label: 'Descargar el informe en PDF', a: 'bm-dl', v: v });
  };
  A['bm-dl'] = function (v) { const r = D.PATIENT_RESULTS[parseInt(v, 10)]; EXT.download('informe-orientacion-' + r.id + '.txt', 'text/plain', reportText(r)); S.modal = null; U.toast('Informe descargado.'); render(); };
  render();
})();
