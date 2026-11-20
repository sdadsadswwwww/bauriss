// Zeichnungen: Gotthard-Basistunnel. Höhen in Metern über Meer, Längen in Kilometern; schematisch.
// Belegt (Post-Text): 57 km Erstfeld–Bodio, Scheitel des Basistunnels 549 m, Bergstrecke 1882 mit Scheitel 1151 m und
// 15 km Scheiteltunnel, mehr als 2000 m Fels, Piz Vatgira 2983 m (rund 27 km ab Nordportal), zwei Röhren rund 40 m
// auseinander, Querschläge alle 325 m, Nothalte Sedrun und Faido, Durchschlag 15.10.2010 mit 8 cm / 1 cm Abweichung.
// Schematisch und ohne Maßzahl: Geländeprofil, Gesteinszonen, Zugänge und Schacht, Ausbau, Gleise, Bohrmaschine.
// Seit 20.11.2026 als CAD-Konstruktion: Achsen, Koten, Schraffuren, Ausbau und Ausrüstung.
(function () {
  const { r, svg, pfad, text, kreis, massV, massH } = Z;

  // ---------- CAD-Hilfen ----------
  const PI = Math.PI;
  const rausch = (i, k = 1) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const zug = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
  const zu = pts => zug(pts) + 'Z';
  const rechteck = (x, y, w, h) => `M${r(x)} ${r(y)}h${r(w)}v${r(h)}h${r(-w)}Z`;
  // Linienschar im Winkel w (Grad) mit Abstand a über dem Rechteck b = [x0, y0, x1, y1]
  function schar(b, w, a, v = 0.5) {
    const [x0, y0, x1, y1] = b, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    const dx = Math.cos((w * PI) / 180), dy = Math.sin((w * PI) / 180);
    let d = '';
    for (let t = -R + a * v; t < R; t += a) {
      const px = cx - dy * t, py = cy + dx * t;
      d += `M${r(px - dx * R)} ${r(py - dy * R)}L${r(px + dx * R)} ${r(py + dy * R)}`;
    }
    return d;
  }
  // Granit: versetzte Kreuzchen
  function kreuze(b, a, k = 3) {
    const [x0, y0, x1, y1] = b;
    let d = '', z = 0;
    for (let y = y0 + a / 2; y < y1; y += a * 0.86, z++) {
      for (let x = x0 + (z % 2 ? a / 2 : 0); x < x1; x += a) {
        const xx = x + (rausch(x * 0.37 + y, 3) - 0.5) * a * 0.3, yy = y + (rausch(y * 0.53 + x, 4) - 0.5) * a * 0.25;
        d += `M${r(xx - k)} ${r(yy)}h${r(2 * k)}M${r(xx)} ${r(yy - k)}v${r(2 * k)}`;
      }
    }
    return d;
  }
  // Gneis: Wellenlinien
  function wellen(b, a, amp = 2.4, per = 30) {
    const [x0, y0, x1, y1] = b;
    let d = '';
    for (let y = y0 + a / 2, z = 0; y < y1; y += a, z++) {
      d += 'M';
      for (let x = x0; x <= x1; x += 5) d += `${x > x0 ? 'L' : ''}${r(x)} ${r(y + amp * Math.sin(((x + z * 11) / per) * 2 * PI))}`;
    }
    return d;
  }
  // Fläche: Inhalt nur innerhalb des Umrisses d (und optional innerhalb von d2), ohne Aussparungen (Rechtecke [x, y, b, h])
  function flaeche(id, d, inhalt, cls = 'z', loecher = [], d2 = '') {
    const frei = 'M-200 -200H1200V1400H-200Z' + loecher.map(([x, y, b, h]) => rechteck(x, y, b, h)).join('');
    let s = `<clipPath id="${id}a"><path d="${d}"/></clipPath><clipPath id="${id}f"><path clip-rule="evenodd" d="${frei}"/></clipPath>`;
    if (d2) s += `<clipPath id="${id}b"><path d="${d2}"/></clipPath>`;
    const innen = `<g clip-path="url(#${id}f)"><path class="${cls}" d="${inhalt}"/></g>`;
    return s + `<g clip-path="url(#${id}a)">${d2 ? `<g clip-path="url(#${id}b)">${innen}</g>` : innen}</g>`;
  }
  // Achse mit Kreis und Buchstabe
  const achsKopf = (x, y, name) => pfad('m', kreis(x, y, 12)) + text(x, y + 8, name, 'achse', 'text-anchor="middle"');
  // Höhenkote: Dreieck mit Spitze auf der Höhe y, Text darüber
  const kote = (x, y, inhalt, seite = 1) =>
    pfad('m', `M${r(x)} ${r(y)}l-7 -12h14zM${r(x - 10)} ${r(y)}h${r(seite * 52 + 10)}`) +
    text(x + seite * 12, y - 8, inhalt, 'kote', seite > 0 ? '' : 'text-anchor="end"');
  // Bruchlinien mit Zickzack
  const bruchH = (x1, x2, y, n = 3) => {
    let d = `M${r(x1)} ${r(y)}`;
    for (let k = 1; k <= n; k++) { const x = x1 + ((x2 - x1) * k) / (n + 1); d += `L${r(x - 6)} ${r(y)}L${r(x - 2)} ${r(y - 9)}L${r(x + 2)} ${r(y + 9)}L${r(x + 6)} ${r(y)}`; }
    return d + `L${r(x2)} ${r(y)}`;
  };
  const bruchV = (x, y1, y2, n = 1) => {
    let d = `M${r(x)} ${r(y1)}`;
    for (let k = 1; k <= n; k++) { const y = y1 + ((y2 - y1) * k) / (n + 1); d += `L${r(x)} ${r(y - 6)}L${r(x - 9)} ${r(y - 2)}L${r(x + 9)} ${r(y + 2)}L${r(x)} ${r(y + 6)}`; }
    return d + `L${r(x)} ${r(y2)}`;
  };

  const LANG = 57, NORD = 460, SUED = 312, SCHEITEL = 549, KS = 27;
  const tunnelHoehe = km => (km <= KS ? NORD + ((SCHEITEL - NORD) * km) / KS : SCHEITEL - ((SCHEITEL - SUED) * (km - KS)) / (LANG - KS));
  // Gelände über der Achse, schematisch: [km, m ü. M., ruhig]; belegt ist nur der Piz Vatgira (2983 m bei km 27)
  const GEL = [
    [-9, 470, 1], [-1.5, 470, 1], [0, 474, 1], [0.6, 650], [1.3, 1100], [2.1, 1700], [3, 2150], [4, 2450], [5, 2300], [6, 2600],
    [6.9, 2000], [7.7, 1150], [8.2, 640], [8.45, 552, 1], [8.8, 532, 1], [9.2, 700], [10, 1500], [11.1, 2200], [12.3, 2650],
    [13.5, 2480], [14.7, 2900], [15.9, 2700], [17.1, 2950], [18.3, 2620], [19.5, 2800], [20.7, 2450], [21.7, 2600], [22.5, 2250],
    [23.3, 1720], [23.8, 1430], [24.1, 1340, 1], [24.5, 1330, 1], [24.9, 1345, 1], [25.5, 1700], [26.2, 2350], [27, 2983, 1],
    [27.8, 2580], [28.7, 2700], [29.7, 2420], [30.7, 2150], [31.7, 2260], [33, 2560], [34.5, 2440], [36, 2660], [37.5, 2300],
    [39, 1800], [40.3, 1400], [41.5, 1060], [42.3, 860], [42.9, 780, 1], [43.6, 750, 1], [44.2, 770, 1], [44.9, 1000],
    [46, 1700], [47.5, 2300], [49, 2460], [50.5, 2120], [52, 1600], [53.5, 1050], [54.8, 640], [55.8, 380], [56.5, 318, 1],
    [57, 312, 1], [57.6, 300, 1], [66, 300, 1],
  ];
  function gelaende(X, Y) {
    const pts = [];
    let i = 0;
    for (let k = 0; k + 1 < GEL.length; k++) {
      const [ka, ha, ra] = GEL[k], [kb, hb, rb] = GEL[k + 1];
      const n = Math.max(1, Math.round((kb - ka) / 0.3));
      for (let j = 0; j < n; j++, i++) {
        const t = j / n, w = (1 - Math.cos(t * PI)) / 2;
        let h = ha + (hb - ha) * w;
        const ruhe = ra && rb ? 0 : Math.min(ra && t < 0.5 ? t * 2 : 1, rb && t > 0.5 ? (1 - t) * 2 : 1) * (j === 0 && ra ? 0 : 1);
        h += ((rausch(i, 2) - 0.5) * (h > 1500 ? 80 : 30) * Math.sin(t * PI) + (rausch(i, 11) - 0.5) * (h > 1800 ? 40 : 12)) * ruhe;
        pts.push([X(ka + (kb - ka) * t), Y(h)]);
      }
    }
    const [kl, hl] = GEL[GEL.length - 1];
    pts.push([X(kl), Y(hl)]);
    return pts;
  }

  // Längsschnitt Erstfeld–Bodio, Höhen überhöht
  function gotthardProfil({ beschriftet = false } = {}) {
    const id = beschriftet ? 'gpb' : 'gpa';
    const ox = 160, sx = 10.62, g = 560, sy = 0.155;
    const X = km => ox + km * sx, Y = m => g - m * sy;
    const UNT = Y(230), xL = X(-9), xR = X(66);
    const geo = gelaende(X, Y);
    const berg = zu(geo.concat([[xR, UNT], [xL, UNT]]));
    const ax = [[X(0), Y(NORD)], [X(KS), Y(SCHEITEL)], [X(LANG), Y(SUED)]];
    const T = km => [X(km), Y(tunnelHoehe(km))];
    const a1 = X(14.5), a2 = X(29.5), yA = Y(1151);

    // Aussparungen in der Schraffur: Beschriftungen, Scheiteltunnel
    const loecher = [[a1, yA - 5, a2 - a1, 10]];
    if (beschriftet) loecher.push([X(27) + 14, Y(1700) - 32, 262, 78]);

    // Gesteinszonen (schematisch): steile Grenzen [km oben, km unten]
    const GR = [[6.6, 5.4], [18.4, 17.2], [31.4, 30.6], [33.9, 33.2], [46.4, 47.3]];
    const gx = ([ko, ku], y) => X(ko) + ((X(ku) - X(ko)) * (y - 60)) / (UNT - 60);
    const xs = [[xL - 10, xL - 10], ...GR.map(z => [gx(z, 0), gx(z, 620)]), [xR + 10, xR + 10]];
    const muster = [
      b => kreuze(b, 15, 2.6),
      b => schar(b, 45, 8) + schar(b, -45, 16),
      b => wellen(b, 9, 2.2, 32),
      b => schar(b, 0, 5) + schar(b, 70, 15),
      b => wellen(b, 11, 2.6, 24) + schar(b, 120, 22),
      b => kreuze(b, 17, 2.6) + schar(b, 30, 24),
    ];
    let body = '';
    for (let i = 0; i < muster.length; i++) {
      const zone = zu([[xs[i][0], 0], [xs[i + 1][0], 0], [xs[i + 1][1], 620], [xs[i][1], 620]]);
      const bx = [Math.min(xs[i][0], xs[i][1]) - 5, 60, Math.max(xs[i + 1][0], xs[i + 1][1]) + 5, UNT + 5];
      body += flaeche(`${id}${i}`, berg, muster[i](bx), 'z', loecher, zone);
    }
    let grenzen = '';
    for (const z of GR) grenzen += `M${r(gx(z, 0))} 0L${r(gx(z, 620))} 620`;
    body += `<clipPath id="${id}g"><path d="${berg}"/></clipPath><g clip-path="url(#${id}g)">${pfad('t', grenzen)}</g>`;

    // Gelände und Schnittbegrenzung
    body += pfad('l', zug(geo));
    body += pfad('t', `M${r(xL)} ${r(geo[0][1])}V${r(UNT)}M${r(xR)} ${r(geo[geo.length - 1][1])}V${r(UNT)}` + bruchH(xL, xR, UNT, 4));

    // Bergstrecke von 1882: Scheiteltunnel 15 km, projiziert (gestrichelt)
    body += pfad('d', `M${r(a1)} ${r(yA - 3)}H${r(a2)}M${r(a1)} ${r(yA + 3)}H${r(a2)}`) + pfad('t', `M${r(a1)} ${r(yA - 7)}v14M${r(a2)} ${r(yA - 7)}v14`);

    // Zugänge und Schacht (schematisch): Amsteg, Sedrun, Faido; Kavernen der Nothalte
    const [, syS] = T(23.1), [sxF, syF] = T(41.2), [sxA, syA] = T(7.8);
    let zg = '';
    zg += zu([[X(8.45), Y(552) - 1], [sxA, syA - 3], [sxA, syA + 3], [X(8.45), Y(552) + 5]]);
    zg += rechteck(X(23.1) - 2, Y(1345), 4, syS - Y(1345)) + rechteck(X(23.1) + 5, Y(1345), 3, syS - Y(1345));
    zg += rechteck(X(23.1) - 2, Y(1345) - 2, X(24.1) - X(23.1) + 2, 5);
    zg += zu([[X(43.6), Y(750)], [sxF + 3, syF - 3], [sxF + 3, syF + 2], [X(43.6), Y(750) + 5]]);
    for (const [k1, k2] of [[22.4, 23.8], [40.5, 41.9]]) {
      const [x1, y1] = T(k1), [x2, y2] = T(k2);
      zg += zu([[x1, y1 - 8], [x2, y2 - 8], [x2, y2 + 8], [x1, y1 + 8]]);
    }
    body += `<path class="lf" d="${zg}"/>`;
    // Schachtkopf Sedrun, Portale der Zugänge
    body += pfad('t', `M${r(X(23.1) - 8)} ${r(Y(1345) - 2)}h22M${r(X(23.1) - 6)} ${r(Y(1345) - 2)}l4 -10h10l4 10M${r(X(24.1))} ${r(Y(1345) - 6)}v12`);
    body += pfad('t', `M${r(X(43.6))} ${r(Y(750) - 4)}v13M${r(X(8.45))} ${r(Y(552) - 5)}v12`);

    // Basistunnel als Band: Röhre, Ringfugen, Achse, Kilometrierung
    const oben = ax.map(([x, y]) => [x, y - 4]), unten = ax.map(([x, y]) => [x, y + 4]).reverse();
    body += `<g class="akzent"><path class="lf" d="${zu(oben.concat(unten))}"/></g>`;
    let ringe = '';
    for (let km = 0.25; km < LANG; km += 0.42) { const [x, y] = T(km); ringe += `M${r(x)} ${r(y - 3)}v6`; }
    body += pfad('z', ringe);
    body += pfad('ax', zug([[X(0) - 40, Y(NORD)], ...ax, [X(LANG) + 40, Y(SUED)]]));
    let km5 = '';
    for (let k = 5; k < LANG; k += 5) { const [x, y] = T(k); km5 += `M${r(x)} ${r(y + 6)}v${k % 10 ? 6 : 12}`; }
    body += pfad('t', km5);
    // Portale Erstfeld und Bodio, Gleise davor
    body += pfad('l', `M${r(X(0))} ${r(Y(NORD) - 12)}v16M${r(X(0) - 12)} ${r(Y(NORD) - 12)}h12M${r(X(LANG))} ${r(Y(SUED) - 12)}v16M${r(X(LANG))} ${r(Y(SUED) - 12)}h12`);
    let gl = '';
    for (let x = X(-8); x < X(0) - 4; x += 6) gl += `M${r(x)} ${r(Y(470) + 1)}v3`;
    for (let x = X(LANG) + 6; x < X(65); x += 6) gl += `M${r(x)} ${r(Y(300) + 1)}v3`;
    body += pfad('z', gl);

    // Achsen der Portale und Nothalte, Kreise unter dem Schnitt
    const yk = UNT + 19;
    for (const [km, n] of [[0, 'A'], [23.1, 'B'], [41.2, 'C'], [LANG, 'D']]) {
      const [x, y] = T(km);
      body += pfad('ax', `M${r(x)} ${r(y + 9)}V${r(yk - 12)}`) + achsKopf(x, yk, n);
    }
    body += text(X(23.1) + 18, yk + 7, 'Sedrun', 'kote') + text(X(41.2) + 18, yk + 7, 'Faido', 'kote');

    // Höhenlinien und Koten
    body += pfad('hl', `M${r(X(KS))} ${r(Y(SCHEITEL))}H880M24 ${r(yA)}H${r(a1)}`);
    body += kote(X(61.5), Y(SCHEITEL), '+549');
    body += kote(56, yA, '+1151');
    body += text(880, 40, 'Höhen überhöht', 'kote', 'text-anchor="end"');

    body += text(X(0) - 2, Y(470) - 14, 'Erstfeld', '', 'text-anchor="end"') + text(X(LANG) + 12, Y(300) - 14, 'Bodio');
    body += massH(X(0), X(LANG), UNT + 50, '57 km');

    if (beschriftet) {
      body += text(X(27), Y(2983) - 46, 'Piz Vatgira', 'gross', 'text-anchor="middle"') + text(X(27), Y(2983) - 14, '2983 m', '', 'text-anchor="middle"');
      body += pfad('bgl', `M${r(X(27))} ${r(Y(2983) + 8)}V${r(Y(SCHEITEL) - 8)}`) + pfad('a', `M${r(X(27))} ${r(Y(2983) + 8)}V${r(Y(SCHEITEL) - 8)}m-9 -16l9 16l9 -16M${r(X(27) - 9)} ${r(Y(2983) + 24)}l9 -16l9 16`);
      body += text(X(27) + 22, Y(1700), 'über 2000 m', 'gross akz hell') + text(X(27) + 22, Y(1700) + 34, 'Fels darüber', 'akz hell');
    }
    return svg(900, g + 50, body);
  }

  // Alte Bergstrecke und Basistunnel als Höhendiagramm nebeneinander
  function gotthardVergleich() {
    const g = 430, sy = 0.27, xE = 70, xB = 830, sk = (xB - xE) / 57;
    const Y = m => g - m * sy;
    const t1 = 325, ts = t1 + 7.8 * sk, t2 = t1 + 15 * sk; // Scheiteltunnel 15 km
    const yT1 = Y(1106), yS = Y(1151), yT2 = Y(1142);
    // Bergstrecke: Rampen im Tal, schematisch geknickt
    const nord = [[xE, Y(NORD)], [140, Y(520)], [190, Y(640)], [235, Y(800)], [280, Y(960)], [t1, yT1]];
    const sued = [[t2, yT2], [580, Y(1000)], [630, Y(820)], [690, Y(640)], [750, Y(480)], [xB, Y(SUED)]];
    // Berg über dem Scheiteltunnel (schematisch)
    const huegel = [];
    for (let x = t1, i = 0; x <= t2; x += 8, i++) {
      const t = (x - t1) / (t2 - t1), hub = Math.sin(t * PI);
      huegel.push([x, yT1 + (yT2 - yT1) * t - 8 - hub * 18 - rausch(i, 5) * 8 * hub]);
    }
    huegel.push([t2, yT2 - 8]);
    const oberflaeche = nord.concat(huegel, sued);
    const berg = zu(oberflaeche.concat([[xB + 30, Y(SUED)], [xB + 30, g], [xE - 30, g], [xE - 30, Y(NORD)]]));
    const basis = [[xE, Y(NORD)], [ts, Y(SCHEITEL)], [xB, Y(SUED)]];
    const tunnelAlt = zu([[t1, yT1 - 4], [ts, yS - 4], [t2, yT2 - 4], [t2, yT2 + 4], [ts, yS + 4], [t1, yT1 + 4]]);

    const loecher = [[260, 306, 340, 78], [ts + 14, 154, 32, 92], [t1, yS - 6, t2 - t1, 13]];
    let body = flaeche('gv', berg, kreuze([20, 40, 880, g], 18, 2.6) + schar([20, 40, 880, g], 45, 11), 'z', loecher);
    body += pfad('t', `M${xE - 30} ${r(Y(NORD))}H${xE}M${xB} ${r(Y(SUED))}H${xB + 30}`);
    // Gleis der Bergstrecke mit Schwellen
    body += pfad('l', zug(nord) + zug(sued));
    let sw = '';
    for (const lauf of [nord, sued]) {
      for (let i = 0; i + 1 < lauf.length; i++) {
        const [x1, y1] = lauf[i], [x2, y2] = lauf[i + 1], L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
        for (let s = 4; s < L; s += 7) sw += `M${r(x1 + ((x2 - x1) * s) / L)} ${r(y1 + ((y2 - y1) * s) / L)}l${r(nx * 4)} ${r(ny * 4)}`;
      }
    }
    body += pfad('z', sw) + pfad('t', zug(huegel));
    // Scheiteltunnel
    body += pfad('d', zug([[t1, yT1 - 3], [ts, yS - 3], [t2, yT2 - 3]]) + zug([[t1, yT1 + 3], [ts, yS + 3], [t2, yT2 + 3]]));
    body += pfad('t', `M${r(t1)} ${r(yT1 - 8)}v16M${r(t2)} ${r(yT2 - 8)}v16`);
    // Basistunnel: Band mit Ringfugen und Achse
    const ob = basis.map(([x, y]) => [x, y - 5]), un = basis.map(([x, y]) => [x, y + 5]).reverse();
    body += `<g class="akzent"><path class="lf" d="${zu(ob.concat(un))}"/></g>`;
    let rf = '';
    for (let x = xE + 6; x < xB - 2; x += 7) {
      const y = x <= ts ? Y(NORD) + ((Y(SCHEITEL) - Y(NORD)) * (x - xE)) / (ts - xE) : Y(SCHEITEL) + ((Y(SUED) - Y(SCHEITEL)) * (x - ts)) / (xB - ts);
      rf += `M${r(x)} ${r(y - 4)}v8`;
    }
    body += pfad('z', rf) + pfad('ax', zug([[xE - 26, Y(NORD)], ...basis, [xB + 26, Y(SUED)]]));
    // Grundlinie mit Kilometerteilung
    let km = `M40 ${g}H860`;
    for (let k = 0; k <= 57; k += 5) km += `M${r(xE + k * sk)} ${g}v${k % 10 ? -6 : -11}`;
    body += pfad('t', km + `M${xB} ${g}v-11`);
    // Höhenlinien und Koten
    body += pfad('hl', `M${r(ts)} ${r(yS)}H880M${r(ts)} ${r(Y(SCHEITEL))}H880`);
    body += kote(800, yS, '+1151') + kote(800, Y(SCHEITEL), '+549');

    body += text(xE, g + 36, 'Erstfeld', '', 'text-anchor="middle"') + text(xB, g + 36, 'Bodio', '', 'text-anchor="middle"');
    body += text(425, 40, 'Bergstrecke von 1882', 'gross', 'text-anchor="middle"') + text(425, 74, 'Scheitel auf 1151 m, Tunnel 15 km', '', 'text-anchor="middle"');
    body += text(430, Y(SCHEITEL) + 58, 'Basistunnel', 'gross akz', 'text-anchor="middle"') + text(430, Y(SCHEITEL) + 92, 'Scheitel auf 549 m', 'akz', 'text-anchor="middle"');
    body += massV(ts, yS + 6, Y(SCHEITEL) - 6, '600 m');
    return svg(900, g + 60, body);
  }

  // Draufsicht: zwei Röhren, Querschläge, zwei Multifunktionsstellen
  function roehrenPlan() {
    const y1 = 180, y2 = 320, h = 21, xa = 60, xb = 800;
    const MFS = [[290, 'Sedrun'], [550, 'Faido']], halb = 62;
    const inMfs = x => MFS.some(([m]) => Math.abs(x - m) < halb + 8);
    let l = '', t = '', z = '', ax = '';
    for (const y of [y1, y2]) {
      l += `M${xa} ${y - h}H${xb}M${xa} ${y + h}H${xb}`;
      // Innenschale, Gehwege, Ringfugen
      t += `M${xa} ${y - h + 3}H${xb}M${xa} ${y + h - 3}H${xb}`;
      z += `M${xa} ${y - h + 8}H${xb}M${xa} ${y + h - 8}H${xb}`;
      for (let x = xa + 4; x < xb; x += 7) z += `M${x} ${y - h}v3M${x} ${y + h - 3}v3`;
      // Schienen und Schwellen
      z += `M${xa} ${y - 3.5}H${xb}M${xa} ${y + 3.5}H${xb}`;
      for (let x = xa + 3; x < xb; x += 5) z += `M${x} ${y - 6}v12`;
      ax += `M${xa - 14} ${y}H${xb + 14}`;
    }
    // Querschläge mit Türen (Türblatt und Schwenkbogen an beiden Enden)
    let qs = '', qa = '', tz = '';
    const XQ = 420;
    for (let x = xa + 20; x < xb; x += 20) {
      if (inMfs(x)) continue;
      const d = `M${x - 4} ${y1 + h}V${y2 - h}M${x + 4} ${y1 + h}V${y2 - h}`;
      if (x === XQ) qa += d; else qs += d;
      tz += `M${x - 4} ${y1 + h + 3}h8M${x - 4} ${y2 - h - 3}h8`;
      tz += `M${x - 4} ${y1 + h + 3}l7 7M${x - 4} ${y1 + h + 13}a10 10 0 0 0 7 -3`;
      tz += `M${x + 4} ${y2 - h - 3}l-7 -7M${x + 4} ${y2 - h - 13}a10 10 0 0 0 -7 3`;
      tz += `M${x} ${y1 + h + 22}v${y2 - y1 - 2 * h - 44}`;
    }
    let body = pfad('t', qs + t) + pfad('z', z + tz) + `<g class="akzent">${pfad('l', qa)}</g>`;
    // Multifunktionsstellen: Kaverne, Spurwechsel, Nothalte mit Fluchtstollen
    for (const [x, name] of MFS) {
      body += `<path class="lf" d="${rechteck(x - halb, y1 + h, 2 * halb, y2 - y1 - 2 * h)}"/>`;
      let sw = '', nz = '';
      sw += `M${x - 54} ${y1 + h}L${x - 14} ${y2 - h}M${x - 42} ${y1 + h}L${x - 2} ${y2 - h}`;
      sw += `M${x + 54} ${y1 + h}L${x + 14} ${y2 - h}M${x + 42} ${y1 + h}L${x + 2} ${y2 - h}`;
      for (let xx = x - halb + 6; xx < x + halb; xx += 10) nz += `M${xx} ${y1 + h}v9M${xx} ${y2 - h}v-9`;
      nz += `M${x - halb + 3} ${y1 + h + 9}H${x + halb - 3}M${x - halb + 3} ${y2 - h - 9}H${x + halb - 3}`;
      body += pfad('t', nz) + pfad('l', sw);
      // Nothalt-Bahnsteige in den Röhren
      body += pfad('t', `M${x - halb} ${y1 + h - 8}H${x + halb}M${x - halb} ${y2 - h + 8}H${x + halb}`);
      body += text(x, y2 + h + 44, name, 'gross', 'text-anchor="middle"') + text(x, y2 + h + 78, 'Nothalt', '', 'text-anchor="middle"');
    }
    body += pfad('l', l) + pfad('ax', ax);
    // Portale mit Flügelmauern
    body += pfad('l', `M${xa} ${y1 - h - 6}V${y1 + h + 6}M${xa} ${y2 - h - 6}V${y2 + h + 6}M${xb} ${y1 - h - 6}V${y1 + h + 6}M${xb} ${y2 - h - 6}V${y2 + h + 6}`);
    body += pfad('t', `M${xa} ${y1 - h - 6}l-12 -10M${xa} ${y2 + h + 6}l-12 10M${xb} ${y1 - h - 6}l12 -10M${xb} ${y2 + h + 6}l12 10`);
    // Kilometrierung an der Oströhre
    let kmT = '';
    for (let x = xa + 40; x < xb; x += 40) kmT += `M${x} ${y1 - h}v-${(x - xa) % 200 ? 6 : 12}`;
    body += pfad('t', kmT);
    // Züge (schematisch) mit Fahrtrichtung
    const zugUmriss = (x, y, w) => `M${x + 7} ${y - 8}H${x + w - 7}Q${x + w} ${y - 8} ${x + w} ${y}Q${x + w} ${y + 8} ${x + w - 7} ${y + 8}H${x + 7}Q${x} ${y + 8} ${x} ${y}Q${x} ${y - 8} ${x + 7} ${y - 8}Z`;
    body += `<path class="lf" d="${zugUmriss(640, y1, 96)}${zugUmriss(140, y2, 96)}"/>`;
    let wg = '';
    for (const [x0, y] of [[640, y1], [140, y2]]) for (let k = 1; k < 4; k++) wg += `M${x0 + k * 24} ${y - 8}v16`;
    body += pfad('t', wg + `M748 ${y1}h34m-11 -8l11 8l-11 8M128 ${y2}h-34m11 -8l-11 8l11 8`);
    // Achskreise der Röhren
    body += achsKopf(xa - 26, y1, 'O') + achsKopf(xa - 26, y2, 'W');
    body += text(xa, y1 - h - 22, 'Nord: Erstfeld') + text(xb, y1 - h - 22, 'Süd: Bodio', '', 'text-anchor="end"');
    body += pfad('m', `M${xb + 16} ${y1}H${xb + 40}M${xb + 16} ${y2}H${xb + 40}`) + massV(xb + 30, y1, y2, '40 m');
    body += pfad('t', `M${XQ} 100V${y1 + h + 30}`) + text(XQ, 52, 'Querschlag', 'gross', 'text-anchor="middle"') + text(XQ, 86, 'alle 325 m', '', 'text-anchor="middle"');
    return svg(900, 440, body);
  }

  // Durchschlag in der Draufsicht: zwei Vortriebe treffen sich, der Versatz ist übertrieben gezeichnet
  function durchschlag() {
    const xm = 450, yl = 150, yr = 162, h = 50, ya = 50, yu = 296;
    // Fels um die Röhre (schematisch Granit), Aussparungen für Röhre und Beschriftung
    const loecher = [[52, 228, 186, 36], [372, 240, 476, 36], [30, yl - h, xm - 30, 2 * h], [xm, yr - h, 870 - xm, 2 * h]];
    let body = flaeche('ds', rechteck(30, ya, 840, yu - ya), kreuze([30, ya, 870, yu], 18, 2.6) + schar([30, ya, 870, yu], 45, 14), 'z', loecher);
    body += pfad('t', bruchH(30, 870, ya, 3) + bruchH(30, 870, yu, 3) + bruchV(30, ya, yu, 1) + bruchV(870, ya, yu, 1));
    // Ausbruch und Ausbau (Nordseite), Ringfugen
    let l = `M30 ${yl - h}H${xm}M30 ${yl + h}H${xm}M${xm} ${yr - h}H870M${xm} ${yr + h}H870`;
    let t = `M30 ${yl - h + 7}H${xm - 36}M30 ${yl + h - 7}H${xm - 36}M${xm - 36} ${yl - h}v7M${xm - 36} ${yl + h - 7}v7`, z = '';
    for (let x = 36; x < xm - 36; x += 12) z += `M${x} ${yl - h}v7M${x} ${yl + h - 7}v7`;
    // Gleis, Förderband und Lüftungsleitung im Vortrieb von Sedrun
    for (let x = 34; x < xm - 44; x += 8) z += `M${x} ${yl + 8}v18`;
    z += `M30 ${yl + 11}H${xm - 44}M30 ${yl + 23}H${xm - 44}M30 ${yl + 34}H${xm - 20}M30 ${yl + 39}H${xm - 20}`;
    for (let x = 40; x < xm - 20; x += 30) z += `M${x} ${yl + 34}v5`;
    body += pfad('d', `M30 ${yl - h + 15}H${xm - 50}M30 ${yl - h + 27}H${xm - 50}`);
    // Vermessungspunkte auf der Achse
    for (const x of [110, 230, 350]) t += `M${x} ${yl - 2}l-6 -10h12z`;
    // Tunnelbohrmaschine von Süden: Bohrkopf mit Rollenmeißeln, Schild, Gripper, Hauptträger, Nachläufer
    const xk = xm + 4;
    t += `M${xk} ${yr - h + 3}V${yr + h - 3}M${xk + 12} ${yr - h + 3}V${yr + h - 3}`;
    for (let y = yr - h + 8; y < yr + h - 4; y += 7) z += `M${xk} ${y}l-3 3l3 3`;
    for (let y = yr - h + 10; y < yr + h - 6; y += 14) z += `M${xk + 2} ${y}h8`;
    l += `M${xk + 12} ${yr - h + 4}H${xk + 70}M${xk + 12} ${yr + h - 4}H${xk + 70}M${xk + 70} ${yr - h + 4}V${yr + h - 4}`;
    t += rechteck(xk + 82, yr - h + 1, 30, 9) + rechteck(xk + 82, yr + h - 10, 30, 9) + rechteck(xk + 12, yr - 9, 130, 18);
    z += `M${xk + 97} ${yr - h + 10}V${yr - 9}M${xk + 97} ${yr + 9}V${yr + h - 10}M${xk + 20} ${yr - h + 10}l40 ${2 * h - 20}M${xk + 20} ${yr + h - 10}l40 ${-2 * h + 20}`;
    for (let x = xk + 150; x < 860; x += 58) {
      t += rechteck(x, yr - h + 12, 50, 2 * h - 24);
      z += `M${x} ${yr - h + 12}l50 ${2 * h - 24}M${x + 50} ${yr - h + 12}l-50 ${2 * h - 24}`;
      z += `M${x + 6} ${yr - h + 12}v-4M${x + 44} ${yr - h + 12}v-4M${x + 6} ${yr + h - 12}v4M${x + 44} ${yr + h - 12}v4`;
    }
    z += `M${xk + 20} ${yr - 3}H866M${xk + 20} ${yr + 3}H866`;
    body += pfad('z', z) + pfad('t', t) + pfad('l', l);
    // Achsen beider Vortriebe; Versatz an der Durchschlagstelle
    body += pfad('ax', `M30 ${yl}H${xm + 90}M${xm - 90} ${yr}H870`);
    body += `<g class="akzent">${pfad('l', `M${xm} ${yl - h}V${yr - h}M${xm} ${yl + h}V${yr + h}`)}</g>`;
    body += pfad('m', `M${xm - 24} ${yl}V${yr}M${xm - 31} ${yl + 7}l14 -14M${xm - 31} ${yr + 7}l14 -14M${xm - 34} ${yl}h20M${xm - 34} ${yr}h20`);
    body += text(60, 254, 'von Sedrun') + text(840, 266, 'von Faido, mit Bohrmaschine', '', 'text-anchor="end"');
    body += text(xm, 344, '8 cm seitlich, 1 cm in der Höhe', 'gross akz', 'text-anchor="middle"') + text(xm, 380, 'Abweichung beim Durchschlag', 'akz', 'text-anchor="middle"');
    return svg(900, 410, body);
  }

  Object.assign(Zeichnung, { gotthardProfil, gotthardVergleich, roehrenPlan, durchschlag });
})();
