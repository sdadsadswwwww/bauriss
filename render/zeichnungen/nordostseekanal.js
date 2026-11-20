// Zeichnungen: Nord-Ostsee-Kanal, als CAD-Konstruktionszeichnungen (seit 20.11.2026). Schematisch.
// Karten: Küstenlinien vereinfacht nach Länge/Breite projiziert, Inseln nur angedeutet; Kilometrierung
// entlang der Kanalachse proportional zur belegten Länge von 98 km. Rasterbuchstaben, Schiffe, Bagger, Brücke,
// Schleusenmauern, Tore, Poller, Deckwerk und Bodenschichten ohne Maß (nach Fotos und Plänen vereinfacht).
// Belegt: Länge 98 km, Umweg rund 460 km bzw. 250 Seemeilen, Durchfahrtshöhe 42 m, Profil 1895 (67 m breit,
// Sohle 22 m, 9 m tief), Profil heute (162 m breit, Sohle 90 m, 11 m tief). Tiefen in den Profilen überhöht.
// Koten relativ zum Kanalwasserspiegel (±0,00), nur mit belegten Maßen.
(function () {
  const { r, svg, pfad, text, kreis, massV, massH } = Z;

  const linie = pts => 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L');
  const ring = pts => linie(pts) + 'Z';
  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${r(x)} ${r(y)}q8 -6 17 0t17 0`;
    return d;
  };
  // Wasserspiegel-Symbol: Dreieck auf der Linie, drei kürzer werdende Striche darunter
  const wsym = (x, y) =>
    `M${r(x - 9)} ${r(y - 15)}H${r(x + 9)}L${r(x)} ${r(y)}Z` +
    `M${r(x - 11)} ${r(y + 6)}h22M${r(x - 7)} ${r(y + 11)}h14M${r(x - 3)} ${r(y + 16)}h6`;
  // Höhenkote: Dreieck auf der Linie, Text rechts darüber (unter = Dreieck von unten, Text darunter)
  const kote = (x, y, label, unter = false) =>
    pfad('m', unter ? `M${r(x - 9)} ${r(y + 15)}H${r(x + 9)}L${r(x)} ${r(y)}Z M${r(x - 16)} ${r(y)}H${r(x + 72)}`
      : `M${r(x - 9)} ${r(y - 15)}H${r(x + 9)}L${r(x)} ${r(y)}Z M${r(x - 16)} ${r(y)}H${r(x + 72)}`) +
    text(x + 14, unter ? y + 22 : y - 6, label, 'kote hell');
  // Rasterkreis mit Buchstabe (rote Achsbeschriftung)
  const rasterKreis = (x, y, b) => `<path class="lf" d="${kreis(x, y, 14)}"/>` + pfad('ax', kreis(x, y, 14)) +
    text(x, y + 7, b, 'achse', 'text-anchor="middle"');
  // Polyline: Länge und Punkt bei Länge l mit Richtung
  const laenge = pts => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  function beiLaenge(pts, l) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
      if (l <= d || i === pts.length - 1) {
        const t = Math.min(1, l / d);
        return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, dx: (x1 - x0) / d, dy: (y1 - y0) / d };
      }
      l -= d;
    }
  }
  // Nordpfeil
  const nordpfeil = (x, y) =>
    `<path class="lf" d="${kreis(x, y, 30)}"/>` + pfad('t', kreis(x, y, 24)) +
    pfad('l', `M${x} ${y - 38}L${x + 10} ${y + 16}L${x} ${y + 8}L${x - 10} ${y + 16}Z`) +
    pfad('t', `M${x} ${y - 38}V${y + 8}M${x - 30} ${y}h-8M${x + 30} ${y}h8M${x} ${y + 30}v8`) +
    text(x, y - 46, 'N', '', 'text-anchor="middle"');

  // ---------------------------------------------------------------------------------------------
  // Lageplan Schleswig-Holstein: der Kanal von der Elbe zur Kieler Förde (900 × 500)
  function nokKarte() {
    const P = ([lon, lat]) => [(lon - 8.2) * 366, (54.52 - lat) * 625];
    const pp = a => a.map(P);
    const westkueste = pp([[9.0, 54.52], [9.05, 54.48], [8.92, 54.43], [8.80, 54.42], [8.70, 54.40], [8.62, 54.34], [8.60, 54.31],
      [8.64, 54.27], [8.80, 54.26], [8.92, 54.29], [8.97, 54.25], [8.88, 54.20], [8.86, 54.13], [8.97, 54.08], [8.90, 54.04],
      [8.84, 54.0], [8.88, 53.97], [9.0, 53.91], [9.14, 53.89]]);
    const elbeNord = pp([[9.14, 53.89], [9.25, 53.86], [9.30, 53.84], [9.42, 53.79], [9.48, 53.75], [9.53, 53.72]]);
    const ostkueste = pp([[10.66, 54.34], [10.55, 54.38], [10.45, 54.42], [10.35, 54.43], [10.25, 54.42], [10.22, 54.41], [10.20, 54.38],
      [10.17, 54.35], [10.15, 54.33], [10.13, 54.32], [10.12, 54.33], [10.13, 54.35], [10.14, 54.365], [10.16, 54.38], [10.19, 54.41],
      [10.18, 54.45], [10.10, 54.47], [10.0, 54.48], [9.90, 54.47], [9.84, 54.47], [9.88, 54.50], [9.95, 54.52]]);
    const sued = pp([[8.48, 53.72], [8.55, 53.80], [8.62, 53.85], [8.70, 53.88], [8.80, 53.865], [8.95, 53.86], [9.10, 53.855],
      [9.20, 53.835], [9.30, 53.81], [9.40, 53.77], [9.45, 53.72]]);
    const inseln = [
      [[8.80, 54.52], [8.82, 54.50], [8.90, 54.51], [8.92, 54.52]],
      [[8.60, 54.52], [8.62, 54.48], [8.70, 54.49], [8.69, 54.52]],
    ].map(pp);
    const kanal = pp([[9.14, 53.89], [9.20, 53.93], [9.28, 54.0], [9.38, 54.06], [9.47, 54.13], [9.55, 54.20], [9.62, 54.27], [9.67, 54.30],
      [9.75, 54.33], [9.83, 54.36], [9.95, 54.37], [10.05, 54.36], [10.14, 54.365]]);
    const eider = pp([[9.67, 54.30], [9.58, 54.315], [9.47, 54.29], [9.36, 54.305], [9.24, 54.33], [9.10, 54.30], [8.97, 54.29]]);
    const bach = pp([[9.42, 53.79], [9.47, 53.84], [9.50, 53.90], [9.58, 53.94]]);

    // Land als Schraffur ohne Rand, Küsten als Linien
    const land = ring([...westkueste, ...elbeNord.slice(1), [P([9.53, 53.72])[0], 500], [900, 500], ...ostkueste]);
    let body = pfad('hs', land) + pfad('hs', ring([...sued, [P([9.45, 0])[0], 500], [P([8.48, 0])[0], 500]]));
    for (const i of inseln) body += pfad('hs', ring(i));
    // Raster
    let raster = '';
    for (const x of [150, 300, 450, 600, 750]) raster += `M${x} 20V456`;
    for (const y of [125, 250, 375]) raster += `M54 ${y}H880`;
    body += pfad('hl', raster);
    body += pfad('l', linie(westkueste) + linie(elbeNord) + linie(ostkueste) + linie(sued) + inseln.map(linie).join(''));
    body += pfad('t', linie(eider) + linie(bach));
    // Deiche entlang der Westküste und der Elbe, angedeutet
    let deich = '';
    for (const zug of [westkueste.slice(10), elbeNord]) {
      for (let i = 1; i < zug.length; i++) {
        const [x0, y0] = zug[i - 1], [x1, y1] = zug[i], d = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
        for (let l = 6; l < d - 3; l += 9) deich += `M${r(x0 + ((x1 - x0) * l) / d - nx * 2)} ${r(y0 + ((y1 - y0) * l) / d - ny * 2)}l${r(-nx * 5)} ${r(-ny * 5)}`;
      }
    }
    body += pfad('z', deich);
    // Kanal mit Uferlinien, Achse und Kilometrierung
    body += pfad('bgl', linie(kanal)) + pfad('a', linie(kanal));
    const L = laenge(kanal);
    let km = '', kmText = '';
    for (let k = 10; k < 98; k += 10) {
      const p = beiLaenge(kanal, (L * k) / 98), nx = p.dy, ny = -p.dx, lang = k % 20 === 0 ? 16 : 9;
      km += `M${r(p.x + nx * 5)} ${r(p.y + ny * 5)}l${r(nx * lang)} ${r(ny * lang)}`;
      if (k % 20 === 0 && k !== 60) kmText += text(p.x + nx * 28 + (nx < 0 ? -2 : 0), p.y + ny * 28 + 7, `km ${k}`, 'kote hell', nx < -0.3 ? 'text-anchor="end"' : 'text-anchor="middle"');
    }
    body += pfad('t', km) + kmText;
    // Schleusen an beiden Enden: zwei Kammern in Kanalrichtung
    const schleuse = (p, q) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]), dx = (q[0] - p[0]) / d, dy = (q[1] - p[1]) / d, nx = -dy, ny = dx;
      const P2 = (a, b) => [p[0] + dx * a + nx * b, p[1] + dy * a + ny * b];
      return ring([P2(-4, -12), P2(22, -12), P2(22, -3), P2(-4, -3)]) + ring([P2(-4, 3), P2(22, 3), P2(22, 12), P2(-4, 12)]);
    };
    body += `<path class="lf" d="${schleuse(kanal[0], kanal[1])}"/>`;
    body += `<path class="lf" d="${schleuse(kanal[kanal.length - 1], kanal[kanal.length - 2])}"/>`;
    body += `<path class="lf" d="${kreis(kanal[7][0], kanal[7][1], 8)}"/>` + pfad('t', kreis(kanal[7][0], kanal[7][1], 3));
    // Raster beschriften
    ['A', 'B', 'C', 'D', 'E'].forEach((b, i) => { body += rasterKreis(150 + i * 150, 470, b); });
    ['1', '2', '3'].forEach((b, i) => { body += rasterKreis(36, 125 + i * 125, b); });
    body += nordpfeil(838, 390);
    // Beschriftung
    body += text(72, 250, 'Nordsee', 'gross hell') + text(728, 48, 'Ostsee', 'gross hell');
    body += pfad('t', 'M694 48L733 76') + text(690, 56, 'Kieler Förde', 'hell', 'text-anchor="end"');
    body += text(60, 420, 'Elbe', 'hell');
    body += text(386, 386, 'Brunsbüttel', 'hell') + text(522, 114, 'Rendsburg', 'hell', 'text-anchor="end"') + text(640, 150, 'Kiel-Holtenau', 'hell');
    body += text(520, 300, '98 km', 'gross akz hell');
    return svg(900, 500, body);
  }

  // ---------------------------------------------------------------------------------------------
  // Übersicht: der Seeweg um Skagen und die Abkürzung durch den Kanal (900 × 540)
  function nokUmweg() {
    const P = ([lon, lat]) => [20 + (lon - 4.6) * 88, (58.45 - lat) * 112];
    const pp = a => a.map(P);
    const fest = pp([[6.9, 53.44], [7.0, 53.62], [7.6, 53.70], [8.1, 53.70], [8.3, 53.56], [8.5, 53.64], [8.7, 53.88], [9.1, 53.84],
      [9.4, 53.76], [9.42, 53.80], [9.14, 53.91], [8.88, 54.02], [8.86, 54.13], [8.6, 54.30], [9.0, 54.48], [8.62, 54.90],
      [8.62, 55.15], [8.68, 55.42], [8.40, 55.48], [8.08, 55.56], [8.16, 55.90], [8.12, 56.10], [8.18, 56.55], [8.25, 56.75],
      [8.60, 57.12], [9.10, 57.16], [9.55, 57.30], [9.96, 57.59], [10.30, 57.66], [10.62, 57.74], [10.53, 57.45], [10.45, 57.25],
      [10.30, 57.00], [10.28, 56.80], [10.40, 56.60], [10.90, 56.45], [10.92, 56.25], [10.55, 56.12], [10.22, 56.13], [10.25, 55.95],
      [9.98, 55.75], [10.0, 55.70], [9.60, 55.70], [9.80, 55.55], [9.62, 55.40], [9.50, 55.25], [9.62, 54.98], [9.45, 54.82],
      [9.90, 54.78], [10.03, 54.67], [9.86, 54.47], [10.17, 54.44], [10.15, 54.33], [10.22, 54.41], [10.50, 54.38], [10.75, 54.30],
      [11.08, 54.37], [10.95, 54.15], [10.88, 53.96], [11.30, 53.95], [11.60, 54.10], [12.10, 54.18], [12.40, 54.38], [12.90, 54.42],
      [13.10, 54.30], [13.45, 54.10], [13.90, 53.97], [14.79, 53.90]]);
    const inseln = [
      [[9.75, 55.55], [10.05, 55.58], [10.40, 55.60], [10.75, 55.45], [10.85, 55.30], [10.70, 55.05], [10.35, 55.05], [10.0, 55.10], [9.70, 55.25], [9.68, 55.45]],
      [[11.1, 55.70], [11.3, 55.95], [11.8, 55.98], [12.3, 56.12], [12.6, 56.03], [12.55, 55.80], [12.6, 55.68], [12.35, 55.55], [12.25, 55.35],
        [12.0, 55.20], [11.6, 55.15], [11.25, 55.20], [11.1, 55.40], [11.15, 55.55]],
      [[11.0, 54.85], [11.5, 54.82], [11.85, 54.95], [12.1, 54.90], [12.0, 54.65], [11.85, 54.55], [11.5, 54.63], [11.2, 54.65], [11.05, 54.72]],
      [[11.0, 54.45], [11.1, 54.53], [11.3, 54.50], [11.25, 54.40], [11.05, 54.40]],
      [[9.75, 55.05], [10.05, 55.0], [9.95, 54.85], [9.75, 54.90]],
      [[13.1, 54.45], [13.25, 54.68], [13.45, 54.68], [13.65, 54.55], [13.6, 54.30], [13.3, 54.25], [13.15, 54.30]],
    ].map(pp);
    const schweden = pp([[11.6, 58.45], [11.85, 57.95], [11.9, 57.70], [12.25, 57.10], [12.85, 56.67], [12.6, 56.45], [12.45, 56.30],
      [12.85, 56.22], [12.7, 56.05], [12.95, 55.75], [13.0, 55.60], [12.82, 55.40], [13.15, 55.37], [13.8, 55.43], [14.2, 55.39],
      [14.37, 55.55], [14.79, 55.80]]);
    const norwegen = pp([[5.9, 58.45], [6.6, 58.10], [7.05, 57.98], [7.6, 58.05], [8.2, 58.15], [8.9, 58.35], [9.3, 58.45]]);
    const kanal = pp([[9.14, 53.89], [9.67, 54.30], [10.14, 54.365]]);
    const weg = pp([[8.45, 53.97], [7.75, 54.22], [7.45, 54.75], [7.35, 55.50], [7.45, 56.30], [7.80, 56.95], [8.60, 57.42], [9.40, 57.62],
      [10.05, 57.83], [10.62, 57.92], [11.0, 57.78], [11.15, 57.40], [11.20, 56.90], [11.25, 56.40], [11.05, 56.00], [11.0, 55.62],
      [10.98, 55.15], [10.85, 54.80], [10.55, 54.58], [10.28, 54.50]]);

    // Breiten- und Längengrade als Hilfslinien, ohne Zahl
    let netz = '';
    for (let lat = 54; lat <= 58; lat++) netz += `M20 ${r(P([0, lat])[1])}H880`;
    for (let lon = 5; lon <= 14; lon += 2) netz += `M${r(P([lon, 0])[0])} 20V520`;
    let body = pfad('hl', netz);
    body += pfad('hs', ring([...fest, [900, 540], [P([6.9, 0])[0], 540]]));
    body += pfad('hs', ring([...schweden, [900, 0]]));
    body += pfad('hs', ring([...norwegen]));
    for (const i of inseln) body += pfad('hs', ring(i));
    body += pfad('l', linie(fest) + linie(schweden) + linie(norwegen) + inseln.map(ring).join(''));
    // Umweg gestrichelt mit Pfeil, Kanal gelb
    body += pfad('d', linie(weg));
    const e = weg[weg.length - 1], v = weg[weg.length - 2], d = Math.hypot(e[0] - v[0], e[1] - v[1]), ux = (e[0] - v[0]) / d, uy = (e[1] - v[1]) / d;
    body += pfad('l', `M${r(e[0])} ${r(e[1])}l${r(-ux * 16 - uy * 7)} ${r(-uy * 16 + ux * 7)}M${r(e[0])} ${r(e[1])}l${r(-ux * 16 + uy * 7)} ${r(-uy * 16 - ux * 7)}`);
    // Querstriche entlang des Umwegs
    const LW = laenge(weg);
    let marken = '';
    for (let l = 40; l < LW - 30; l += 46) {
      const p = beiLaenge(weg, l);
      marken += `M${r(p.x - p.dy * 5)} ${r(p.y + p.dx * 5)}l${r(p.dy * 10)} ${r(-p.dx * 10)}`;
    }
    body += pfad('t', marken);
    body += pfad('bgl', linie(kanal)) + pfad('a', linie(kanal));
    for (const p of [kanal[0], kanal[2]]) body += `<path class="lf" d="${kreis(p[0], p[1], 6)}"/>`;
    const sk = P([10.62, 57.74]);
    body += `<path class="lf" d="${kreis(sk[0], sk[1], 5)}"/>`;
    // Beschriftung
    body += text(50, 360, 'Nordsee', 'gross hell') + text(730, 395, 'Ostsee', 'gross hell');
    body += text(190, 100, 'Skagerrak', 'hell');
    body += text(640, 175, 'Kattegat', 'hell', 'text-anchor="middle" transform="rotate(-90 640 175)"');
    body += text(550, 44, 'Skagen', 'hell', 'text-anchor="middle"');
    body += text(426, 250, 'Jütland', 'hell', 'text-anchor="middle"');
    body += text(60, 196, 'Umweg', 'hell') + text(60, 230, '460 km', 'hell') + text(60, 262, '250 sm', 'mass hell');
    body += pfad('t', 'M560 494L470 482') + text(564, 516, 'Kanal 98 km', 'gross akz hell');
    return svg(900, 540, body);
  }

  // ---------------------------------------------------------------------------------------------
  // Hochbrücke im Schnitt quer zum Kanal: 42 Meter frei über dem Wasser (5 Pixel pro Meter), 900 × 510
  function fachwerk(x1, x2, n, yu, hoehe) {
    const xs = [], yo = [];
    for (let i = 0; i <= n; i++) { const x = x1 + ((x2 - x1) * i) / n; xs.push(x); yo.push(yu - hoehe(x)); }
    const gurt = `M${r(x1)} ${r(yu)}H${r(x2)}` + linie(xs.map((x, i) => [x, yo[i]]));
    let stab = '', knoten = '';
    for (let i = 0; i <= n; i++) {
      stab += `M${r(xs[i])} ${r(yu)}V${r(yo[i])}`;
      if (i < n) stab += i < n / 2 ? `M${r(xs[i])} ${r(yo[i])}L${r(xs[i + 1])} ${r(yu)}` : `M${r(xs[i])} ${r(yu)}L${r(xs[i + 1])} ${r(yo[i + 1])}`;
      knoten += kreis(xs[i], yu, 2.2) + kreis(xs[i], yo[i], 2.2);
    }
    return pfad('t', stab) + pfad('z', knoten) + pfad('l', gurt);
  }
  // Gitterpfeiler: zwei geneigte Stiele mit Riegeln und Kreuzen
  function pfeiler(x, yo, yu) {
    const bo = 12, bu = 26, n = Math.max(2, Math.round((yu - yo) / 22));
    const xl = y => x - bo - ((bu - bo) * (y - yo)) / (yu - yo), xr = y => 2 * x - xl(y);
    const st = `M${r(xl(yo))} ${r(yo)}L${r(xl(yu))} ${r(yu)}M${r(xr(yo))} ${r(yo)}L${r(xr(yu))} ${r(yu)}`;
    let k = '';
    for (let i = 0; i <= n; i++) {
      const y = yo + ((yu - yo) * i) / n;
      k += `M${r(xl(y))} ${r(y)}H${r(xr(y))}`;
      if (i < n) { const y2 = yo + ((yu - yo) * (i + 1)) / n; k += `M${r(xl(y))} ${r(y)}L${r(xr(y2))} ${r(y2)}M${r(xr(y))} ${r(y)}L${r(xl(y2))} ${r(y2)}`; }
    }
    return pfad('l', st) + pfad('z', k);
  }
  function nokBruecke() {
    const s = 5, wasser = 430, unten = wasser - 42 * s, gel = 300, sohle = wasser + 9 * s;
    const ufL = 160, xl = 238, xr = 662, ufR = 740, sl = 318, sr = 582;
    // Achse und Höhenlinien
    let body = pfad('ax', 'M450 52V500') + text(462, 46, 'Kanalachse', 'achse');
    body += pfad('hl', `M20 ${unten}H880M20 ${wasser}H${xl}M${xr} ${wasser}H880`);
    // Boden mit Böschungen, Fundamente
    body += `<path class="hf" d="M20 ${gel}H${ufL}L${xl} ${wasser}L${sl} ${sohle}H${sr}L${xr} ${wasser}L${ufR} ${gel}H880V505H20Z"/>`;
    for (const x of [ufL - 4, ufR + 4, 60, 840]) body += `<path class="lf" d="M${x - 34} ${gel - 4}h68v34h-68Z"/>` + pfad('z', `M${x - 34} ${gel + 8}h68M${x - 24} ${gel + 30}v12M${x + 24} ${gel + 30}v12`);
    body += pfad('t', wellen(xl + 20, xr - 20, wasser) + `M${xl} ${wasser}H${xr}`);
    // Pfeiler, Überbau
    for (const x of [ufL - 4, ufR + 4, 60, 840]) {
      body += pfeiler(x, unten + 12, gel - 4);
      body += pfad('l', `M${x - 16} ${unten + 12}h32M${x - 12} ${unten + 8}h24`) + pfad('t', `M${x - 7} ${unten + 8}L${x} ${unten}L${x + 7} ${unten + 8}`) + pfad('z', kreis(x, unten + 3, 2));
    }
    const haupt = x => 40 + 78 * (1 - ((x - 450) / 286) ** 2);
    body += fachwerk(164, 736, 22, unten - 4, haupt);
    body += fachwerk(20, 164, 6, unten - 4, () => 30) + fachwerk(736, 880, 6, unten - 4, () => 30);
    body += pfad('l', `M20 ${unten}H880`) + pfad('t', `M20 ${unten - 4}H880`);
    // Kriegsschiff von vorn, Masten bis knapp unter die Brücke
    body += `<g class="akzent">` + pfad('l', `M396 ${wasser}l6 -24h96l6 24M422 ${wasser - 24}v-30h56v30M436 ${wasser - 54}v-34h28v34`) +
      pfad('t', `M450 ${wasser - 88}V${unten + 14}M426 ${wasser - 128}h48M434 ${wasser - 168}h32M402 ${wasser - 12}h96M428 ${wasser - 40}h44` +
        `M450 ${wasser - 128}l-24 40M450 ${wasser - 128}l24 40`) + `</g>`;
    // Lichtraum gestrichelt, Maß und Koten
    body += pfad('d', `M${xl + 30} ${wasser}V${unten + 8}H${xr - 30}V${wasser}`);
    body += massV(532, unten, wasser, '42 m');
    body += kote(580, wasser, '±0,00') + kote(580, unten, '+42,00', true);
    return svg(900, 510, body);
  }

  // ---------------------------------------------------------------------------------------------
  // Querschnitt des Kanals. Ohne Option das Profil von 1895, mit heute: true das heutige mit dem alten gestrichelt darin.
  function nokProfil({ heute = false } = {}) {
    const s = heute ? 5 : 9, v = heute ? 20 : 22, gel = heute ? 104 : 156, wasser = gel + 22;
    const prof = (breit, sohle, tief) => {
      const a = 450 - (breit * s) / 2, b = 450 - (sohle * s) / 2, y = wasser + tief * v;
      return { a: r(a), b: r(b), c: r(900 - b), d: r(900 - a), y: r(y) };
    };
    const alt = prof(67, 22, 9), neu = heute ? prof(162, 90, 11) : alt;
    const hoch = neu.y + 96;
    const aus = neu.a - 22, ein = 900 - aus;
    // x der linken Böschung in Höhe y
    const xL = y => (y <= wasser ? aus + ((neu.a - aus) * (y - gel)) / (wasser - gel) : neu.a + ((neu.b - neu.a) * (y - wasser)) / (neu.y - wasser));
    const xR = y => 900 - xL(y);
    const yb = r(wasser + (neu.y - wasser) * 0.5);
    let body = '';
    // Höhenlinien
    body += pfad('hl', `M20 ${wasser}H880M20 ${neu.y}H880`);
    // Untere Schicht schraffiert, obere punktiert, Schichtgrenze und Oberboden als Linie
    body += pfad('hs', `M20 ${yb}H${r(xL(yb))}L${neu.b} ${neu.y}H${neu.c}L${r(xR(yb))} ${yb}H880V${hoch}H20Z`);
    let punkte = '';
    for (let y = gel + 12, z = 0; y < yb - 4; y += 11, z++) {
      for (let x = 26 + (z % 2) * 8; x < 876; x += 16) if (x < xL(y) - 8 || x > xR(y) + 8) punkte += `M${x} ${y}h2`;
    }
    body += pfad('z', punkte);
    body += pfad('t', `M20 ${yb}H${r(xL(yb))}M${r(xR(yb))} ${yb}H880M20 ${gel + 7}H${r(xL(gel + 7))}M${r(xR(gel + 7))} ${gel + 7}H880`);
    // Bruchkanten links und rechts
    const bruch = x => `M${x} ${gel}V${r((gel + hoch) / 2 - 12)}l-8 8l16 8l-8 8V${hoch}`;
    body += pfad('t', bruch(20) + bruch(880));
    // Deckwerk an beiden Böschungen: Steinschüttung um den Wasserspiegel
    const y1 = wasser - (heute ? 6 : 14), y2 = r(wasser + (neu.y - wasser) * 0.4), dick = heute ? 7 : 9;
    for (const seite of [1, -1]) {
      const X = y => (seite > 0 ? xL(y) : xR(y));
      const band = [[X(y1), y1], [X(wasser), wasser], [X(y2), y2], [X(y2) - seite * dick * 1.4, y2 + dick * 0.4],
        [X(wasser) - seite * dick * 1.4, wasser + dick * 0.5], [X(y1) - seite * dick * 1.4, y1 + dick * 0.4]];
      body += pfad('lf', ring(band));
      let st = '';
      for (let y = y1 + 4; y < y2 - 2; y += 6) st += kreis(X(y) - seite * dick * 0.7, y + dick * 0.2, 2);
      body += pfad('z', st);
    }
    // Profil: Gelände, Böschungen, Sohle
    body += pfad('l', `M20 ${gel}H${aus}L${neu.a} ${wasser}L${neu.b} ${neu.y}H${neu.c}L${neu.d} ${wasser}L${ein} ${gel}H880`);
    body += pfad('a', `M${neu.a} ${wasser}L${neu.b} ${neu.y}H${neu.c}L${neu.d} ${wasser}`);
    // Wasser, Achse
    body += pfad('t', `M${neu.a} ${wasser}H${neu.d}` + wellen(neu.a + 40, neu.d - 30, wasser + 20));
    body += pfad('ax', `M450 ${gel - (heute ? 76 : 20)}V${hoch - 6}`);
    if (heute) {
      body += `<g class="geplant">${pfad('l', `M${alt.a} ${wasser}L${alt.b} ${alt.y}H${alt.c}L${alt.d} ${wasser}`)}</g>`;
      body += text(450, wasser + 78, '1895', 'gross hell', 'text-anchor="middle"') + text(450, wasser + 118, '67 m', 'hell', 'text-anchor="middle"');
      body += massH(neu.a, neu.d, gel - 40, '162 m') + massV(neu.c - 26, wasser, neu.y, '11 m', -1);
      body += massH(neu.b, neu.c, neu.y + 44, '90 m');
      body += kote(neu.b + 40, neu.y, '−11,00') + kote(neu.d - 150, wasser, '±0,00');
    } else {
      // Dampfer von vorn, als Größenvergleich ohne Maß
      const sx = 600;
      body += pfad('l', `M${sx - 40} ${wasser}l4 -26h72l4 26M${sx - 20} ${wasser - 26}v-26h40v26M${sx - 6} ${wasser - 52}v-30h12v30`) +
        pfad('t', `M${sx - 38} ${wasser - 14}h76M${sx - 18} ${wasser - 40}h36M${sx} ${wasser - 82}v-26`);
      body += massH(neu.a, neu.d, gel - 60, '67 m') + massV(neu.b + 46, wasser, neu.y, '9 m');
      body += massH(neu.b, neu.c, neu.y + 44, '22 m');
      body += kote(470, neu.y, '−9,00') + kote(370, wasser, '±0,00');
      // Eimerkettenbagger auf Schienen an der linken Böschungskante (Maße schematisch, k = Vergrößerung)
      const g = gel, bx = 22, k = 1.3, X = dx => r(bx + dx * k), Y = dy => r(g - dy * k);
      const gl = `M${bx} ${g - 3}H${aus + 4}`;
      let sw = '';
      for (let x = bx + 4; x < aus; x += 8) sw += `M${x} ${g - 3}v5`;
      let bl = `M${X(6)} ${Y(12)}H${X(84)}V${Y(52)}H${X(6)}ZM${X(2)} ${Y(52)}H${X(88)}L${X(80)} ${Y(60)}H${X(10)}Z` +
        `M${X(16)} ${Y(60)}V${Y(80)}h${r(9 * k)}V${Y(60)}M${X(4)} ${Y(12)}H${X(86)}`;
      let bt = `M${X(6)} ${Y(26)}H${X(84)}M${X(30)} ${Y(52)}V${Y(12)}M${X(58)} ${Y(52)}V${Y(12)}` +
        `M${X(36)} ${Y(46)}h${r(16 * k)}v${r(12 * k)}h${r(-16 * k)}ZM${X(64)} ${Y(46)}h${r(14 * k)}v${r(12 * k)}h${r(-14 * k)}Z` +
        `M${X(14)} ${Y(84)}h${r(13 * k)}`;
      // Leiter mit Eimerkette schräg die Böschung hinab, Turas oben und unten
      const lx1 = bx + 84 * k, ly1 = g - 46 * k, ly2 = wasser - 4, lx2 = xL(ly2) + 16;
      const ld = Math.hypot(lx2 - lx1, ly2 - ly1), ux = (lx2 - lx1) / ld, uy = (ly2 - ly1) / ld;
      bl += `M${r(lx1)} ${r(ly1)}L${r(lx2)} ${r(ly2)}M${r(lx1 + uy * 7)} ${r(ly1 - ux * 7)}L${r(lx2 + uy * 7)} ${r(ly2 - ux * 7)}`;
      bt += `M${X(70)} ${Y(60)}L${r(lx1 + ux * ld * 0.55 + uy * 7)} ${r(ly1 + uy * ld * 0.55 - ux * 7)}M${X(48)} ${Y(60)}L${X(70)} ${Y(74)}L${X(70)} ${Y(60)}`;
      let eimer = kreis(lx1 + uy * 3.5, ly1 - ux * 3.5, 6) + kreis(lx2 + uy * 3.5, ly2 - ux * 3.5, 5);
      for (let l = 10; l < ld - 6; l += 8) {
        const px = lx1 + ux * l - uy * 1, py = ly1 + uy * l + ux * 1;
        eimer += `M${r(px)} ${r(py)}l${r(-uy * 6)} ${r(ux * 6)}l${r(ux * 5)} ${r(uy * 5)}`;
        if (l % 16 < 8) eimer += `M${r(lx1 + ux * l + uy * 3.5)} ${r(ly1 + uy * l - ux * 3.5)}l${r(ux * 3)} ${r(uy * 3)}`;
      }
      let raeder = '';
      for (const x of [16, 30, 60, 74]) raeder += kreis(bx + x * k, g - 9, 5.5) + kreis(bx + x * k, g - 9, 1.5);
      body += pfad('t', gl + bt) + pfad('z', sw + eimer + raeder) + pfad('l', bl);
    }
    body += text(34, hoch - 22, 'Tiefe überhöht', 'mass hell');
    return svg(900, hoch, body);
  }

  // ---------------------------------------------------------------------------------------------
  // Längsschnitt, stark verkürzt: Schleusen an beiden Enden, dazwischen ein Wasserstand (900 × 450)
  function nokSchleusen() {
    const kanal = 240, sohle = 340, krone = 176;
    const schleusen = [{ tore: [204, 296] }, { tore: [604, 696] }];
    // Achsen
    let body = pfad('ax', 'M250 74V430M650 74V430');
    body += pfad('hl', `M20 ${kanal}H880`);
    // Boden und Schleusensohlen
    body += `<path class="hf" d="M20 392L175 352V${sohle}H725V352L880 392V450H20Z"/>`;
    let beton = '', t = '', z = '', akz = '', akzT = '';
    for (const { tore } of schleusen) {
      const x0 = tore[0] - 29, x1 = tore[1] + 29;
      body += `<path class="lf" d="M${x0} ${sohle}H${x1}V${sohle + 38}H${x0}Z"/>`;
      for (let y = sohle + 10, i = 0; y < sohle + 36; y += 9, i++) {
        for (let x = x0 + 6 + (i % 2) * 9; x < x1 - 8; x += 18) beton += `M${x} ${y}l3 -4l3 4ZM${x + 9} ${y - 2}h1.5`;
      }
      // Seitenmauer dahinter mit Kronenbalken, Fugen, Leitern, Pollern
      t += `M${x0 + 4} ${sohle}V${krone}H${x1 - 4}V${sohle}M${x0 + 4} ${krone + 8}H${x1 - 4}`;
      for (const lx of [tore[0] + 26, tore[1] - 26]) {
        z += `M${lx - 3} ${krone + 8}V${sohle}M${lx + 3} ${krone + 8}V${sohle}`;
        for (let y = krone + 14; y < sohle; y += 8) z += `M${lx - 3} ${y}h6`;
      }
      for (let px = x0 + 12; px <= x1 - 10; px += 26) {
        if (tore.some(tx => Math.abs(tx - px) < 14)) continue;
        t += `M${px - 3} ${krone}v-7h6v7M${px - 5} ${krone - 7}h10`;
      }
      // Drempel unter den Toren, Tore als Fachwerk
      for (const tx of tore) {
        body += `<path class="lf" d="M${tx - 16} ${sohle}V${sohle - 8}H${tx + 16}V${sohle}"/>`;
        akz += `M${tx - 8} ${sohle - 14}V${krone - 8}H${tx + 8}V${sohle - 14}Z`;
        for (let y = krone + 4; y < sohle - 14; y += 18) akzT += `M${tx - 8} ${y}h16`;
        for (let y = krone + 4; y + 18 < sohle - 14; y += 18) akzT += `M${tx - 8} ${y}l16 18`;
        akzT += kreis(tx - 4, sohle - 11, 3) + kreis(tx + 4, sohle - 11, 3);
      }
    }
    body += pfad('z', beton) + pfad('t', t) + pfad('z', z);
    body += `<g class="akzent">${pfad('l', akz)}${pfad('z', akzT)}</g>`;
    // Wasserstände: Elbe mit Flut und Ebbe, Kammern und Kanal, Ostsee mit Windstau
    body += pfad('l', `M20 208H196M212 ${kanal}H288M304 ${kanal}H596M612 ${kanal}H688M704 ${kanal + 4}H880`);
    body += pfad('d', 'M20 276H175M704 216H880');
    body += pfad('t', wellen(326, 580, kanal + 22) + wellen(222, 284, kanal + 22) + wellen(620, 690, kanal + 22));
    body += pfad('m', wsym(140, 208) + wsym(540, kanal) + wsym(800, kanal + 4));
    // Bruchlinie: stark verkürzt
    body += pfad('t', `M500 ${kanal - 30}V${kanal + 12}l-8 8l16 8l-8 8V${kanal + 44}M500 ${sohle - 14}V${sohle + 4}l-8 8l16 8l-8 8V${sohle + 46}`);
    // Dampfer im Kanal
    body += pfad('l', `M340 ${kanal}l10 16h90l10 -16M365 ${kanal}v-20h56v20M385 ${kanal - 20}v-22h12v22`) + pfad('t', `M352 ${kanal + 6}h86M370 ${kanal - 10}h46`);
    body += massH(250, 650, 100, '98 km');
    body += text(250, 136, 'Brunsbüttel', 'gross hell', 'text-anchor="middle"') + text(650, 136, 'Kiel-Holtenau', 'gross hell', 'text-anchor="middle"');
    body += text(30, 196, 'Flut') + text(30, 304, 'Ebbe') + text(732, 204, 'Windstau');
    body += text(450, kanal + 72, 'ein Wasserstand', 'akz hell', 'text-anchor="middle"');
    body += text(30, 60, 'Elbe') + text(870, 60, 'Ostsee', '', 'text-anchor="end"');
    return svg(900, 450, body);
  }

  Object.assign(Zeichnung, { nokKarte, nokUmweg, nokBruecke, nokProfil, nokSchleusen });
})();
