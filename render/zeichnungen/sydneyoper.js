// Zeichnungen: Sydney Opera House. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Gebäude 184 m lang, Dach 67 m hoch; Schalen aus der Oberfläche einer einzigen Kugel geschnitten
// (Spherical Solution, Ende 1961); über eine Million Fliesen aus Schweden auf den Schalen.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Höhe des Sockels, Zahl, Lage und Form der Schalen,
// kleine Schalen des Restaurants, Rippen, Glaswände; die Kugel ist eine Prinzipskizze ohne Maßstab.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV } = Z;

  const LANG = 184, HOCH = 67, SOCKEL = 13;
  // Schalen der Seitenansicht: Fuß vorn (a), Fuß hinten (b), Spitze (x, h); richtung -1 = Spitze nach links
  const SCHALEN = [
    { a: 2, b: 40, x: 42, h: 50, dir: 1 },
    { a: -40, b: 12, x: -38, h: HOCH, dir: -1, gross: true },
    { a: -58, b: -8, x: -61, h: 50, dir: -1 },
    { a: -76, b: -30, x: -82, h: 35, dir: -1 },
    { a: 74, b: 88, x: 90, h: 27, dir: 1 },
    { a: 56, b: 82, x: 54, h: 31, dir: -1 },
  ];

  // Umriss einer Schale (Segel): Vorderkante steigt steil zur Spitze, Rücken fällt gewölbt zum hinteren Fuß
  function segel(X, Y, { a, b, x, h }) {
    const vorne = `M${r(X(a))} ${r(Y(SOCKEL))}Q${r(X(a + (x - a) * 0.15))} ${r(Y(SOCKEL + (h - SOCKEL) * 0.75))} ${r(X(x))} ${r(Y(h))}`;
    const ruecken = `C${r(X(x + (b - x) * 0.55))} ${r(Y(h + 1))} ${r(X(b))} ${r(Y(SOCKEL + (h - SOCKEL) * 0.55))} ${r(X(b))} ${r(Y(SOCKEL))}`;
    const mitte = (a + b) / 2;
    const rippe = `M${r(X(mitte))} ${r(Y(SOCKEL))}Q${r(X(mitte + (x - mitte) * 0.35))} ${r(Y(SOCKEL + (h - SOCKEL) * 0.8))} ${r(X(x))} ${r(Y(h))}`;
    return { umriss: vorne + ruecken, rippe };
  }

  // Seitenansicht. akzent: höchste Schale gelb; mass: 67 m an der höchsten Schale
  function operAnsicht({ akzent = true, mass = false, reel = false } = {}) {
    const zeigen = mass && !reel;
    const s = zeigen ? 4.1 : 4.6;
    const oben = 22, unten = 26;
    const xm = zeigen ? 420 : 450;
    const g = Math.round(oben + HOCH * s);
    const X = m => xm + m * s, Y = h => g - h * s;
    const L = LANG / 2;
    let body = '';
    // Sockel, zur Landseite (rechts) abgeschrägt
    body += `<path class="lf" d="M${r(X(-L))} ${r(Y(0))}V${r(Y(SOCKEL))}H${r(X(L - 14))}L${r(X(L))} ${r(Y(4))}V${r(Y(0))}Z"/>`;
    body += pfad('t', `M${r(X(-L + 2))} ${r(Y(6))}H${r(X(L - 20))}`);
    // Schalen von hinten nach vorn
    for (const sch of SCHALEN) {
      const { umriss, rippe } = segel(X, Y, sch);
      const teil = `<path class="lf" d="${umriss}Z"/>` + pfad('t', rippe) + pfad('l', umriss);
      body += sch.gross && akzent ? `<g class="akzent">${teil}</g>` : teil;
    }
    body += boden(20, 880, g);
    // Wasser vor der Spitze der Halbinsel (links)
    if (X(-L) > 70) {
      let w = '';
      for (let x = 30; x < X(-L) - 30; x += 34) w += `M${r(x)} ${r(g - 12)}q8 -6 17 0`;
      body += pfad('t', w);
    }
    if (zeigen) {
      body += massV(X(L) + 30, Y(HOCH), g, '67 m', 1, 40);
    }
    return svg(900, g + unten, body);
  }

  // Prinzip der Kugel: links die Kugel mit einem herausgeschnittenen Dreieck, rechts die Schale daraus
  function operKugel({ reel = false } = {}) {
    const zeigen = !reel;
    const cx = 230, cy = 250, R = 190;
    let body = '';
    // Kugel: Umriss, Äquator, zwei Meridiane
    body += `<path class="lf" d="${kreis(cx, cy, R)}"/>`;
    body += pfad('z', `M${cx - R} ${cy}A${R} ${R * 0.3} 0 0 0 ${cx + R} ${cy}` +
      `M${cx} ${cy - R}A${R * 0.45} ${R} 0 0 0 ${cx} ${cy + R}` +
      `M${cx} ${cy - R}A${R * 0.45} ${R} 0 0 1 ${cx} ${cy + R}`);
    // Dreieck auf der Kugel: Spitze oben, zwei Meridiane, Basis auf einem Breitenkreis
    const tri = `M${cx} ${cy - R}A${R * 0.45} ${R} 0 0 1 ${r(cx + R * 0.43)} ${r(cy + 52)}` +
      `A${R} ${R * 0.3} 0 0 1 ${r(cx - R * 0.43)} ${r(cy + 52)}A${R * 0.45} ${R} 0 0 1 ${cx} ${cy - R}Z`;
    body += `<g class="akzent"><path class="lf" d="${tri}"/></g>`;
    body += pfad('l', kreis(cx, cy, R));
    // Pfeil zur Schale
    body += pfad('d', `M${cx + R + 30} ${cy}H${cx + R + 140}`) + pfad('l', `M${cx + R + 124} ${cy - 12}l16 12l-16 12`);
    // Schale: aufgerichtetes Segel, gelb
    const fx = 620, fy = cy + 170;
    const schale = `M${fx} ${fy}Q${fx + 4} ${fy - 210} ${fx - 10} ${fy - 330}C${fx + 120} ${fy - 330} ${fx + 220} ${fy - 190} ${fx + 220} ${fy}Z`;
    body += `<g class="akzent"><path class="lf" d="${schale}"/>` +
      pfad('t', `M${fx + 110} ${fy}Q${fx + 40} ${fy - 260} ${fx - 10} ${fy - 330}`) + '</g>';
    body += boden(560, 880, fy);
    if (zeigen) {
      body += text(cx, cy + R + 56, 'eine Kugel', 'gross', 'text-anchor="middle"');
      body += text(fx + 110, fy + 56, 'jede Schale', 'gross akz', 'text-anchor="middle"');
    }
    return svg(900, zeigen ? cy + R + 76 : fy + 24, body);
  }

  Object.assign(Zeichnung, { operAnsicht, operKugel });
})();
