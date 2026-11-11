// Zeichnungen: Eiffelturm. Maße in Metern, s = Pixel pro Meter.
(function () {
  const { r, svg, pfad, text, boden, massV, massH, formen } = Z;

  const E1 = 57, E2 = 115, E3 = 276, SPITZE = 300, MAST = 312;
  // halbe Breite außen: 62,5 m am Boden, läuft nach oben wie eine Exponentialkurve aus
  const aussen = h => 3.5 + 59 * Math.exp(-h / 80);
  // Innenkante der Füße: 25 m breite Pfeiler am Boden, die bis zur zweiten Etage schlanker werden
  const innen = h => aussen(h) - (h <= E1 ? 25 - (13 * h) / E1 : 12 - (3 * (h - E1)) / (E2 - E1));
  // über der zweiten Etage schließt sich der Spalt zwischen den Pfeilern
  const spalt = h => 8.5 * (1 - (h - 119.5) / 70);

  // Liefert den Turm ab Bodenlinie g mit Achse cx: voll = fertiger Turm, umriss = Pfaddaten nur der Kontur
  function turmKoerper(cx, g, s, detail, bogenAkzent) {
    const X = m => r(cx + m * s), Y = m => r(g - m * s);
    const kurve = (f, von, bis, v) => {
      let d = `M${X(v * f(von))} ${Y(von)}`;
      for (let h = von + 3; h < bis; h += 3) d += `L${X(v * f(h))} ${Y(h)}`;
      return d + `L${X(v * f(bis))} ${Y(bis)}`;
    };
    const etage = (h, hoch, mehr) => `M${X(-aussen(h) - mehr)} ${Y(h)}H${X(aussen(h) + mehr)}V${Y(h + hoch)}H${X(-aussen(h) - mehr)}Z`;

    let umriss = '', l = '', t = '';
    for (const v of [-1, 1]) {
      umriss += kurve(aussen, 0, E3, v);
      l += kurve(innen, 0, E1, v) + kurve(innen, E1 + 5, E2, v) + kurve(spalt, 119.5, 189.5, v);
    }
    umriss += etage(E1, 5, 2.5) + etage(E2, 4.5, 2) + etage(E3, 5, 2.6);
    // Laterne mit Kuppel, darüber der Fahnenmast
    umriss += `M${X(-3.2)} ${Y(281)}V${Y(293)}Q${X(-3.2)} ${Y(SPITZE)} ${X(0)} ${Y(SPITZE)}Q${X(3.2)} ${Y(SPITZE)} ${X(3.2)} ${Y(293)}V${Y(281)}M${X(0)} ${Y(SPITZE)}V${Y(MAST)}`;

    // Bogen zwischen den Füßen: zwei Ellipsenbögen, Scheitel knapp unter der ersten Etage
    let bogen = '';
    for (const [rx, ry] of [[innen(6), 46], [innen(6) - 4, 42]]) {
      bogen += `M${X(-rx)} ${Y(6)}A${r(rx * s)} ${r(ry * s)} 0 0 1 ${X(rx)} ${Y(6)}`;
    }

    if (detail) {
      // Fachwerk: Kreuze zwischen Außen- und Innenkante der Füße, darüber über die ganze Breite
      const kreuze = (von, bis, schritt, a, b) => {
        for (let h = von; h + schritt <= bis + 0.1; h += schritt) {
          for (const v of [-1, 1]) {
            t += `M${X(v * a(h))} ${Y(h)}L${X(v * b(h + schritt))} ${Y(h + schritt)}M${X(v * b(h))} ${Y(h)}L${X(v * a(h + schritt))} ${Y(h + schritt)}`;
            t += `M${X(v * a(h))} ${Y(h)}H${X(v * b(h))}`;
          }
        }
      };
      kreuze(0, E1, 9.5, aussen, innen);
      kreuze(E1 + 5, E2, 8.8, aussen, innen);
      for (let h = 125; h < E3 - 8;) {
        const schritt = 6 + aussen(h) * 0.9, oben = Math.min(h + schritt, E3);
        t += `M${X(-aussen(h))} ${Y(h)}L${X(aussen(oben))} ${Y(oben)}M${X(aussen(h))} ${Y(h)}L${X(-aussen(oben))} ${Y(oben)}M${X(-aussen(h))} ${Y(h)}H${X(aussen(h))}`;
        h = oben;
      }
      // Geländer der Etagen
      for (const [h, mehr] of [[E1 + 2.5, 2.5], [E2 + 2.2, 2], [E3 + 2.5, 2.6]]) t += `M${X(-aussen(h - 2.5) - mehr)} ${Y(h)}H${X(aussen(h - 2.5) + mehr)}`;
    }
    const voll = pfad('l', umriss + l) + pfad('t', t) + pfad(bogenAkzent ? 'a' : 'l', bogen);
    return { voll, umriss };
  }

  // Ansicht für das Titelblatt
  function eiffelturm() {
    const s = 3, ox = 14, oy = 16, cx = ox + 62.5 * s, g = oy + MAST * s;
    const body = turmKoerper(cx, g, s, 1).voll + boden(ox - 10, ox + 125 * s + 10, g) +
      massV(ox + 125 * s + 28, g - SPITZE * s, g, '300 m') + massH(ox, ox + 125 * s, g + 26, '125 m');
    return svg(ox + 125 * s + 80, g + 66, body, 'xMaxYMax');
  }

  // Unterer Teil bis zur zweiten Etage, der Zierbogen hervorgehoben
  function eiffelFuss() {
    const s = 4.3, cx = 330, g = 590;
    const Y = m => g - m * s;
    let body = `<clipPath id="eiffel-fuss"><rect x="0" y="${r(Y(128))}" width="900" height="700"/></clipPath>`;
    body += `<g clip-path="url(#eiffel-fuss)">${turmKoerper(cx, g, s, 1, true).voll}</g>`;
    body += pfad('d', `M${r(cx - aussen(128) * s - 30)} ${r(Y(128))}H${r(cx + aussen(128) * s + 30)}`);
    body += boden(cx - 62.5 * s - 20, cx + 62.5 * s + 20, g) + massH(cx - 62.5 * s, cx + 62.5 * s, g + 26, '125 m');

    const marke = (h, kante, titel, sub, cls = '') => {
      const y = Y(h);
      body += pfad('t', `M${r(cx + kante * s + 8)} ${r(y)}H632`) + text(644, y + 4, titel, 'gross ' + cls) + text(644, y + 36, sub, cls);
    };
    marke(E2 + 2, aussen(E2) + 2, '2. Etage', '115 m');
    marke(E1 + 2.5, aussen(E1) + 2.5, '1. Etage', '57 m');
    body += pfad('t', `M${r(cx + 22 * s)} ${r(Y(36))}L632 ${r(Y(20))}`) + text(644, Y(20) + 4, 'Zierbogen', 'gross akz') + text(644, Y(20) + 36, 'trägt nichts', 'akz');
    return svg(900, 660, body);
  }

  // Bauzustand im April 1888: fertig bis zur ersten Etage, der Rest gestrichelt
  function eiffelBau() {
    const s = 1.95, cx = 250, g = 624, stand = E1 + 5;
    const Y = m => g - m * s;
    const turm = turmKoerper(cx, g, s, 1);
    let body = `<clipPath id="eiffel-fertig"><rect x="0" y="${r(Y(stand))}" width="900" height="700"/></clipPath>` +
      `<clipPath id="eiffel-geplant"><rect x="0" y="0" width="900" height="${r(Y(stand))}"/></clipPath>` +
      `<g clip-path="url(#eiffel-fertig)">${turm.voll}</g><g clip-path="url(#eiffel-geplant)">${pfad('d', turm.umriss)}</g>`;

    // Holzgerüste unter den schrägen Füßen
    let geruest = '';
    for (const v of [-1, 1]) {
      const x1 = cx + v * 26 * s, x2 = cx + v * 36 * s;
      geruest += `M${r(x1)} ${g}V${r(Y(30))}H${r(x2)}V${g}M${r(x1)} ${g}L${r(x2)} ${r(Y(15))}L${r(x1)} ${r(Y(30))}M${r(x2)} ${g}L${r(x1)} ${r(Y(15))}L${r(x2)} ${r(Y(30))}`;
    }
    body += pfad('a', geruest) + boden(cx - 62.5 * s - 20, cx + 62.5 * s + 20, g);

    const marke = (h, kante, titel, sub, cls = '') => {
      const y = Y(h);
      body += pfad('t', `M${r(cx + kante * s + 8)} ${r(y)}H436`) + text(448, y + 4, titel, 'gross ' + cls) + text(448, y + 36, sub, cls);
    };
    marke(SPITZE, 3.2, 'Spitze, 300 m', 'März 1889');
    marke(E2 + 2, aussen(E2) + 2, '2. Etage, 115 m', 'August 1888');
    marke(E1 + 2.5, aussen(E1) + 2.5, '1. Etage, 57 m', 'April 1888');
    body += pfad('t', `M${r(cx + 36 * s + 6)} ${r(Y(15))}L436 ${r(Y(12))}`) + text(448, Y(12) + 4, 'Holzgerüst', 'gross akz') + text(448, Y(12) + 36, 'stützt die Füße', 'akz');
    return svg(900, 680, body);
  }

  formen.eiffelturm = { breite: 125, bau: (x0, g, s) => turmKoerper(x0 + 62.5 * s, g, s, 0).voll };

  Object.assign(Zeichnung, { eiffelturm, eiffelFuss, eiffelBau });
})();
