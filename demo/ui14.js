/* LABS demo · ejemplos de imagen y de estudios (rayos X, ecografía, electrocardiograma, electroencefalograma, resonancia y tomografía).
   Las imágenes son dibujos hechos a mano para la demo: NO son estudios reales de ninguna persona. */
(function () {
  const D = window.LABSDATA, S = window.S, U = window.UI, EXT = window.EXT, X = EXT.fn, A = EXT.actions, V = EXT.views;
  const esc = U.esc;
  function svg(w, h, body) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + body + '</svg>'); }
  function tag(w, h, t, dark) { const c = dark ? '#E8ECFF' : '#3345B5'; return '<g font-family="Poppins,Arial,sans-serif" font-weight="700"><rect x="10" y="' + (h - 30) + '" rx="6" width="' + (t.length * 7.4 + 20) + '" height="20" fill="' + (dark ? 'rgba(255,255,255,.14)' : 'rgba(51,69,181,.1)') + '"/><text x="20" y="' + (h - 16) + '" font-size="11" fill="' + c + '">' + t + '</text></g>'; }

  /* Rayos X de tórax */
  function ribs() { let s = ''; for (let i = 0; i < 7; i++) { const y = 120 + i * 34, sp = 60 + i * 6; s += '<path d="M200 ' + y + ' C ' + (200 - sp) + ' ' + (y - 18) + ' ' + (120 - i * 4) + ' ' + (y + 6) + ' ' + (92 - i * 3) + ' ' + (y + 40) + '" stroke="#BFC3CF" stroke-opacity=".32" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M200 ' + y + ' C ' + (200 + sp) + ' ' + (y - 18) + ' ' + (280 + i * 4) + ' ' + (y + 6) + ' ' + (308 + i * 3) + ' ' + (y + 40) + '" stroke="#BFC3CF" stroke-opacity=".32" stroke-width="8" fill="none" stroke-linecap="round"/>'; } return s; }
  const RX = svg(400, 440, '<defs><radialGradient id="b" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#6E7280"/><stop offset="1" stop-color="#1A1C22"/></radialGradient><radialGradient id="l" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#0B0C10"/><stop offset="1" stop-color="#2A2D36"/></radialGradient></defs>' +
    '<rect width="400" height="440" fill="#050608"/><path d="M40 440 C 40 250 70 120 130 80 Q 200 50 270 80 C 330 120 360 250 360 440 Z" fill="url(#b)"/>' +
    '<ellipse cx="138" cy="230" rx="62" ry="135" fill="url(#l)" opacity=".92"/><ellipse cx="262" cy="230" rx="62" ry="135" fill="url(#l)" opacity=".92"/>' + ribs() +
    '<rect x="192" y="60" width="16" height="360" rx="7" fill="#D5D8E0" opacity=".75"/><path d="M196 250 C 180 270 178 335 215 352 C 275 350 300 300 262 255 C 240 240 210 240 196 250 Z" fill="#A3A7B3" opacity=".55"/>' +
    '<path d="M60 380 Q 200 330 340 380" stroke="#C9CCD6" stroke-opacity=".5" stroke-width="10" fill="none"/><text x="368" y="34" font-family="Arial" font-size="20" font-weight="700" fill="#E8ECFF">D</text>' + tag(400, 440, 'IMAGEN DE EJEMPLO · TÓRAX PA', true));

  /* Ecografía abdominal */
  function speck() { let s = '', seed = 11; function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; } for (let i = 0; i < 420; i++) { const a = -0.62 + r() * 1.24, d = 40 + r() * 290; s += '<circle cx="' + (200 + Math.sin(a) * d).toFixed(1) + '" cy="' + (30 + Math.cos(a) * d).toFixed(1) + '" r="' + (0.8 + r() * 1.8).toFixed(1) + '" fill="#fff" opacity="' + (0.08 + r() * 0.35).toFixed(2) + '"/>'; } return s; }
  const ECO = svg(400, 380, '<defs><clipPath id="f"><path d="M200 30 L 18 300 A 330 330 0 0 0 382 300 Z"/></clipPath><radialGradient id="g" cx="50%" cy="10%" r="90%"><stop offset="0" stop-color="#6A6A6A"/><stop offset="1" stop-color="#262626"/></radialGradient></defs>' +
    '<rect width="400" height="380" fill="#000"/><g clip-path="url(#f)"><rect width="400" height="380" fill="url(#g)"/>' + speck() +
    '<path d="M80 150 C 120 110 260 100 320 150 C 330 220 250 260 160 250 C 100 240 70 200 80 150 Z" fill="#8A8A8A" opacity=".5"/><ellipse cx="240" cy="270" rx="34" ry="22" fill="#050505" opacity=".85"/><path d="M110 300 C 150 285 190 300 210 320" stroke="#DDD" stroke-width="3" fill="none" opacity=".5"/></g>' +
    '<path d="M200 30 L 18 300 A 330 330 0 0 0 382 300 Z" fill="none" stroke="#444"/><g font-family="Arial" font-size="11" fill="#9BE7FF"><text x="12" y="20">ABD · 3.5 MHz</text><text x="300" y="20">PROF 16 cm</text><text x="236" y="305">VB</text></g>' +
    '<g stroke="#9BE7FF" stroke-width="1.5"><path d="M150 180 l8 0 M154 176 l0 8 M290 170 l8 0 M294 166 l0 8"/><path d="M158 180 L 290 170" stroke-dasharray="4 4"/></g>' + tag(400, 380, 'IMAGEN DE EJEMPLO · HÍGADO Y VESÍCULA', true));

  /* Electrocardiograma */
  function grid(w, h) { let s = ''; for (let x = 0; x <= w; x += 10) s += '<path d="M' + x + ' 0V' + h + '" stroke="#F4B4B4" stroke-width="' + (x % 50 ? .5 : 1.2) + '"/>'; for (let y = 0; y <= h; y += 10) s += '<path d="M0 ' + y + 'H' + w + '" stroke="#F4B4B4" stroke-width="' + (y % 50 ? .5 : 1.2) + '"/>'; return s; }
  function beats(y0, n, step) { let d = 'M0 ' + y0; for (let i = 0; i < n; i++) { const x = 20 + i * step; d += ' L' + x + ' ' + y0 + ' q6 -8 12 0 l10 0 l4 6 l6 -52 l6 62 l5 -16 l14 0 q12 -16 24 0'; } return d + ' L' + (20 + n * step + 60) + ' ' + y0; }
  const ECG = svg(600, 300, '<rect width="600" height="300" fill="#FFF6F6"/>' + grid(600, 300) +
    '<g fill="none" stroke="#14193A" stroke-width="2" stroke-linejoin="round">' + '<path d="' + beats(90, 6, 96) + '"/><path d="' + beats(190, 6, 96) + '"/></g>' +
    '<g font-family="Arial" font-size="12" font-weight="700" fill="#14193A"><text x="8" y="60">DII</text><text x="8" y="160">V5</text><text x="430" y="262">25 mm/s · 10 mm/mV · FC 72</text></g>' + tag(600, 300, 'TRAZO DE EJEMPLO', false));

  /* Electroencefalograma */
  function wave(y, amp, f, seed) { let d = 'M60 ' + y; for (let x = 60; x <= 590; x += 3) { const v = Math.sin(x * f + seed) * amp + Math.sin(x * f * 2.7 + seed * 3) * amp * 0.45 + Math.sin(x * 0.9 + seed) * amp * 0.2; d += ' L' + x + ' ' + (y + v).toFixed(1); } return d; }
  const EEG = svg(600, 300, '<rect width="600" height="300" fill="#FBFCFF"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<path d="M60 ' + (28 + i * 30) + 'H590" stroke="#E3E7F6"/>'; }).join('') +
    '<g fill="none" stroke="#2F3E9E" stroke-width="1.3">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<path d="' + wave(28 + i * 30, 7 + (i % 3), 0.11 + i * 0.006, i) + '"/>'; }).join('') + '</g>' +
    '<g font-family="Arial" font-size="11" font-weight="700" fill="#3A4470">' + ['Fp1-F3', 'F3-C3', 'C3-P3', 'P3-O1', 'Fp2-F4', 'F4-C4', 'C4-P4', 'P4-O2'].map(function (t, i) { return '<text x="6" y="' + (32 + i * 30) + '">' + t + '</text>'; }).join('') + '</g>' + tag(600, 300, 'TRAZO DE EJEMPLO', false));

  /* Corte de resonancia o tomografía */
  function slice(kind) {
    const knee = kind === 'rm';
    return svg(400, 400, '<defs><radialGradient id="s" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#8C8F99"/><stop offset="1" stop-color="#2B2D33"/></radialGradient></defs><rect width="400" height="400" fill="#000"/>' +
      (knee ? '<path d="M120 20 C 110 120 120 160 150 190 L 250 190 C 280 160 290 120 280 20 Z" fill="url(#s)"/><path d="M130 380 C 125 290 135 240 160 215 L 240 215 C 265 240 275 290 270 380 Z" fill="url(#s)"/><path d="M150 196 Q 200 210 250 196 L 250 210 Q 200 222 150 210 Z" fill="#111"/><path d="M175 120 L 225 300" stroke="#222" stroke-width="10"/>'
        : '<ellipse cx="200" cy="200" rx="150" ry="175" fill="#E9EAEE"/><ellipse cx="200" cy="200" rx="138" ry="163" fill="url(#s)"/><path d="M200 45 L 200 355" stroke="#3A3C44" stroke-width="3"/><ellipse cx="170" cy="200" rx="18" ry="40" fill="#15161A"/><ellipse cx="230" cy="200" rx="18" ry="40" fill="#15161A"/>') +
      '<g font-family="Arial" font-size="11" fill="#CFD5F5"><text x="12" y="20">' + (knee ? 'RM · T2 SAGITAL' : 'TC · CORTE AXIAL') + '</text></g>' + tag(400, 400, 'IMAGEN DE EJEMPLO', true));
  }
  const IMG = { rx: RX, ecoab: ECO, ecg: ECG, eeg: EEG, rm: slice('rm'), tac: slice('tac') };
  EXT.exampleImg = IMG;

  /* ---------- Resultados de ejemplo de Ana Rodríguez (también los ve su médico) ---------- */
  function mk(id, title, date, reports) {
    const p = X.personOf('p1'); return { id: id, title: title, lab: 'Laboratorio Ejemplo', date: date, patient: p.name, ci: X.maskCi(p.ci), age: p.age, sex: p.sex, values: [], history: null, pid: 'p1', reports: reports, live: true };
  }
  const R1 = mk('LAB-0131', 'Rayos X de tórax y ecografía abdominal', '6 de noviembre de 2026', {
    rx: { hallazgos: 'Campos pulmonares bien aireados, sin imágenes de consolidación. Silueta cardíaca de tamaño normal. Senos costofrénicos libres. Estructuras óseas sin alteraciones.', conclusion: 'Radiografía de tórax sin alteraciones.', img: IMG.rx, by: 'Dr. Andrés Lozada' },
    ecoab: { hallazgos: 'Hígado de tamaño normal con aumento leve y difuso de la ecogenicidad. Vesícula de paredes finas, sin cálculos. Vías biliares no dilatadas. Riñones de forma y tamaño normales.', conclusion: 'Esteatosis hepática leve (hígado graso leve). Resto del estudio sin hallazgos.', img: IMG.ecoab, by: 'Dr. Andrés Lozada' }
  });
  const R2 = mk('LAB-0127', 'Electrocardiograma', '20 de octubre de 2026', {
    ecg: { hallazgos: 'Ritmo sinusal regular, frecuencia de 72 latidos por minuto. Eje eléctrico normal. PR 160 ms, QRS 90 ms, QTc 410 ms. Sin alteraciones de la repolarización.', conclusion: 'Electrocardiograma dentro de límites normales.', img: IMG.ecg, by: 'Dra. Elena Suárez' }
  });
  [R1, R2].forEach(function (r) {
    if (D.PATIENT_RESULTS.some(function (x) { return x.id === r.id; })) return;
    D.PATIENT_RESULTS.push(r); const idx = D.PATIENT_RESULTS.length - 1;
    const exams = Object.keys(r.reports); const usd = exams.reduce(function (s, e) { return s + D.BY_ID[e].price; }, 0);
    const o = { id: r.id, pid: 'p1', exams: exams, usd: usd, cost: exams.reduce(function (s, e) { return s + D.BY_ID[e].cost; }, 0), cur: 'bcv', rate: D.RATES.bcv.value, method: 'Pago móvil', paid: true, status: 'Enviada', when: r.date.replace(/ de 2026$/, '').replace(' de ', ' ').replace('noviembre', 'nov').replace('octubre', 'oct'), by: 'Gabriela Ruiz', doctor: '', via: 'QR', resultIdx: idx };
    const k = S.orders.map(function (x) { return x.id; }).indexOf('LAB-0121'); S.orders.splice(k < 0 ? S.orders.length : k, 0, o);
  });

  /* ---------- Laboratorio: “Rellenar con un ejemplo” también pone la imagen ---------- */
  const fill0 = A['res-fill'];
  A['res-fill'] = function (v) { const o = S.orders.filter(function (x) { return x.id === S.ordSel; })[0]; if (o) o.exams.forEach(function (id) { if (IMG[id] && !S.f['ri-' + id]) S.f['ri-' + id] = IMG[id]; }); fill0(v); };

  /* ---------- Médico: dentro de cada estudio se ve la imagen y la conclusión ---------- */
  const dl0 = V.doc.lista;
  V.doc.lista = function () {
    return dl0().replace(/(data-a="acc" data-v="r:(\d+)"(?:(?!data-a="acc")[\s\S])*?)<p class="small muted">Este estudio trae un informe o resultado en texto\. Ábrelo para verlo completo\.<\/p>/g, function (m, pre, i) {
      const r = D.PATIENT_RESULTS[parseInt(i, 10)]; if (!r || !r.reports) return m;
      return pre + Object.keys(r.reports).map(function (k) { const x = r.reports[k]; return '<div class="rep-mini">' + (x.img ? '<img src="' + x.img + '" alt="Imagen del estudio ' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + '">' : '') + '<div><b>' + esc(D.BY_ID[k] ? D.BY_ID[k].name : k) + '</b><div class="small"><b>Conclusión:</b> ' + esc(x.conclusion) + '</div><div class="small muted">Interpretó: ' + esc(x.by || 'Especialista') + '</div></div></div>'; }).join('');
    });
  };

  /* ---------- Paciente y laboratorio: la imagen se abre en grande al tocarla ---------- */
  document.addEventListener('click', function (ev) {
    const im = ev.target.closest && ev.target.closest('#app img[src^="data:image"]'); if (!im || im.closest('.paper-fit, .sheet, .modal') || !/estudio|adjunta/i.test(im.getAttribute('alt') || '')) return;
    X.dlg(im.getAttribute('alt') || 'Imagen del estudio', '<img src="' + im.getAttribute('src') + '" alt="' + esc(im.getAttribute('alt') || 'Imagen del estudio') + '" style="width:100%;height:auto;border-radius:12px;background:#000"><p class="small muted">Imagen de ejemplo para la demostración. No es un estudio real.</p>');
  });
  window.render();
})();
