// Zeichnungen: Dresdner Frauenkirche. Maße in Metern, s = Pixel pro Meter; Fassade schematisch.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV } = Z;

  // Rundbogenfenster: x = Mitte, yb = Unterkante, w = Breite, h = Höhe
  const fenster = (x, yb, w, h) => `M${r(x - w / 2)} ${r(yb)}V${r(yb - h + w / 2)}A${r(w / 2)} ${r(w / 2)} 0 0 1 ${r(x + w / 2)} ${r(yb - h + w / 2)}V${r(yb)}Z`;

  // Kirche ab Bodenlinie g, Achse cx. detail: 0 = Umriss, 1 = mit Fenstern und Rippen
  function koerper(cx, g, s, detail) {
    const X = m => cx + m * s, Y = m => g - m * s;
    let l = '', t = '', tuerme = '';

    // Unterbau, Kuppelanlauf, Kuppel
    l += `M${r(X(-21))} ${r(Y(0))}V${r(Y(28))}H${r(X(21))}V${r(Y(0))}`;
    for (const v of [-1, 1]) {
      l += `M${r(X(19.5 * v))} ${r(Y(28))}Q${r(X(14 * v))} ${r(Y(30))} ${r(X(13.1 * v))} ${r(Y(40))}Q${r(X(12.6 * v))} ${r(Y(56))} ${r(X(5.2 * v))} ${r(Y(64))}`;
      // Treppentürme an den Ecken mit geschweifter Haube
      const turm = `M${r(X(13 * v))} ${r(Y(28))}V${r(Y(47))}Q${r(X(13.6 * v))} ${r(Y(52))} ${r(X(16.5 * v))} ${r(Y(53.5))}Q${r(X(19.4 * v))} ${r(Y(52))} ${r(X(20 * v))} ${r(Y(47))}V${r(Y(28))}Z`;
      tuerme += `<path class="lf" d="${turm}"/>` + pfad('l', `M${r(X(16.5 * v))} ${r(Y(53.5))}V${r(Y(57.5))}M${r(X(13 * v))} ${r(Y(47))}H${r(X(20 * v))}`);
      if (detail) tuerme += pfad('t', fenster(X(16.5 * v), Y(31), 2.4 * s, 11 * s));
    }
    // Laterne mit Haube und Kreuz
    l += `M${r(X(-5.2))} ${r(Y(64))}H${r(X(5.2))}M${r(X(-4.6))} ${r(Y(64))}V${r(Y(77))}M${r(X(4.6))} ${r(Y(64))}V${r(Y(77))}M${r(X(-5.4))} ${r(Y(77))}H${r(X(5.4))}`;
    l += `M${r(X(-5.2))} ${r(Y(77))}Q${r(X(-4.6))} ${r(Y(82))} ${r(X(-1.2))} ${r(Y(85))}L${r(X(0))} ${r(Y(86.5))}L${r(X(1.2))} ${r(Y(85))}Q${r(X(4.6))} ${r(Y(82))} ${r(X(5.2))} ${r(Y(77))}`;
    l += `M${r(X(0))} ${r(Y(86.5))}V${r(Y(91.2))}M${r(X(-1.2))} ${r(Y(89.6))}H${r(X(1.2))}`;

    if (detail) {
      l += `M${r(X(-21))} ${r(Y(26))}H${r(X(21))}M${r(X(-13.1))} ${r(Y(40))}H${r(X(13.1))}`;
      t += `M${r(X(-21))} ${r(Y(3))}H${r(X(21))}M${r(X(-11))} ${r(Y(3))}V${r(Y(26))}M${r(X(11))} ${r(Y(3))}V${r(Y(26))}`;
      // Portal mit Giebel, hohe Fenster, darunter kleine
      l += fenster(X(0), Y(0), 5 * s, 9 * s) + `M${r(X(-4))} ${r(Y(10))}L${r(X(0))} ${r(Y(12.6))}L${r(X(4))} ${r(Y(10))}`;
      for (const x of [-7.4, 7.4]) l += fenster(X(x), Y(11), 3.2 * s, 12.5 * s) + fenster(X(x), Y(4.5), 2.6 * s, 4.5 * s);
      l += fenster(X(0), Y(14), 3.2 * s, 9.5 * s);
      for (const x of [-16.5, 16.5]) t += fenster(X(x), Y(5), 2.2 * s, 6 * s) + fenster(X(x), Y(13.5), 2.2 * s, 10 * s);
      // Rippen und Gauben der Kuppel, Öffnungen der Laterne
      for (const v of [-1, 1]) t += `M${r(X(6 * v))} ${r(Y(40))}Q${r(X(5.8 * v))} ${r(Y(56))} ${r(X(2.4 * v))} ${r(Y(64))}`;
      t += `M${r(X(0))} ${r(Y(40))}V${r(Y(64))}`;
      for (const [x, h] of [[-9, 46], [9, 46], [-3, 53], [3, 53]]) t += kreis(X(x), Y(h), 0.9 * s);
      for (const x of [-2.8, 0, 2.8]) t += fenster(X(x), Y(66), 1.8 * s, 8 * s);
    }
    return pfad('l', l) + pfad('t', t) + tuerme;
  }

  const halbeBreite = h => (h < 28 ? 21 : h < 57 ? 20 : h < 64 ? 9 : 5);

  // marken: [{h, text, sub}] beschriftet Höhen links; ab: zeigt nur den Teil oberhalb dieser Höhe (Kuppel aus der Nähe)
  function frauenkircheAnsicht({ marken = [], ab = 0 } = {}) {
    const s = 10, oy = 16, g = oy + 91.2 * s, cx = marken.length ? 500 : 226;
    let body = koerper(cx, g, s, 1);
    if (!ab) body += boden(cx - 226, cx + 226, g) + massV(cx + 240, oy, g, '91 m');
    for (const m of marken) {
      const y = g - m.h * s;
      body += pfad('t', `M${cx - 232} ${r(y)}H${r(cx - halbeBreite(m.h) * s - 6)}`);
      body += text(cx - 242, y + (m.sub ? -4 : 12), m.text, 'gross', 'text-anchor="end"');
      if (m.sub) body += text(cx - 242, y + 28, m.sub, '', 'text-anchor="end"');
    }
    return svg(cx + (ab ? 230 : 290), ab ? g - ab * s : g + 30, body, ab ? 'xMidYMax' : 'xMaxYMax');
  }

  // Zustand 1945–1993: Trümmerberg, zwei Mauerreste, gestrichelt der alte Umriss
  function frauenkircheRuine() {
    const g = 500, cx = 450, s = 4.6;
    let body = `<g class="geplant">${koerper(cx, g, s, 0)}</g>`;
    // Trümmerberg
    const berg = `M${cx - 150} ${g}L${cx - 128} ${g - 34}L${cx - 96} ${g - 46}L${cx - 70} ${g - 72}L${cx - 30} ${g - 64}L${cx - 4} ${g - 86}L${cx + 28} ${g - 70}L${cx + 56} ${g - 78}L${cx + 92} ${g - 44}L${cx + 122} ${g - 38}L${cx + 150} ${g}Z`;
    body += `<path class="lf" d="${berg}"/>`;
    let steine = '';
    for (let i = 0; i < 46; i++) {
      const x = cx - 124 + ((i * 53) % 250), y = g - 10 - ((i * 29) % 52);
      if (y < g - 30 - (1 - Math.abs(x - cx) / 150) * 20) continue;
      steine += `M${x} ${y}l12 -5l8 7l-10 6Z`;
    }
    body += pfad('t', steine);
    // stehen gebliebene Mauerreste: Treppenturm links, Chorwand rechts
    body += `<path class="lf" d="M${cx - 96} ${g - 40}V${g - 150}l10 -22l12 10l8 -30l14 44l-6 12V${g - 60}Z"/>` + pfad('t', fenster(cx - 74, g - 70, 12, 52));
    body += `<path class="lf" d="M${cx + 52} ${g - 60}V${g - 132}l14 -10l10 16l16 -34l12 22l-4 20l10 8V${g - 44}Z"/>` + pfad('t', fenster(cx + 84, g - 62, 14, 50));
    body += boden(cx - 260, cx + 260, g);
    body += pfad('d', 'M40 60h54') + text(108, 69, 'die Kirche bis 1945');
    body += pfad('t', `M${cx + 130} ${g - 40}L${cx + 196} ${g - 96}`) + text(cx + 202, g - 104, 'Trümmerberg', 'gross') + text(cx + 202, g - 70, 'bis 1993', '');
    return svg(900, 550, body);
  }

  // Fassade als Mosaik: dunkle Originalsteine zwischen neuem, hellem Sandstein
  function steinmosaik() {
    const x0 = 30, y0 = 30, zeilen = 7, hoch = 58;
    let alt = '', neu = '';
    for (let z = 0; z < zeilen; z++) {
      let x = x0 - (z % 2 ? 70 : 0), i = 0;
      while (x < 870) {
        const breite = [140, 96, 118, 164][(z * 3 + i) % 4];
        const stein = `M${x} ${y0 + z * hoch}h${breite - 5}v${hoch - 5}h${-(breite - 5)}Z`;
        if ((z * 5 + i * 3) % 7 < 2) alt += stein; else neu += stein;
        x += breite;
        i++;
      }
    }
    let body = `<clipPath id="mosaik"><rect x="30" y="30" width="840" height="${zeilen * hoch - 5}"/></clipPath>`;
    body += `<g clip-path="url(#mosaik)">${pfad('t', neu)}<path class="hf" d="${alt}"/></g>`;
    const ly = y0 + zeilen * hoch + 44;
    body += `<rect class="hf" x="30" y="${ly - 26}" width="60" height="32"/>` + text(104, ly, 'Stein von 1743, dunkel durch Patina');
    body += `<rect class="t" x="30" y="${ly + 24}" width="60" height="32"/>` + text(104, ly + 50, 'neuer Sandstein');
    return svg(900, ly + 76, body);
  }

  Object.assign(Zeichnung, { frauenkircheAnsicht, frauenkircheRuine, steinmosaik });
})();
