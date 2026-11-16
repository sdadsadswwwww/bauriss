// Zeichnungen: Berliner Fernsehturm. Maße in Metern, s = Pixel pro Meter.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV, formen } = Z;

  const KUGEL = 213.78, RADIUS = 16, SCHAFT = 248.78, SPITZE = 368;
  // halbe Schaftbreite: 16 m Durchmesser bei 20 m Höhe, 9 m am oberen Ende
  const schaft = h => 8 - (3.5 * (h - 20)) / (SCHAFT - 20);
  const mast = [[SCHAFT, 290, 2.6], [290, 327, 1.8], [327, SPITZE, 1]];

  // Turm ab Bodenlinie g mit Achse cx. stufe: 1 = nur Schaft, 2 = mit Kugel, 3 = mit Antenne; Fehlendes gestrichelt
  function turmKoerper(cx, g, s, stufe, detail) {
    const X = m => cx + m * s, Y = m => g - m * s;
    let l = '', t = '', d = '', flaechen = '';

    // Fuß als Kegelstumpf, darüber der Schaft
    for (const v of [-1, 1]) {
      l += `M${r(X(16 * v))} ${r(Y(0))}Q${r(X(9.5 * v))} ${r(Y(8))} ${r(X(8 * v))} ${r(Y(20))}L${r(X(4.5 * v))} ${r(Y(SCHAFT))}`;
    }
    l += `M${r(X(-4.5))} ${r(Y(SCHAFT))}H${r(X(4.5))}`;
    if (detail) {
      // Zwischengeschosse mit Bullaugen, Eingangspavillons mit Faltdach
      for (const h of [65, 110, 155]) {
        t += `M${r(X(-schaft(h)))} ${r(Y(h))}H${r(X(schaft(h)))}` + kreis(X(-2.4), Y(h + 3), 0.7 * s) + kreis(X(0), Y(h + 3), 0.7 * s) + kreis(X(2.4), Y(h + 3), 0.7 * s);
      }
      for (const v of [-1, 1]) {
        l += `M${r(X(15 * v))} ${r(Y(2))}L${r(X(22 * v))} ${r(Y(9))}L${r(X(28 * v))} ${r(Y(3))}L${r(X(34 * v))} ${r(Y(9))}L${r(X(40 * v))} ${r(Y(3))}L${r(X(46 * v))} ${r(Y(9))}L${r(X(49 * v))} ${r(Y(0))}`;
      }
    }

    // Kugel
    const kugel = kreis(X(0), Y(KUGEL), RADIUS * s);
    if (stufe >= 2) {
      flaechen += `<path class="lf" d="${kugel}"/>`;
      for (const [h, cls] of [[202, 'l'], [209, 'l'], [205.5, 't'], [218, 't'], [224, 't']]) {
        const hw = Math.sqrt(RADIUS ** 2 - (h - KUGEL) ** 2);
        const linie = `M${r(X(-hw))} ${r(Y(h))}H${r(X(hw))}`;
        if (cls === 'l') flaechen += pfad('l', linie); else flaechen += pfad('t', linie);
      }
    } else {
      d += kugel;
    }

    // Antenne: Stahlrohr in drei Stufen, rot-weiß geringelt
    for (const [von, bis, hw] of mast) {
      const umriss = `M${r(X(-hw))} ${r(Y(von))}V${r(Y(bis))}H${r(X(hw))}V${r(Y(von))}`;
      if (stufe >= 3) {
        l += umriss;
        for (let h = von + 6; h + 6 <= bis && detail; h += 12) {
          flaechen += `<rect class="hs" x="${r(X(-hw))}" y="${r(Y(h + 6))}" width="${r(2 * hw * s)}" height="${r(6 * s)}"/>`;
        }
      } else {
        d += umriss;
      }
    }
    return pfad('l', l) + pfad('t', t) + flaechen + pfad('d', d);
  }

  // marken: [{h, text, sub}] beschriftet Höhen links vom Turm
  function fernsehturm({ stufe = 3, marken = [] } = {}) {
    const s = 2.6, oy = 16, g = oy + SPITZE * s, cx = marken.length ? 300 : 140;
    let body = turmKoerper(cx, g, s, stufe, 1) + boden(cx - 136, cx + 136, g);
    body += massV(cx + 150, oy, g, '368 m');
    for (const m of marken) {
      const y = g - m.h * s;
      const hw = m.h > SCHAFT ? 3 : Math.abs(m.h - KUGEL) < RADIUS && stufe >= 2 ? RADIUS : schaft(m.h);
      body += pfad('t', `M${cx - 78} ${r(y)}H${r(cx - hw * s - 6)}`);
      body += text(cx - 88, y + (m.sub ? -4 : 12), m.text, 'gross', 'text-anchor="end"');
      if (m.sub) body += text(cx - 88, y + 28, m.sub, '', 'text-anchor="end"');
    }
    return svg(cx + 200, g + 30, body, 'xMaxYMax');
  }

  // Kugel aus der Nähe. bau: Montage 1968 mit Kran und halb fertiger Hülle; kreuz: Lichtreflex bei Sonne
  function turmKugel({ bau = false, kreuz = false } = {}) {
    const s = 9, cx = 440, cy = 400, R = RADIUS * s;
    const Y = h => cy - (h - KUGEL) * s;
    let body = '';

    // Schaft läuft durch die Kugel bis 248,78 m
    const unten = KUGEL - (640 - cy) / s;
    body += pfad('l', `M${r(cx - schaft(unten) * s)} 640L${r(cx - 4.5 * s)} ${r(Y(SCHAFT))}H${r(cx + 4.5 * s)}L${r(cx + schaft(unten) * s)} 640`);

    // Hülle: Breitenkreise als Geraden, Längenkreise als Ellipsen
    let netz = '';
    for (let dy = -12; dy <= 12; dy += 4) {
      const hw = Math.sqrt(R * R - (dy * s) ** 2);
      netz += `M${r(cx - hw)} ${r(cy - dy * s)}H${r(cx + hw)}`;
    }
    let ellipsen = `<path class="t" d="${netz}M${cx} ${cy - R}V${cy + R}"/>`;
    for (const k of [0.38, 0.71, 0.92]) ellipsen += `<ellipse class="t" cx="${cx}" cy="${cy}" rx="${r(R * k)}" ry="${R}"/>`;

    if (bau) {
      // fertig ist die Hülle bis knapp über die Mitte
      const dy = 3 * s, hw = Math.sqrt(R * R - dy * dy);
      const fertig = `M${r(cx - hw)} ${r(cy - dy)}A${R} ${R} 0 1 0 ${r(cx + hw)} ${r(cy - dy)}Z`;
      body += pfad('d', kreis(cx, cy, R));
      body += `<clipPath id="kugel-fertig"><path d="${fertig}"/></clipPath><path class="lf" d="${fertig}"/><g clip-path="url(#kugel-fertig)">${ellipsen}</g>`;
      // Kran auf dem Schaft, ein Segment am Seil
      const ky = Y(SCHAFT);
      body += pfad('l', `M${cx} ${r(ky)}V${r(ky - 62)}M${cx - 70} ${r(ky - 50)}H${cx + 215}M${cx} ${r(ky - 62)}L${cx - 70} ${r(ky - 50)}M${cx} ${r(ky - 62)}L${cx + 215} ${r(ky - 50)}`);
      body += pfad('t', `M${cx + 205} ${r(ky - 50)}V${r(cy - 70)}`);
      body += pfad('a', `M${cx + 186} ${r(cy - 70)}h38l8 46h-54Z`);
      body += pfad('t', `M${cx + 238} ${r(cy - 46)}L${cx + 262} ${r(cy - 30)}`) + text(cx + 268, cy - 30, 'Segment', 'gross akz') + text(cx + 268, cy + 2, '10 Tonnen', 'akz');
      body += text(cx - 86, ky - 44, 'Kran auf dem Schaft', '', 'text-anchor="end"');
      body += text(20, cy + R - 30, 'Montage von') + text(20, cy + R + 2, 'unten nach oben');
    } else {
      body += `<path class="lf" d="${kreis(cx, cy, R)}"/>${ellipsen}`;
    }
    // Fensterband der Aussichtsetage und des Restaurants
    for (const h of [202, 209]) {
      const hw = Math.sqrt(R * R - ((h - KUGEL) * s) ** 2);
      body += pfad('l', `M${r(cx - hw)} ${r(Y(h))}H${r(cx + hw)}`);
    }

    if (kreuz) {
      const kx = cx + 0.36 * R, ky = cy - 0.3 * R, lang = 0.5 * R, schmal = 0.045 * R;
      body += `<path class="af" d="M${r(kx)} ${r(ky - lang)}L${r(kx + schmal)} ${r(ky)}L${r(kx)} ${r(ky + lang * 1.5)}L${r(kx - schmal)} ${r(ky)}Z"/>`;
      body += `<path class="af" d="M${r(kx - lang)} ${r(ky)}L${r(kx)} ${r(ky - schmal)}L${r(kx + lang)} ${r(ky)}L${r(kx)} ${r(ky + schmal)}Z"/>`;
      body += pfad('t', `M${r(kx + lang * 0.7)} ${r(ky - lang * 0.7)}L${cx + 216} ${cy - 196}`) + text(cx + 222, cy - 204, 'Lichtkreuz', 'gross akz') + text(cx + 222, cy - 172, 'bei Sonnenschein', 'akz');
      body += text(20, cy + R - 30, 'Hülle aus') + text(20, cy + R + 2, 'Edelstahl');
    }
    body += massV(cx - R - 44, cy - R, cy + R, '32 m', -1);
    return svg(900, 640, body);
  }

  // Umrisse für den Höhenvergleich
  formen.fernsehturm = { breite: 32, bau: (x0, g, s) => turmKoerper(x0 + 16 * s, g, s, 3, 0) };
  formen.funkturm = { breite: 20, bau: (x0, g, s) => {
    const X = m => x0 + (10 + m) * s, Y = m => g - m * s;
    // Stahlfachwerk: Beine laufen nach oben zusammen, dazwischen Kreuzverbände
    const hw = h => 10 - (8 * h) / 125;
    let l = `M${r(X(-10))} ${g}L${r(X(-2))} ${r(Y(125))}M${r(X(10))} ${g}L${r(X(2))} ${r(Y(125))}`;
    l += `M${r(X(-5))} ${r(Y(125))}H${r(X(5))}V${r(Y(130))}H${r(X(-5))}ZM${r(X(0))} ${r(Y(130))}V${r(Y(147))}`;
    l += `M${r(X(-8))} ${r(Y(52))}H${r(X(8))}V${r(Y(58))}H${r(X(-8))}Z`;
    let t = '';
    for (let h = 0; h < 120; h += 20) t += `M${r(X(-hw(h)))} ${r(Y(h))}L${r(X(hw(h + 20)))} ${r(Y(h + 20))}M${r(X(hw(h)))} ${r(Y(h))}L${r(X(-hw(h + 20)))} ${r(Y(h + 20))}`;
    return pfad('l', l) + pfad('t', t);
  } };
  formen.ostankino = { breite: 60, bau: (x0, g, s) => {
    const X = m => x0 + (30 + m) * s, Y = m => g - m * s;
    let l = '';
    for (const v of [-1, 1]) l += `M${r(X(30 * v))} ${g}Q${r(X(12 * v))} ${r(Y(20))} ${r(X(9 * v))} ${r(Y(63))}L${r(X(4 * v))} ${r(Y(385))}`;
    l += `M${r(X(-4))} ${r(Y(385))}H${r(X(4))}`;
    for (const [von, bis, hw] of [[147, 152, 8], [243, 248, 7], [325, 360, 10]]) l += `M${r(X(-hw))} ${r(Y(von))}H${r(X(hw))}V${r(Y(bis))}H${r(X(-hw))}Z`;
    l += `M${r(X(-2))} ${r(Y(385))}V${r(Y(470))}H${r(X(2))}V${r(Y(385))}M${r(X(0))} ${r(Y(470))}V${r(Y(540))}`;
    return pfad('l', l);
  } };

  Object.assign(Zeichnung, { fernsehturm, turmKugel });
})();
