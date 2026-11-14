// Zeichnungen: Schloss Neuschwanstein. Maße in Metern, s = Pixel pro Meter; schematisch.
// Recherchiert sind: Länge rund 150 m, nördlicher Treppenturm 65 m, Viereckturm 45 m, geplanter Bergfried 90 m,
// Thronsaal 20 m lang und 13 m hoch im dritten und vierten Obergeschoss, Palas mit fünf Geschossen.
// Alle übrigen Höhen und Breiten sind vereinfacht angenommen und tragen deshalb keine Maßzahl.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV, massH } = Z;

  // Rundbogenfenster: x = Mitte, yb = Unterkante, w = Breite, h = Höhe (alles in Bildpunkten)
  const fenster = (x, yb, w, h) => `M${r(x - w / 2)} ${r(yb)}V${r(yb - h + w / 2)}A${r(w / 2)} ${r(w / 2)} 0 0 1 ${r(x + w / 2)} ${r(yb - h + w / 2)}V${r(yb)}Z`;

  // Ansicht von Süden: Palas im Westen (links), Torbau im Osten (rechts). x läuft von 0 bis 150 m.
  // detail: 0 = Umriss, 1 = mit Fenstern; bergfried: der geplante Turm im oberen Hof, gestrichelt
  function koerper(X, Y, s, detail, bergfried) {
    const P = (x, y) => `${r(X(x))} ${r(Y(y))}`;
    let hinten = '', vorn = '', t = '';

    // nördlicher Treppenturm, 65 m: steht hinter dem Palas, sichtbar ist er erst über dem First
    hinten += pfad('l', `M${P(35, 40)}V${r(Y(53))}M${P(41, 40)}V${r(Y(53))}M${P(34.2, 53)}H${r(X(41.8))}V${r(Y(55.5))}H${r(X(34.2))}Z` +
      `M${P(36, 55.5)}V${r(Y(58))}M${P(40, 55.5)}V${r(Y(58))}M${P(35.4, 58)}H${r(X(40.6))}L${P(38, 65)}Z`);
    if (detail) t += fenster(X(38), Y(44), 1.2 * s, 3.2 * s) + fenster(X(38), Y(49), 1.2 * s, 3.2 * s);

    // geplanter Bergfried, 90 m, im oberen Hof hinter der Kemenate
    if (bergfried) {
      hinten += pfad('d', `M${P(61, 24)}V${r(Y(72))}M${P(73, 24)}V${r(Y(72))}M${P(60, 72)}H${r(X(74))}V${r(Y(76))}H${r(X(60))}Z` +
        `M${P(61.5, 76)}L${P(67, 90)}L${P(72.5, 76)}`);
    }

    // Palas: fünf Geschosse, Satteldach, Ziertürmchen an den Giebeln
    vorn += `<path class="lf" d="M${P(0, 0)}V${r(Y(30))}L${P(1.5, 40)}H${r(X(50.5))}L${P(52, 30)}V${r(Y(0))}Z"/>`;
    vorn += pfad('l', `M${P(0, 30)}H${r(X(52))}`);
    for (const x of [0, 52]) {
      vorn += `<path class="lf" d="M${P(x - 1.4, 27)}V${r(Y(35))}L${P(x, 40.5)}L${P(x + 1.4, 35)}V${r(Y(27))}Z"/>`;
    }
    if (detail) {
      for (const [h, hoch] of [[2.5, 3.2], [8, 3.2], [13.5, 3.2], [19, 4], [24.5, 4]]) {
        for (let x = 4.5; x < 48; x += 5) {
          if (x > 24 && x < 35) continue; // hier steht der südliche Treppenturm davor
          t += fenster(X(x), Y(h), 1.5 * s, hoch * s);
        }
      }
      for (const x of [10, 21, 45]) t += `M${P(x, 40)}v${r(-2.2 * s)}h${r(1.2 * s)}v${r(2.2 * s)}`;
    }

    // südlicher Treppenturm vor dem Palas
    vorn += `<path class="lf" d="M${P(27, 0)}V${r(Y(34))}L${P(29.5, 42)}L${P(32, 34)}V${r(Y(0))}Z"/>` + pfad('l', `M${P(26.6, 34)}H${r(X(32.4))}`);
    if (detail) for (const h of [6, 14, 22, 29]) t += fenster(X(29.5), Y(h), 1.1 * s, 2.8 * s);

    // Kemenate: drei Geschosse
    vorn += `<path class="lf" d="M${P(52, 0)}V${r(Y(17))}L${P(53.5, 24)}H${r(X(78.5))}L${P(80, 17)}V${r(Y(0))}Z"/>` + pfad('l', `M${P(52, 17)}H${r(X(80))}`);
    if (detail) for (const h of [2.2, 7.2, 12.2]) for (let x = 56; x < 78; x += 5) t += fenster(X(x), Y(h), 1.5 * s, 3 * s);

    // Galeriebau zwischen Kemenate und Torbau
    vorn += pfad('l', `M${P(80, 9)}H${r(X(120))}`);
    if (detail) for (let x = 82.5; x < 119; x += 3.4) if (x < 90.5 || x > 101.5) t += fenster(X(x), Y(2), 2 * s, 5 * s);

    // Viereckturm, 45 m: Schaft, Plattform mit Zinnen, Aufsatz mit Spitzdach
    vorn += `<path class="lf" d="M${P(92, 0)}V${r(Y(34))}H${r(X(100))}V${r(Y(0))}Z"/>`;
    vorn += `<path class="lf" d="M${P(91, 34)}V${r(Y(36.5))}H${r(X(101))}V${r(Y(34))}Z"/>`;
    vorn += pfad('l', `M${P(94, 36.5)}V${r(Y(40))}M${P(98, 36.5)}V${r(Y(40))}M${P(93.6, 40)}H${r(X(98.4))}L${P(96, 45)}Z`);
    if (detail) {
      for (const h of [8, 17, 26]) t += fenster(X(96), Y(h), 1.4 * s, 3.4 * s);
      for (let x = 91.8; x < 100.5; x += 1.6) t += `M${P(x, 36.5)}v${r(-0.9 * s)}`;
    }

    // Torbau: zwei Rundtürme, Zinnenkranz, Staffelgiebel
    vorn += `<path class="lf" d="M${P(124, 0)}V${r(Y(13))}H${r(X(146))}V${r(Y(0))}Z"/>`;
    vorn += pfad('l', `M${P(129, 13)}V${r(Y(15))}H${r(X(131))}V${r(Y(17))}H${r(X(133))}V${r(Y(19))}H${r(X(134.2))}V${r(Y(21))}H${r(X(135.8))}V${r(Y(19))}H${r(X(137))}V${r(Y(17))}H${r(X(139))}V${r(Y(15))}H${r(X(141))}V${r(Y(13))}`);
    for (const x of [120, 145]) {
      vorn += `<path class="lf" d="M${P(x, 0)}V${r(Y(17))}L${P(x + 2.5, 23)}L${P(x + 5, 17)}V${r(Y(0))}Z"/>` + pfad('l', `M${P(x - 0.3, 17)}H${r(X(x + 5.3))}`);
      if (detail) t += fenster(X(x + 2.5), Y(5), 1.1 * s, 2.8 * s) + fenster(X(x + 2.5), Y(11), 1.1 * s, 2.8 * s);
    }
    if (detail) {
      for (const x of [127, 135, 143]) t += fenster(X(x), Y(3), 1.5 * s, 3.2 * s);
      t += fenster(X(135), Y(9), 1.5 * s, 3 * s);
      for (const x of [125.8, 127.4, 142.6, 144.2]) t += `M${P(x, 13)}v${r(-0.9 * s)}`;
    }
    return hinten + vorn + pfad('t', t);
  }

  // Felsrücken unter dem Schloss; tief: Unterkante in Bildpunkten unter der Hofebene
  function fels(X, g, tief) {
    const k = tief / 78;
    const zacken = [[151, 26], [140, 58], [128, 44], [112, 70], [96, 52], [80, 76], [60, 56], [44, 78], [26, 50], [10, 66], [0, 30]];
    return `<path class="hf" d="M${r(X(-4))} ${g}H${r(X(154))}${zacken.map(([x, y]) => `L${r(X(x))} ${r(g + y * k)}`).join('')}Z"/>`;
  }

  // stand: 'heute' (mit Maßen), 'plan' (Burg gestrichelt, abgetragener Fels gelb) oder 'tuerme' (mit geplantem Bergfried und Turmhöhen)
  function neuschwansteinAnsicht({ stand = 'heute' } = {}) {
    const plan = stand === 'plan', tuerme = stand === 'tuerme';
    const s = tuerme ? 4.6 : 5, hoch = tuerme ? 90 : 65;
    const ox = (900 - 150 * s) / 2 + (tuerme ? 8 : 15), g = 30 + hoch * s;
    const X = m => ox + m * s, Y = m => g - m * s;
    let body;

    if (plan) {
      body = fels(X, g, 104) + `<g class="geplant">${koerper(X, Y, s, 0, false)}</g>`;
      // Felskuppe vor dem Bau: bis zu 8 m höher als die spätere Hofebene
      const kuppe = [[-4, 0], [8, 5], [22, 3.5], [40, 8], [58, 5], [76, 7.5], [96, 4], [118, 6.5], [136, 3], [154, 0]];
      body += pfad('bgl', 'M' + kuppe.map(([x, y]) => `${r(X(x))} ${r(Y(y))}`).join('L'));
      body += pfad('a', 'M' + kuppe.map(([x, y]) => `${r(X(x))} ${r(Y(y))}`).join('L'));
      body += text(X(75), g + 40, 'bis zu 8 m Fels abgetragen', 'akz hell', 'text-anchor="middle"');
      body += pfad('d', 'M680 44h54') + text(748, 53, 'geplant');
      return svg(900, g + 124, body);
    }

    const tief = tuerme ? 80 : 150;
    body = fels(X, g, tief) + koerper(X, Y, s, 1, tuerme);
    if (tuerme) {
      body += text(X(76), Y(84), 'Bergfried', 'gross akz') + text(X(76), Y(84) + 34, '90 m, nie gebaut', 'akz');
      body += text(X(32.8), Y(64), 'Treppenturm', 'gross', 'text-anchor="end"') + text(X(32.8), Y(64) + 34, '65 m', '', 'text-anchor="end"');
      body += text(X(102.5), Y(46), 'Viereckturm', 'gross') + text(X(102.5), Y(46) + 34, '45 m');
      return svg(900, g + tief + 24, body);
    }
    body += pfad('t', `M44 ${r(Y(65))}H${r(X(37.2))}`) + massV(50, Y(65), g, '65 m', -1);
    body += massH(X(0), X(150), g + tief + 18, 'rund 150 m');
    return svg(900, g + tief + 68, body);
  }

  // Baustelle: ein Dampfkran zieht das Material am Gerüst vorbei auf den Fels
  function neuschwansteinKran() {
    const tal = 470, hof = 190;
    let body = `<path class="hf" d="M352 ${tal}L366 420L386 380L392 320L410 262L418 216L438 ${hof}H880V${tal}Z"/>` + boden(20, 352, tal);

    // Gerüst vor der Felswand, oben eine Bühne auf Höhe der Baustelle
    body += pfad('l', `M270 ${hof}H438M284 ${hof}V${tal}M346 ${hof}V${tal}M284 284H346M284 378H346`);
    body += pfad('t', `M284 ${hof}L346 284M346 284L284 378M284 378L346 ${tal}`);

    // Mauer im Bau: Ziegel in Lagen
    body += `<path class="lf" d="M660 ${hof}V120H720V96H790V120H830V146H860V${hof}Z"/>`;
    let lagen = '';
    for (let y = hof - 14, i = 0; y > 96; y -= 14, i++) {
      const [x1, x2] = y >= 146 ? [660, 860] : y >= 120 ? [660, 830] : [720, 790];
      lagen += `M${x1} ${y}H${x2}`;
      for (let x = x1 + (i % 2 ? 26 : 13); x < x2 - 4; x += 26) lagen += `M${x} ${y}v14`;
    }
    body += pfad('t', lagen);

    // Dampfkran: Kessel mit Schornstein, Schwungrad, Mast und Ausleger
    let kran = pfad('l', `M478 ${hof}V132A18 18 0 0 1 514 132V${hof}M490 116V78H502V116` + kreis(456, hof - 20, 13) +
      `M440 ${hof}V84M440 ${hof - 12}L200 52M440 84L540 ${hof}`);
    kran += pfad('t', `M440 84L200 52V268` + kreis(500, 60, 7) + kreis(514, 42, 9) + kreis(532, 24, 11));
    body += `<g class="akzent">${kran}</g>`;
    // Steinblock am Seil, Fuhrwerk im Tal
    body += `<path class="lf" d="M176 268h48v32h-48Z"/>` + pfad('t', 'M176 268l24 -14l24 14');
    body += pfad('l', `M70 426h104v22h-104Z` + kreis(94, 458, 12) + kreis(150, 458, 12) + 'M70 440l-42 10') + pfad('t', 'M82 426v-16h30v16M118 426v-12h34v12');

    body += text(566, 56, 'Dampfkran', 'gross akz');
    body += pfad('t', 'M268 386H284') + text(262, 395, 'Gerüst', '', 'text-anchor="end"');
    body += text(700, hof + 46, 'Mauern aus Ziegeln', 'hell', 'text-anchor="middle"');
    return svg(900, 500, body);
  }

  // Längsschnitt durch den Palas (schematisch): fünf Geschosse, der Thronsaal reicht über zwei davon
  function palasSchnitt() {
    const s = 10, ox = 30, g = 496, L = 52;
    const X = m => ox + m * s, Y = m => g - m * s;
    let body = '';

    // Außenmauern aus Ziegeln, Dach, Decken
    for (const x of [0, L - 1.5]) body += `<rect class="hf" x="${r(X(x))}" y="${r(Y(28))}" width="${r(1.5 * s)}" height="${r(28 * s)}"/>`;
    let l = `M${r(X(0))} ${r(Y(28))}L${r(X(2))} ${r(Y(38))}H${r(X(L - 2))}L${r(X(L))} ${r(Y(28))}M${r(X(0))} ${r(Y(28))}H${r(X(L))}`;
    for (const h of [5, 10, 15]) l += `M${r(X(1.5))} ${r(Y(h))}H${r(X(L - 1.5))}`;
    l += `M${r(X(1.5))} ${r(Y(21.5))}H${r(X(30))}M${r(X(30))} ${r(Y(15))}V${r(Y(28))}`;
    let t = '';
    for (const x of [10, 19]) t += `M${r(X(x))} ${r(Y(0))}V${r(Y(28))}`;
    t += `M${r(X(34))} ${r(Y(5))}V${r(Y(15))}`;

    // Thronsaal: 20 m lang, 13 m hoch, zwei Reihen Arkaden
    const saal = `M${r(X(30.7))} ${r(Y(15.5))}V${r(Y(27.5))}H${r(X(L - 2.2))}V${r(Y(15.5))}Z`;
    for (let x = 33; x < 49; x += 3.4) t += fenster(X(x), Y(15.5), 2.4 * s, 5 * s) + fenster(X(x), Y(21.5), 2.4 * s, 5 * s);
    t += `M${r(X(30.7))} ${r(Y(21.5))}H${r(X(L - 2.2))}`;

    // Speiseaufzug: Schacht vom Erdgeschoss nach oben
    t += `M${r(X(25))} ${r(Y(0))}V${r(Y(15))}M${r(X(28))} ${r(Y(0))}V${r(Y(15))}M${r(X(26.5))} ${r(Y(15))}V${r(Y(9.5))}`;
    l += `M${r(X(25.4))} ${r(Y(6.5))}h${r(2.2 * s)}v${r(-3 * s)}h${r(-2.2 * s)}Z`;

    // Warmluftheizung: Ofen im Erdgeschoss, warme Luft steigt durch die Geschosse
    l += `M${r(X(38))} ${r(Y(0))}V${r(Y(3.5))}H${r(X(46))}V${r(Y(0))}`;
    for (const x of [40, 42, 44]) {
      t += `M${r(X(x))} ${r(Y(3.5))}q5 -10 0 -20q-5 -10 0 -20q5 -10 0 -20q-5 -10 0 -20l-5 7m5 -7l5 7`;
    }

    body += pfad('l', l) + pfad('t', t) + pfad('a', saal) + boden(X(-2), X(L + 1.2), g);

    const lx = X(L) + 26;
    body += pfad('t', `M${r(X(L) + 5)} ${r(Y(24))}H${lx - 6}`) + text(lx, Y(24) + 4, 'Thronsaal', 'gross akz') +
      text(lx, Y(24) + 38, 'Stahlgerüst', 'akz') + text(lx, Y(24) + 70, '20 m lang,', 'akz') + text(lx, Y(24) + 102, '13 m hoch', 'akz');
    body += pfad('t', `M${r(X(28))} ${r(Y(9))}H${lx - 6}`) + text(lx, Y(9) + 4, 'Speiseaufzug', 'gross');
    body += pfad('t', `M${r(X(46))} ${r(Y(1.5))}H${lx - 6}`) + text(lx, Y(1.5) + 4, 'Heizung', 'gross') + text(lx, Y(1.5) + 38, 'mit warmer Luft');
    return svg(900, 556, body);
  }

  Object.assign(Zeichnung, { neuschwansteinAnsicht, neuschwansteinKran, palasSchnitt });
})();
