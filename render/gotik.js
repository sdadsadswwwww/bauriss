// Kopie aus dem YouTube-Projekt (produktion/tools/render/zeichnungen/gotik.js), seit 20.11.2026 auch für Bauriss: global als Gotik.
// Gotische Bauteile für detaillierte CAD-Zeichnungen (seit 20.11.2026).
// Alle Maße in Metern, y nach oben ab Boden. M = { X, Y, s } bildet Meter auf Bildpunkte ab.
// Jedes Bauteil liefert { l, t, f } als Pfaddaten: l = Kontur, t = Details (Maßwerk, Laibungen), f = Zierrat (Krabben, Kreuzblumen).
// Die Bauteile sind eigene Bibliothek; Pakete wählen sie nur über Namen und Zahlen aus (Element-Art „bauteil“).
(function () {
  const r = n => Math.round(n * 10) / 10;
  const leer = () => ({ l: '', t: '', f: '' });
  const plus = (a, b) => { a.l += b.l || ''; a.t += b.t || ''; a.f += b.f || ''; return a; };

  function pt(M, x, y) { return `${r(M.X(x))} ${r(M.Y(y))}`; }
  function linie(M, ...p) { return 'M' + p.map(([x, y]) => pt(M, x, y)).join('L'); }
  function kreis(M, cx, cy, rad) {
    const k = rad * M.s;
    return `M${r(M.X(cx) - k)} ${r(M.Y(cy))}a${r(k)} ${r(k)} 0 1 0 ${r(2 * k)} 0a${r(k)} ${r(k)} 0 1 0 ${r(-2 * k)} 0`;
  }
  // Spitzbogen von (x, yk) nach (x + w, yk); R = Zirkelradius (R = w: gleichseitig, R > w: Lanzett)
  function scheitelHoehe(w, R) { return Math.sqrt(Math.max(R * R - (R - w / 2) * (R - w / 2), 0)); }
  function bogenPfad(M, x, yk, w, R, mitStart = true) {
    const hA = scheitelHoehe(w, R), k = R * M.s;
    return (mitStart ? `M${pt(M, x, yk)}` : '') + `A${r(k)} ${r(k)} 0 0 1 ${pt(M, x + w / 2, yk + hA)}A${r(k)} ${r(k)} 0 0 1 ${pt(M, x + w, yk)}`;
  }
  // Pass (Drei-, Vier-, Sechspass): Kreis mit eingeschriebenen Nasen
  function pass(M, cx, cy, rad, n = 4, drehung = 0) {
    let d = kreis(M, cx, cy, rad);
    const si = Math.sin(Math.PI / n), rf = rad * si / (1 + si) * 0.98;
    for (let i = 0; i < n; i++) {
      const w = drehung + (i * 2 * Math.PI) / n + Math.PI / 2;
      d += kreis(M, cx + (rad - rf) * Math.cos(w), cy + (rad - rf) * Math.sin(w), rf);
    }
    return d;
  }
  // Krabben: kleine Blatthaken entlang einer Kante von (x1,y1) nach (x2,y2), nach außen (seite = 1 oder -1)
  function krabben(M, x1, y1, x2, y2, abstand = 1.3, groesse = 0.7, seite = 1) {
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(L / abstand));
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * seite, ny = ux * seite;
    let d = '';
    for (let i = 1; i < n; i++) {
      const px = x1 + ux * i * abstand, py = y1 + uy * i * abstand;
      const ax = px + nx * groesse, ay = py + ny * groesse;
      const ex = ax + ux * groesse * 0.6, ey = ay + uy * groesse * 0.6;
      d += `M${pt(M, px, py)}Q${pt(M, ax - ux * groesse * 0.2, ay - uy * groesse * 0.2)} ${pt(M, ex, ey)}`;
    }
    return d;
  }
  // Kreuzblume: Stängel, zwei Blattkränze, Knauf
  function kreuzblume(M, cx, y, h) {
    const b = h * 0.45;
    let d = linie(M, [cx, y], [cx, y + h]);
    for (const [hy, bb] of [[0.28, b], [0.62, b * 0.75]]) {
      const yy = y + h * hy;
      d += `M${pt(M, cx, yy)}Q${pt(M, cx - bb * 0.9, yy + bb * 0.1)} ${pt(M, cx - bb, yy + bb * 0.45)}`;
      d += `M${pt(M, cx, yy)}Q${pt(M, cx + bb * 0.9, yy + bb * 0.1)} ${pt(M, cx + bb, yy + bb * 0.45)}`;
      d += linie(M, [cx - bb * 0.35, yy], [cx + bb * 0.35, yy]);
    }
    d += kreis(M, cx, y + h * 0.92, h * 0.08);
    return d;
  }
  // Wimperg: Ziergiebel mit innerem Rahmen, Pass im Feld, Krabben und Kreuzblume
  function wimperg(M, x, y, w, h, opt = {}) {
    const o = leer(), cx = x + w / 2, e = Math.min(w, h) * 0.07;
    o.l += linie(M, [x, y], [cx, y + h], [x + w, y]);
    o.t += linie(M, [x + e * 2, y], [cx, y + h - e * 2.6], [x + w - e * 2, y]);
    if (opt.pass !== false && w > 2) o.t += pass(M, cx, y + h * 0.36, Math.min(w * 0.17, h * 0.2), 3, Math.PI);
    o.f += krabben(M, x, y, cx, y + h, Math.max(0.9, w * 0.09), Math.max(0.35, w * 0.05), 1) + krabben(M, x + w, y, cx, y + h, Math.max(0.9, w * 0.09), Math.max(0.35, w * 0.05), -1);
    o.f += kreuzblume(M, cx, y + h, Math.max(0.9, w * 0.16));
    return o;
  }
  // Lanzettfenster mit Teilung, Laibung, Unterbögen und Maßwerk im Bogenfeld
  function fenster(M, x, y, w, h, n = 2, opt = {}) {
    const o = leer(), R = opt.R || w * 1.05, hA = scheitelHoehe(w, R), yk = y + h - hA;
    o.l += `M${pt(M, x, y)}L${pt(M, x, yk)}` + bogenPfad(M, x, yk, w, R, false) + `L${pt(M, x + w, y)}`;
    const e = w * 0.07;
    o.t += `M${pt(M, x + e, y)}L${pt(M, x + e, yk)}` + bogenPfad(M, x + e, yk, w - 2 * e, R - e, false) + `L${pt(M, x + w - e, y)}`;
    o.t += linie(M, [x - e * 0.6, y], [x + w + e * 0.6, y]) + linie(M, [x - e * 0.6, y - e * 0.8], [x + w + e * 0.6, y - e * 0.8]);
    const innen = w - 2 * e, lw = innen / n, ykl = yk - innen * 0.06;
    for (let i = 1; i < n; i++) o.t += linie(M, [x + e + i * lw, y], [x + e + i * lw, ykl]);
    for (let i = 0; i < n; i++) o.t += bogenPfad(M, x + e + i * lw, ykl, lw, lw * 1.0);
    // Bogenfeld: ein großer Pass, bei vier Bahnen zwei Paare darunter
    const ry = ykl + scheitelHoehe(lw, lw) + (hA - scheitelHoehe(lw, lw)) * 0.45;
    if (n >= 2) o.t += pass(M, x + w / 2, ry, Math.min(innen * 0.22, hA * 0.3), n >= 4 ? 6 : 4);
    if (n >= 4) {
      for (const k of [0.25, 0.75]) o.t += pass(M, x + e + innen * k, ykl + scheitelHoehe(lw * 2, lw * 2) * 0.62, lw * 0.32, 3, Math.PI);
      o.t += bogenPfad(M, x + e, ykl, innen / 2, innen / 2) + bogenPfad(M, x + e + innen / 2, ykl, innen / 2, innen / 2);
    }
    // Sprossen der Verglasung
    if (opt.sprossen !== false && h > 6) for (let yy = y + 1.6; yy < ykl - 0.5; yy += 1.6) o.t += linie(M, [x + e, yy], [x + w - e, yy]);
    if (opt.wimperg) plus(o, wimperg(M, x - w * 0.12, yk + hA * 0.25, w * 1.24, hA * 1.6 + w * 0.5));
    return o;
  }
  // Rosette: Kreisfenster mit Speichen, Bögen und Mittelpass
  function rosette(M, cx, cy, rad, n = 12) {
    const o = leer();
    o.l += kreis(M, cx, cy, rad);
    o.t += kreis(M, cx, cy, rad * 0.92) + kreis(M, cx, cy, rad * 0.32);
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI) / n, b = ((i + 0.5) * 2 * Math.PI) / n;
      o.t += linie(M, [cx + rad * 0.32 * Math.cos(a), cy + rad * 0.32 * Math.sin(a)], [cx + rad * 0.92 * Math.cos(a), cy + rad * 0.92 * Math.sin(a)]);
      o.t += kreis(M, cx + rad * 0.7 * Math.cos(b), cy + rad * 0.7 * Math.sin(b), rad * 0.13);
    }
    o.t += pass(M, cx, cy, rad * 0.24, 6);
    return o;
  }
  // Fiale: Schaft mit Giebelchen, Riese mit Krabben, Kreuzblume
  function fiale(M, cx, y, w, hb, hs) {
    const o = leer(), x = cx - w / 2;
    o.l += linie(M, [x, y], [x, y + hb], [x + w, y + hb], [x + w, y]);
    o.t += linie(M, [cx, y + hb * 0.15], [cx, y + hb * 0.8]);
    o.t += bogenPfad(M, x + w * 0.12, y + hb * 0.55, w * 0.38, w * 0.4) + bogenPfad(M, cx + w * 0.02, y + hb * 0.55, w * 0.38, w * 0.4);
    plus(o, wimperg(M, x, y + hb, w, w * 0.9, { pass: false }));
    o.l += linie(M, [x + w * 0.12, y + hb], [cx, y + hb + hs], [x + w * 0.88, y + hb]);
    o.f += krabben(M, x + w * 0.12, y + hb, cx, y + hb + hs, Math.max(0.5, hs * 0.14), w * 0.22, 1) + krabben(M, x + w * 0.88, y + hb, cx, y + hb + hs, Math.max(0.5, hs * 0.14), w * 0.22, -1);
    o.f += kreuzblume(M, cx, y + hb + hs, w * 0.8);
    return o;
  }
  // Strebepfeiler mit Rücksprüngen (absaetze: Höhen), Wasserschlägen und je einer Fiale
  function strebepfeiler(M, x, y, w, h, absaetze = [], opt = {}) {
    const o = leer();
    let x0 = x, x1 = x + w, yy = y;
    const stufen = [...absaetze.filter(a => a > y && a < y + h), y + h];
    stufen.forEach((ya, i) => {
      o.l += linie(M, [x0, yy], [x0, ya]) + linie(M, [x1, yy], [x1, ya]);
      o.t += linie(M, [(x0 + x1) / 2, yy + 0.6], [(x0 + x1) / 2, ya - 0.6]);
      for (let b = yy + 2.2; b < ya - 1; b += 2.2) o.t += linie(M, [x0, b], [x1, b]);
      if (i < stufen.length - 1) {
        const ein = (x1 - x0) * 0.12;
        o.l += linie(M, [x0, ya], [x0 + ein, ya + 0.9], [x1 - ein, ya + 0.9], [x1, ya]);
        if (opt.fialen !== false) plus(o, fiale(M, (x0 + x1) / 2, ya + 0.9, (x1 - x0) * 0.5, 2.6, 3.4));
        x0 += ein; x1 -= ein; yy = ya + 0.9;
      } else {
        o.l += linie(M, [x0, ya], [x1, ya]);
      }
    });
    return o;
  }
  // Maßwerkgalerie: Brüstung mit Vierpässen zwischen zwei Gurten
  function galerie(M, x, y, w, h = 1.4) {
    const o = leer();
    o.l += linie(M, [x, y], [x + w, y]) + linie(M, [x, y + h], [x + w, y + h]);
    const n = Math.max(2, Math.round(w / (h * 1.05)));
    const b = w / n;
    for (let i = 0; i < n; i++) {
      o.t += pass(M, x + b * (i + 0.5), y + h / 2, Math.min(b, h) * 0.38, 4, Math.PI / 4);
      if (i) o.t += linie(M, [x + b * i, y], [x + b * i, y + h]);
    }
    return o;
  }
  // Blendmaßwerk: Reihe blinder Spitzbögen auf einer Wandfläche
  function blendarkade(M, x, y, w, h, n) {
    const o = leer(), b = w / n;
    for (let i = 0; i < n; i++) {
      const xx = x + b * i + b * 0.08, bb = b * 0.84, hA = scheitelHoehe(bb, bb);
      o.t += `M${pt(M, xx, y)}L${pt(M, xx, y + h - hA)}` + bogenPfad(M, xx, y + h - hA, bb, bb, false) + `L${pt(M, xx + bb, y)}`;
    }
    return o;
  }
  // Portal: gestufte Archivolten, Gewände, Tympanon mit Registern, Mittelpfeiler
  function portal(M, x, y, w, h, stufen = 5, opt = {}) {
    const o = leer(), R = w * 0.95, hA = scheitelHoehe(w, R), yk = y + h - hA;
    o.l += `M${pt(M, x, y)}L${pt(M, x, yk)}` + bogenPfad(M, x, yk, w, R, false) + `L${pt(M, x + w, y)}`;
    const tiefe = w * 0.3;
    for (let i = 1; i <= stufen; i++) {
      const e = (tiefe * i) / stufen;
      const cls = `M${pt(M, x + e, y)}L${pt(M, x + e, yk)}` + bogenPfad(M, x + e, yk, w - 2 * e, R - e, false) + `L${pt(M, x + w - e, y)}`;
      o.t += cls;
      for (let f = 1; f < 4; f++) o.t += kreis(M, x + e - tiefe / stufen / 2, yk - f * (yk - y) / 4, 0.12) + kreis(M, x + w - e + tiefe / stufen / 2, yk - f * (yk - y) / 4, 0.12);
    }
    const xi = x + tiefe, wi = w - 2 * tiefe, ytt = y + (yk - y) * 0.62;
    o.t += linie(M, [xi, ytt], [xi + wi, ytt]);
    for (const k of [0.35, 0.65]) o.t += linie(M, [xi + wi * 0.05, ytt + (yk + hA - ytt) * k], [xi + wi * 0.95, ytt + (yk + hA - ytt) * k]);
    if (opt.mittelpfeiler !== false) o.t += linie(M, [x + w / 2 - 0.3, y], [x + w / 2 - 0.3, ytt]) + linie(M, [x + w / 2 + 0.3, y], [x + w / 2 + 0.3, ytt]);
    o.t += kreis(M, x + w / 2, ytt + (yk + hA - ytt) * 0.82, wi * 0.08);
    if (opt.wimperg !== false) plus(o, wimperg(M, x - w * 0.08, yk + hA * 0.3, w * 1.16, hA * 1.1 + w * 0.55));
    return o;
  }
  // Durchbrochener Turmhelm: Rippen, Querbänder mit Maßwerk, Krabben, Kreuzblume
  function helm(M, cx, y, w, h, kreuz = 9.5) {
    const o = leer(), top = y + h;
    const hb = x => (w / 2) * (1 - (x - y) / h);
    o.l += linie(M, [cx - w / 2, y], [cx, top], [cx + w / 2, y]);
    for (const k of [-0.5, 0, 0.5]) o.t += linie(M, [cx + k * w / 2, y], [cx, top]);
    let band = y + 2.5, i = 0;
    while (band < top - 6) {
      const b0 = hb(band), naechstes = band + Math.max(3.2, 7 - i * 0.6);
      o.t += linie(M, [cx - b0, band], [cx + b0, band]);
      const b1 = hb(naechstes), mitte = (band + naechstes) / 2, bm = hb(mitte);
      for (const seite of [-1, 1]) {
        const feldMitte = cx + seite * bm * 0.5, rr = Math.min(bm * 0.32, (naechstes - band) * 0.32);
        if (rr > 0.35) o.t += pass(M, feldMitte, mitte, rr, i % 2 ? 3 : 4, i % 2 ? Math.PI : Math.PI / 4);
      }
      if (b1 > 0.8) o.t += linie(M, [cx - b0 * 0.97, band + 0.35], [cx + b0 * 0.97, band + 0.35]);
      band = naechstes; i++;
    }
    o.f += krabben(M, cx - w / 2, y, cx, top - 2, 1.6, 0.9, 1) + krabben(M, cx + w / 2, y, cx, top - 2, 1.6, 0.9, -1);
    o.f += kreuzblume(M, cx, top - 0.5, kreuz);
    return o;
  }
  // Oktogon: achteckiges Turmgeschoss in Ansicht, mit Fenstern und Eckfialen
  function oktogon(M, cx, y, w, h) {
    const o = leer(), x = cx - w / 2, kante = w * 0.29;
    o.l += linie(M, [x, y], [x, y + h], [x + w, y + h], [x + w, y], [x, y]);
    o.t += linie(M, [x + kante, y], [x + kante, y + h]) + linie(M, [x + w - kante, y], [x + w - kante, y + h]);
    plus(o, fenster(M, x + kante + 0.6, y + 1.2, w - 2 * kante - 1.2, h * 0.86, 2, { wimperg: true }));
    for (const fx of [x + 0.6, x + w - kante + 0.6]) plus(o, fenster(M, fx, y + 2, kante - 1.2, h * 0.7, 1, { sprossen: false }));
    plus(o, galerie(M, x - 0.6, y + h, w + 1.2, 1.3));
    return o;
  }
  // Hölzerner Baukran (mittelalterlich): Turm, Ausleger, Streben, Seil, Tretrad
  function kran(M, x, y, h, ausleger = -1) {
    const o = leer(), b = h * 0.32, top = y + h;
    o.l += linie(M, [x, y], [x, top], [x + b, top], [x + b, y]);
    for (let yy = y + h / 5; yy < top; yy += h / 5) o.t += linie(M, [x, yy], [x + b, yy]);
    for (let yy = y; yy < top - 0.1; yy += h / 5) o.t += linie(M, [x, yy], [x + b, yy + h / 5]) + linie(M, [x + b, yy], [x, yy + h / 5]);
    o.l += linie(M, [x + b / 2, top], [x + b / 2, top + h * 0.35]);
    const jx = x + b / 2 + ausleger * h * 0.95, jy = top + h * 0.75;
    o.l += linie(M, [x + b / 2, top + h * 0.1], [jx, jy]) + linie(M, [x + b / 2, top + h * 0.35], [jx, jy]);
    for (let k = 0.2; k < 1; k += 0.2) {
      const ax = x + b / 2 + (jx - x - b / 2) * k, ay = top + h * 0.1 + (jy - top - h * 0.1) * k;
      const bx = x + b / 2 + (jx - x - b / 2) * k, by = top + h * 0.35 + (jy - top - h * 0.35) * k;
      o.t += linie(M, [ax, ay], [bx, by]);
    }
    o.t += linie(M, [jx, jy], [jx, jy - h * 0.55]) + kreis(M, jx, jy - h * 0.55 - 0.3, 0.3);
    o.t += kreis(M, x + b / 2, y + b * 0.62, b * 0.55) + kreis(M, x + b / 2, y + b * 0.62, b * 0.1);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      o.t += linie(M, [x + b / 2 + b * 0.1 * Math.cos(a), y + b * 0.62 + b * 0.1 * Math.sin(a)], [x + b / 2 + b * 0.55 * Math.cos(a), y + b * 0.62 + b * 0.55 * Math.sin(a)]);
    }
    return o;
  }
  // Strebebogen vom Strebepfeiler (xa) zur Hochschiffwand (xb), mit Fiale auf dem Pfeiler
  function strebebogen(M, xa, ya, xb, yb, dicke = 0.9) {
    const o = leer(), mx = (xa + xb) / 2, my = Math.max(ya, yb) - Math.abs(xb - xa) * 0.18;
    o.l += `M${pt(M, xa, ya)}Q${pt(M, mx, my)} ${pt(M, xb, yb)}`;
    o.l += `M${pt(M, xa, ya + dicke * 1.6)}L${pt(M, xb, yb + dicke)}`;
    const n = Math.max(3, Math.round(Math.abs(xb - xa) / 1.6));
    for (let i = 1; i < n; i++) {
      const k = i / n, x1 = xa + (xb - xa) * k;
      const yu = (1 - k) * (1 - k) * ya + 2 * (1 - k) * k * my + k * k * yb, yo = ya + dicke * 1.6 + (yb + dicke - ya - dicke * 1.6) * k;
      o.t += linie(M, [x1, yu], [x1, yo]);
    }
    return o;
  }

  const bauteile = {
    lanzettfenster: (M, e) => fenster(M, e.x, e.y, e.b, e.h, e.teilung || 2, { wimperg: !!e.wimperg }),
    rosette: (M, e) => rosette(M, e.x + e.b / 2, e.y + e.b / 2, e.b / 2, e.teilung || 12),
    wimperg: (M, e) => wimperg(M, e.x, e.y, e.b, e.h),
    fiale: (M, e) => fiale(M, e.x + e.b / 2, e.y, e.b, e.h * 0.45, e.h * 0.55),
    strebepfeiler: (M, e) => strebepfeiler(M, e.x, e.y, e.b, e.h, e.absaetze || []),
    galerie: (M, e) => galerie(M, e.x, e.y, e.b, e.h || 1.4),
    blendarkade: (M, e) => blendarkade(M, e.x, e.y, e.b, e.h, e.teilung || 4),
    portal: (M, e) => portal(M, e.x, e.y, e.b, e.h, e.teilung || 5),
    helm: (M, e) => helm(M, e.x + e.b / 2, e.y, e.b, e.h),
    oktogon: (M, e) => oktogon(M, e.x + e.b / 2, e.y, e.b, e.h),
    kran: (M, e) => kran(M, e.x, e.y, e.h, e.teilung === 2 ? 1 : -1),
    strebebogen: (M, e) => strebebogen(M, e.x, e.y, e.x + e.b, e.y + e.h),
  };

  window.Gotik = { leer, plus, pt, linie, kreis, pass, krabben, kreuzblume, wimperg, fenster, rosette, fiale, strebepfeiler, galerie,
    blendarkade, portal, helm, oktogon, kran, strebebogen, bogenPfad, scheitelHoehe };
  Z.bauteile = bauteile;
})();
