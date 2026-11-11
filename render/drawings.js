// Zeichnungen für Bauriss. Jede Funktion liefert ein SVG als String.
// Bauwerksmaße stehen in Metern, s ist der Maßstab in Pixel pro Meter.
(function () {
  const r = n => Math.round(n * 10) / 10;

  const DEFS = `<defs><pattern id="schraffur" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="ph" x1="0" y1="0" x2="0" y2="9"/></pattern></defs>`;

  const svg = (w, h, body, anker = 'xMidYMax') =>
    `<svg class="fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${anker} meet">${DEFS}${body}</svg>`;
  const pfad = (cls, d) => (d ? `<path class="${cls}" d="${d}"/>` : '');
  const text = (x, y, inhalt, cls = '', attr = '') => `<text x="${r(x)}" y="${r(y)}" class="${cls}" ${attr}>${inhalt}</text>`;

  // ---- Bausteine (liefern Pfaddaten in Bildpunkten) ----

  // Spitzbogen: yb = Fußpunkt, h = Gesamthöhe bis zum Scheitel
  function bogen(x, yb, w, h) {
    const ys = yb - (h - 0.866 * w);
    return `M${r(x)} ${r(yb)}V${r(ys)}A${r(w)} ${r(w)} 0 0 1 ${r(x + w / 2)} ${r(ys - 0.866 * w)}A${r(w)} ${r(w)} 0 0 1 ${r(x + w)} ${r(ys)}V${r(yb)}`;
  }
  const kreis = (cx, cy, k) => `M${r(cx - k)} ${r(cy)}a${r(k)} ${r(k)} 0 1 0 ${r(2 * k)} 0a${r(k)} ${r(k)} 0 1 0 ${r(-2 * k)} 0`;
  // Maßwerk: zwei Lanzetten und ein Kreis im Bogenfeld
  function masswerk(x, yb, w, h) {
    const ys = yb - (h - 0.866 * w), hw = w / 2;
    return bogen(x, yb, hw, yb - ys + 0.866 * hw) + bogen(x + hw, yb, hw, yb - ys + 0.866 * hw) + kreis(x + hw, ys - 0.48 * w, 0.17 * w);
  }
  // Wimperg: Ziergiebel über einem Bogen
  const wimperg = (x, y, w, h) => `M${r(x)} ${r(y)}L${r(x + w / 2)} ${r(y - h)}L${r(x + w)} ${r(y)}M${r(x + w / 2)} ${r(y - h)}v${r(-h * 0.16)}`;
  // Fiale: schlankes Türmchen mit Spitze
  const fiale = (cx, yb, w, hb, hs) =>
    `M${r(cx - w / 2)} ${r(yb)}V${r(yb - hb)}H${r(cx + w / 2)}V${r(yb)}M${r(cx - w / 2)} ${r(yb - hb)}L${r(cx)} ${r(yb - hb - hs)}L${r(cx + w / 2)} ${r(yb - hb)}`;

  function boden(x1, x2, y) {
    let t = '';
    for (let x = x1 + 10; x < x2; x += 14) t += `M${r(x)} ${r(y)}l-8 9`;
    return pfad('l', `M${r(x1)} ${r(y)}H${r(x2)}`) + pfad('t', t);
  }
  // Maßlinien mit Schrägstrichen an den Enden, wie auf Bauplänen
  function massV(x, y1, y2, label, seite = 1) {
    const ym = (y1 + y2) / 2, tx = seite > 0 ? x + 30 : x - 10;
    return pfad('t', `M${r(x)} ${r(y1)}V${r(y2)}M${r(x - 7)} ${r(y1 + 7)}l14 -14M${r(x - 7)} ${r(y2 + 7)}l14 -14`) +
      text(tx, ym, label, 'mass', `text-anchor="middle" transform="rotate(-90 ${r(tx)} ${r(ym)})"`);
  }
  function massH(x1, x2, y, label) {
    return pfad('t', `M${r(x1)} ${r(y)}H${r(x2)}M${r(x1 - 7)} ${r(y + 7)}l14 -14M${r(x2 - 7)} ${r(y + 7)}l14 -14`) +
      text((x1 + x2) / 2, y + 30, label, 'mass', 'text-anchor="middle"');
  }

  // ---- Kölner Dom, Westfassade ----
  // Ursprung oben links, 61 m breit, 157 m hoch. detail: 0 = Umriss, 1 = mit Fenstern und Maßwerk
  function fassadeKoerper(s, detail) {
    const X = m => m * s, Y = m => (157 - m) * s;
    let l = '', t = '';

    const turm = x0 => {
      const x1 = x0 + 23, cx = x0 + 11.5;
      l += `M${r(X(x0))} ${r(Y(0))}V${r(Y(72))}H${r(X(x1))}V${r(Y(0))}`;
      l += `M${r(X(cx - 8))} ${r(Y(72))}V${r(Y(97))}H${r(X(cx + 8))}V${r(Y(72))}`;
      l += `M${r(X(cx - 7.5))} ${r(Y(97))}L${r(X(cx))} ${r(Y(152))}L${r(X(cx + 7.5))} ${r(Y(97))}`;
      l += `M${r(X(cx))} ${r(Y(152))}V${r(Y(157))}M${r(X(cx - 1.6))} ${r(Y(154.6))}H${r(X(cx + 1.6))}`;
      l += fiale(X(x0 + 2), Y(72), 3.4 * s, 11 * s, 13 * s) + fiale(X(x1 - 2), Y(72), 3.4 * s, 11 * s, 13 * s);
      if (!detail) return;

      // Gesimse und Strebepfeiler
      for (const h of [24, 47]) l += `M${r(X(x0))} ${r(Y(h))}H${r(X(x1))}`;
      t += `M${r(X(x0 + 2.8))} ${r(Y(0))}V${r(Y(72))}M${r(X(x1 - 2.8))} ${r(Y(0))}V${r(Y(72))}`;
      for (const h of [24, 47]) t += fiale(X(x0 + 1.4), Y(h), 1.9 * s, 3 * s, 5 * s) + fiale(X(x1 - 1.4), Y(h), 1.9 * s, 3 * s, 5 * s);

      // Erdgeschoss: Seitenportal
      l += bogen(X(cx - 3.75), Y(0), 7.5 * s, 15 * s);
      t += bogen(X(cx - 2.7), Y(0), 5.4 * s, 12.6 * s) + wimperg(X(cx - 5.4), Y(8.6), 10.8 * s, 13.6 * s);
      t += bogen(X(x0 + 3.6), Y(2), 2.2 * s, 13 * s) + bogen(X(x1 - 5.8), Y(2), 2.2 * s, 13 * s);

      // zwei Fenstergeschosse
      for (const [basis, hoch] of [[26, 17], [49.5, 19]]) {
        for (const fx of [x0 + 4.4, x1 - 10.4]) {
          l += bogen(X(fx), Y(basis), 6 * s, hoch * s);
          t += masswerk(X(fx), Y(basis), 6 * s, hoch * s) + wimperg(X(fx - 0.8), Y(basis + hoch - 5.2), 7.6 * s, 10.4 * s);
        }
      }

      // Oktogon
      for (const fx of [cx - 6.4, cx + 1.4]) {
        l += bogen(X(fx), Y(74), 5 * s, 19 * s);
        t += masswerk(X(fx), Y(74), 5 * s, 19 * s);
      }
      t += fiale(X(cx - 8), Y(97), 1.6 * s, 2 * s, 6 * s) + fiale(X(cx + 8), Y(97), 1.6 * s, 2 * s, 6 * s);

      // durchbrochener Turmhelm: Rippen, Querbänder, Krabben
      t += `M${r(X(cx - 2.6))} ${r(Y(97))}L${r(X(cx))} ${r(Y(152))}L${r(X(cx + 2.6))} ${r(Y(97))}`;
      for (let h = 104; h < 150; h += 7) {
        const hw = 7.5 * (152 - h) / 55;
        t += `M${r(X(cx - hw))} ${r(Y(h))}H${r(X(cx + hw))}`;
      }
      for (let h = 100; h < 150; h += 3.5) {
        const hw = 7.5 * (152 - h) / 55;
        t += `M${r(X(cx - hw))} ${r(Y(h))}l${r(-0.9 * s)} ${r(-0.7 * s)}M${r(X(cx + hw))} ${r(Y(h))}l${r(0.9 * s)} ${r(-0.7 * s)}`;
      }
    };
    turm(0);
    turm(38);

    // Mittelteil: Hauptportal, Westfenster, Giebel
    l += bogen(X(25.85), Y(0), 9.3 * s, 19 * s);
    l += bogen(X(25), Y(31), 11 * s, 25 * s);
    l += `M${r(X(23))} ${r(Y(58.5))}H${r(X(38))}M${r(X(23))} ${r(Y(58.5))}L${r(X(30.5))} ${r(Y(71))}L${r(X(38))} ${r(Y(58.5))}M${r(X(30.5))} ${r(Y(71))}V${r(Y(74))}`;
    if (detail) {
      t += bogen(X(26.95), Y(0), 7.1 * s, 16.4 * s) + bogen(X(28.05), Y(0), 4.9 * s, 13.8 * s);
      t += wimperg(X(24), Y(11), 13 * s, 17.5 * s);
      t += masswerk(X(25), Y(31), 11 * s, 25 * s);
      t += `M${r(X(27.75))} ${r(Y(31))}V${r(Y(49))}M${r(X(33.25))} ${r(Y(31))}V${r(Y(49))}`;
      t += `M${r(X(23))} ${r(Y(30))}H${r(X(38))}` + kreis(X(30.5), Y(63), 2 * s);
    }
    return pfad('l', l) + pfad('t', t);
  }

  function domFassade({ s = 6, geteilt = false } = {}) {
    const ox = 14, oy = 16, w = 61 * s, h = 157 * s, spalt = geteilt ? 30 : 0;
    const W = ox + w + spalt + 80, H = oy + h + 66;
    const k = fassadeKoerper(s, 1);
    let body;
    if (geteilt) {
      let riss = '';
      for (const x of [ox + w / 2, ox + w / 2 + spalt]) {
        riss += `M${r(x)} ${oy - 6}`;
        for (let y = oy + 16, i = 0; y < oy + h; y += 22, i++) riss += `L${r(x + (i % 2 ? 5 : -5))} ${r(y)}`;
      }
      body = `<clipPath id="haelfte-l"><rect x="-30" y="-30" width="${r(w / 2 + 30)}" height="${r(h + 60)}"/></clipPath>` +
        `<clipPath id="haelfte-r"><rect x="${r(w / 2)}" y="-30" width="${r(w / 2 + 30)}" height="${r(h + 60)}"/></clipPath>` +
        `<g transform="translate(${ox} ${oy})" clip-path="url(#haelfte-l)">${k}</g>` +
        `<g transform="translate(${ox + spalt} ${oy})" clip-path="url(#haelfte-r)">${k}</g>` + pfad('a', riss);
    } else {
      body = `<g transform="translate(${ox} ${oy})">${k}</g>`;
    }
    body += boden(ox - 10, ox + w + spalt + 10, oy + h);
    body += massV(ox + w + spalt + 28, oy, oy + h, '157 m') + massH(ox, ox + w + spalt, oy + h + 26, geteilt ? 'Fassadenriss, um 1370' : '61 m');
    return svg(W, H, body, 'xMaxYMax');
  }

  // ---- Kölner Dom, Südansicht im Zustand 1560–1842 ----
  function domTorso() {
    const s = 3.8, ox = 72, g = 620;
    const X = m => ox + m * s, Y = m => g - m * s;
    let l = '', t = '', d = '', a = '';

    // Südturm: Stumpf mit abgetreppter Mauerkrone
    l += `M${r(X(0))} ${r(Y(0))}V${r(Y(56))}H${r(X(6))}V${r(Y(54.5))}H${r(X(13))}V${r(Y(57))}H${r(X(22))}V${r(Y(55))}H${r(X(30))}V${r(Y(0))}`;
    l += `M${r(X(0))} ${r(Y(24))}H${r(X(30))}M${r(X(0))} ${r(Y(47))}H${r(X(30))}`;
    t += `M${r(X(2.8))} ${r(Y(0))}V${r(Y(55))}M${r(X(27.2))} ${r(Y(0))}V${r(Y(55))}`;
    for (const fx of [5.5, 18.5]) {
      l += bogen(X(fx), Y(3), 6 * s, 16 * s) + bogen(X(fx), Y(26.5), 6 * s, 17 * s);
      t += masswerk(X(fx), Y(3), 6 * s, 16 * s) + masswerk(X(fx), Y(26.5), 6 * s, 17 * s);
    }

    // Baukran
    a += `M${r(X(9))} ${r(Y(56.5))}V${r(Y(63))}L${r(X(15))} ${r(Y(68))}L${r(X(21))} ${r(Y(63))}V${r(Y(55.5))}`;
    a += `M${r(X(20.5))} ${r(Y(58))}L${r(X(5))} ${r(Y(81))}M${r(X(15))} ${r(Y(68))}L${r(X(12))} ${r(Y(70.6))}`;
    a += `M${r(X(5))} ${r(Y(81))}V${r(Y(63))}`;

    // Langhaus: halbhoch, Notdach
    l += `M${r(X(30))} ${r(Y(19))}H${r(X(98))}M${r(X(30))} ${r(Y(25))}H${r(X(98))}`;
    for (let k = 0; k < 8; k++) {
      l += bogen(X(34 + k * 7.9), Y(3), 4.4 * s, 12.5 * s);
      t += `M${r(X(32.2 + k * 7.9))} ${r(Y(0))}V${r(Y(19))}`;
    }
    t += `M${r(X(95.4))} ${r(Y(0))}V${r(Y(19))}`;

    // Chor: als einziger Teil fertig
    l += `M${r(X(98))} ${r(Y(19))}V${r(Y(61))}H${r(X(130))}L${r(X(137))} ${r(Y(43))}V${r(Y(22))}`;
    l += `M${r(X(98))} ${r(Y(43))}H${r(X(137))}`;
    l += `M${r(X(98))} ${r(Y(21))}H${r(X(137))}L${r(X(144))} ${r(Y(18))}V${r(Y(0))}`;
    for (let k = 0; k < 5; k++) {
      const fx = 100.2 + k * 7.5;
      l += bogen(X(fx), Y(23), 4.6 * s, 18.5 * s) + bogen(X(fx), Y(3), 4.2 * s, 13 * s);
      t += masswerk(X(fx), Y(23), 4.6 * s, 18.5 * s);
      if (k) t += `M${r(X(fx - 1.45))} ${r(Y(0))}V${r(Y(43))}` + fiale(X(fx - 1.45), Y(43), 1.7 * s, 2.5 * s, 6 * s);
    }
    l += bogen(X(138.2), Y(3), 3.6 * s, 11 * s);
    const dach = `M${r(X(98))} ${r(Y(43))}V${r(Y(61))}H${r(X(130))}L${r(X(137))} ${r(Y(43))}Z`;

    // geplant, aber nicht gebaut
    d += `M${r(X(0))} ${r(Y(57))}V${r(Y(72))}H${r(X(30))}V${r(Y(56))}`;
    d += `M${r(X(4))} ${r(Y(72))}V${r(Y(97))}H${r(X(26))}V${r(Y(72))}`;
    d += `M${r(X(4.5))} ${r(Y(97))}L${r(X(15))} ${r(Y(152))}L${r(X(25.5))} ${r(Y(97))}M${r(X(15))} ${r(Y(152))}V${r(Y(157))}`;
    d += `M${r(X(30))} ${r(Y(26))}V${r(Y(61))}H${r(X(98))}M${r(X(30))} ${r(Y(43))}H${r(X(64))}M${r(X(92))} ${r(Y(43))}H${r(X(98))}`;
    d += `M${r(X(64))} ${r(Y(26))}V${r(Y(43))}L${r(X(78))} ${r(Y(67))}L${r(X(92))} ${r(Y(43))}V${r(Y(26))}`;
    d += bogen(X(73), Y(27), 10 * s, 24 * s);
    d += `M${r(X(75.6))} ${r(Y(63))}L${r(X(78))} ${r(Y(109))}L${r(X(80.4))} ${r(Y(63))}`;

    let body = `<path class="hf" d="${dach}"/>` + pfad('l', l) + pfad('t', t) + pfad('d', d) + pfad('a', a) + boden(ox - 14, X(144) + 14, g);

    // Beschriftung
    body += text(X(15) + 16, Y(157) + 26, '157 m', 'gross') + text(X(15) + 16, Y(157) + 58, 'geplant');
    body += pfad('t', `M${r(X(13))} ${r(Y(75))}L196 252`) + text(200, 232, 'Baukran', 'gross akz') + text(200, 264, 'über 25 m', 'akz');
    body += pfad('t', `M${r(X(88))} ${r(Y(26))}L404 300`) + text(390, 258, 'Langhaus', 'gross') + text(390, 290, 'nur Notdach');
    body += pfad('t', `M${r(X(134))} ${r(Y(52))}L636 440`) + text(642, 432, 'Chor', 'gross') + text(642, 464, 'fertig 1322');
    body += pfad('l', 'M642 40h54') + text(710, 49, 'gebaut');
    body += pfad('d', 'M642 80h54') + text(710, 89, 'nur geplant');
    return svg(900, 660, body);
  }

  // ---- Kölner Dom, Grundriss (Westen links) ----
  function domGrundriss() {
    const s = 5.6, ox = 47, oy = 44;
    const X = m => ox + m * s, Y = m => oy + m * s;
    const cx = 121.4, cy = 43, R = 22.6;
    const kranz = [];
    for (let i = 0; i <= 7; i++) {
      const w = (i * Math.PI) / 7;
      kranz.push([cx + R * Math.sin(w), cy - R * Math.cos(w)]);
    }
    const kapellen = kranz.slice(1).map(p => `A${r(5.8 * s)} ${r(5.8 * s)} 0 0 1 ${r(X(p[0]))} ${r(Y(p[1]))}`).join('');
    const umriss = `M${r(X(0))} ${r(Y(12.3))}H${r(X(26))}V${r(Y(20.4))}H${r(X(62))}V${r(Y(0))}H${r(X(98))}V${r(Y(20.4))}H${r(X(cx))}${kapellen}H${r(X(98))}V${r(Y(86))}H${r(X(62))}V${r(Y(65.6))}H${r(X(26))}V${r(Y(73.7))}H${r(X(0))}Z`;
    const chor = `M${r(X(98))} ${r(Y(20.4))}H${r(X(cx))}${kapellen}H${r(X(98))}Z`;

    let t = `M${r(X(26))} ${r(Y(20.4))}V${r(Y(65.6))}M${r(X(0))} ${r(Y(35.5))}H${r(X(26))}M${r(X(0))} ${r(Y(50.5))}H${r(X(26))}M${r(X(62))} ${r(Y(20.4))}V${r(Y(65.6))}`;
    let p = '';
    for (const y of [28, 35.5, 50.5, 58]) for (let x = 33.5; x < 118; x += 7.5) p += kreis(X(x), Y(y), 3.2);
    for (const rad of [7.5, 15]) for (let i = 1; i < 7; i++) {
      const w = (i * Math.PI) / 7;
      p += kreis(X(cx + rad * Math.sin(w)), Y(cy - rad * Math.cos(w)), 3.2);
    }

    let body = `<path class="hf" d="${chor}"/>` + pfad('l', umriss) + pfad('l', `M${r(X(98))} ${r(Y(20.4))}V${r(Y(65.6))}`) + pfad('t', t) + pfad('t punkt', p);
    body += pfad('t', `M${ox} ${oy + 8}h${r(50 * s)}M${ox} ${oy}v16M${r(ox + 50 * s)} ${oy}v16`) + text(ox + 25 * s, oy - 6, '50 m', 'mass', 'text-anchor="middle"');
    body += pfad('t', `M${r(X(13))} ${r(Y(73.7))}V548M${r(X(80))} ${r(Y(86))}V548M${r(X(124))} ${r(Y(66))}V548`);
    body += text(X(0), 586, 'Türme', 'gross') + text(X(0), 620, 'fertig 1880');
    body += text(X(80), 586, 'Langhaus', 'gross', 'text-anchor="middle"') + text(X(80), 620, 'fertig 1863', '', 'text-anchor="middle"');
    body += text(X(144), 586, 'Chor', 'gross akz', 'text-anchor="end"') + text(X(144), 620, '1248–1322', 'akz', 'text-anchor="end"');
    return svg(900, 634, body);
  }

  // ---- Zeitleiste, senkrecht ----
  // o.phasen: [{von, bis, art: 'bau' | 'pause' | 'schluss', text}], o.marken: [{jahr, text, label}]
  // jahr darf Nachkommastellen haben (2011.8 = Oktober 2011); label ersetzt dann die angezeigte Jahreszahl.
  function zeitleiste(o) {
    const y0 = 40, y1 = 820, bx = 170, bw = 64;
    const Y = j => y0 + ((j - o.von) / (o.bis - o.von)) * (y1 - y0);
    let body = '';
    for (const ph of o.phasen) {
      const a = Y(ph.von), b = Y(ph.bis);
      const cls = ph.art === 'bau' ? 'hf' : ph.art === 'pause' ? 'd' : 'af';
      body += `<rect class="${cls}" x="${bx}" y="${r(a)}" width="${bw}" height="${r(b - a)}"/>`;
      if (ph.text) body += text(bx + bw + 46, (a + b) / 2 + 18, ph.text, 'riesig' + (ph.art === 'pause' ? ' akz' : ''));
    }
    for (const m of o.marken) {
      const y = Y(m.jahr);
      body += pfad('l', `M${bx - 16} ${r(y)}H${bx + bw + 16}`);
      body += text(bx - 30, y + 12, m.label || m.jahr, 'gross', 'text-anchor="end"') + text(bx + bw + 46, y + 10, m.text);
    }
    return svg(900, 860, body);
  }

  // ---- Höhenvergleich ----
  // Umrisse: breite in Metern, bau(x0, g, s) zeichnet ab der Bodenlinie g. Weitere Umrisse hängen die Themen-Dateien an.
  const formen = {
    strassburg: { breite: 51, bau: (x0, g, s) => {
      const X = m => x0 + m * s, Y = m => g - m * s;
      return pfad('l', `M${r(X(0))} ${g}V${r(Y(66))}H${r(X(51))}V${g}M${r(X(3))} ${r(Y(66))}V${r(Y(100))}H${r(X(16))}V${r(Y(66))}M${r(X(3.5))} ${r(Y(100))}L${r(X(9.5))} ${r(Y(142))}L${r(X(15.5))} ${r(Y(100))}`) +
        pfad('t', kreis(X(25.5), Y(42), 6.8 * s) + bogen(X(4.5), g, 8 * s, 16 * s) + bogen(X(21.5), g, 8 * s, 16 * s) + bogen(X(38.5), g, 8 * s, 16 * s) + `M${r(X(0))} ${r(Y(24))}H${r(X(51))}M${r(X(0))} ${r(Y(52))}H${r(X(51))}`);
    } },
    rouen: { breite: 60, bau: (x0, g, s) => {
      const X = m => x0 + m * s, Y = m => g - m * s;
      return pfad('l', `M${r(X(0))} ${g}V${r(Y(75))}L${r(X(6))} ${r(Y(82))}L${r(X(12))} ${r(Y(75))}V${g}M${r(X(12))} ${r(Y(45))}H${r(X(48))}M${r(X(22))} ${r(Y(45))}L${r(X(30))} ${r(Y(58))}L${r(X(38))} ${r(Y(45))}M${r(X(48))} ${g}V${r(Y(75))}H${r(X(60))}V${g}M${r(X(27))} ${r(Y(53))}L${r(X(30))} ${r(Y(151))}L${r(X(33))} ${r(Y(53))}`) +
        pfad('t', kreis(X(30), Y(32), 5.5 * s) + bogen(X(25.5), g, 9 * s, 18 * s) + bogen(X(15), g, 6 * s, 12 * s) + bogen(X(39), g, 6 * s, 12 * s) + fiale(X(49.5), Y(75), 2 * s, 2 * s, 5 * s) + fiale(X(58.5), Y(75), 2 * s, 2 * s, 5 * s));
    } },
    koeln: { breite: 61, bau: (x0, g, s) => `<g transform="translate(${r(x0)} ${r(g - 157 * s)})">${fassadeKoerper(s, 0)}</g>` },
    washington: { breite: 16.8, bau: (x0, g, s) => {
      const X = m => x0 + m * s, Y = m => g - m * s;
      return pfad('l', `M${r(X(0))} ${g}L${r(X(3.15))} ${r(Y(152))}L${r(X(8.4))} ${r(Y(169))}L${r(X(13.65))} ${r(Y(152))}L${r(X(16.8))} ${g}M${r(X(3.15))} ${r(Y(152))}H${r(X(13.65))}`);
    } },
  };

  // o.bauten: [{form, name, jahr, hoehe, akzent}], o.klein: kleinere Namen für lange Bezeichnungen
  function hoehenvergleich(o = {}) {
    const bauten = o.bauten || [
      { form: 'strassburg', name: 'Straßburg', jahr: 1439, hoehe: 142 },
      { form: 'rouen', name: 'Rouen', jahr: 1876, hoehe: 151 },
      { form: 'koeln', name: 'Köln', jahr: 1880, hoehe: 157, akzent: true },
      { form: 'washington', name: 'Washington', jahr: 1884, hoehe: 169 },
    ];
    const g = 566, s = Math.min(3.1, 500 / Math.max(...bauten.map(b => b.hoehe)));
    const namen = o.klein ? '' : 'gross', zeichen = o.klein ? 17 : 21.6;
    // Jeder Bau bekommt ein Feld, das für Umriss und Namen reicht
    const felder = bauten.map(b => Math.max(formen[b.form].breite * s, String(b.name).length * zeichen));
    const luecke = (900 - 40 - felder.reduce((a, b) => a + b, 0)) / (bauten.length - 1);
    let x = 20, body = '';
    bauten.forEach((b, i) => {
      const mitte = x + felder[i] / 2, akz = b.akzent ? ' akz' : '';
      const umriss = formen[b.form].bau(mitte - (formen[b.form].breite * s) / 2, g, s);
      body += b.akzent ? `<g class="akzent">${umriss}</g>` : umriss;
      body += text(mitte, g - b.hoehe * s - 14, b.hoehe + ' m', 'gross' + akz, 'text-anchor="middle"');
      body += text(mitte, g + 44, b.name, namen + akz, 'text-anchor="middle"') + text(mitte, g + 78, b.jahr, akz, 'text-anchor="middle"');
      x += felder[i] + luecke;
    });
    body += boden(10, 890, g);
    return svg(900, 656, body);
  }

  // ---- Marke: Spitzbogenfenster mit Y-Maßwerk ----
  // Bogen 38 breit über den Kämpferpunkten (31|52) und (69|52); die Äste des Y haben denselben Radius.
  // riss: zeigt zusätzlich die Zirkelschläge, mit denen der Bogen konstruiert wird (für das Profilbild).
  function marke({ riss = false } = {}) {
    const hilfslinien = riss
      ? '<path class="mk" d="M50 19.1A38 38 0 0 1 65.7 14.1M50 19.1A38 38 0 0 0 34.3 14.1M14 52H26.5M73.5 52H86M18 49V55M82 49V55"/>'
      : '';
    return `<svg class="fig marke" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${hilfslinien}` +
      '<path class="mi" d="M50 84V52A38 38 0 0 0 40.5 26.9M50 52A38 38 0 0 1 59.5 26.9"/>' +
      '<path class="mb" d="M31 84V52A38 38 0 0 1 50 19.1A38 38 0 0 1 69 52V84Z"/></svg>';
  }

  window.Zeichnung = { domFassade, domTorso, domGrundriss, zeitleiste, hoehenvergleich, marke };
  // Werkzeug für die Themen-Dateien in render/zeichnungen/
  window.Z = { r, svg, pfad, text, bogen, kreis, boden, massV, massH, formen };
})();
