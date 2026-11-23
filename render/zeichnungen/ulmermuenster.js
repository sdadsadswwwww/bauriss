// Zeichnungen: Ulmer Münster. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Hauptturm 161,53 m, um 1543 rund 100 m; Chortürme 86 m, um 1543 etwa 32 m; Kirche 123,56 m lang und 48,8 m breit;
// Chor 29 m lang; Mittelschiff 41,6 m, Seitenschiffe 20,55 m hoch; ursprünglich als dreischiffige Halle geplant.
// Vergleich: Kölner Dom 157 m, Christusturm der Sagrada Família 172,5 m (Marienturm 138 m, Evangelistentürme 135 m).
// Ohne Maßzahl und nur nach Fotos vereinfacht: Breite von Turm, Achteck und Helm, Höhe von Traufe, Dach und Chor,
// Lage der Chortürme, Fenster, Portal, Gewölbeform, Dachneigung und alle Umrisse im Vergleich.
(function () {
  const { r, svg, pfad, text, bogen, boden, massV, massH, formen } = Z;

  const TURM = 161.53, LANG = 123.56, CHOR = 29;
  const poly = (X, Y, pts) => 'M' + pts.map(([x, h]) => `${r(X(x))} ${r(Y(h))}`).join('L') + 'Z';

  // Südansicht, Westturm links. x0 = Westseite in Pixeln, g = Bodenlinie.
  // stand: '1377' (nur der Chor steht, alles andere geplant), '1543' (Helm und obere Chortürme fehlen), '1890' (fertig)
  // akzent: 'chor' | 'stumpf' (Turm bis 100 m) | 'helm' (Turm über 100 m) | ''
  function koerper(x0, g, s, { stand = '1890', akzent = '' } = {}) {
    const X = m => x0 + m * s, Y = m => g - m * s;
    const C0 = LANG - CHOR;
    const teile = { fest: '', plan: '', akz: '' };
    const lege = (wohin, d) => { teile[wohin] += d; };
    const wo = (name, gebaut) => (akzent === name ? 'akz' : gebaut ? 'fest' : 'plan');

    // Flächen (Umriss in Blattfarbe) und Linien je Teil
    const fl = d => `<path class="lf" d="${d}"/>`;
    const dach = d => `<path class="hf" d="${d}"/>`;

    // Langhaus: Seitenschiff, Obergaden, Dach
    const schiff = fl(poly(X, Y, [[26, 0], [26, 44], [C0, 44], [C0, 0]])) + dach(poly(X, Y, [[26, 44], [26, 60], [C0, 60], [C0, 44]]));
    let schiffT = `M${r(X(26))} ${r(Y(20.55))}H${r(X(C0))}M${r(X(26))} ${r(Y(27))}H${r(X(C0))}`;
    for (let x = 33; x < C0 - 4; x += 10) schiffT += bogen(X(x - 2), Y(4), 4 * s, 13 * s) + bogen(X(x - 1.5), Y(29.5), 3 * s, 12 * s);
    lege(wo('schiff', stand !== '1377'), schiff + pfad('t', schiffT));

    // Chor mit Walmdach
    const chor = fl(poly(X, Y, [[C0, 0], [C0, 32], [LANG, 32], [LANG, 0]])) + dach(poly(X, Y, [[C0, 32], [C0, 46], [LANG - 8, 46], [LANG, 32]]));
    let chorT = '';
    for (const x of [C0 + 6, C0 + 14.5, C0 + 23]) chorT += bogen(X(x - 2), Y(5), 4 * s, 21 * s);
    lege(wo('chor', true), chor + pfad('t', chorT));

    // Chorturm (die beiden Türme decken sich in der Ansicht); bis 32 m schon im Mittelalter
    const ct = C0 - 4;
    const ctUnten = fl(poly(X, Y, [[ct - 4, 0], [ct - 4, 32], [ct + 4, 32], [ct + 4, 0]]));
    const ctOben = fl(poly(X, Y, [[ct - 4, 32], [ct - 4, 62], [ct + 4, 62], [ct + 4, 32]])) + fl(poly(X, Y, [[ct - 4, 62], [ct, 86], [ct + 4, 62]]));
    lege(stand === '1377' ? 'plan' : 'fest', ctUnten);
    lege(stand === '1890' ? 'fest' : 'plan', ctOben);

    // Hauptturm: Viereck bis 70 m, Achteck bis 100 m, Helm bis 152,5 m, Kreuzblume bis 161,53 m
    const stumpf = fl(poly(X, Y, [[0, 0], [0, 70], [26, 70], [26, 0]])) + fl(poly(X, Y, [[4, 70], [4, 100], [22, 100], [22, 70]]));
    const stumpfT = bogen(X(6), Y(0), 14 * s, 24 * s) + bogen(X(9), Y(36), 8 * s, 24 * s) + bogen(X(9.5), Y(74), 7 * s, 21 * s);
    lege(stand === '1377' ? 'plan' : akzent === 'stumpf' ? 'akz' : 'fest', stumpf + pfad('t', stumpfT));
    const helm = fl(poly(X, Y, [[4, 100], [13, 152.5], [22, 100]])) +
      pfad('l', `M${r(X(13))} ${r(Y(152.5))}V${r(Y(TURM))}M${r(X(10.8))} ${r(Y(157))}H${r(X(15.2))}`) +
      pfad('t', `M${r(X(8.5))} ${r(Y(118))}H${r(X(17.5))}`);
    lege(stand === '1890' ? (akzent === 'helm' ? 'akz' : 'fest') : 'plan', helm);

    return `<g class="geplant">${teile.plan}</g>` + teile.fest + `<g class="akzent">${teile.akz}</g>`;
  }

  // Ansicht mit Optionen; hoehe = Höhe der Zeichenfläche
  function ulmAnsicht({ stand = '1890', akzent = '', beschriftung = '', hoehe = 590, reel = false } = {}) {
    const oben = 22, unten = 20, s = (hoehe - oben - unten) / TURM;
    const g = hoehe - unten, x0 = r(450 - (LANG / 2) * s) + (beschriftung === 'turm' ? 40 : 0);
    const X = m => x0 + m * s, Y = m => g - m * s;
    let body = koerper(x0, g, s, { stand, akzent }) + boden(X(-14), X(LANG + 14), g);
    if (reel) return svg(900, hoehe, body);
    if (beschriftung === 'chor') {
      body += text(X(LANG) + 22, Y(22), 'Chor', 'gross akz') + text(X(LANG) + 22, Y(22) + 44, '29 m', 'mass');
      body += pfad('t', `M${r(X(-1))} ${r(Y(120))}H${r(X(-12))}`) + text(X(-14), Y(120) + 12, 'geplant', '', 'text-anchor="end"');
    }
    if (beschriftung === 'stumpf') {
      body += massV(X(-8), Y(100), g, 'rund 100 m', -1, 40);
      body += pfad('t', `M${r(X(19))} ${r(Y(128))}H${r(X(32))}`) + text(X(34), Y(128) + 12, 'fehlt bis 1890');
    }
    if (beschriftung === 'turm') {
      body += massV(X(-8), Y(TURM), g, '161,53 m', -1, 40);
      body += pfad('t', `M${r(X(17.5))} ${r(Y(126))}H${r(X(32))}`) + text(X(34), Y(126) + 12, '1885–1890', 'gross akz');
    }
    return svg(900, hoehe, body);
  }

  // Querschnitt durch das Langhaus: drei Schiffe; gestrichelt der Plan einer Halle, gelb das hohe Mittelschiff
  function ulmSchnitt({ reel = false } = {}) {
    const s = 9.0, g = 548, B = 48.8 / 2, P = 48.8 / 6;
    const X = m => 450 + m * s, Y = m => g - m * s;
    const w = 2 * P * s;
    let l = '', t = '';
    // Außenwände, Pfeiler, Pultdächer der Seitenschiffe, Obergaden und Satteldach
    l += `M${r(X(-B))} ${g}V${r(Y(22))}L${r(X(-P))} ${r(Y(30))}V${r(Y(46))}L${r(X(0))} ${r(Y(58))}L${r(X(P))} ${r(Y(46))}V${r(Y(30))}L${r(X(B))} ${r(Y(22))}V${g}`;
    t += `M${r(X(-P))} ${g}V${r(Y(30))}M${r(X(P))} ${g}V${r(Y(30))}`;
    // Gewölbe: Seitenschiffe bis 20,55 m
    t += bogen(X(-B), g, w, 20.55 * s) + bogen(X(P), g, w, 20.55 * s);
    let body = pfad('l', l) + pfad('t', t);
    // Mittelschiff bis 41,6 m
    body += `<g class="akzent">${pfad('l', bogen(X(-P), g, w, 41.6 * s))}</g>`;
    // Plan der Halle: Mittelschiff so hoch wie die Seitenschiffe
    body += pfad('d', bogen(X(-P), g, w, 20.55 * s));
    body += boden(X(-B) - 30, X(B) + 30, g);
    if (reel) return svg(900, g + 18, body);
    body += massV(X(-B) - 34, Y(41.6), g, '41,6 m', -1, 40) + pfad('t', `M${r(X(-B) - 46)} ${r(Y(41.6))}H${r(X(-P))}`);
    body += massV(X(B) + 34, Y(20.55), g, '20,55 m', 1, 40);
    body += pfad('d', `M${r(X(B) - 10)} 60h54`) + text(X(B) + 56, 72, 'Halle');
    body += pfad('a', `M${r(X(B) - 10)} 116h54`) + text(X(B) + 56, 128, 'Basilika', 'akz');
    return svg(900, g + 18, body);
  }

  // Umrisse für den Vergleich (Westseite des Münsters, schematische Sagrada Família)
  formen.ulm = { breite: 48.8, bau: (x0, g, s) => {
    const X = m => x0 + (m + 24.4) * s, Y = m => g - m * s;
    let l = `M${r(X(-24.4))} ${g}V${r(Y(20.55))}L${r(X(-13))} ${r(Y(30))}M${r(X(24.4))} ${g}V${r(Y(20.55))}L${r(X(13))} ${r(Y(30))}`;
    l += `M${r(X(-13))} ${g}V${r(Y(70))}H${r(X(13))}V${g}M${r(X(-9))} ${r(Y(70))}V${r(Y(100))}H${r(X(9))}V${r(Y(70))}`;
    l += `M${r(X(-9))} ${r(Y(100))}L${r(X(0))} ${r(Y(152.5))}L${r(X(9))} ${r(Y(100))}M${r(X(0))} ${r(Y(152.5))}V${r(Y(TURM))}M${r(X(-2.2))} ${r(Y(157))}H${r(X(2.2))}`;
    return pfad('l', l) + pfad('t', bogen(X(-7), g, 14 * s, 24 * s) + bogen(X(-4), Y(36), 8 * s, 24 * s));
  } };
  const spitz = (X, Y, x, von, bis, hw) => {
    const n = 14, li = [], re = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = hw * Math.pow(1 - t, 0.55), h = von + (bis - von) * t;
      li.push(`${r(X(x - w))} ${r(Y(h))}`); re.unshift(`${r(X(x + w))} ${r(Y(h))}`);
    }
    return 'M' + li.concat(re).join('L') + 'Z';
  };
  formen.sagradaUmriss = { breite: 70, bau: (x0, g, s) => {
    const X = m => x0 + (m + 34) * s, Y = m => g - m * s;
    let b = '';
    for (const [x, h, w] of [[-11.5, 135, 6.5], [11.5, 135, 6.5], [27, 138, 9]]) b += `<path class="lf" d="${spitz(X, Y, x, 40, h, w)}"/>`;
    b += `<path class="lf" d="${spitz(X, Y, 0, 45, 172.5, 11)}"/>`;
    b += `<path class="lf" d="M${r(X(-34))} ${g}V${r(Y(46))}H${r(X(36))}V${g}Z"/>`;
    b += pfad('t', bogen(X(-5), g, 10 * s, 26 * s) + bogen(X(-18), g, 7 * s, 18 * s) + bogen(X(11), g, 7 * s, 18 * s));
    return b;
  } };

  // Höhenvergleich in einem Maßstab: Kölner Dom, Ulmer Münster (gelb), Sagrada Família
  function ulmVergleich({ reel = false } = {}) {
    const s = 2.75, g = 520, Y = m => g - m * s;
    const bauten = [
      { form: 'koeln', name: 'Köln', jahr: 1880, hoehe: '157 m', h: 157, x: 150 },
      { form: 'ulm', name: 'Ulm', jahr: 1890, hoehe: '161,53 m', h: TURM, x: 440, akz: true },
      { form: 'sagradaUmriss', name: 'Barcelona', jahr: 2026, hoehe: '172,5 m', h: 172.5, x: 730 },
    ];
    let body = reel ? '' : pfad('d', `M${r(440 + 6 * s)} ${r(Y(TURM))}H${r(730 - 12 * s)}`);
    for (const b of bauten) {
      const f = formen[b.form], u = f.bau(b.x - (f.breite * s) / 2, g, s);
      body += b.akz ? `<g class="akzent">${u}</g>` : u;
      if (reel) continue;
      const k = b.akz ? ' akz' : '';
      body += text(b.x, Y(b.h) - 16, b.hoehe, 'gross' + k, 'text-anchor="middle"');
      body += text(b.x, g + 48, b.name, 'gross' + k, 'text-anchor="middle"') + text(b.x, g + 92, b.jahr, k.trim(), 'text-anchor="middle"');
    }
    body += boden(20, 880, g);
    return svg(900, reel ? g + 20 : g + 108, body);
  }

  Object.assign(Zeichnung, { ulmAnsicht, ulmSchnitt, ulmVergleich });
})();
