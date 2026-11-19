/* LABS demo · herramientas de QR: crear QR reales, leerlos desde una imagen */
(function () {
  const L = window.LABS;
  function matrix(text) { const q = window.qrcode(0, 'M'); q.addData(String(text)); q.make(); return q; }
  function svg(text, size) {
    const q = matrix(text), n = q.getModuleCount(), m = 3, cs = size / (n + 2 * m); let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += 'M' + ((x + m) * cs).toFixed(2) + ' ' + ((y + m) * cs).toFixed(2) + 'h' + cs.toFixed(2) + 'v' + cs.toFixed(2) + 'h-' + cs.toFixed(2) + 'z';
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Código QR" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff" rx="6"/><path d="' + d + '" fill="#14193A"/></svg>';
  }
  function dataUrl(text, px) {
    const q = matrix(text), n = q.getModuleCount(), m = 4, cell = Math.max(4, Math.floor((px || 480) / (n + 2 * m))); const c = document.createElement('canvas'); c.width = c.height = (n + 2 * m) * cell; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#14193A';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + m) * cell, (y + m) * cell, cell, cell);
    return c.toDataURL('image/png');
  }
  function decodeCanvas(c) { try { const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height); const r = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' }); return r ? r.data : null; } catch (e) { return null; } }
  function drawScaled(im, max) { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c; }
  function decodeUrl(url) { return new Promise(function (res) { const im = new Image(); im.onload = function () { res(decodeCanvas(drawScaled(im, 1000))); }; im.onerror = function () { res(null); }; im.src = url; }); }
  function fileToQr(file) { return new Promise(function (res) { const fr = new FileReader(); fr.onload = function () { const im = new Image(); im.onload = function () { const c = drawScaled(im, 700); res({ url: c.toDataURL('image/png'), text: decodeCanvas(c) }); }; im.onerror = function () { res(null); }; im.src = fr.result; }; fr.onerror = function () { res(null); }; fr.readAsDataURL(file); }); }
  window.QRT = { svg: svg, dataUrl: dataUrl, decodeUrl: decodeUrl, fileToQr: fileToQr, decodeCanvas: decodeCanvas };
  L.qrSvg = svg;
})();
