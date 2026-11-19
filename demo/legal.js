/* Términos y condiciones y privacidad: lectura en la app y descarga en PDF con la identidad de LABS */
(function () {
  'use strict';
  const S = window.S, EXT = window.EXT, X = EXT.fn, U = window.UI, A = EXT.actions, TM = window.TERMS, esc = U.esc;
  if (S.settings) S.settings.terms = TM.version;

  function ver() { return (S.settings && S.settings.terms) || TM.version; }

  function partHtml(part, openFirst) {
    return '<h3 style="margin:10px 0 2px">' + esc(part.title) + '</h3>' + part.sections.map(function (s, i) {
      return '<details class="acc"' + (openFirst && i === 0 ? ' open' : '') + '><summary>' + esc(s.h) + '</summary>' + s.p.map(function (p) {
        return Array.isArray(p) ? '<ul class="clean small">' + p.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>' : '<p class="small">' + esc(p) + '</p>';
      }).join('') + '</details>';
    }).join('');
  }
  function noteHtml() { return '<div class="card note small"><p><b>Versión de demostración.</b> ' + esc(TM.note) + '</p></div>'; }
  function summaryHtml() { return '<div class="card" style="box-shadow:none;background:rgba(255,255,255,0.6)"><h3>En palabras simples</h3><ul class="clean small">' + TM.summary.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'; }

  A['terms-open'] = function (v) {
    const html = noteHtml() + summaryHtml() + partHtml(TM.parts[0], v !== 'B') + partHtml(TM.parts[1], v === 'B') + '<p class="small muted">Versión ' + esc(ver()) + ' · ' + esc(TM.date) + '</p>';
    S.modal = { type: 'dlg', title: 'Términos y condiciones · Privacidad', html: html, ok: { label: 'Descargar en PDF', a: 'legal-dl', v: '', closeLabel: 'Cerrar' }, extra: null, fresh: true, big: true };
    window.render();
  };
  const post0 = window.UI_post;
  window.UI_post = function () {
    if (post0) post0();
    if (S.modal && S.modal.big) { const m = document.querySelector('.modal'); if (m) { m.style.maxWidth = '760px'; } }
  };

  EXT.legalHtml = function () {
    return '<div class="card"><h2>Legal y versión</h2><p class="small muted">Lo que debes saber antes de usar LABS, en palabras simples.</p>' + summaryHtml() +
      '<div class="row"><button class="btn" type="button" data-a="terms-open" data-v="A">Leer términos y condiciones</button><button class="btn ghost" type="button" data-a="terms-open" data-v="B">Leer política de privacidad</button><button class="btn ghost" type="button" data-a="legal-dl">Descargar en PDF</button></div>' +
      '<div class="row"><span class="chip gray">LABS demo 0.9</span><span class="chip gray">Términos v' + esc(ver()) + '</span><span class="chip gray">' + esc(TM.date) + '</span></div>' +
      noteHtml() +
      '<p class="small muted">Contacto de soporte: soporte@labs.demo · WhatsApp +58 000 000 0000 · Lunes a sábado, 8 a. m. a 6 p. m. (datos de ejemplo).</p></div>';
  };

  /* ---------- PDF ---------- */
  function build() {
    const kit = EXT.pdfKit, C = kit.C, T = kit.T; const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', compress: true });
    kit.fonts(doc);
    const PW = 612, PH = 792, M = 48, CW = PW - 2 * M, BOT = PH - 60; let y = 0;
    const fill = function (c) { doc.setFillColor(c[0], c[1], c[2]); }, stroke = function (c) { doc.setDrawColor(c[0], c[1], c[2]); }, ink = function (c) { doc.setTextColor(c[0], c[1], c[2]); };
    const font = function (st, sz) { doc.setFont('Poppins', st); doc.setFontSize(sz); };
    const lines = function (t, w, st, sz) { font(st, sz); return doc.splitTextToSize(T(t), w); };
    function header(first) {
      if (first) {
        fill(C.bg); doc.rect(0, 0, PW, 100, 'F'); fill(C.deep); doc.rect(0, 100, PW, 3, 'F');
        doc.addImage(kit.logo, 'PNG', M, 28, 98, 32);
        font('bold', 16); ink(C.ink); doc.text('Términos y condiciones', PW - M, 42, { align: 'right' });
        font('bold', 12); doc.text('y política de privacidad', PW - M, 58, { align: 'right' });
        font('normal', 8.5); ink(C.muted); doc.text('Versión ' + ver() + '  ·  ' + TM.date, PW - M, 76, { align: 'right' });
        y = 124;
      } else {
        fill(C.bg); doc.rect(0, 0, PW, 40, 'F'); fill(C.deep); doc.rect(0, 40, PW, 2, 'F'); doc.addImage(kit.logo, 'PNG', M, 11, 56, 18);
        font('normal', 8); ink(C.muted); doc.text('Términos y condiciones y política de privacidad  ·  Versión ' + ver(), PW - M, 24, { align: 'right' }); y = 64;
      }
    }
    function newPage() { doc.addPage(); header(false); }
    function ensure(h) { if (y + h > BOT) newPage(); }
    function box(t, title, bg, fg, st) {
      const ls = lines(t, CW - 28, 'normal', 8.5); const h = ls.length * 11.5 + 30; ensure(h + 8);
      fill(bg); doc.roundedRect(M, y, CW, h, 6, 6, 'F'); font('bold', 8.5); ink(fg); doc.text(T(title), M + 14, y + 16); font('normal', 8.5); ink(C.ink); doc.text(ls, M + 14, y + 29); y += h + 12;
    }
    function bullets(arr, sz) {
      arr.forEach(function (t) { const ls = lines(t, CW - 22, 'normal', sz); ls.forEach(function (ln, k) { ensure(13); if (k === 0) { fill(C.primary); doc.circle(M + 6, y + 6, 1.6, 'F'); } font('normal', sz); ink(C.ink); doc.text(ln, M + 16, y + 9); y += 12.5; }); y += 2; });
    }
    function para(t, sz) { const ls = lines(t, CW, 'normal', sz); ls.forEach(function (ln) { ensure(13); font('normal', sz); ink(C.ink); doc.text(ln, M, y + 9); y += 12.5; }); y += 4; }

    header(true);
    box(TM.note, 'VERSIÓN DE DEMOSTRACIÓN', C.warnBg, C.warn);
    (function () { const items = TM.summary.map(function (t) { return lines(t, CW - 40, 'normal', 9); }); const h = items.reduce(function (a, l) { return a + l.length * 12 + 4; }, 0) + 34; ensure(h + 8); fill(C.bg); doc.roundedRect(M, y, CW, h, 6, 6, 'F'); font('bold', 9.5); ink(C.primary); doc.text('EN PALABRAS SIMPLES', M + 14, y + 18); let yy = y + 32; items.forEach(function (l) { fill(C.primary); doc.circle(M + 18, yy + 4, 1.6, 'F'); font('normal', 9); ink(C.ink); doc.text(l, M + 28, yy + 7); yy += l.length * 12 + 4; }); y += h + 16; })();
    TM.parts.forEach(function (part, pi) {
      ensure(70); fill(C.deep); doc.roundedRect(M, y, CW, 24, 5, 5, 'F'); font('bold', 10.5); ink(C.white); doc.text(T(part.title), M + 12, y + 16); y += 38;
      part.sections.forEach(function (s) {
        ensure(48); font('bold', 10.5); ink(C.deep); doc.text(T(s.h), M, y + 10); y += 20;
        s.p.forEach(function (p) { if (Array.isArray(p)) bullets(p, 9); else para(p, 9); });
        y += 6;
      });
      y += 6;
    });
    const N = doc.getNumberOfPages();
    for (let p = 1; p <= N; p++) { doc.setPage(p); stroke(C.line); doc.setLineWidth(0.8); doc.line(M, PH - 44, PW - M, PH - 44); font('normal', 7.5); ink(C.muted); doc.text('LABS · by Insanity Media LLC', M, PH - 30); doc.text('Términos y condiciones · Versión ' + ver(), PW / 2, PH - 30, { align: 'center' }); doc.text('Página ' + p + ' de ' + N, PW - M, PH - 30, { align: 'right' }); }
    doc.setProperties({ title: 'LABS · Términos y condiciones y política de privacidad v' + ver(), author: 'LABS · Insanity Media LLC', creator: 'LABS' });
    return doc;
  }
  EXT.buildTermsPdf = build;
  A['legal-dl'] = function () {
    U.toast('Preparando el PDF...');
    EXT.pdfLoadLib(function () { try { build().save('terminos-y-privacidad-labs-v' + ver() + '.pdf'); U.toast('Términos descargados en PDF.'); } catch (e) { console.error(e); U.toast('No se pudo crear el PDF. Inténtalo otra vez.'); } });
  };
  window.render();
})();
