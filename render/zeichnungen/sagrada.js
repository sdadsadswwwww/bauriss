// Zeichnungen: Sagrada Família, Barcelona. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt sind die Höhen der mittleren Türme (Jesus 172,5 m, Maria 138 m, Evangelisten 135 m), das Kreuz (17 m),
// die Maße des Grundrisses (90 m lang, 45 m breit, Querhaus 60 × 30 m, Schiffe 15 und 7,5 m) und die Höhen
// von Ulmer Münster (161,5 m) und Kölner Dom (157 m). Alles andere ist nach Fotos vereinfacht und trägt keine Maßzahl.
(function () {
  const { r, svg, pfad, text, kreis, bogen, boden, massV, massH, formen } = Z;

  // Turm als schlanke Spindel: Achse x, Fuß yb, Spitze yt, Fußbreite w (alles in Bildpunkten)
  function spindel(x, yb, yt, w) {
    const n = 18, links = [], rechts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, hw = (w / 2) * Math.pow(1 - t, 0.55), y = yb + (yt - yb) * t;
      links.push(`${r(x - hw)} ${r(y)}`);
      rechts.unshift(`${r(x + hw)} ${r(y)}`);
    }
    return 'M' + links.concat(rechts).join('L') + 'Z';
  }
  const stern = (x, y, k) => {
    let d = '';
    for (let i = 0; i < 24; i++) {
      const w = (i * Math.PI) / 12, q = i % 2 ? k * 0.5 : k;
      d += (i ? 'L' : 'M') + `${r(x + q * Math.sin(w))} ${r(y - q * Math.cos(w))}`;
    }
    return d + 'Z';
  };

  // Ansicht von Nordosten (Geburtsfassade): links die Hauptfassade, rechts die Apsis.
  // Achse cx liegt in der Vierung, g ist die Bodenlinie.
  // detail: Fenster und Portale; glorie: zeigt die vier fehlenden Türme der Hauptfassade gestrichelt;
  // stand1926: der Plan gestrichelt, das 1926 Gebaute durchgezogen, der fertige Turm gelb
  function koerper(cx, g, s, { detail = 1, glorie = true, kreuzGelb = false, stand1926 = false } = {}) {
    const X = m => cx + m * s, Y = m => g - m * s;
    const turm = (x, von, bis, w) => `<path class="lf" d="${spindel(X(x), Y(von), Y(bis), w * s)}"/>`;
    const kreuz = `M${r(X(-1.6))} ${r(Y(155.5))}V${r(Y(163))}H${r(X(-6.5))}V${r(Y(166.2))}H${r(X(-1.6))}V${r(Y(172.5))}H${r(X(1.6))}V${r(Y(166.2))}H${r(X(6.5))}V${r(Y(163))}H${r(X(1.6))}V${r(Y(155.5))}Z`;
    const schiff = `M${r(X(-52))} ${r(Y(0))}V${r(Y(45))}H${r(X(15))}V${r(Y(40))}H${r(X(33))}Q${r(X(38))} ${r(Y(40))} ${r(X(38))} ${r(Y(34))}V${r(Y(0))}Z`;
    const apsis = `M${r(X(16))} ${r(Y(0))}V${r(Y(40))}H${r(X(33))}Q${r(X(38))} ${r(Y(40))} ${r(X(38))} ${r(Y(34))}V${r(Y(0))}Z`;
    const vorbau = `M${r(X(-16))} ${r(Y(0))}V${r(Y(24))}L${r(X(-8.5))} ${r(Y(36))}L${r(X(-4.5))} ${r(Y(28))}L${r(X(0))} ${r(Y(48))}L${r(X(4.5))} ${r(Y(28))}L${r(X(8.5))} ${r(Y(36))}L${r(X(16))} ${r(Y(24))}V${r(Y(0))}Z`;
    const apostel = [[-12, 98.5], [-4.5, 107], [4.5, 107], [12, 98.5]];

    // hinten: die sechs mittleren Türme
    let hinten = turm(-11.5, 45, 135, 13) + turm(11.5, 45, 135, 13) + turm(27, 40, 134.5, 18) + turm(0, 45, 157, 22);
    hinten += `<path class="${kreuzGelb ? 'af' : 'lf'}" d="${kreuz}"/>`;
    hinten += `<path class="lf" d="${stern(X(27), Y(135.6), 2.4 * s)}"/>`;
    const hauptfassade = turm(-48.5, 0, 112, 7) + turm(-42, 0, 118, 7);

    if (stand1926) {
      let plan = hinten + hauptfassade + pfad('l', schiff);
      for (const [x, h] of apostel.slice(1)) plan += turm(x, 0, h, 7);
      let body = `<g class="geplant">${plan}</g>`;
      body += `<path class="lf" d="${apsis}"/>` + `<g class="akzent">${turm(-12, 0, 98.5, 7)}</g>` + `<path class="lf" d="${vorbau}"/>`;
      return body;
    }

    let body = hinten;
    if (glorie) body += `<g class="geplant">${hauptfassade}</g>`;
    body += `<path class="lf" d="${schiff}"/>`;
    for (const [x, h] of apostel) body += turm(x, 0, h, 7) + pfad('t', kreis(X(x), Y(h - 5.5), 0.9 * s));
    body += `<path class="lf" d="${vorbau}"/>`;
    if (detail) {
      let t = '';
      for (const x of [-47, -40.5, -34, -27.5]) t += bogen(X(x), Y(12), 3.6 * s, 24 * s);
      for (const x of [20, 26.5]) t += bogen(X(x), Y(10), 3.6 * s, 22 * s);
      t += bogen(X(-11.5), Y(0), 4 * s, 13 * s) + bogen(X(-3), Y(0), 6 * s, 19 * s) + bogen(X(7.5), Y(0), 4 * s, 13 * s);
      t += `M${r(X(-52))} ${r(Y(8))}H${r(X(-16))}M${r(X(16))} ${r(Y(8))}H${r(X(38))}`;
      // Schallöffnungen der Türme als senkrechte Striche
      for (const [x, h] of apostel) t += `M${r(X(x))} ${r(Y(52))}V${r(Y(h - 14))}`;
      t += `M${r(X(0))} ${r(Y(118))}V${r(Y(146))}M${r(X(27))} ${r(Y(60))}V${r(Y(118))}`;
      body += pfad('t', t);
    }
    return body;
  }

  // Titelblatt (hoch), mit namen: breite Ansicht mit beschrifteten Türmen
  function sagradaAnsicht({ namen = false } = {}) {
    if (!namen) {
      const s = 4.7, oy = 16, g = oy + 172.5 * s, cx = 256;
      const body = koerper(cx, g, s, { kreuzGelb: true }) + boden(4, 446, g) + massV(460, oy, g, '172,5 m');
      return svg(510, g + 30, body, 'xMaxYMax');
    }
    const s = 3, oy = 22, g = oy + 172.5 * s, cx = 500;
    const X = m => cx + m * s, Y = m => g - m * s;
    let body = koerper(cx, g, s, { kreuzGelb: true }) + boden(300, 660, g);
    // rechts: Jesus und Maria
    body += pfad('t', `M${r(X(8))} ${r(Y(164.6))}H640`) + text(650, Y(164.6) + 12, 'Jesus', 'gross akz') + text(650, Y(164.6) + 46, '172,5 m', 'akz');
    body += pfad('t', `M${r(X(30.5))} ${r(Y(135.6))}L640 ${r(Y(128))}`) + text(650, Y(128) + 12, 'Maria', 'gross') + text(650, Y(128) + 46, '138 m');
    // links: Evangelisten und Apostel
    body += pfad('t', `M${r(X(-14.5))} ${r(Y(128))}H330`) + text(320, Y(128) + 12, 'Evangelisten', 'gross', 'text-anchor="end"') + text(320, Y(128) + 46, '4 Türme, je 135 m', '', 'text-anchor="end"');
    body += pfad('t', `M${r(X(-51.5))} ${r(Y(84))}H330`) + text(320, Y(84) + 12, 'Apostel', 'gross', 'text-anchor="end"') + text(320, Y(84) + 46, '12 Türme,', '', 'text-anchor="end"') + text(320, Y(84) + 80, '4 fehlen noch', '', 'text-anchor="end"');
    return svg(900, g + 20, body);
  }

  // Stand beim Tod Gaudís 1926
  function sagrada1926() {
    const s = 2.75, oy = 16, g = oy + 172.5 * s, cx = 470;
    let body = koerper(cx, g, s, { stand1926: true }) + boden(300, 640, g);
    body += pfad('a', 'M30 52h54') + text(100, 62, 'fertig 1925');
    body += pfad('l', 'M30 96h54') + text(100, 106, '1926 im Bau');
    body += pfad('d', 'M30 140h54') + text(100, 150, 'Gaudís Plan');
    return svg(900, g + 14, body);
  }

  // Grundriss: lateinisches Kreuz, links die Hauptfassade, rechts die Apsis
  function sagradaGrundriss() {
    const s = 5.6, x0 = 170, ym = 223;
    const X = m => x0 + m * s, Y = m => ym + m * s;
    const umriss = `M${r(X(0))} ${r(Y(-22.5))}H${r(X(35))}V${r(Y(-30))}H${r(X(65))}V${r(Y(-22.5))}H${r(X(67.5))}A${r(22.5 * s)} ${r(22.5 * s)} 0 0 1 ${r(X(67.5))} ${r(Y(22.5))}H${r(X(65))}V${r(Y(30))}H${r(X(35))}V${r(Y(22.5))}H${r(X(0))}Z`;
    let body = pfad('l', umriss);
    // fünf Schiffe: Hauptschiff 15 m, je zwei Seitenschiffe zu 7,5 m
    let t = '';
    for (const y of [-15, -7.5, 7.5, 15]) t += `M${r(X(0))} ${r(Y(y))}H${r(X(35))}`;
    body += pfad('t', t);
    // Türme: Jesus über der Vierung, vier Evangelisten, Maria über der Apsis, je vier Apostel an drei Fassaden
    let stehen = '', fehlen = '';
    for (const [x, y] of [[44, -6], [56, -6], [44, 6], [56, 6]]) stehen += kreis(X(x), Y(y), 2.1 * s);
    stehen += kreis(X(76), Y(0), 3 * s);
    for (const x of [38.5, 46, 54, 61.5]) stehen += kreis(X(x), Y(-26), 1.7 * s) + kreis(X(x), Y(26), 1.7 * s);
    for (const y of [-17, -6, 6, 17]) fehlen += kreis(X(4), Y(y), 1.7 * s);
    body += pfad('l', stehen) + pfad('d', fehlen) + `<path class="af" d="${kreis(X(50), Y(0), 3.2 * s)}"/>`;
    // Beschriftung
    body += text(X(50), Y(-30) - 14, 'Geburtsfassade', '', 'text-anchor="middle"') + text(X(50), Y(30) + 34, 'Passionsfassade', '', 'text-anchor="middle"');
    body += pfad('l', kreis(42, 34, 9)) + text(64, 44, '18 Türme');
    body += pfad('d', kreis(42, 68, 9)) + text(64, 78, '4 fehlen noch');
    body += text(30, Y(22.5) + 44, 'Hauptfassade') + pfad('t', `M118 ${r(Y(22.5) + 20)}L${r(X(0) - 4)} ${r(Y(18))}`);
    body += text(X(90) + 14, ym + 10, 'Apsis');
    body += massH(X(0), X(90), 448, '90 m') + massV(806, Y(-30), Y(30), '60 m');
    return svg(900, 496, body);
  }

  // Ulmer Münster von Westen, vereinfacht: Schiff, Turm, Achteck, Helm
  const ulm = (x0, g, s) => {
    const X = m => x0 + (24 + m) * s, Y = m => g - m * s;
    let l = `M${r(X(-24))} ${g}V${r(Y(22))}L${r(X(-13))} ${r(Y(30))}M${r(X(24))} ${g}V${r(Y(22))}L${r(X(13))} ${r(Y(30))}`;
    l += `M${r(X(-13))} ${g}V${r(Y(70))}H${r(X(13))}V${g}M${r(X(-9))} ${r(Y(70))}V${r(Y(102))}H${r(X(9))}V${r(Y(70))}`;
    l += `M${r(X(-9))} ${r(Y(102))}L${r(X(0))} ${r(Y(161.5))}L${r(X(9))} ${r(Y(102))}`;
    const t = bogen(X(-5), g, 10 * s, 26 * s) + bogen(X(-4), Y(36), 8 * s, 28 * s) + bogen(X(-3), Y(74), 6 * s, 24 * s) + `M${r(X(-13))} ${r(Y(34))}H${r(X(13))}`;
    return pfad('l', l) + pfad('t', t);
  };

  // Höhenvergleich in einem Maßstab: Köln, Ulm, Barcelona
  function sagradaVergleich() {
    const s = 3, g = 586;
    const bauten = [
      { mitte: 130, hoehe: 157, label: '157 m', name: 'Kölner Dom', jahr: '1880', bau: () => formen.koeln.bau(130 - 30.5 * s, g, s) },
      { mitte: 390, hoehe: 161.5, label: '161,5 m', name: 'Ulmer Münster', jahr: '1890', bau: () => ulm(390 - 24 * s, g, s) },
      { mitte: 706, hoehe: 172.5, label: '172,5 m', name: 'Sagrada Família', jahr: '2026', akzent: true, bau: () => koerper(706, g, s, { detail: 0, glorie: false }) },
    ];
    let body = '';
    for (const b of bauten) {
      const akz = b.akzent ? ' akz' : '';
      body += b.akzent ? `<g class="akzent">${b.bau()}</g>` : b.bau();
      body += text(b.mitte, g - b.hoehe * s - 14, b.label, 'gross' + akz, 'text-anchor="middle"');
      body += text(b.akzent ? b.mitte - 21 : b.mitte, g + 44, b.name, akz.trim(), 'text-anchor="middle"') + text(b.akzent ? b.mitte - 21 : b.mitte, g + 78, b.jahr, akz.trim(), 'text-anchor="middle"');
    }
    body += boden(10, 890, g);
    return svg(900, 676, body);
  }

  Object.assign(Zeichnung, { sagradaAnsicht, sagrada1926, sagradaGrundriss, sagradaVergleich });
})();
