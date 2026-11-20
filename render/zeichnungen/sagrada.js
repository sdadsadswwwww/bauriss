// Zeichnungen: Sagrada Família, Barcelona. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt sind die Höhen der mittleren Türme (Jesus 172,5 m, Maria 138 m, Evangelisten 135 m), das Kreuz (17 m),
// die Maße des Grundrisses (90 m lang, 45 m breit, Querhaus 60 × 30 m, Schiffe 15 und 7,5 m) und die Höhen
// von Ulmer Münster (161,5 m) und Kölner Dom (157 m). Alles andere ist nach Fotos vereinfacht und trägt keine Maßzahl:
// Lamellen und Durchbrüche der Turmhelme, Pinakel, Portale, Fenster, Stützenraster und Achsbezeichnungen sind schematisch.
// Seit 20.11.2026 im CAD-Stil (Achsen rot, Koten cyan nur für belegte Höhen).
(function () {
  const { r, svg, pfad, text, kreis, bogen, boden, massV, massH, formen } = Z;
  const G = Gotik;

  // Turm als schlanke Spindel: Achse x, Fuß yb, Spitze yt, Fußbreite w (alles in Bildpunkten)
  const halb = (w, t) => (w / 2) * Math.pow(1 - t, 0.55);
  function spindel(x, yb, yt, w) {
    const n = 18, links = [], rechts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, hw = halb(w, t), y = yb + (yt - yb) * t;
      links.push(`${r(x - hw)} ${r(y)}`);
      rechts.unshift(`${r(x + hw)} ${r(y)}`);
    }
    return 'M' + links.concat(rechts).join('L') + 'Z';
  }
  // Feinheiten einer Spindel: Rippen, schräge Lamellen in Bändern, Durchbrüche oben (Bildpunkte, s = Maßstab)
  function spindelDetail(x, yb, yt, w, s, { von = 0.06, bis = 0.8 } = {}) {
    const H = yb - yt;
    let d = '';
    // Rippen
    for (const k of [-0.5, 0.5]) {
      const p = [];
      for (let t = 0.03; t <= 0.9; t += 0.06) p.push(`${r(x + k * halb(w, t))} ${r(yb - H * t)}`);
      d += 'M' + p.join('L');
    }
    // Lamellenbänder
    const schritt = Math.max(2.2 * s, 6) / H;
    let i = 0;
    for (let t = von; t < bis; t += schritt, i++) {
      const y = yb - H * t, hw = halb(w, t) * 0.92, n = Math.max(2, Math.floor((2 * hw) / Math.max(1.1 * s, 4)));
      if (i % 4 === 3) { d += `M${r(x - hw)} ${r(y)}H${r(x + hw)}`; continue; }
      for (let j = 0; j < n; j++) {
        const xa = x - hw + ((j + 0.25) * 2 * hw) / n;
        d += `M${r(xa)} ${r(y)}l${r(Math.max(0.5 * s, 1.5))} ${r(-Math.max(1.1 * s, 3))}`;
      }
    }
    // Durchbrüche in der Spitze
    for (let t = bis + 0.02; t < 0.94; t += schritt * 1.4) {
      const y = yb - H * t, hw = halb(w, t);
      if (hw > 2) d += kreis(x, y, Math.min(hw * 0.4, 0.9 * s));
    }
    return d;
  }
  const stern = (x, y, k) => {
    let d = '';
    for (let i = 0; i < 24; i++) {
      const w = (i * Math.PI) / 12, q = i % 2 ? k * 0.5 : k;
      d += (i ? 'L' : 'M') + `${r(x + q * Math.sin(w))} ${r(y - q * Math.cos(w))}`;
    }
    return d + 'Z';
  };
  // Parabelbogen (Kettenlinie angenähert): Mitte xc, Fuß y, Breite w, Scheitelhöhe h (Meter)
  const P = (M, x, y) => `${r(M.X(x))} ${r(M.Y(y))}`;
  const para = (M, xc, y, w, h) => `M${P(M, xc - w / 2, y)}Q${P(M, xc, y + 2 * h)} ${P(M, xc + w / 2, y)}`;
  const ringM = (M, x, y, k) => kreis(M.X(x), M.Y(y), k * M.s);

  // Ansicht von Nordosten (Geburtsfassade): links die Hauptfassade, rechts die Apsis.
  // Achse cx liegt in der Vierung, g ist die Bodenlinie.
  // detail: Fenster, Portale, Lamellen; glorie: zeigt die vier fehlenden Türme der Hauptfassade gestrichelt;
  // stand1926: der Plan gestrichelt, das 1926 Gebaute durchgezogen, der fertige Turm gelb
  function koerper(cx, g, s, { detail = 1, glorie = true, kreuzGelb = false, stand1926 = false } = {}) {
    const X = m => cx + m * s, Y = m => g - m * s, M = { X, Y, s };
    const turm = (x, von, bis, w) => `<path class="lf" d="${spindel(X(x), Y(von), Y(bis), w * s)}"/>`;
    const turmZ = (x, von, bis, w, o) => (detail ? spindelDetail(X(x), Y(von), Y(bis), w * s, s, o) : '');
    const kreuz = `M${r(X(-1.6))} ${r(Y(155.5))}V${r(Y(163))}H${r(X(-6.5))}V${r(Y(166.2))}H${r(X(-1.6))}V${r(Y(172.5))}H${r(X(1.6))}V${r(Y(166.2))}H${r(X(6.5))}V${r(Y(163))}H${r(X(1.6))}V${r(Y(155.5))}Z`;
    const schiff = `M${r(X(-52))} ${r(Y(0))}V${r(Y(45))}H${r(X(15))}V${r(Y(40))}H${r(X(33))}Q${r(X(38))} ${r(Y(40))} ${r(X(38))} ${r(Y(34))}V${r(Y(0))}Z`;
    const apsis = `M${r(X(16))} ${r(Y(0))}V${r(Y(40))}H${r(X(33))}Q${r(X(38))} ${r(Y(40))} ${r(X(38))} ${r(Y(34))}V${r(Y(0))}Z`;
    const vorbau = `M${r(X(-16))} ${r(Y(0))}V${r(Y(24))}L${r(X(-8.5))} ${r(Y(36))}L${r(X(-4.5))} ${r(Y(28))}L${r(X(0))} ${r(Y(48))}L${r(X(4.5))} ${r(Y(28))}L${r(X(8.5))} ${r(Y(36))}L${r(X(16))} ${r(Y(24))}V${r(Y(0))}Z`;
    const apostel = [[-12, 98.5], [-4.5, 107], [4.5, 107], [12, 98.5]];

    // Pinakel eines Apostelturms: Bänder, Kugel mit vier Nebenkugeln, Spitze
    const pinakel = (x, h) => {
      let d = '';
      for (const hy of [h - 13, h - 10]) {
        const t = hy / h, hw = halb(7, t);
        d += `M${r(X(x - hw))} ${r(Y(hy))}H${r(X(x + hw))}`;
      }
      d += ringM(M, x, h - 5.5, 0.9);
      if (s > 2.5) d += ringM(M, x - 1.5, h - 6.2, 0.45) + ringM(M, x + 1.5, h - 6.2, 0.45) + ringM(M, x, h - 3.6, 0.45);
      return d;
    };

    // hinten: die sechs mittleren Türme
    let hinten = turm(-11.5, 45, 135, 13) + turm(11.5, 45, 135, 13) + turm(27, 40, 134.5, 18) + turm(0, 45, 157, 22);
    let hz = turmZ(-11.5, 45, 135, 13) + turmZ(11.5, 45, 135, 13) + turmZ(27, 40, 134.5, 18) + turmZ(0, 45, 157, 22, { bis: 0.78 });
    if (detail) {
      // Evangelistentürme: Abschluss mit Kugel und Flügeln; Jesusturm: Laterne mit Okuli
      for (const x of [-11.5, 11.5]) hz += ringM(M, x, 131.5, 1.3) + `M${P(M, x - 2.6, 128.5)}Q${P(M, x, 133)} ${P(M, x + 2.6, 128.5)}`;
      for (const y of [146, 150]) hz += `M${P(M, -halb(22, (y - 45) / 112), y)}H${r(X(halb(22, (y - 45) / 112)))}`;
      hz += ringM(M, 0, 153.2, 0.8);
    }
    hinten += `<path class="${kreuzGelb ? 'af' : 'lf'}" d="${kreuz}"/>`;
    hinten += `<path class="lf" d="${stern(X(27), Y(135.6), 2.4 * s)}"/>`;
    hinten += pfad('z', hz);
    if (detail && s > 3.5) hinten += pfad('z', ringM(M, 27, 135.6, 0.7));
    const hauptfassade = turm(-48.5, 0, 112, 7) + turm(-42, 0, 118, 7);

    // Fenster, Pinakel und Gliederung von Schiff und Apsis
    const schiffDetail = () => {
      let t = '', z = '';
      for (const x of [-47, -40.5, -34, -27.5]) {
        t += para(M, x, 25, 4, 15) + para(M, x, 4, 4, 13);
        z += para(M, x, 25, 3, 13) + ringM(M, x, 37.2, 1.1) + `M${P(M, x, 25)}V${r(Y(33))}`;
        z += para(M, x, 4, 3, 11) + ringM(M, x, 14.3, 0.9) + `M${P(M, x, 4)}V${r(Y(11))}`;
      }
      for (const x of [21, 27.5]) {
        t += para(M, x, 22, 3.8, 14) + para(M, x, 4, 3.8, 12);
        z += ringM(M, x, 33, 1) + ringM(M, x, 13.6, 0.85);
      }
      t += `M${P(M, -52, 22.5)}H${r(X(-16))}M${P(M, 16, 20)}H${r(X(38))}M${P(M, -52, 1.6)}H${r(X(-16))}M${P(M, 16, 1.6)}H${r(X(38))}`;
      z += `M${P(M, -52, 23.3)}H${r(X(-16))}M${P(M, 16, 20.8)}H${r(X(38))}`;
      // kleine Pinakel auf der Traufe
      let pin = '';
      for (let x = -50; x < 14; x += 6.2) {
        if (x > -18 && x < 0) continue;
        pin += spindel(X(x), Y(45), Y(50.5), 1.8 * s);
        z += ringM(M, x, 51.2, 0.5);
      }
      for (const x of [19, 25, 31]) { pin += spindel(X(x), Y(40), Y(45), 1.6 * s); z += ringM(M, x, 45.6, 0.45); }
      return pfad('l', pin) + pfad('t', t) + pfad('z', z);
    };
    // Geburtsfassade: drei Parabelportale mit Archivolten, Giebel mit Krabben, Zypresse in der Mitte
    const fassadeDetail = () => {
      let t = '', z = '';
      t += para(M, 0, 0, 7, 21) + para(M, -9.5, 0, 4.6, 14) + para(M, 9.5, 0, 4.6, 14);
      for (const [xc, w, h] of [[0, 7, 21], [-9.5, 4.6, 14], [9.5, 4.6, 14]]) {
        for (const k of [0.82, 0.64]) z += para(M, xc, 0, w * k, h * (0.9 + 0.1 * k) * k + h * 0.08);
        z += `M${P(M, xc - w * 0.3, h * 0.42)}H${r(X(xc + w * 0.3))}M${P(M, xc - w * 0.24, h * 0.6)}H${r(X(xc + w * 0.24))}`;
        z += `M${P(M, xc, 0)}V${r(Y(h * 0.42))}`;
      }
      // Giebel innen und Krabben
      t += `M${P(M, -14.6, 24)}L${P(M, -8.5, 33.8)}L${P(M, -5.5, 28)}M${P(M, 14.6, 24)}L${P(M, 8.5, 33.8)}L${P(M, 5.5, 28)}`;
      t += `M${P(M, -3.4, 29)}L${P(M, 0, 45)}L${P(M, 3.4, 29)}`;
      if (s > 2.5) {
        z += G.krabben(M, -16, 24, -8.5, 36, 1.5, 0.7, 1) + G.krabben(M, 16, 24, 8.5, 36, 1.5, 0.7, -1);
        z += G.krabben(M, -4.5, 28, 0, 48, 1.6, 0.7, 1) + G.krabben(M, 4.5, 28, 0, 48, 1.6, 0.7, -1);
      }
      // Zypresse: gestaffelte Blattbögen
      for (let y = 31; y < 45; y += 1.6) {
        const b = (45.5 - y) * 0.16;
        z += `M${P(M, -b, y)}Q${P(M, 0, y + 1.4)} ${P(M, b, y)}`;
      }
      z += ringM(M, 0, 46.3, 0.6);
      t += `M${P(M, -16, 1.6)}H${r(X(16))}M${P(M, -16, 23)}H${r(X(16))}`;
      // Säulen zwischen den Portalen
      for (const x of [-5.2, 5.2, -13.2, 13.2]) z += `M${P(M, x - 0.4, 0)}V${r(Y(22))}M${P(M, x + 0.4, 0)}V${r(Y(22))}`;
      return pfad('t', t) + pfad('z', z);
    };

    if (stand1926) {
      let plan = hinten + hauptfassade + pfad('l', schiff);
      for (const [x, h] of apostel.slice(1)) plan += turm(x, 0, h, 7);
      let body = `<g class="geplant">${plan}</g>`;
      body += `<path class="lf" d="${apsis}"/>`;
      body += `<g class="akzent">${turm(-12, 0, 98.5, 7)}${pfad('z', spindelDetail(X(-12), Y(0), Y(98.5), 7 * s, s, { von: 0.5 }) + pinakel(-12, 98.5))}</g>`;
      body += `<path class="lf" d="${vorbau}"/>` + fassadeDetail();
      // Apsis 1926: Fenster und Traufpinakel
      let t = '', z = '';
      for (const x of [21, 27.5]) { t += para(M, x, 22, 3.8, 14) + para(M, x, 4, 3.8, 12); z += ringM(M, x, 33, 1) + ringM(M, x, 13.6, 0.85); }
      t += `M${P(M, 16, 20)}H${r(X(38))}M${P(M, 16, 1.6)}H${r(X(38))}`;
      body += pfad('t', t) + pfad('z', z);
      return body;
    }

    let body = hinten;
    if (glorie) body += `<g class="geplant">${hauptfassade}</g>`;
    body += `<path class="lf" d="${schiff}"/>`;
    for (const [x, h] of apostel) body += turm(x, 0, h, 7) + pfad('z', turmZ(x, 0, h, 7, { von: 0.5 }) + (detail ? pinakel(x, h) : '')) + (detail ? '' : pfad('t', kreis(X(x), Y(h - 5.5), 0.9 * s)));
    body += `<path class="lf" d="${vorbau}"/>`;
    if (detail) body += schiffDetail() + fassadeDetail();
    return body;
  }

  // Titelblatt (hoch), mit namen: breite Ansicht mit beschrifteten Türmen
  function sagradaAnsicht({ namen = false } = {}) {
    if (!namen) {
      const s = 4.7, oy = 16, g = oy + 172.5 * s, cx = 256;
      let body = koerper(cx, g, s, { kreuzGelb: true }) + boden(4, 446, g) + massV(460, oy, g, '172,5 m');
      return svg(510, g + 30, body, 'xMaxYMax');
    }
    const s = 3, oy = 22, g = oy + 172.5 * s, cx = 500;
    const X = m => cx + m * s, Y = m => g - m * s;
    let body = pfad('ax', `M${cx} ${oy}V${r(g + 14)}`);
    body += koerper(cx, g, s, { kreuzGelb: true }) + boden(300, 660, g);
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

  // Achskreis aus kurzen Stücken (bleibt mit der Strichpunkt-Klasse durchgezogen)
  function achsKreis(x, y, name) {
    let k = '';
    for (let i = 0; i < 12; i++) {
      const a1 = (i * Math.PI) / 6, a2 = ((i + 1) * Math.PI) / 6;
      k += `M${r(x + 13 * Math.cos(a1))} ${r(y + 13 * Math.sin(a1))}L${r(x + 13 * Math.cos(a2))} ${r(y + 13 * Math.sin(a2))}`;
    }
    return pfad('ax', k) + text(x, y + 8, name, 'achse', 'text-anchor="middle"');
  }

  // Grundriss: lateinisches Kreuz, links die Hauptfassade, rechts die Apsis
  function sagradaGrundriss() {
    const s = 5.6, x0 = 170, ym = 223;
    const X = m => x0 + m * s, Y = m => ym + m * s;
    const Q = (x, y) => `${r(X(x))} ${r(Y(y))}`;
    const form = e => `M${Q(e, -22.5 + e)}H${r(X(35 + e))}V${r(Y(-30 + e))}H${r(X(65 - e))}V${r(Y(-22.5 + e))}H${r(X(67.5))}A${r((22.5 - e) * s)} ${r((22.5 - e) * s)} 0 0 1 ${Q(67.5, 22.5 - e)}H${r(X(65 - e))}V${r(Y(30 - e))}H${r(X(35 + e))}V${r(Y(22.5 - e))}H${r(X(e))}Z`;
    let body = '';

    // Achsen: Längsachse und Querhausachse, Reihen A–F, Joche 1–5
    let ax = `M${r(X(-3))} ${ym}H${r(X(93))}M${r(X(50))} ${r(Y(-33))}V${r(Y(33))}`;
    const reihen = [-22.5, -15, -7.5, 7.5, 15, 22.5];
    reihen.forEach((y, i) => { ax += `M159 ${r(Y(y))}H${r(X(0) - 2)}`; body += achsKreis(146, Y(y), 'ABCDEF'[i]); });
    [0, 7.5, 15, 22.5, 30].forEach((x, i) => { ax += `M${r(X(x))} ${r(Y(22.5) + 2)}V${r(Y(22.5) + 23)}`; body += achsKreis(X(x), Y(22.5) + 36, String(i + 1)); });
    body = pfad('ax', ax) + body;

    // Mauern: Außen- und Innenkante, dazwischen Schraffur
    body += `<path class="hs" fill-rule="evenodd" d="${form(0)}${form(1.2)}"/>` + pfad('l', form(0)) + pfad('t', form(1.2));

    // fünf Schiffe: Hauptschiff 15 m, je zwei Seitenschiffe zu 7,5 m; Querhaus mit drei Schiffen; Chorumgang
    let t = '', z = '', st = '';
    for (const y of [-15, -7.5, 7.5, 15]) t += `M${Q(1.2, y)}H${r(X(35))}`;
    for (const x of [42.5, 57.5]) t += `M${Q(x, -28.8)}V${r(Y(-7.5))}M${Q(x, 7.5)}V${r(Y(28.8))}`;
    t += `M${Q(35, -7.5)}H${r(X(65))}M${Q(35, 7.5)}H${r(X(65))}`;
    t += `M${Q(67.5, -15)}A${r(15 * s)} ${r(15 * s)} 0 0 1 ${Q(67.5, 15)}`;
    // Baumstützen im Raster: Stütze mit vier Ästen
    const stuetze = (x, y) => {
      st += kreis(X(x), Y(y), 0.8 * s);
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) z += `M${Q(x + dx * 0.6, y + dy * 0.6)}L${Q(x + dx * 2, y + dy * 2)}`;
    };
    for (const x of [7.5, 15, 22.5, 30]) for (const y of [-15, -7.5, 7.5, 15]) stuetze(x, y);
    for (const x of [42.5, 57.5]) for (const y of [-22.5, -15, 15, 22.5]) stuetze(x, y);
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 6;
      st += kreis(X(67.5 + 15 * Math.cos(a)), Y(15 * Math.sin(a)), 0.7 * s);
    }
    // Gewölbefelder im Hauptschiff (Diagonalen)
    for (let x = 7.5; x < 30; x += 7.5) z += `M${Q(x + 1.2, -7.5)}L${Q(x + 7.5, 7.5)}M${Q(x + 1.2, 7.5)}L${Q(x + 7.5, -7.5)}`;
    body += pfad('t', t) + pfad('z', z) + pfad('l', st);

    // Türme: Jesus über der Vierung, vier Evangelisten, Maria über der Apsis, je vier Apostel an drei Fassaden
    let stehen = '', fehlen = '', innen = '';
    for (const [x, y] of [[44, -6], [56, -6], [44, 6], [56, 6]]) { stehen += kreis(X(x), Y(y), 2.1 * s); innen += kreis(X(x), Y(y), 1.2 * s); }
    stehen += kreis(X(76), Y(0), 3 * s); innen += kreis(X(76), Y(0), 1.8 * s);
    for (const x of [38.5, 46, 54, 61.5]) for (const y of [-26, 26]) { stehen += kreis(X(x), Y(y), 1.7 * s); innen += kreis(X(x), Y(y), 0.9 * s); }
    for (const y of [-17, -6, 6, 17]) fehlen += kreis(X(4), Y(y), 1.7 * s);
    body += `<path class="lf" d="${stehen}"/>` + pfad('z', innen) + pfad('d', fehlen);
    body += `<path class="af" d="${kreis(X(50), Y(0), 3.2 * s)}"/>`;

    // Beschriftung
    body += text(X(50), Y(-30) - 14, 'Geburtsfassade', 'hell', 'text-anchor="middle"') + text(X(50), Y(30) + 34, 'Passionsfassade', '', 'text-anchor="middle"');
    body += pfad('l', kreis(42, 34, 9)) + text(64, 44, '18 Türme');
    body += pfad('d', kreis(42, 68, 9)) + text(64, 78, '4 fehlen noch');
    body += text(112, ym, 'Hauptfassade', '', `text-anchor="middle" transform="rotate(-90 112 ${ym})"`);
    body += text(X(90) + 14, ym - 14, 'Apsis');
    body += massH(X(0), X(90), 448, '90 m') + massV(806, Y(-30), Y(30), '60 m');
    return svg(900, 496, body);
  }

  // Ulmer Münster von Westen, vereinfacht: Schiff, Turm mit Portal, Maßwerkfenster, Achteck, durchbrochener Helm
  const ulm = (x0, g, s) => {
    const M = { X: m => x0 + (24 + m) * s, Y: m => g - m * s, s };
    const X = M.X, Y = M.Y;
    let l = `M${r(X(-24))} ${g}V${r(Y(22))}L${r(X(-13))} ${r(Y(30))}M${r(X(24))} ${g}V${r(Y(22))}L${r(X(13))} ${r(Y(30))}`;
    l += `M${r(X(-13))} ${g}V${r(Y(70))}H${r(X(13))}V${g}`;
    const o = G.leer();
    G.plus(o, G.portal(M, -5, 0, 10, 20, 4));
    G.plus(o, G.fenster(M, -4, 34, 8, 28, 4));
    for (const xx of [-13, 10.6]) G.plus(o, G.strebepfeiler(M, xx, 0, 2.4, 68, [24, 48], { fialen: false }));
    G.plus(o, G.galerie(M, -13.5, 68.6, 27, 1.4));
    G.plus(o, G.oktogon(M, 0, 70, 18, 30));
    G.plus(o, G.helm(M, 0, 101.3, 18, 51.2, 9));
    let t = `M${r(X(-13))} ${r(Y(30))}H${r(X(13))}`;
    for (const xx of [-19, -16]) t += bogen(X(xx) - 4, Y(4), 8, 13 * s * 0.9);
    for (const xx of [16, 19]) t += bogen(X(xx) - 4, Y(4), 8, 13 * s * 0.9);
    return pfad('l', l + o.l) + pfad('t', t + o.t) + pfad('z', o.f);
  };

  // Kölner Dom, Westfassade vereinfacht (61 m breit, 157 m hoch): Strebepfeiler, Portale, Fenster, Achtecke, Helme
  const koeln = (x0, g, s) => {
    const M = { X: m => x0 + m * s, Y: m => g - m * s, s };
    const o = G.leer();
    let l = '';
    for (const xt of [0, 38]) {
      l += G.linie(M, [xt, 0], [xt, 72], [xt + 23, 72], [xt + 23, 0]);
      for (const xp of [xt, xt + 20.4]) G.plus(o, G.strebepfeiler(M, xp, 0, 2.6, 72, [24, 47], { fialen: false }));
      G.plus(o, G.portal(M, xt + 6.5, 0, 10, 18, 3, { wimperg: false }));
      G.plus(o, G.fenster(M, xt + 6, 26, 11, 18, 2));
      G.plus(o, G.fenster(M, xt + 6.5, 50, 10, 19, 2, { wimperg: true }));
      G.plus(o, G.oktogon(M, xt + 11.5, 72, 16, 25));
      G.plus(o, G.helm(M, xt + 11.5, 97, 15, 51, 9));
    }
    l += G.linie(M, [23, 0], [23, 45], [38, 45], [38, 0]);
    G.plus(o, G.portal(M, 25, 0, 11, 22, 4));
    G.plus(o, G.fenster(M, 25.5, 24, 10, 19, 4, { sprossen: false }));
    G.plus(o, G.wimperg(M, 23, 45, 15, 14));
    return pfad('l', l + o.l) + pfad('t', o.t) + pfad('z', o.f);
  };

  // Höhenvergleich in einem Maßstab: Köln, Ulm, Barcelona
  function sagradaVergleich() {
    const s = 3, g = 586;
    const bauten = [
      { mitte: 130, hoehe: 157, label: '157 m', name: 'Kölner Dom', jahr: '1880', bau: () => koeln(130 - 30.5 * s, g, s) },
      { mitte: 390, hoehe: 161.5, label: '161,5 m', name: 'Ulmer Münster', jahr: '1890', bau: () => ulm(390 - 24 * s, g, s) },
      { mitte: 706, hoehe: 172.5, label: '172,5 m', name: 'Sagrada Família', jahr: '2026', akzent: true, bau: () => koerper(706, g, s, { detail: 1, glorie: false }) },
    ];
    let body = '';
    // gemeinsame Höhenlinien der drei Spitzen
    for (const b of bauten) body += pfad('hl', `M${b.mitte + 10} ${r(g - b.hoehe * s)}H880`);
    for (const b of bauten) {
      const akz = b.akzent ? ' akz' : '';
      body += b.akzent ? `<g class="akzent">${b.bau()}</g>` : b.bau();
      body += text(b.mitte, g - b.hoehe * s - 14, b.label, 'gross hell' + akz, 'text-anchor="middle"');
      body += text(b.akzent ? b.mitte - 21 : b.mitte, g + 44, b.name, akz.trim(), 'text-anchor="middle"') + text(b.akzent ? b.mitte - 21 : b.mitte, g + 78, b.jahr, akz.trim(), 'text-anchor="middle"');
    }
    body += boden(10, 890, g);
    return svg(900, 676, body);
  }

  Object.assign(Zeichnung, { sagradaAnsicht, sagrada1926, sagradaGrundriss, sagradaVergleich });
})();
