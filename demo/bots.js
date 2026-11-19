/* LABS demo · los 2 bots de IA: motor de reglas de DEMOSTRACIÓN.
   Bot bioanalista: revisa cada resultado antes de que salga y decide si puede salir solo (autoverificación).
   Bot médico: lee todo el resultado junto y da una orientación (no es un diagnóstico).
   En la versión real, estas reglas se combinan con un modelo de IA. Aquí no hay conexión a ninguna IA. */
(function () {
  const D = window.LABSDATA, L = window.LABS;

  function val(vals, id) { const x = vals.filter(function (v) { return v.id === id; })[0]; return x ? x.v : null; }
  function T(s) { return String(s).replace(/(\d)\.(\d)/g, '$1,$2'); }
  function fix(n, d) { return (Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString().replace('.', ','); }

  /* ---------- Datos de EJEMPLO: cuántas veces el bot coincidió con el bioanalista ---------- */
  const AGREE = {
    glu: [4200, 99.8], cre: [3900, 99.7], col: [3100, 99.6], hdl: [2800, 99.5], ldl: [2700, 99.4], tri: [3000, 99.6], ure: [3500, 99.7], hem: [3600, 99.5], hct: [2100, 99.7], plq: [2400, 99.3],
    tgo: [1900, 99.4], tgp: [1900, 99.5], bil: [1500, 99.2], fal: [1200, 99.1], uric: [1700, 99.5], ca: [1100, 99.2], fe: [900, 98.7], fer: [520, 98.9], vsg: [980, 99.2], pcr: [1100, 99.1],
    tsh: [640, 97.8], t3: [410, 98.1], t4l: [430, 98.4], hemog: [3500, 99.4], ori: [3200, 99.5], hec: [2900, 99.8], cop: [2100, 99.6], grp: [2600, 99.9]
  };
  const MIN_N = 1000, MIN_OK = 99;
  function agree(id) { const a = AGREE[id] || [1500, 99.5]; return { n: a[0], ok: a[1], ready: a[0] >= MIN_N && a[1] >= MIN_OK }; }
  // ¿Este tipo de examen puede salir solo, por su naturaleza?
  function kindAuto(c) { return c.kind === 'range' || c.kind === 'max' || c.kind === 'min' || c.kind === 'none' || (c.kind === 'pos' && !c.sens); }

  /* ---------- Bot bioanalista ---------- */
  const DELTA = { glu: 0.5, cre: 0.5, hem: 0.2, hct: 0.2, plq: 0.5, col: 0.4, tri: 0.8, tsh: 1.0, ure: 0.8 };
  function prevOf(pid, id, skipId) {
    const list = D.PATIENT_RESULTS.filter(function (r) { return r.pid === pid && r.id !== skipId && r.values.some(function (v) { return v.id === id; }); });
    if (!list.length) return null; const live = list.filter(function (r) { return r.live; }); const r = live.length ? live[live.length - 1] : list[0];
    return { v: val(r.values, id), date: r.date };
  }
  const HINT = { glu: [20, 'Una glucosa menor de 20 mg/dL casi siempre es un valor en otra unidad (mmol/L). Revisa la unidad.'], col: [15, 'Un colesterol menor de 15 mg/dL casi siempre es un valor en mmol/L. Revisa la unidad.'], cre: [null, null], hem: [null, null] };

  function review(o, p, col, cfg) {
    cfg = cfg || {}; const checks = []; const vals = col.values || []; const sum = L.summarize(vals); const age = p && p.age; const hold = []; // motivos por los que no sale solo
    let critical = false, flag = false;
    function add(k, t, x) { checks.push({ k: k, t: T(t), x: T(x) }); }
    // 1. Valores críticos
    sum.rows.filter(function (r) { return r.level === 'urgente'; }).forEach(function (r) { critical = true; add('critico', r.name + ': valor crítico (' + r.v + ' ' + r.unit + ')', 'No puede esperar. Avisa al paciente o a su médico antes de enviar.'); });
    // 2. Fuera del margen normal
    sum.rows.filter(function (r) { return r.level === 'alto' || r.level === 'vigilar'; }).forEach(function (r) { flag = true; add('revisar', r.name + ': ' + r.label.toLowerCase() + ' (' + r.v + ' ' + r.unit + ')', 'Está fuera del margen normal. Lo ve el bioanalista.'); });
    // 3. Posibles errores de unidad o de escritura
    if (val(vals, 'glu') !== null && val(vals, 'glu') < 20) { flag = true; add('revisar', 'Glucosa: ¿unidad equivocada?', HINT.glu[1]); }
    if (val(vals, 'col') !== null && val(vals, 'col') < 15) { flag = true; add('revisar', 'Colesterol: ¿unidad equivocada?', HINT.col[1]); }
    if (val(vals, 'hem') !== null && val(vals, 'hem') > 25) { flag = true; add('revisar', 'Hemoglobina: ¿unidad equivocada?', 'Más de 25 g/dL casi siempre es un valor en g/L (por ejemplo, 130 en vez de 13,0).'); }
    if (val(vals, 'cre') !== null && val(vals, 'cre') > 30) { flag = true; add('revisar', 'Creatinina: ¿unidad equivocada?', 'Más de 30 mg/dL casi siempre es un valor en µmol/L. Revisa la unidad.'); }
    // 4. Cambio brusco frente al resultado anterior del mismo paciente
    let deltaSeen = 0;
    vals.forEach(function (x) {
      const pv = o && o.pid ? prevOf(o.pid, x.id, o.id) : null; if (!pv || !pv.v) return; deltaSeen++;
      const lim = DELTA[x.id] || 0.5; const ch = Math.abs(x.v - pv.v) / pv.v; const c = D.BY_ID[x.id];
      if (ch > lim) { flag = true; add('revisar', c.name + ': cambió mucho (antes ' + pv.v + ', ahora ' + x.v + ')', 'El cambio es de ' + Math.round(ch * 100) + ' %. Puede ser un error de muestra o de escritura, o un cambio real.'); }
    });
    // 5. Los valores deben cuadrar entre sí
    let coh = 0, cohBad = false;
    const col_ = val(vals, 'col'), hdl = val(vals, 'hdl'), ldl = val(vals, 'ldl'), tri = val(vals, 'tri'), hb = val(vals, 'hem'), hct = val(vals, 'hct');
    if (col_ !== null && ldl !== null && ldl > col_ * 1.02) { coh++; cohBad = true; flag = true; add('revisar', 'LDL mayor que el colesterol total', 'No puede ser: el LDL es una parte del colesterol total. Revisa los dos valores.'); }
    if (col_ !== null && hdl !== null && hdl > col_ * 1.02) { coh++; cohBad = true; flag = true; add('revisar', 'HDL mayor que el colesterol total', 'No puede ser. Revisa los dos valores.'); }
    if (col_ !== null && hdl !== null && ldl !== null && tri !== null && tri < 400) { coh++; const calc = col_ - hdl - tri / 5; if (Math.abs(calc - ldl) > 20) { cohBad = true; flag = true; add('revisar', 'Las grasas no cuadran entre sí', 'Con colesterol, HDL y triglicéridos, el LDL debería estar cerca de ' + Math.round(calc) + ' y está en ' + ldl + '. Repite o revisa.'); } }
    if (hb !== null && hct !== null) { coh++; const ratio = hct / hb; if (ratio < 2.7 || ratio > 3.6) { cohBad = true; flag = true; add('revisar', 'Hemoglobina y hematocrito no cuadran', 'El hematocrito suele ser unas 3 veces la hemoglobina (aquí es ' + fix(ratio, 1) + '). Revisa los dos valores.'); } }
    // 6. Positivos, cultivos, informes y texto
    let manual = false; const why = [];
    Object.keys(col.pos || {}).forEach(function (id) {
      const c = D.BY_ID[id]; const x = col.pos[id];
      if (x.res === 'Positivo') { manual = true; if (c.notif) add('critico', c.name + ': positivo de notificación obligatoria', 'Se avisa al Ministerio de Salud. Lo revisa y firma el bioanalista.'); else add('revisar', c.name + ': positivo', 'Un positivo lo confirma el bioanalista antes de enviarse.'); if (c.notif) critical = true; }
      if (c.sens) { manual = true; add('revisar', c.name + ': resultado sensible', 'Se entrega con orientación al paciente. Lo ve el bioanalista.'); }
    });
    if (Object.keys(col.cult || {}).length) { manual = true; add('revisar', 'Cultivo: lo interpreta el bioanalista', 'Los cultivos y antibiogramas siempre los revisa una persona.'); }
    if (Object.keys(col.reports || {}).length) { manual = true; add('revisar', 'Informe de imagen o de estudio: lo firma el especialista', 'El bot lo lee, pero el informe es del especialista que lo interpretó.'); }
    Object.keys(col.texts || {}).forEach(function (id) {
      const t = (col.texts[id] || '').toLowerCase(); const okTxt = /(sin alteraci|sin hallazgos|no se observan|dentro de (lo )?normal|normal)/.test(t) && !/(positiv|presenc|abundante|moderad|aument|elevad|escaso|incremento)/.test(t);
      if (!okTxt) { manual = true; add('revisar', D.BY_ID[id].name + ': el texto menciona hallazgos', 'El bot solo deja salir solo un texto sin alteraciones. Este lo ve el bioanalista.'); }
    });
    // 7. ¿Cada examen está habilitado para salir solo?
    const blocked = [];
    (o ? o.exams : []).forEach(function (id) {
      const c = D.BY_ID[id]; if (!c) return;
      if (!kindAuto(c)) { return; }
      if (cfg.off && cfg.off[id]) blocked.push(c.name + ' (apagado por el bioanalista)');
      else if (!agree(id).ready) blocked.push(c.name + ' (todavía en prueba)');
    });
    if (blocked.length) { manual = true; add('info', 'Todavía no salen solos: ' + blocked.join(', '), 'Faltan revisiones o la coincidencia con el bioanalista aún no llega al ' + MIN_OK + ' %.'); }
    // Resumen en positivo
    const okVals = sum.rows.filter(function (r) { return r.level === 'normal'; }).length;
    if (vals.length && okVals === vals.length) checks.unshift({ k: 'ok', t: 'Todos los valores están dentro del margen normal (' + okVals + ' de ' + vals.length + ')', x: '' });
    if (vals.length && !critical && !cohBad) checks.push({ k: 'ok', t: 'Ningún valor es imposible ni crítico', x: '' });
    if (coh && !cohBad) checks.push({ k: 'ok', t: 'Los valores cuadran entre sí', x: '' });
    if (deltaSeen && !checks.some(function (c) { return /cambió mucho/.test(c.t); })) checks.push({ k: 'ok', t: 'Sin cambios bruscos frente al resultado anterior del paciente', x: '' });
    // Decisión
    let decision = 'auto';
    if (critical) decision = 'critico'; else if (flag || manual) decision = 'revisar';
    if (!cfg.on && decision === 'auto') { decision = 'revisar'; add('info', 'La autoverificación está apagada', 'Todo resultado lo firma el bioanalista, como siempre.'); }
    const order = { critico: 0, revisar: 1, info: 2, ok: 3 }; checks.sort(function (a, b) { return order[a.k] - order[b.k]; });
    return { decision: decision, checks: checks, total: vals.length };
  }

  /* ---------- Bot médico ---------- */
  function egfr(cr, age, sex) { const k = sex === 'F' ? 0.7 : 0.9, a = sex === 'F' ? -0.241 : -0.302; return 142 * Math.pow(Math.min(cr / k, 1), a) * Math.pow(Math.max(cr / k, 1), -1.2) * Math.pow(0.9938, age) * (sex === 'F' ? 1.012 : 1); }
  function stage(e) { return e >= 90 ? 'G1' : e >= 60 ? 'G2' : e >= 45 ? 'G3a' : e >= 30 ? 'G3b' : e >= 15 ? 'G4' : 'G5'; }

  const REPORT_RED = /(hemorragi|infarto|neumot[oó]rax|embolia|fibrilaci[oó]n|elevaci[oó]n del st|aneurisma|isquemia aguda|oclusi[oó]n|apendicitis|obstrucci[oó]n intestinal|perforaci[oó]n|ictus|status epil)/;
  const REPORT_YEL = /(masa|n[oó]dulo|tumor|neoplas|sospech|fractura|derrame|trombo|dilataci[oó]n|c[aá]lculo|lesi[oó]n|arritmia|epileptiform|punta|onda aguda|quiste|hernia|estenosis|cardiomegalia|esteatosis|h[ií]gado graso|hipertrofia|bradicardia|taquicardia|bloqueo)/;
  const GLOS = [
    [/derrame/, 'derrame', 'líquido que no debería estar ahí'], [/n[oó]dulo/, 'nódulo', 'una bolita pequeña que hay que estudiar'], [/quiste/, 'quiste', 'una bolsita con líquido, casi siempre benigna'],
    [/c[aá]lculo/, 'cálculo', 'una piedra (en riñón o vesícula)'], [/esteatosis|h[ií]gado graso/, 'esteatosis', 'hígado con grasa'], [/cardiomegalia/, 'cardiomegalia', 'corazón más grande de lo normal'],
    [/bradicardia/, 'bradicardia', 'el corazón late lento'], [/taquicardia/, 'taquicardia', 'el corazón late rápido'], [/arritmia/, 'arritmia', 'el ritmo del corazón no es regular'], [/hernia/, 'hernia', 'un órgano o tejido que se sale de su lugar'],
    [/estenosis/, 'estenosis', 'un conducto más estrecho de lo normal'], [/hipertrofia/, 'hipertrofia', 'un músculo más grueso de lo normal'], [/epileptiform|punta|onda aguda/, 'actividad epileptiforme', 'ondas del cerebro que se ven en la epilepsia']
  ];

  function read(r) {
    const vals = r.values || [], age = r.age || 40, sex = r.sex || 'F'; const F = []; const spec = {}; const ask = []; const miss = []; const doc = []; let worst = 0; // 0 verde,1 amarillo,2 rojo
    function add(lv, title, text, who) { F.push({ lv: lv, title: T(title), text: T(text) }); if (lv > worst) worst = lv; if (who) spec[who] = 1; }
    const g = val(vals, 'glu'), col = val(vals, 'col'), hdl = val(vals, 'hdl'), ldl = val(vals, 'ldl'), tri = val(vals, 'tri'), cr = val(vals, 'cre'), ur = val(vals, 'ure'), hb = val(vals, 'hem'), hct = val(vals, 'hct'), pl = val(vals, 'plq'), fe = val(vals, 'fe'), fer = val(vals, 'fer'), tsh = val(vals, 'tsh'), t4 = val(vals, 't4l'), tgo = val(vals, 'tgo'), tgp = val(vals, 'tgp'), bil = val(vals, 'bil'), fal = val(vals, 'fal'), uric = val(vals, 'uric'), pcr = val(vals, 'pcr'), vsg = val(vals, 'vsg'), ca = val(vals, 'ca');
    // Azúcar
    if (g !== null) {
      if (g < 55) add(2, 'Azúcar muy baja', 'Con ' + g + ' mg/dL puedes marearte o desmayarte. Come algo con azúcar ahora y ve hoy al médico.', 'Médico general o endocrinólogo');
      else if (g < 70) add(1, 'Azúcar algo baja', 'Con ' + g + ' mg/dL conviene comer a tus horas y comentarlo con tu médico.', 'Médico general');
      else if (g >= 250) add(2, 'Azúcar muy alta', 'Con ' + g + ' mg/dL ve hoy al médico. Si tienes mucha sed, vómitos o cansancio fuerte, ve a emergencias.', 'Endocrinólogo o médico internista');
      else if (g >= 126) { add(2 - 1, 'Azúcar en rango de posible diabetes', 'Con ' + g + ' mg/dL en ayunas, este valor entra en el rango de diabetes. Un solo examen no basta: se confirma repitiéndolo o con la hemoglobina glicosilada. Pide cita esta semana.', 'Endocrinólogo o médico internista'); ask.push('¿Me repiten la glucosa en ayunas o me piden la hemoglobina glicosilada?'); miss.push('Hemoglobina glicosilada (HbA1c)'); }
      else if (g >= 100) { add(1, 'Azúcar un poco alta (prediabetes posible)', 'Con ' + g + ' mg/dL en ayunas estás por encima de lo normal, pero por debajo de diabetes. Baja los dulces y las bebidas azucaradas, camina 30 minutos casi todos los días y repite el examen en 3 meses.', 'Médico general'); ask.push('¿Debo hacerme la hemoglobina glicosilada para ver cómo ha estado mi azúcar los últimos 3 meses?'); }
      else add(0, 'Azúcar normal', 'Tu glucosa está en el margen normal.');
      doc.push('Glucosa en ayunas ' + g + ' mg/dL' + (g >= 126 ? ' (rango diagnóstico, requiere confirmación)' : g >= 100 ? ' (glucemia alterada en ayunas)' : '') + '.');
    }
    if (r.history && r.history.points && r.history.points.length >= 3) { const pts = r.history.points; const up = pts.every(function (p, i) { return i === 0 || p.v > pts[i - 1].v; }); if (up) { add(1, 'Tu azúcar viene subiendo', 'En los últimos exámenes subió de ' + pts[0].v + ' a ' + pts[pts.length - 1].v + '. Aunque cada valor no sea muy alto, la tendencia importa. Coméntalo con tu médico.', 'Médico general'); ask.push('Mi azúcar sube en cada examen. ¿Qué cambios debo hacer ya?'); doc.push('Glucosa en ascenso en ' + pts.length + ' controles (' + pts.map(function (p) { return p.v; }).join(' → ') + ').'); } }
    // Grasas y riesgo del corazón
    if (col !== null || ldl !== null || tri !== null || hdl !== null) {
      const lowH = hdl !== null && (sex === 'F' ? hdl < 50 : hdl < 40); let n = 0; if (g !== null && g >= 100) n++; if (tri !== null && tri >= 150) n++; if (lowH) n++;
      if (n >= 2) { add(1, 'Varios datos de síndrome metabólico', 'Tu azúcar, tus triglicéridos o tu colesterol bueno están fuera de lo ideal a la vez. Juntos aumentan el riesgo de diabetes y del corazón. Para confirmarlo falta medir la cintura y la tensión.', 'Médico internista'); miss.push('Medida de cintura y tensión arterial'); ask.push('¿Tengo síndrome metabólico? ¿Me miden la cintura y la tensión?'); }
      if (tri !== null && tri >= 500) add(2, 'Triglicéridos muy altos', 'Con ' + tri + ' mg/dL puede inflamarse el páncreas. Ve hoy al médico.', 'Médico internista');
      else if (tri !== null && tri >= 200) add(1, 'Triglicéridos altos', 'Con ' + tri + ' mg/dL conviene bajar dulces, pan blanco y alcohol, y consultar.', 'Médico general');
      if (ldl !== null && ldl >= 190) add(2, 'Colesterol “malo” muy alto', 'Con ' + ldl + ' mg/dL conviene consultar pronto: a veces tiene causa familiar.', 'Cardiólogo o endocrinólogo');
      else if (ldl !== null && ldl >= 160) add(1, 'Colesterol “malo” alto', 'Con ' + ldl + ' mg/dL, baja frituras y grasas de origen animal y pide cita con tu médico.', 'Médico general o cardiólogo');
      else if ((col !== null && col >= 200) || (ldl !== null && ldl >= 130)) { add(1, 'Colesterol un poco alto', 'Esto sube poco a poco el riesgo del corazón. Come más verduras, avena y pescado, y muévete a diario. Coméntalo con tu médico para ver si necesitas otro control.', 'Médico general'); ask.push('Con estos valores, ¿cuál es mi riesgo del corazón y cada cuánto repito el examen?'); }
      else if (col !== null || ldl !== null) add(0, 'Grasas en la sangre en el margen', 'Tus grasas están bien. Sigue comiendo variado y moviéndote.');
      doc.push('Perfil lipídico: ' + [col !== null ? 'CT ' + col : '', ldl !== null ? 'LDL ' + ldl : '', hdl !== null ? 'HDL ' + hdl : '', tri !== null ? 'TG ' + tri : ''].filter(Boolean).join(', ') + ' mg/dL.');
    }
    // Riñón
    if (cr !== null) {
      const e = egfr(cr, age, sex); const st = stage(e);
      if (cr > 3 || e < 15) add(2, 'Riñón muy afectado', 'La creatinina está muy alta (' + cr + ' mg/dL). Ve hoy al médico.', 'Nefrólogo');
      else if (e < 60) { add(2 - 1, 'Posible función del riñón disminuida', 'Con tu creatinina (' + cr + ' mg/dL) el filtrado del riñón se calcula en unos ' + Math.round(e) + ' mL/min (etapa ' + st + '). Un solo examen no confirma una enfermedad del riñón: se repite en 3 meses y se mira la orina. Toma agua y evita antiinflamatorios sin consultar.', 'Nefrólogo o médico internista'); ask.push('¿Me repiten la creatinina y me piden un examen de orina con albúmina?'); miss.push('Orina con albúmina y repetir la creatinina en 3 meses'); }
      else if (cr > 1.3) add(1, 'Creatinina un poco alta', 'Con ' + cr + ' mg/dL conviene tomar agua y repetir el examen. Coméntalo con tu médico.', 'Médico general');
      else add(0, 'Riñón en el margen', 'Tu creatinina está normal; el filtrado se calcula en unos ' + Math.round(e) + ' mL/min.');
      doc.push('Creatinina ' + cr + ' mg/dL' + (ur !== null ? ', urea ' + ur + ' mg/dL' : '') + '; filtrado estimado (CKD-EPI 2021) ' + Math.round(e) + ' mL/min/1,73 m² (' + st + '). Una sola medición no establece enfermedad renal crónica.');
    } else if (ur !== null && ur > 100) add(2, 'Urea muy alta', 'Con ' + ur + ' mg/dL ve hoy al médico.', 'Nefrólogo');
    else if (ur !== null && ur > 45) add(1, 'Urea alta', 'Toma agua y coméntalo con tu médico.', 'Médico general');
    // Sangre
    if (hb !== null) {
      const lim = sex === 'F' ? 12 : 13;
      if (hb < 7) add(2, 'Hemoglobina muy baja', 'Con ' + hb + ' g/dL puede faltarte el aire o sentirte muy débil. Ve hoy al médico.', 'Hematólogo o médico internista');
      else if (hb < lim) { const fal_ = (fer !== null && fer < 13) || (fe !== null && fe < 60); add(1, fal_ ? 'Anemia, probablemente por falta de hierro' : 'Anemia (hemoglobina baja)', 'Tu hemoglobina (' + hb + ' g/dL) está por debajo de ' + lim + '.' + (fal_ ? ' Tu hierro o tu ferritina también están bajos, lo que apunta a falta de hierro.' : ' Faltan datos para saber la causa.') + ' Come carnes, lentejas y verduras verdes, y pide cita con tu médico.', 'Hematólogo o médico internista'); ask.push('¿Por qué tengo la hemoglobina baja y necesito hierro?'); miss.push('Tamaño de los glóbulos rojos (VCM) y reticulocitos'); }
      else if (hb > (sex === 'F' ? 16 : 17.5)) add(1, 'Hemoglobina alta', 'Toma agua y coméntalo con tu médico; si fumas o vives en altura, puede explicarlo.', 'Médico general');
      else add(0, 'Hemoglobina normal', 'Tu hemoglobina está en el margen normal.');
      doc.push('Hemoglobina ' + hb + ' g/dL' + (hct !== null ? ', hematocrito ' + hct + ' %' : '') + (fer !== null ? ', ferritina ' + fer + ' ng/mL' : '') + '.');
    }
    if (pl !== null) {
      if (pl < 50) add(2, 'Plaquetas muy bajas', 'Con ' + pl + ' mil/µL hay riesgo de sangrado. Ve hoy al médico o a emergencias.', 'Hematólogo');
      else if (pl < 100) add(2 - 1, 'Plaquetas bajas', 'Con ' + pl + ' mil/µL conviene ver hoy a tu médico. Si tienes fiebre, puede ser importante (por ejemplo, dengue).', 'Médico internista');
      else if (pl < 150) add(1, 'Plaquetas un poco bajas', 'Repite el examen y coméntalo con tu médico.', 'Médico general');
      else if (pl > 450) add(1, 'Plaquetas altas', 'Pueden subir con una infección o con falta de hierro. Coméntalo con tu médico.', 'Médico general');
    }
    // Hígado
    if (tgo !== null || tgp !== null || bil !== null || fal !== null) {
      const hi = (tgo !== null && tgo > 40) || (tgp !== null && tgp > 41); const big = (tgo !== null && tgo > 120) || (tgp !== null && tgp > 123);
      if (big) add(2 - 1, 'Hígado muy irritado', 'Las transaminasas están más de 3 veces sobre lo normal. Pide cita esta semana y evita alcohol y medicinas sin receta.', 'Gastroenterólogo o hepatólogo');
      else if (hi) add(1, 'Hígado un poco irritado', 'Las transaminasas están algo altas. Evita el alcohol, baja las grasas y repite el examen. Puede ser hígado graso, una medicina o un virus.', 'Médico general o gastroenterólogo');
      if (bil !== null && bil > 1.2) add(bil > 3 ? 2 - 1 : 1, 'Bilirrubina alta', 'Si ves la piel o los ojos amarillos, ve pronto al médico.', 'Gastroenterólogo');
      if (!hi && !(bil !== null && bil > 1.2) && (tgo !== null || tgp !== null)) add(0, 'Hígado en el margen', 'Tus pruebas del hígado están normales.');
      if (fal !== null && fal > 129) add(1, 'Fosfatasa alcalina alta', 'Puede venir del hígado o del hueso. Tu médico debe mirar el resto de las pruebas.', 'Médico general');
      doc.push('Perfil hepático: ' + [tgo !== null ? 'TGO ' + tgo : '', tgp !== null ? 'TGP ' + tgp : '', bil !== null ? 'bilirrubina ' + bil : '', fal !== null ? 'FAL ' + fal : ''].filter(Boolean).join(', ') + '.');
    }
    // Tiroides
    if (tsh !== null) {
      if (tsh > 4 && t4 !== null && t4 < 0.8) add(1, 'Tiroides lenta (posible hipotiroidismo)', 'La TSH está alta y la T4 libre baja: la tiroides produce menos hormona de la que debe. Pide cita con tu médico o endocrinólogo.', 'Endocrinólogo');
      else if (tsh > 4) { add(1, 'TSH alta', 'Puede indicar una tiroides algo lenta. Falta la T4 libre para saberlo.', 'Endocrinólogo o médico general'); miss.push('T4 libre'); }
      else if (tsh < 0.4 && t4 !== null && t4 > 1.8) add(1, 'Tiroides acelerada (posible hipertiroidismo)', 'La TSH está baja y la T4 libre alta. Pide cita pronto con tu médico o endocrinólogo.', 'Endocrinólogo');
      else if (tsh < 0.4) { add(1, 'TSH baja', 'Puede indicar una tiroides algo acelerada. Falta la T4 libre para saberlo.', 'Endocrinólogo o médico general'); miss.push('T4 libre'); }
      else add(0, 'Tiroides en el margen', 'Tu TSH está normal.');
    }
    // Otros
    if (uric !== null) { const lim = sex === 'F' ? 6 : 7.2; if (uric > lim) add(1, 'Ácido úrico alto', 'Con ' + uric + ' mg/dL puede dar crisis de gota (dolor fuerte en una articulación). Toma agua, baja carnes rojas, vísceras y alcohol.', 'Médico general o reumatólogo'); }
    if (pcr !== null && pcr > 5 || (vsg !== null && vsg > 20)) { add(pcr !== null && pcr > 100 ? 2 : 1, 'Señales de inflamación o infección', 'La proteína C reactiva o la sedimentación están altas. Sola no dice dónde está el problema: tu médico debe unirla con tus síntomas.', 'Médico general'); ask.push('Mi examen muestra inflamación. ¿Qué la puede estar causando?'); }
    if (ca !== null && (ca > 11 || ca < 7.5)) add(2 - 1, ca > 11 ? 'Calcio alto' : 'Calcio bajo', 'Conviene ver pronto a tu médico para repetirlo y buscar la causa.', 'Endocrinólogo o médico internista');
    // Infecciones
    const pos = r.pos || {};
    Object.keys(pos).forEach(function (id) {
      const c = D.BY_ID[id] || { name: id }; const x = pos[id]; if (x.res !== 'Positivo') return;
      if (id === 'dns1' || id === 'dig') { add(2 - 1, 'Posible dengue', 'La prueba salió positiva. Toma mucho líquido y reposa. No tomes aspirina ni ibuprofeno: usa paracetamol. Ve de inmediato a emergencias si hay dolor fuerte de barriga, vómitos que no paran, sangrado, mucha somnolencia o la fiebre baja y te sientes peor.', 'Infectólogo o médico general'); ask.push('¿Necesito controles de plaquetas los próximos días?'); }
      else if (id === 'gota' || id === 'mal') add(2, 'Posible malaria', 'La malaria necesita tratamiento el mismo día. Ve hoy a un centro de salud.', 'Infectólogo o médico general');
      else if (id === 'baar' || id === 'gx') add(2 - 1, 'Posible tuberculosis', 'Hay que confirmarla y empezar el tratamiento pronto. Ve esta semana al médico. Mientras tanto, cúbrete al toser y ventila los espacios.', 'Neumólogo o infectólogo');
      else if (c.sens) { add(1, c.name + ': positivo (confirmar)', 'Una prueba positiva en este tipo de examen se confirma con otra prueba antes de hablar de diagnóstico. Hay tratamiento y seguimiento. Pide cita con un infectólogo o tu médico. Tu resultado es privado.', 'Infectólogo'); ask.push('¿Qué prueba de confirmación necesito para ' + c.name.split('·')[0].trim() + '?'); }
      else add(1, c.name + ': positivo', 'Un positivo no es un diagnóstico por sí solo. Llévalo a tu médico para confirmarlo y ver el tratamiento.', 'Infectólogo o médico general');
      doc.push(c.name + ': POSITIVO' + (x.detail ? ' (' + x.detail + ')' : '') + '.');
    });
    // Cultivos
    Object.keys(r.cult || {}).forEach(function (id) {
      const x = r.cult[id]; const c = D.BY_ID[id] || { name: id };
      if (x.none) { add(0, c.name + ': sin bacterias', 'No creció ninguna bacteria.'); return; }
      const R = x.rows.filter(function (a) { return a.r === 'R'; }).map(function (a) { return a.ab; }), S_ = x.rows.filter(function (a) { return a.r === 'S'; }).map(function (a) { return a.ab; });
      add(1, c.name + ': creció ' + x.org, 'Esta bacteria es resistente a ' + (R.length ? R.join(', ') : 'ningún antibiótico probado') + (S_.length ? ' y sensible a ' + S_.slice(0, 4).join(', ') : '') + '. Tu médico elige el antibiótico: no te automediques.', 'Infectólogo o médico general'); ask.push('¿Qué antibiótico me conviene según el antibiograma?');
      doc.push(c.name + ': ' + x.org + '; resistente: ' + (R.join(', ') || 'ninguno') + '; sensible: ' + (S_.join(', ') || 'ninguno') + '.');
    });
    // Informes de imagen y estudios
    Object.keys(r.reports || {}).forEach(function (id) {
      const x = r.reports[id]; const c = D.BY_ID[id] || { name: id }; const t = (x.hallazgos + ' ' + x.conclusion).toLowerCase();
      const clean = t.replace(/(sin|no se observan?|no hay|libres? de|ausencia de|descarta)\s+[^.,;]*/g, ' ');
      if (REPORT_RED.test(clean)) add(2, c.name + ': hallazgo que no puede esperar', 'El informe menciona algo que necesita atención médica hoy. Ve a emergencias o llama a tu médico ahora.', 'Emergencias');
      else if (REPORT_YEL.test(clean)) add(1, c.name + ': hay hallazgos que ver con el médico', 'El informe menciona hallazgos que conviene comentar con tu médico pronto.', 'Médico general o el especialista del órgano');
      else add(0, c.name + ': sin alteraciones importantes', 'El informe del especialista no señala nada preocupante. Guárdalo para tus controles.');
      GLOS.forEach(function (gl) { if (gl[0].test(clean)) { F.push({ lv: 0, title: 'Palabra del informe: “' + gl[1] + '”', text: 'Significa ' + gl[2] + '.' }); } });
      doc.push(c.name + ' (' + (x.by || 'especialista') + '): ' + x.conclusion);
    });
    Object.keys(r.texts || {}).forEach(function (id) { doc.push((D.BY_ID[id] ? D.BY_ID[id].name : id) + ': ' + r.texts[id]); });

    F.sort(function (a, b) { return b.lv - a.lv; });
    const specs = Object.keys(spec);
    const lead = worst === 2 ? 'Hay algo que no puede esperar. Sigue las indicaciones en rojo y ve hoy a un médico.' : worst === 1 ? 'Hay puntos para mejorar o vigilar. Ninguno es una emergencia, pero conviene hablarlo con tu médico pronto.' : 'Todo lo que se leyó está bien. Sigue con tus controles y tus buenos hábitos.';
    if (!ask.length && worst) ask.push('¿Qué debo repetir o controlar y en cuánto tiempo?');
    F.forEach(function (f) { f.title = T(f.title); f.text = T(f.text); }); return { level: worst, lead: lead, findings: F, specialists: specs, ask: ask.slice(0, 4), missing: miss, doctor: doc.map(T) };
  }

  /* ---------- Qué sabe leer hoy (según la lista de 13 secciones) ---------- */
  function coverage() {
    const C = D.CATALOG; const nNum = C.filter(function (c) { return c.kind === 'range' || c.kind === 'max' || c.kind === 'min'; }).length, nPos = C.filter(function (c) { return c.kind === 'pos'; }).length, nCult = C.filter(function (c) { return c.kind === 'cult'; }).length, nRep = C.filter(function (c) { return c.kind === 'report'; }).length;
    return [
      { n: '1. Laboratorio', bio: 'Lee hoy: ' + nNum + ' con valores, ' + nPos + ' de infecciones y ' + nCult + ' cultivos', med: 'Lee hoy', st: 'ok', note: 'Hormonas, genética, marcadores de tumores y otros siguen en la lista de preparación.' },
      { n: '2. Rayos X', bio: 'Lee el informe escrito', med: 'Lee el informe escrito', st: 'part', note: 'No mira la imagen: lee lo que escribió el especialista.' },
      { n: '3. Ecografías', bio: 'Lee el informe escrito', med: 'Lee el informe escrito', st: 'part', note: 'Igual: palabras clave y orientación.' },
      { n: '4. Resonancias', bio: 'Lee el informe escrito', med: 'Lee el informe escrito', st: 'part', note: 'Igual.' },
      { n: '5. Tomografías', bio: 'Lee el informe escrito', med: 'Lee el informe escrito', st: 'part', note: 'Igual.' },
      { n: '6. Gramas (ECG, EEG, etc.)', bio: 'Lee el informe escrito', med: 'Lee el informe escrito', st: 'part', note: 'Todavía no lee el trazo; sí la conclusión escrita.' },
      { n: '7. Medicina nuclear', bio: 'En preparación', med: 'Informe escrito', st: 'next', note: 'Entra con el mismo método de informe.' },
      { n: '8. Endoscopias', bio: 'En preparación', med: 'Informe escrito', st: 'next', note: 'Entra con el mismo método de informe.' },
      { n: '9. Biopsias y citologías', bio: 'Siempre una persona', med: 'Informe escrito', st: 'next', note: 'El informe de patología siempre lo firma el patólogo.' },
      { n: '10. Pruebas de función', bio: 'En preparación', med: 'En preparación', st: 'next', note: 'Espirometría, audiometría y otras: valores propios.' },
      { n: '11. Estudios por órgano', bio: 'Mezcla de las anteriores', med: 'Lee hoy lo ya incluido', st: 'part', note: 'Se activa a medida que entran los exámenes de cada órgano.' },
      { n: '12. Enfermedades de Venezuela', bio: 'Lee hoy', med: 'Lee hoy', st: 'ok', note: 'Dengue, malaria, Chagas, leishmaniasis, tuberculosis, hongos y más.' },
      { n: '13. Paquetes de laboratorio', bio: 'Lee hoy (' + D.PACKAGES.length + ' paquetes)', med: 'Lee hoy', st: 'ok', note: 'Perfil 20, preoperatorio, prenatal y otros.' }
    ];
  }

  window.BOTS = { bio: { review: review, agree: agree, kindAuto: kindAuto, MIN_N: MIN_N, MIN_OK: MIN_OK }, med: { read: read, egfr: egfr }, coverage: coverage };
})();
