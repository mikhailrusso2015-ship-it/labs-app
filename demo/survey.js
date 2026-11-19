/* LABS demo · Superadmin › Encuestas: validar los supuestos del negocio en la calle (laboratorios, médicos y pacientes).
   Método del Programa 1.000 Empresas: cada supuesto lleva qué tendría que ser verdad, cómo me daría cuenta si no lo es y un criterio escrito ANTES de salir.
   Preguntas sobre hechos pasados (no “¿lo comprarías?”), compromisos reales al final y cada “no” anotado con su razón. */
(function () {
  const S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc, F = X.F, fld = X.fld;
  function render() { window.render(); }
  const KEY = 'labs-encuestas-v1'; const MIN_N = 10;
  const ZONAS = ['Valencia', 'Naguanagua', 'San Diego', 'Los Guayos', 'Guacara', 'Libertador (Tocuyito)', 'Puerto Cabello', 'Otro municipio'];

  /* ---------- Las tres encuestas ---------- */
  const SV = {
    lab: { label: 'Laboratorio', who: 'Dueño o bioanalista del laboratorio', place: 'Nombre del laboratorio (opcional)', qs: [
      { id: 'l1', q: '¿Cómo le entregan hoy los resultados a sus pacientes?', o: ['En papel, en el local', 'Por WhatsApp (foto o PDF)', 'Por correo', 'Por una página o sistema propio', 'Una mezcla de varias'] },
      { id: 'l2', q: 'En un día normal, ¿cuántos pacientes atienden?', o: ['Menos de 20', 'De 20 a 50', 'De 51 a 100', 'Más de 100'] },
      { id: 'l3', q: 'Cada día, ¿cuánto tiempo se le va al personal en entregar resultados? (imprimir, enviar, llamar, atender a quien los viene a buscar)', o: ['Menos de 30 minutos', 'De 30 minutos a 1 hora', 'De 1 a 2 horas', 'Más de 2 horas'] },
      { id: 'l4', q: 'En el último mes, ¿cuántas veces un paciente perdió su resultado o pidió que se lo mandaran otra vez?', o: ['Ninguna', 'De 1 a 5 veces', 'De 6 a 20 veces', 'Más de 20 veces'] },
      { id: 'l5', q: 'Hoy, ¿cuánto pagan al mes por todos sus programas o sistemas juntos?', o: ['Nada', 'Menos de $10', 'De $10 a $30', 'Más de $30'] },
      { id: 'l6', q: 'Para un sistema que entrega los resultados al teléfono del paciente, ¿desde qué precio al mes le parecería caro?', o: ['Desde $10', 'Desde $20', 'Desde $30', 'Desde $50 o más'] },
      { id: 'l7', q: '¿Quién revisa y firma cada resultado antes de entregarlo?', o: ['Un solo bioanalista', 'Varios bioanalistas', 'El dueño', 'No se revisa otra vez'] },
      { id: 'l8', q: 'Si un sistema revisara primero los resultados normales y solo le avisara los raros, y usted lo pudiera apagar cuando quiera, ¿lo usaría?', o: ['Sí', 'Solo para algunos exámenes', 'No', 'No sé'] },
      { id: 'l9', q: '¿Cómo es el internet en el laboratorio?', o: ['Estable todo el día', 'Se cae a veces', 'Se cae seguido', 'No tenemos'] },
      { id: 'l10', q: '¿Quién decide si se compra un sistema nuevo?', o: ['El dueño', 'El bioanalista jefe', 'Un socio o gerente', 'Otra persona'] },
      { id: 'l11', q: '¿Quieren probar LABS 30 días gratis en su laboratorio?', o: ['Sí, agendemos ya', 'Sí, pero más adelante', 'No por ahora'], commit: true, neg: ['No por ahora', 'Sí, pero más adelante'] },
      { id: 'l12', q: '¿Qué es lo que más lo frena?', o: ['El precio', 'No confío en un sistema nuevo', 'El internet', 'Ya tengo un sistema', 'Ahora no es prioridad', 'Otra razón'], if: ['l11', ['No por ahora', 'Sí, pero más adelante']] }
    ] },
    doc: { label: 'Médico', who: 'Médico que pide exámenes', place: 'Consultorio o centro (opcional)', qs: [
      { id: 'd1', q: '¿Cómo recibe hoy los resultados de sus pacientes?', o: ['El paciente trae el papel', 'Foto por WhatsApp', 'Correo del laboratorio', 'Los busco en la página del laboratorio'] },
      { id: 'd2', q: 'En la última semana, ¿cuántas veces llegó un paciente sin su resultado o con uno incompleto?', o: ['Ninguna', '1 o 2 veces', '3 a 5 veces', 'Más de 5 veces'] },
      { id: 'd3', q: '¿Le sirve ver cómo cambia un valor en el tiempo (por ejemplo, la glucosa)?', o: ['Mucho', 'Algo', 'Poco', 'Nada'] },
      { id: 'd4', q: 'Si el paciente le da permiso, ¿revisaría sus resultados en una app?', o: ['Sí, todos los días', 'Sí, de vez en cuando', 'Solo si es gratis', 'No'] },
      { id: 'd5', q: '¿Les dice a sus pacientes en qué laboratorio hacerse los exámenes?', o: ['Siempre a uno fijo', 'A veces', 'Nunca'] },
      { id: 'd6', q: '¿Cobra hoy consultas por WhatsApp o a distancia?', o: ['Sí, seguido', 'A veces', 'No'] },
      { id: 'd7', q: '¿Cuánto paga hoy al mes por programas para su consulta?', o: ['Nada', 'Menos de $5', 'De $5 a $10', 'Más de $10'] },
      { id: 'd8', q: '¿Quiere su acceso de médico a LABS cuando abra en su zona?', o: ['Sí, deme mi acceso', 'Más adelante', 'No'], commit: true, neg: ['No', 'Más adelante'] },
      { id: 'd9', q: '¿Qué es lo que más lo frena?', o: ['No tengo tiempo', 'No uso apps', 'La privacidad del paciente', 'Ya uso otra herramienta', 'Otra razón'], if: ['d8', ['No', 'Más adelante']] }
    ] },
    pat: { label: 'Paciente', who: 'Persona que se hizo exámenes este año', place: 'Lugar donde la encuestaste (opcional)', qs: [
      { id: 'p1', q: 'La última vez que se hizo exámenes, ¿cómo recibió el resultado?', o: ['Fui a buscarlo en papel', 'Por WhatsApp', 'Por correo', 'En una página web'] },
      { id: 'p2', q: '¿Cuántas veces tuvo que ir o volver al laboratorio solo por ese resultado?', o: ['Ninguna, me llegó', '1 vez', '2 veces', '3 o más'] },
      { id: 'p3', q: '¿Entendió lo que decía su resultado sin ayuda?', o: ['Sí, todo', 'Más o menos', 'No, nada'] },
      { id: 'p4', q: '¿Alguna vez perdió un resultado y tuvo que pedirlo o repetirlo?', o: ['Sí', 'No'] },
      { id: 'p5', q: '¿Qué teléfono usa?', o: ['Android', 'iPhone', 'No tengo teléfono inteligente'] },
      { id: 'p6', q: '¿Cómo paga normalmente sus exámenes?', o: ['Efectivo en dólares', 'Pago móvil', 'Tarjeta (punto de venta)', 'Seguro'] },
      { id: 'p7', q: '¿Cómo elige el laboratorio donde se hace los exámenes?', o: ['Donde me manda mi médico', 'El más cerca', 'El más barato', 'El que entrega más rápido o mejor'] },
      { id: 'p8', q: '¿Le preocupa que sus resultados estén guardados en una app?', o: ['Nada', 'Un poco', 'Mucho'] },
      { id: 'p9', q: '¿Quiere recibir su próximo resultado por LABS? Le anotamos su WhatsApp.', o: ['Sí, anóteme', 'Tal vez', 'No'], commit: true, neg: ['No', 'Tal vez'] },
      { id: 'p10', q: '¿Qué es lo que más lo frena?', o: ['La privacidad', 'No uso apps', 'Prefiero el papel', 'Otra razón'], if: ['p9', ['No', 'Tal vez']] }
    ] }
  };
  function qOf(id) { let r = null; Object.keys(SV).forEach(function (k) { SV[k].qs.forEach(function (q) { if (q.id === id) r = q; }); }); return r; }

  /* ---------- Supuestos a validar (criterios PROPUESTOS, escritos antes de salir) ---------- */
  const SUP = [
    { id: 'A1', au: 'lab', t: 'Entregar resultados le quita al laboratorio al menos 1 hora al día.', v: 'El dolor existe y se mide en tiempo del personal.', no: 'La mayoría dice que le toma menos de 1 hora.', q: 'l3', fav: ['De 1 a 2 horas', 'Más de 2 horas'], thr: 50 },
    { id: 'A2', au: 'lab', t: 'Los laboratorios entregan hoy los resultados a mano (papel o WhatsApp).', v: 'Lo que reemplazamos es un trabajo manual, no otro sistema.', no: 'Muchos ya usan una página o sistema propio.', q: 'l1', fav: ['En papel, en el local', 'Por WhatsApp (foto o PDF)', 'Una mezcla de varias'], thr: 70 },
    { id: 'A3', au: 'lab', t: 'Los pacientes pierden resultados o piden reenvíos todos los meses.', v: 'Hay un costo escondido que LABS elimina.', no: 'La mayoría dice “ninguna vez” en el último mes.', q: 'l4', fav: ['De 1 a 5 veces', 'De 6 a 20 veces', 'Más de 20 veces'], thr: 60 },
    { id: 'A4', au: 'lab', t: '$20 al mes no le parece caro a un laboratorio.', v: 'El precio de $20 está por debajo de lo que sienten “caro”.', no: 'La mayoría dice que es caro desde $10 o desde $20.', q: 'l6', fav: ['Desde $30', 'Desde $50 o más'], thr: 60 },
    { id: 'A5', au: 'lab', t: 'El bioanalista acepta que un bot revise primero los resultados normales.', v: 'La autoverificación es una ventaja y no un miedo.', no: 'La mayoría dice “No” o “No sé”.', q: 'l8', fav: ['Sí', 'Solo para algunos exámenes'], thr: 60 },
    { id: 'A6', au: 'lab', t: 'El internet del laboratorio alcanza para trabajar en línea.', v: 'LABS puede funcionar en línea sin un modo sin conexión desde el día uno.', no: 'Muchos dicen que se cae seguido o que no tienen.', q: 'l9', fav: ['Estable todo el día', 'Se cae a veces'], thr: 70 },
    { id: 'A7', au: 'lab', t: 'Hay laboratorios dispuestos a probar ya.', v: 'Existe demanda real: un compromiso, no un cumplido.', no: 'Casi nadie acepta agendar la prueba.', q: 'l11', fav: ['Sí, agendemos ya'], thr: 30 },
    { id: 'B1', au: 'doc', t: 'A los médicos les llegan pacientes sin su resultado.', v: 'El médico sufre el mismo problema y tiene razones para usar LABS.', no: 'La mayoría dice “ninguna” o “1 o 2 veces”.', q: 'd2', fav: ['3 a 5 veces', 'Más de 5 veces'], thr: 40 },
    { id: 'B2', au: 'doc', t: 'El médico revisaría los resultados en la app con permiso del paciente.', v: 'La parte del médico se va a usar.', no: 'La mayoría dice “No” o “Solo si es gratis”.', q: 'd4', fav: ['Sí, todos los días', 'Sí, de vez en cuando'], thr: 60 },
    { id: 'B3', au: 'doc', t: 'Los médicos influyen en qué laboratorio escoge el paciente.', v: 'El médico puede ser un canal para llegar a los laboratorios.', no: 'La mayoría “nunca” recomienda un laboratorio.', q: 'd5', fav: ['Siempre a uno fijo', 'A veces'], thr: 60 },
    { id: 'B4', au: 'doc', t: 'Hay médicos que quieren entrar ya.', v: 'Compromiso real del lado del médico.', no: 'Casi nadie pide su acceso.', q: 'd8', fav: ['Sí, deme mi acceso'], thr: 30 },
    { id: 'C1', au: 'pat', t: 'Buscar el resultado le cuesta al paciente al menos un viaje.', v: 'El paciente gana tiempo y dinero con LABS.', no: 'La mayoría dice “Ninguna, me llegó”.', q: 'p2', fav: ['1 vez', '2 veces', '3 o más'], thr: 60 },
    { id: 'C2', au: 'pat', t: 'El paciente no entiende su resultado sin ayuda.', v: 'El médico virtual resuelve un problema real.', no: 'La mayoría dice que lo entendió todo.', q: 'p3', fav: ['Más o menos', 'No, nada'], thr: 50 },
    { id: 'C3', au: 'pat', t: 'El paciente tiene teléfono inteligente.', v: 'Se puede entregar todo por la app, sin papel.', no: 'Más de 15 de cada 100 no tienen.', q: 'p5', fav: ['Android', 'iPhone'], thr: 85 },
    { id: 'C4', au: 'pat', t: 'El paciente elige laboratorio por servicio y no solo por precio o cercanía.', v: 'Un laboratorio con LABS puede atraer pacientes.', no: 'Casi todos eligen por cercanía o precio.', q: 'p7', fav: ['El que entrega más rápido o mejor', 'Donde me manda mi médico'], thr: 40 },
    { id: 'C5', au: 'pat', t: 'La privacidad no frena el uso de la app.', v: 'El paciente acepta tener sus resultados en LABS.', no: 'Muchos dicen que les preocupa “mucho”.', q: 'p8', fav: ['Nada', 'Un poco'], thr: 70 },
    { id: 'C6', au: 'pat', t: 'Hay pacientes que quieren usarlo ya.', v: 'Compromiso real: dejan su WhatsApp.', no: 'Casi nadie se anota.', q: 'p9', fav: ['Sí, anóteme'], thr: 40 }
  ];

  /* ---------- Guardado en este dispositivo ---------- */
  function load() { try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S.sv.list)); return true; } catch (e) { return false; } }
  S.sv = { tab: 'hacer', run: null, list: load(), open: null };

  /* ---------- Cálculos ---------- */
  function rows(au, real) { return S.sv.list.filter(function (r) { return r.au === au && (!real || !r.ex); }); }
  function dist(q) { const c = {}; q.o.forEach(function (o) { c[o] = 0; }); let n = 0; S.sv.list.forEach(function (r) { const a = r.a && r.a[q.id]; if (a !== undefined && c[a] !== undefined) { c[a]++; n++; } }); return { c: c, n: n }; }
  function judge(s) {
    const d = dist(qOf(s.q)); const fv = s.fav.reduce(function (t, o) { return t + (d.c[o] || 0); }, 0); const pct = d.n ? Math.round(fv / d.n * 100) : 0;
    let st = 'n', lab = 'Faltan respuestas (' + d.n + ' de ' + MIN_N + ')';
    if (d.n >= MIN_N) { if (pct >= s.thr) { st = 'g'; lab = 'Se cumple'; } else if (pct >= s.thr * 0.6) { st = 'y'; lab = 'Dudoso'; } else { st = 'r'; lab = 'No se cumple'; } }
    return { n: d.n, pct: pct, st: st, lab: lab, d: d };
  }
  function visible(q, a) { if (!q.if) return true; return q.if[1].indexOf(a[q.if[0]]) >= 0; }

  /* ---------- Menú ---------- */
  (function () { const nav = EXT.nav.adm; const i = nav.map(function (n) { return n.sep || n.id; }).indexOf('Plataforma'); nav.splice(i < 0 ? nav.length : i, 0, { sep: 'Validación' }, { id: 'encuestas', label: 'Encuestas' }); })();

  /* ---------- Pantallas ---------- */
  const TABS = [['hacer', 'Encuestar'], ['res', 'Resultados'], ['lista', 'Respuestas'], ['guia', 'Cómo encuestar']];
  if (EXT.MI) EXT.MI.encuestas = '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4.5h6M9 11h6M9 15h4"/>';
  V.adm.encuestas = function () { return '<div class="svw">' + svView() + '</div>'; };
  function svView() {
    if (S.sv.run) return runView();
    const t = S.sv.tab; const nEx = S.sv.list.filter(function (r) { return r.ex; }).length;
    return '<div class="head"><div><h1>Encuestas</h1><p>Sal a la calle a validar los supuestos de LABS con laboratorios, médicos y pacientes de Carabobo.</p></div></div>' +
      '<div class="row"><div class="seg" role="group" aria-label="Secciones de encuestas">' + TABS.map(function (x) { return '<button type="button" data-a="sv-tab" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      (nEx ? '<div class="banner" role="status">Hay ' + nEx + ' respuestas de ejemplo mezcladas. No sirven para decidir. <button class="btn ghost sm" type="button" data-a="sv-noex">Borrar los ejemplos</button></div>' : '') +
      (t === 'res' ? resView() : t === 'lista' ? listView() : t === 'guia' ? guideView() : homeView());
  };
  function homeView() {
    const meta = { lab: 10, doc: 10, pat: 20 };
    return '<div class="grid">' + Object.keys(SV).map(function (k) {
      const s = SV[k]; const n = rows(k, true).length; const qn = s.qs.filter(function (q) { return !q.if; }).length; const sp = SUP.filter(function (x) { return x.au === k; }).length;
      return '<div class="card"><div class="row between"><h2>' + s.label + '</h2><span class="chip ' + (n >= meta[k] ? 'ok' : 'gray') + '">' + n + ' de ' + meta[k] + '</span></div><p class="small muted">' + esc(s.who) + '</p><p class="small">' + qn + ' preguntas · unos 2 minutos · valida ' + sp + ' supuestos</p><div class="svq"><div class="prog" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(n / meta[k] * 100)) + '%"></i></div></div><div class="row" style="margin-top:10px"><button class="btn" type="button" data-a="sv-start" data-v="' + k + '">Empezar encuesta</button></div></div>';
    }).join('') + '</div>' +
      '<div class="card note small"><p><b>Meta de la primera ronda (estado Carabobo):</b> 10 laboratorios, 10 médicos y 20 pacientes. Con menos de 10 respuestas en un grupo, el resultado todavía no dice nada.</p><p>Las respuestas se guardan en este dispositivo. Al terminar el día, ve a <b>Respuestas</b> y descárgalas en un archivo para no perderlas.</p></div>';
  }
  function runView() {
    const r = S.sv.run; const s = SV[r.au]; const qs = s.qs.filter(function (q) { return visible(q, r.a); }); const tot = qs.length + 1;
    if (r.step === 0) {
      return '<div class="svq"><div class="row between"><button class="btn ghost sm" type="button" data-a="sv-quit">‹ Salir</button><span class="small muted">Encuesta a ' + s.label.toLowerCase() + '</span></div><div class="prog" aria-hidden="true" style="margin:10px 0 14px"><i style="width:' + Math.round(1 / tot * 100) + '%"></i></div>' +
        '<div class="card"><h2 class="q">Antes de empezar</h2><p class="small muted">Di esto: “Estoy haciendo un estudio sobre cómo se entregan los resultados de laboratorio. Son unas preguntas rápidas. No le voy a vender nada.”</p>' +
        fld('Municipio', 'sv-zona', { type: 'select', options: ZONAS }) + fld(s.place, 'sv-place', { ph: 'Puedes dejarlo vacío' }) + '<div class="row"><button class="btn" type="button" data-a="sv-next">Empezar las preguntas</button></div></div></div>';
    }
    const i = r.step - 1; if (i >= qs.length) return doneView();
    const q = qs[i]; const cur = r.a[q.id];
    return '<div class="svq"><div class="row between"><button class="btn ghost sm" type="button" data-a="sv-prev">‹ Anterior</button><span class="small muted">Pregunta ' + (i + 1) + ' de ' + qs.length + '</span><button class="btn ghost sm" type="button" data-a="sv-quit">Salir</button></div><div class="prog" aria-hidden="true" style="margin:10px 0 14px"><i style="width:' + Math.round((i + 2) / tot * 100) + '%"></i></div>' +
      '<div class="card"><h2 class="q" id="svq-t">' + esc(q.q) + '</h2><div class="aud" role="radiogroup" aria-labelledby="svq-t">' + q.o.map(function (o) { return '<button type="button" class="opt" role="radio" data-a="sv-ans" data-v="' + esc(q.id + '|' + o) + '" aria-pressed="' + (cur === o) + '" aria-checked="' + (cur === o) + '"><i aria-hidden="true"></i><span>' + esc(o) + '</span></button>'; }).join('') + '</div>' +
      (q.commit ? '<p class="small muted" style="margin-top:10px">Esta es la pregunta más importante: un “sí” aquí es un compromiso, no un cumplido.</p>' : '') + '</div></div>';
  }
  function doneView() {
    const r = S.sv.run; const s = SV[r.au]; const qs = s.qs.filter(function (q) { return visible(q, r.a); }); const miss = qs.filter(function (q) { return !r.a[q.id]; }).length;
    return '<div class="svq"><div class="row between"><button class="btn ghost sm" type="button" data-a="sv-prev">‹ Anterior</button><span class="small muted">Último paso</span><span></span></div><div class="prog" aria-hidden="true" style="margin:10px 0 14px"><i style="width:100%"></i></div>' +
      '<div class="card"><h2 class="q">Listo. Guarda la respuesta</h2><p class="small">' + (miss ? 'Quedaron ' + miss + ' preguntas sin responder. Se guarda igual.' : 'Respondió todo.') + ' Dale las gracias a la persona.</p>' +
      fld('Nota (opcional): algo que dijo y vale la pena recordar', 'sv-note', { type: 'textarea', ph: 'Ej.: “Pierdo media mañana llamando a pacientes”' }) +
      '<div class="row"><button class="btn" type="button" data-a="sv-save">Guardar respuesta</button></div></div></div>';
  }
  function bars(q, fav) {
    const d = dist(q); const mx = Math.max(1, d.n);
    return '<div class="sres">' + q.o.map(function (o) { const v = d.c[o] || 0; const pc = Math.round(v / mx * 100); return '<div class="orow2"><span class="small">' + esc(o) + '</span><div class="bar" aria-hidden="true"><i class="' + (fav && fav.indexOf(o) >= 0 ? 'fav' : '') + '" style="width:' + pc + '%"></i></div><span class="small" style="text-align:right"><b>' + v + '</b> · ' + pc + '%</span></div>'; }).join('') + '</div>';
  }
  function resView() {
    const used = {}; SUP.forEach(function (s) { used[s.q] = 1; });
    const sem = { g: 0, y: 0, r: 0, n: 0 }; SUP.forEach(function (s) { sem[judge(s).st]++; });
    let h = '<div class="grid">' + [['g', 'Se cumplen', sem.g], ['y', 'Dudosos', sem.y], ['r', 'No se cumplen', sem.r], ['n', 'Sin datos suficientes', sem.n]].map(function (k) { return '<div class="card kpi"><small><span class="sem ' + k[0] + '">' + k[1] + '</span></small><b>' + k[2] + '</b></div>'; }).join('') + '</div>';
    h += '<p class="small muted">Los criterios son <b>propuestos</b>: se escribieron antes de salir, para no acomodarlos después. Un supuesto se juzga con al menos ' + MIN_N + ' respuestas. La barra oscura marca las respuestas que confirman el supuesto.</p>';
    Object.keys(SV).forEach(function (k) {
      h += '<div class="card"><h2>' + SV[k].label + 's · ' + rows(k).length + ' respuestas</h2>' + SUP.filter(function (s) { return s.au === k; }).map(function (s) {
        const j = judge(s); const o = S.sv.open === s.id;
        return '<div class="acc"><button type="button" class="acch" data-a="sv-open" data-v="' + s.id + '" aria-expanded="' + o + '"><span class="t">' + esc(s.t) + '<span class="s">' + (j.n ? j.pct + '% a favor · ' : '') + 'criterio: ' + s.thr + '% o más</span></span><span class="sem ' + j.st + '">' + esc(j.lab) + '</span><i class="chev' + (o ? ' open' : '') + '" aria-hidden="true">›</i></button>' +
          (o ? '<div class="accb"><p class="small"><b>Qué tendría que ser verdad:</b> ' + esc(s.v) + '</p><p class="small"><b>Cómo me daría cuenta si no lo es:</b> ' + esc(s.no) + '</p><p class="small muted">Pregunta: “' + esc(qOf(s.q).q) + '”</p>' + bars(qOf(s.q), s.fav) + '</div>' : '') + '</div>';
      }).join('');
      const extra = SV[k].qs.filter(function (q) { return !used[q.id]; });
      h += '<details class="tv" style="margin-top:10px"><summary>Lo que dicen del mercado (' + extra.length + ' preguntas)</summary>' + extra.map(function (q) { return '<div style="margin-top:12px"><b class="small">' + esc(q.q) + '</b>' + bars(q) + '</div>'; }).join('') + '</details></div>';
    });
    return h;
  }
  function listView() {
    const L0 = S.sv.list.slice().reverse();
    const head = '<div class="row"><button class="btn" type="button" data-a="sv-csv"' + (L0.length ? '' : ' disabled') + '>Descargar en un archivo (CSV)</button>' + (L0.length ? '<button class="btn ghost" type="button" data-a="sv-wipe">Borrar todas</button>' : '<button class="btn ghost" type="button" data-a="sv-demo">Probar con respuestas de ejemplo</button>') + '</div>';
    if (!L0.length) return '<div class="card"><h2>Todavía no hay respuestas</h2><p class="small muted">Cuando guardes la primera encuesta, aparece aquí. Para ver cómo se ven los resultados, puedes cargar respuestas de ejemplo y luego borrarlas.</p>' + head + '</div>';
    return '<div class="card"><div class="row between"><h2>' + L0.length + ' respuestas guardadas</h2></div>' + head + '<div style="margin-top:8px">' + L0.map(function (r) {
      const n = Object.keys(r.a || {}).length; const neg = SV[r.au].qs.filter(function (q) { return q.commit; })[0]; const c = neg ? r.a[neg.id] : '';
      return '<div class="vrow"><span><b>' + esc(SV[r.au].label) + (r.place ? ' · ' + esc(r.place) : '') + '</b>' + (r.ex ? ' <span class="chip gray">Ejemplo</span>' : '') + '<small class="block">' + esc(r.when + ' · ' + r.zona + ' · ' + n + ' respuestas' + (c ? ' · ' + c : '')) + '</small>' + (r.note ? '<small class="block muted">“' + esc(r.note) + '”</small>' : '') + '</span><button class="btn ghost sm" type="button" data-a="sv-del" data-v="' + esc(r.id) + '">Borrar</button></div>';
    }).join('') + '</div></div>';
  }
  function guideView() {
    return '<div class="card"><h2>Cómo hacer una buena encuesta</h2><ul class="clean">' +
      '<li><b>No vendas mientras preguntas.</b> Primero las preguntas; la demo de LABS, después, si la piden.</li>' +
      '<li><b>Pregunta por lo que ya pasó,</b> no por lo que harían. “¿Cuántas veces pasó el mes pasado?” vale más que “¿lo usaría?”.</li>' +
      '<li><b>No digas el precio antes</b> de la pregunta del precio. Así no influyes en la respuesta.</li>' +
      '<li><b>Lee la pregunta igual cada vez</b> y deja que escojan una opción. Si dudan entre dos, que escojan la que más se parece.</li>' +
      '<li><b>Un “sí, agendemos” vale más que diez “qué buena idea”.</b> Los cumplidos no cuentan; los compromisos sí.</li>' +
      '<li><b>Anota cada “no” con su razón.</b> La encuesta lo pregunta sola. Esa razón es oro para corregir el plan.</li>' +
      '<li><b>Escribe la frase que más te llamó la atención</b> en la nota final.</li>' +
      '<li><b>Mínimo 10 por grupo</b> antes de sacar conclusiones. Con 3 o 4, todavía es suerte.</li>' +
      '<li><b>Mezcla zonas:</b> Valencia, Naguanagua, San Diego, Guacara y otros municipios, para no oír solo a un tipo de cliente.</li>' +
      '<li><b>Descarga el archivo cada día.</b> Las respuestas viven en este dispositivo.</li></ul></div>' +
      '<div class="card"><h2>Qué hacer con los resultados</h2><ul class="clean small"><li><span class="sem g">Se cumple</span> Sigue adelante con esa parte del plan.</li><li><span class="sem y">Dudoso</span> Haz 10 conversaciones más con ese grupo antes de decidir.</li><li><span class="sem r">No se cumple</span> Cambia esa parte del plan (precio, a quién le vendes, qué ofreces) y vuelve a probar.</li></ul></div>';
  }

  /* ---------- Acciones ---------- */
  const back0 = A['back']; A['back'] = function () { if (S.role === 'adm' && S.adm === 'encuestas' && S.sv.run) return S.sv.run.step > 0 ? A['sv-prev']() : A['sv-quit'](); back0(); };
  const nav0 = A['nav']; A['nav'] = function (v) { if (S.sv.run && v !== 'encuestas') S.sv.run = null; nav0(v); };
  A['sv-tab'] = function (v) { S.sv.tab = v; S.sv.open = null; render(); window.scrollTo(0, 0); };
  A['sv-open'] = function (v) { S.sv.open = S.sv.open === v ? null : v; render(); };
  A['sv-start'] = function (v) { S.sv.run = { au: v, step: 0, a: {} }; delete S.f['sv-place']; delete S.f['sv-note']; render(); window.scrollTo(0, 0); };
  A['sv-quit'] = function () { const r = S.sv.run; if (r && Object.keys(r.a).length) return X.dlg('¿Salir sin guardar?', '<p>Se pierden las respuestas de esta persona.</p>', { label: 'Salir sin guardar', a: 'sv-quit-ok' }); A['sv-quit-ok'](); };
  A['sv-quit-ok'] = function () { S.sv.run = null; S.modal = null; render(); window.scrollTo(0, 0); };
  A['sv-next'] = function () { S.sv.run.step++; render(); window.scrollTo(0, 0); };
  A['sv-prev'] = function () { const r = S.sv.run; r.step = Math.max(0, r.step - 1); render(); window.scrollTo(0, 0); };
  A['sv-ans'] = function (v) {
    const k = v.indexOf('|'); const id = v.slice(0, k), o = v.slice(k + 1); const r = S.sv.run; r.a[id] = o;
    const s = SV[r.au]; s.qs.forEach(function (q) { if (q.if && !visible(q, r.a)) delete r.a[q.id]; });
    render(); clearTimeout(A['sv-ans'].t); A['sv-ans'].t = setTimeout(function () { if (S.sv.run === r) { r.step++; render(); window.scrollTo(0, 0); } }, 280);
  };
  A['sv-save'] = function () {
    const r = S.sv.run; const rec = { id: X.uid ? X.uid('sv') : 'sv' + Date.now(), au: r.au, when: X.when ? X.when() : new Date().toLocaleString('es-VE'), date: new Date().toISOString().slice(0, 10), zona: F('sv-zona', ZONAS[0]), place: F('sv-place').trim(), note: F('sv-note').trim(), by: S.auth ? S.auth.name : '', a: r.a };
    S.sv.list.push(rec); const ok = save(); S.sv.run = null; ['sv-place', 'sv-note'].forEach(function (k) { delete S.f[k]; });
    U.logAudit(S.auth.name, 'Guardó una encuesta a ' + SV[rec.au].label.toLowerCase());
    X.dlg('Respuesta guardada', '<p>' + (ok ? 'Quedó guardada en este dispositivo.' : 'Quedó guardada mientras la app esté abierta. Este navegador no deja guardar: descarga el archivo antes de cerrar.') + ' Ya van <b>' + rows(rec.au, true).length + '</b> encuestas a ' + SV[rec.au].label.toLowerCase() + 's.</p>', { label: 'Hacer otra igual', a: 'sv-again', v: rec.au });
  };
  A['sv-again'] = function (v) { S.modal = null; A['sv-start'](v); };
  A['sv-del'] = function (v) { X.dlg('Borrar esta respuesta', '<p>Se borra para siempre de este dispositivo.</p>', { label: 'Borrar', a: 'sv-del-ok', v: v }); };
  A['sv-del-ok'] = function (v) { S.sv.list = S.sv.list.filter(function (r) { return r.id !== v; }); save(); S.modal = null; U.toast('Respuesta borrada.'); };
  A['sv-wipe'] = function () { X.dlg('Borrar todas las respuestas', '<p>Se borran las ' + S.sv.list.length + ' respuestas de este dispositivo y no se pueden recuperar. Descarga el archivo antes si las necesitas.</p>', { label: 'Borrar todas', a: 'sv-wipe-ok' }); };
  A['sv-wipe-ok'] = function () { S.sv.list = []; save(); S.modal = null; U.toast('Se borraron todas las respuestas.'); };
  A['sv-noex'] = function () { S.sv.list = S.sv.list.filter(function (r) { return !r.ex; }); save(); U.toast('Se borraron las respuestas de ejemplo.'); };
  A['sv-csv'] = function () {
    const ids = []; Object.keys(SV).forEach(function (k) { SV[k].qs.forEach(function (q) { ids.push(q.id); }); });
    const cell = function (x) { x = String(x === undefined || x === null ? '' : x); return /[";\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const head = ['fecha', 'grupo', 'municipio', 'lugar', 'encuestador', 'ejemplo', 'nota'].concat(ids.map(function (id) { return id + ' ' + qOf(id).q; }));
    const lines = [head.map(cell).join(';')].concat(S.sv.list.map(function (r) { return [r.date || r.when, SV[r.au].label, r.zona, r.place, r.by, r.ex ? 'sí' : '', r.note].concat(ids.map(function (id) { return r.a[id] || ''; })).map(cell).join(';'); }));
    EXT.download('encuestas-labs-' + new Date().toISOString().slice(0, 10) + '.csv', 'text/csv;charset=utf-8', '﻿' + lines.join('\r\n')); U.toast('Archivo descargado.');
  };
  A['sv-demo'] = function () {
    /* Respuestas inventadas SOLO para ver la pantalla. Quedan marcadas como “Ejemplo”. */
    let seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function pick(q) { const w = q.o.map(function (o, i) { return q.o.length - i * 0.6; }); const t = w.reduce(function (a, b) { return a + b; }, 0); let x = rnd() * t; for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return q.o[i]; } return q.o[0]; }
    [['lab', 10], ['doc', 6], ['pat', 12]].forEach(function (g) { for (let i = 0; i < g[1]; i++) { const a = {}; SV[g[0]].qs.forEach(function (q) { if (visible(q, a)) a[q.id] = pick(q); }); S.sv.list.push({ id: 'ex' + g[0] + i, au: g[0], when: 'Ejemplo', date: 'ejemplo', zona: ZONAS[i % 5], place: '', note: '', by: 'Ejemplo', a: a, ex: true }); } });
    save(); S.sv.tab = 'res'; render(); window.scrollTo(0, 0);
  };
  render();
})();
