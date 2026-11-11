// Zeichnungen: Elbphilharmonie, Ansicht von Süden (Westspitze links). Maße in Metern, schematisch.
(function () {
  const { r, svg, pfad, text, boden, massV } = Z;

  const LANG = 126, SPEICHER = 37, GLAS = 41;
  // Dachspitzen (x, Höhe); dazwischen hängt das Dach durch
  const SPITZEN = [[0, 110], [30, 96], [62, 102], [96, 90], [126, 80]];
  const senke = (a, b) => [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 10];

  function dachHoehe(x) {
    for (let i = 0; i < SPITZEN.length - 1; i++) {
      const a = SPITZEN[i], b = SPITZEN[i + 1];
      if (x <= b[0]) {
        const t = (x - a[0]) / (b[0] - a[0]), c = senke(a, b);
        return (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t ** 2 * b[1];
      }
    }
    return SPITZEN[SPITZEN.length - 1][1];
  }

  // Liefert die Bauteile als Pfade; X/Y rechnen Meter in Bildpunkte um
  function teile(X, Y) {
    let dach = `M${r(X(0))} ${r(Y(SPITZEN[0][1]))}`;
    for (let i = 0; i < SPITZEN.length - 1; i++) {
      const c = senke(SPITZEN[i], SPITZEN[i + 1]), b = SPITZEN[i + 1];
      dach += `Q${r(X(c[0]))} ${r(Y(c[1]))} ${r(X(b[0]))} ${r(Y(b[1]))}`;
    }
    const glas = `M${r(X(0))} ${r(Y(GLAS))}V${r(Y(110))}${dach.slice(dach.indexOf('Q'))}V${r(Y(GLAS))}Z`;
    const speicher = `M${r(X(0))} ${r(Y(0))}V${r(Y(SPEICHER))}H${r(X(LANG))}V${r(Y(0))}`;
    return { glas, speicher };
  }

  function fassade(X, Y, s) {
    // Speicher: Raster kleiner Luken; Glas: Raster mit einzelnen gewölbten Scheiben
    let luken = '', raster = '', woelbung = '';
    for (let x = 3; x < LANG - 2; x += 4.2) {
      for (let y = 4; y < SPEICHER - 3; y += 4.6) luken += `M${r(X(x))} ${r(Y(y))}h${r(1.3 * s)}v${r(-1.7 * s)}h${r(-1.3 * s)}Z`;
    }
    for (let x = 4.2, i = 0; x < LANG; x += 4.2, i++) {
      raster += `M${r(X(x))} ${r(Y(GLAS))}V${r(Y(dachHoehe(x)))}`;
      for (let y = GLAS, j = 0; y + 3.7 < dachHoehe(x) - 2; y += 3.7, j++) {
        if ((i * 7 + j * 13) % 9 === 0) woelbung += `M${r(X(x + 0.5))} ${r(Y(y + 0.6))}a${r(1.6 * s)} ${r(1.9 * s)} 0 0 1 ${r(3.2 * s)} 0`;
      }
    }
    for (let y = GLAS + 3.7; y < 110; y += 3.7) raster += `M${r(X(0))} ${r(Y(y))}H${r(X(LANG))}`;
    return { luken, raster, woelbung };
  }

  // stand: 'heute' oder 'speicher' (Glasaufbau nur gestrichelt); beschriftet: Namen der drei Schichten rechts
  function elphiAnsicht({ stand = 'heute', beschriftet = false } = {}) {
    // Ohne Beschriftung darf das Gebäude die Breite füllen
    const s = beschriftet ? 4 : 5.6, ox = beschriftet ? 70 : (900 - LANG * s) / 2, g = beschriftet ? 590 : 660;
    const X = m => ox + m * s, Y = m => g - m * s;
    const t = teile(X, Y), f = fassade(X, Y, s);
    let body = pfad('l', t.speicher) + pfad('t', f.luken);

    if (stand === 'speicher') {
      body += pfad('l', `M${r(X(0))} ${r(Y(SPEICHER))}H${r(X(LANG))}`) + pfad('d', t.glas);
      body += text(X(LANG / 2), Y(72), 'geplant: ein Konzerthaus obendrauf', '', 'text-anchor="middle"');
    } else {
      let stuetzen = '';
      for (let x = 8.4; x < LANG; x += 8.4) stuetzen += `M${r(X(x))} ${r(Y(SPEICHER))}V${r(Y(GLAS))}`;
      body += `<clipPath id="elphi-glas"><path d="${t.glas}"/></clipPath><g clip-path="url(#elphi-glas)">${pfad('t', f.raster)}</g>`;
      body += pfad('t', stuetzen + f.woelbung) + pfad('l', t.glas + `M${r(X(0))} ${r(Y(SPEICHER))}H${r(X(LANG))}`);
    }
    body += boden(X(-9), X(LANG + 9), g);
    body += massV(X(0) - 26, Y(110), g, stand === 'speicher' ? '110 m geplant' : '110 m', -1);

    if (beschriftet) {
      const lx = X(LANG) + 26;
      for (const [h, titel, sub] of [[80, 'Glasaufbau', '1100 Glaselemente'], [39, 'Plaza', 'in 37 Metern Höhe'], [16, 'Kaispeicher A', 'Baujahr 1966']]) {
        body += pfad('t', `M${r(X(LANG) + 5)} ${r(Y(h))}H${r(lx - 6)}`) + text(lx, Y(h) + 4, titel, 'gross') + text(lx, Y(h) + 38, sub);
      }
    } else {
      body += massV(X(LANG) + 26, Y(SPEICHER), g, '37 m');
    }
    return svg(900, g + 50, body);
  }

  // Schnitt: der Große Saal steht als eigener Baukörper auf Federn
  function elphiSchnitt() {
    const s = 4, ox = 40, g = 590;
    const X = m => ox + m * s, Y = m => g - m * s;
    const t = teile(X, Y);
    let body = pfad('l', t.speicher + t.glas + `M${r(X(0))} ${r(Y(SPEICHER))}H${r(X(LANG))}`);

    // Geschosse im Speicher, Decke unter dem Saal
    let decken = '';
    for (let y = 6.2; y < SPEICHER; y += 6.2) decken += `M${r(X(0))} ${r(Y(y))}H${r(X(LANG))}`;
    body += pfad('t', decken) + pfad('l', `M${r(X(34))} ${r(Y(46))}H${r(X(102))}`);

    // Saal: zwei Schalen, innen ansteigende Ränge um das Podium
    const schale = (a, b) => `M${r(X(42 - a))} ${r(Y(51 - b))}Q${r(X(35 - a))} ${r(Y(72))} ${r(X(46 - a))} ${r(Y(89 + b))}L${r(X(90 + a))} ${r(Y(87 + b))}Q${r(X(101 + a))} ${r(Y(70))} ${r(X(94 + a))} ${r(Y(51 - b))}Z`;
    body += pfad('t', schale(2.4, 2)) + `<path class="lf" d="${schale(0, 0)}"/>`;
    body += pfad('t', `M${r(X(44))} ${r(Y(80))}L${r(X(50))} ${r(Y(72))}h${r(3 * s)}L${r(X(58))} ${r(Y(64))}h${r(3 * s)}L${r(X(64))} ${r(Y(57))}H${r(X(72))}L${r(X(75))} ${r(Y(64))}h${r(3 * s)}L${r(X(83))} ${r(Y(72))}h${r(3 * s)}L${r(X(92))} ${r(Y(80))}`);
    body += pfad('l', `M${r(X(64))} ${r(Y(56))}H${r(X(72))}`);

    // Federpakete zwischen Saal und Decke
    let federn = '';
    for (const x of [44, 53, 62, 74, 83, 92]) federn += `M${r(X(x))} ${r(Y(51))}l5 -5l-10 -5l10 -5l-5 -5`;
    body += pfad('a', federn);

    body += boden(X(-9), X(LANG + 9), g);
    const lx = X(LANG) + 30;
    body += pfad('t', `M${r(X(98))} ${r(Y(74))}H${r(lx - 6)}`) + text(lx, Y(74) + 4, 'Großer Saal', 'gross') + text(lx, Y(74) + 38, '2100 Plätze');
    body += pfad('t', `M${r(X(94))} ${r(Y(48.5))}H${r(lx - 6)}`) + text(lx, Y(48.5) + 4, 'Auf Federn', 'gross akz') + text(lx, Y(48.5) + 38, '342 Federpakete', 'akz');
    body += pfad('t', `M${r(X(LANG) + 5)} ${r(Y(14))}H${r(lx - 6)}`) + text(lx, Y(14) + 4, 'Kaispeicher', 'gross') + text(lx, Y(14) + 38, 'innen neu gebaut');
    return svg(900, 640, body);
  }

  Object.assign(Zeichnung, { elphiAnsicht, elphiSchnitt });
})();
