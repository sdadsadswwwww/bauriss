// Zeichnungen: Schloss Neuschwanstein. Maße in Metern, s = Pixel pro Meter; schematisch.
// Recherchiert sind: Länge rund 150 m, nördlicher Treppenturm 65 m, Viereckturm 45 m, geplanter Bergfried 90 m,
// Thronsaal 20 m lang und 13 m hoch im dritten und vierten Obergeschoss, Palas mit fünf Geschossen,
// bis zu 8 m Fels abgetragen, Mauern aus Ziegeln mit Kalkstein verkleidet, Dampfkräne, Thronsaal als Stahl-/Eisenkonstruktion.
// Alle übrigen Höhen, Breiten, Fenster, Zinnen, Friese und Dachformen sind nach Fotos vereinfacht und tragen keine Maßzahl.
// Seit 20.11.2026 im CAD-Stil: Achsen (rot), Höhenkoten (cyan, nur belegte Höhen), romanische Bi- und Triforien, Rundbogenfriese.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV, massH } = Z;

  // ---------- Bausteine in Metern; M = { X, Y, s } ----------
  const P = (M, x, y) => `${r(M.X(x))} ${r(M.Y(y))}`;
  const L = (M, ...p) => 'M' + p.map(([x, y]) => P(M, x, y)).join('L');
  // Rundbogenöffnung: linke Kante x, Unterkante y, Breite w, Gesamthöhe h
  const rund = (M, x, y, w, h) => {
    const k = r((w / 2) * M.s);
    return `M${P(M, x, y)}L${P(M, x, y + h - w / 2)}A${k} ${k} 0 0 1 ${P(M, x + w, y + h - w / 2)}L${P(M, x + w, y)}Z`;
  };
  const rundOffen = (M, x, y, w, h) => {
    const k = r((w / 2) * M.s);
    return `M${P(M, x, y)}L${P(M, x, y + h - w / 2)}A${k} ${k} 0 0 1 ${P(M, x + w, y + h - w / 2)}L${P(M, x + w, y)}`;
  };
  const ring = (M, x, y, k) => kreis(M.X(x), M.Y(y), k * M.s);

  // Bi- oder Triforium: großer Rundbogen, darin n kleine Bögen auf Säulchen, Okulus im Bogenfeld, Sohlbank
  function forium(M, cx, y, w, h, n = 2) {
    const o = { t: '', z: '' }, x = cx - w / 2;
    o.t += rund(M, x, y, w, h);
    o.t += L(M, [x - 0.25, y], [x + w + 0.25, y]);
    const e = w * 0.09, c = w * 0.1, bi = (w - 2 * e - (n - 1) * c) / n, hi = h * 0.7;
    for (let i = 0; i < n; i++) {
      const xi = x + e + i * (bi + c);
      o.z += rundOffen(M, xi, y, bi, hi);
      if (i) {
        const xs = xi - c;
        o.z += L(M, [xs + c * 0.3, y], [xs + c * 0.3, y + hi - bi / 2]) + L(M, [xs + c * 0.7, y], [xs + c * 0.7, y + hi - bi / 2]);
        o.z += L(M, [xs, y + hi - bi / 2], [xs + c, y + hi - bi / 2]);
      }
    }
    o.z += ring(M, cx, y + hi + (h - hi) * 0.38, Math.min(w * 0.12, (h - hi) * 0.28));
    o.z += rundOffen(M, x + w * 0.04, y + 0.15, w * 0.92, h - 0.12);
    return o;
  }
  // Zinnen: abwechselnd Zahn und Lücke
  function zinnen(M, x1, x2, y, h = 1, b = 0.9) {
    let d = `M${P(M, x1, y)}`, hoch = true;
    for (let x = x1; x < x2 - 0.01; x += b) {
      const xe = Math.min(x + b, x2);
      d += hoch ? `L${P(M, x, y + h)}L${P(M, xe, y + h)}L${P(M, xe, y)}` : `L${P(M, xe, y)}`;
      hoch = !hoch;
    }
    return d;
  }
  // Rundbogenfries unter einer Traufe oder Plattform
  function fries(M, x1, x2, y, b = 0.8) {
    const n = Math.max(1, Math.round((x2 - x1) / b)), bb = (x2 - x1) / n, k = r((bb / 2) * M.s);
    let d = L(M, [x1, y], [x2, y]);
    for (let i = 0; i < n; i++) {
      const x = x1 + i * bb;
      d += `M${P(M, x, y)}L${P(M, x, y - bb * 0.55)}A${k} ${k} 0 0 0 ${P(M, x + bb, y - bb * 0.55)}`;
    }
    return d;
  }
  // Gesims: doppelte Linie
  const gesims = (M, x1, x2, y) => L(M, [x1 - 0.2, y], [x2 + 0.2, y]) + L(M, [x1 - 0.2, y - 0.35], [x2 + 0.2, y - 0.35]);
  // Kegeldach mit Schindellagen und Knauf; liefert { l, z }
  function kegel(M, cx, y, w, h, knauf = 1) {
    const top = y + h;
    let l = L(M, [cx - w / 2, y], [cx, top], [cx + w / 2, y]) + L(M, [cx - w / 2 - 0.3, y], [cx + w / 2 + 0.3, y]);
    let z = '';
    for (let k = 0.18; k < 0.86; k += 0.16) {
      const hw = (w / 2) * (1 - k);
      z += L(M, [cx - hw, y + h * k], [cx + hw, y + h * k]);
    }
    z += L(M, [cx - w / 4, y], [cx, top]) + L(M, [cx + w / 4, y], [cx, top]);
    if (knauf) {
      l += L(M, [cx, top], [cx, top + knauf]);
      z += ring(M, cx, top + knauf * 0.4, Math.max(0.2, knauf * 0.18));
    }
    return { l, z };
  }
  // Rundturm: Zylinderkanten als feine Linien
  const zylinder = (M, x1, x2, y1, y2) => L(M, [x1 + (x2 - x1) * 0.18, y1], [x1 + (x2 - x1) * 0.18, y2]) + L(M, [x2 - (x2 - x1) * 0.18, y1], [x2 - (x2 - x1) * 0.18, y2]);
  // Eckquader an einer Turmkante
  function quader(M, x, y1, y2, b, seite) {
    let d = '', i = 0;
    for (let y = y1; y < y2 - 0.6; y += 1.2, i++) {
      const bb = i % 2 ? b : b * 0.6;
      d += `M${P(M, x, y)}L${P(M, x + seite * bb, y)}L${P(M, x + seite * bb, y + 1.2)}`;
    }
    return d;
  }

  // ---------- Schloss in Südansicht: Palas im Westen (links), Torbau im Osten (rechts), x von 0 bis 150 m ----------
  // detail: 0 = Umriss (für den Plan), 1 = mit Fenstern, Friesen und Dachdeckung; bergfried: geplanter Turm gestrichelt
  function koerper(M, detail, bergfried) {
    let hinten = '', vorn = '', t = '', z = '';
    const lf = d => `<path class="lf" d="${d}"/>`;
    const plus = o => { t += o.t || ''; z += o.z || ''; };

    // nördlicher Treppenturm, 65 m: hinter dem Palas, über dem First sichtbar
    hinten += lf(L(M, [35, 40], [35, 53], [41, 53], [41, 40]) + 'Z');
    hinten += lf(L(M, [34.2, 53], [34.2, 55.5], [41.8, 55.5], [41.8, 53]) + 'Z');
    hinten += lf(L(M, [36, 55.5], [36, 58], [40, 58], [40, 55.5]) + 'Z');
    const nk = kegel(M, 38, 58, 5.2, 6.2, 0.8);
    hinten += pfad('l', nk.l + zinnen(M, 34.2, 41.8, 55.5, 0.7, 0.76));
    if (detail) {
      z += nk.z + zylinder(M, 35, 41, 40, 53) + fries(M, 35, 41, 53, 0.75) + zylinder(M, 36, 40, 55.5, 58);
      for (const [x, h] of [[37.4, 42], [38.6, 46.5], [37.4, 50]]) t += rund(M, x - 0.5, h, 1, 2.4);
      t += rund(M, 37.5, 56, 1, 1.6);
    }

    // geplanter Bergfried, 90 m, im oberen Hof hinter der Kemenate
    if (bergfried) {
      let d = L(M, [61, 24], [61, 72]) + L(M, [73, 24], [73, 72]) + L(M, [60, 72], [60, 76], [74, 76], [74, 72]) + 'Z';
      d += L(M, [61.5, 76], [67, 90], [72.5, 76]) + zinnen(M, 60, 74, 76, 1.2, 1.4);
      for (const h of [32, 44, 56, 66]) d += rund(M, 66, h, 2, 4);
      hinten += pfad('d', d);
    }

    // Palas: fünf Geschosse, steiles Dach, Ziertürmchen an den Giebeln
    vorn += lf(L(M, [0, 0], [0, 30], [1.5, 40], [50.5, 40], [52, 30], [52, 0]) + 'Z');
    vorn += pfad('l', L(M, [-0.3, 30], [52.3, 30]));
    for (const x of [0, 52]) vorn += lf(L(M, [x - 1.4, 27], [x - 1.4, 35], [x, 40.5], [x + 1.4, 35], [x + 1.4, 27]) + 'Z') + pfad('l', L(M, [x, 40.5], [x, 41.6]));
    if (detail) {
      for (const y of [5.5, 11, 16.5, 23]) t += gesims(M, 0, 52, y);
      z += fries(M, 0, 52, 29.7, 0.85);
      for (let k = 32; k < 40; k += 2) z += L(M, [(k - 30) * 0.15, k], [52 - (k - 30) * 0.15, k]);
      const reihen = [[1.4, 'rund'], [6.4, 2], [11.9, 2], [17.4, 3], [23.9, 2]];
      for (const [y, art] of reihen) {
        for (let x = 4.5; x < 50; x += 5) {
          if (x > 24 && x < 35) continue; // davor steht der südliche Treppenturm
          if (art === 'rund') t += rund(M, x - 0.6, y, 1.2, 2.6);
          else plus(forium(M, x, y, art === 3 ? 3.6 : 2.7, art === 3 ? 4.4 : (y > 20 ? 4.2 : 3.6), art));
        }
      }
      // Gauben im Dach
      for (const x of [10, 21, 45]) t += L(M, [x - 0.8, 34], [x - 0.8, 36.3], [x, 37.6], [x + 0.8, 36.3], [x + 0.8, 34]) + rund(M, x - 0.35, 34.4, 0.7, 1.4);
      // Balkon vor dem vierten Geschoss
      t += L(M, [11, 17.2], [18, 17.2], [18, 16.4], [11, 16.4]) + 'Z';
      for (let x = 11.6; x < 18; x += 1.4) z += L(M, [x, 16.4], [x + 0.35, 15.4], [x + 0.7, 16.4]);
      z += L(M, [11, 18.3], [18, 18.3]);
      for (let x = 11.4; x < 18; x += 0.7) z += L(M, [x, 17.2], [x, 18.3]);
    }

    // südlicher Treppenturm vor dem Palas: Rundturm mit Kranz und Kegeldach
    vorn += lf(L(M, [27, 0], [27, 33], [32, 33], [32, 0]) + 'Z');
    vorn += lf(L(M, [26.5, 33], [26.5, 34.4], [32.5, 34.4], [32.5, 33]) + 'Z');
    const sk = kegel(M, 29.5, 34.4, 5.8, 8, 0.9);
    vorn += pfad('l', sk.l);
    if (detail) {
      z += sk.z + zylinder(M, 27, 32, 0, 33) + fries(M, 27, 32, 32.6, 0.62);
      for (const [x, h] of [[29.1, 4], [29.9, 10], [29.1, 16], [29.9, 22]]) t += rund(M, x - 0.45, h, 0.9, 2.4);
      plus(forium(M, 29.5, 27.4, 2.4, 3.6, 2));
    }

    // Kemenate: drei Geschosse
    vorn += lf(L(M, [52, 0], [52, 17], [53.5, 24], [78.5, 24], [80, 17], [80, 0]) + 'Z') + pfad('l', L(M, [51.8, 17], [80.2, 17]));
    if (detail) {
      for (const y of [5.6, 11]) t += gesims(M, 52, 80, y);
      z += fries(M, 52, 80, 16.7, 0.85);
      for (let k = 19; k < 24; k += 1.6) z += L(M, [52 + (k - 17) * 0.21, k], [80 - (k - 17) * 0.21, k]);
      for (const y of [1.6, 6.8, 12.2]) for (let x = 56; x < 78; x += 5) plus(forium(M, x, y, 2.6, 3.4, 2));
    }

    // Galeriebau zwischen Kemenate und Torbau: Arkaden, Zinnen
    vorn += pfad('l', L(M, [80, 9], [92, 9]) + L(M, [100, 9], [120, 9]) + zinnen(M, 80, 92, 9, 0.9, 0.86) + zinnen(M, 100, 120, 9, 0.9, 0.86));
    if (detail) {
      t += gesims(M, 80, 92, 7) + gesims(M, 100, 120, 7);
      for (let x = 81.8; x < 119; x += 2.9) {
        if (x > 90 && x < 101.5) continue;
        t += rund(M, x, 1.2, 2, 4.6);
        z += L(M, [x - 0.3, 1.2], [x + 2.3, 1.2]) + L(M, [x - 0.35, 3.8], [x - 0.35, 1.2]) + L(M, [x - 0.65, 4.4], [x - 0.05, 4.4]);
      }
    }

    // Viereckturm, 45 m: Schaft, Konsolenfries, Plattform mit Zinnen, Aufsatz mit Spitzhelm
    vorn += lf(L(M, [92, 0], [92, 34], [100, 34], [100, 0]) + 'Z');
    vorn += lf(L(M, [91, 34], [91, 35.6], [101, 35.6], [101, 34]) + 'Z');
    vorn += pfad('l', zinnen(M, 91, 101, 35.6, 0.9, 0.84));
    vorn += lf(L(M, [94, 35.6], [94, 40], [98, 40], [98, 35.6]) + 'Z');
    vorn += pfad('l', L(M, [93.6, 40], [96, 44.2], [98.4, 40]) + 'Z' + L(M, [96, 44.2], [96, 45]));
    if (detail) {
      z += fries(M, 92, 100, 33.6, 0.8) + quader(M, 92, 0.4, 33, 0.7, 1) + quader(M, 100, 0.4, 33, 0.7, -1);
      for (const y of [6, 14.5, 23]) plus(forium(M, 96, y, 2.6, 3.6, 2));
      plus(forium(M, 96, 28.4, 2.2, 3.4, 3));
      t += rund(M, 95.4, 36.6, 1.2, 2.2);
      for (let k = 41; k < 44; k += 0.9) z += L(M, [96 - 2.4 * (1 - (k - 40) / 4.2), k], [96 + 2.4 * (1 - (k - 40) / 4.2), k]);
      z += ring(M, 96, 44.6, 0.22);
    }

    // Torbau: zwei Rundtürme, Zinnen, Staffelgiebel, Tor
    vorn += lf(L(M, [124, 0], [124, 13], [146, 13], [146, 0]) + 'Z');
    vorn += pfad('l', L(M, [129, 13], [129, 15], [131, 15], [131, 17], [133, 17], [133, 19], [134.2, 19], [134.2, 21], [135.8, 21], [135.8, 19], [137, 19], [137, 17], [139, 17], [139, 15], [141, 15], [141, 13]));
    vorn += pfad('l', zinnen(M, 125, 129, 13, 0.8, 0.8) + zinnen(M, 141, 145, 13, 0.8, 0.8));
    for (const x of [120, 145]) {
      vorn += lf(L(M, [x, 0], [x, 16.4], [x + 5, 16.4], [x + 5, 0]) + 'Z');
      vorn += lf(L(M, [x - 0.4, 16.4], [x - 0.4, 17.4], [x + 5.4, 17.4], [x + 5.4, 16.4]) + 'Z');
      const k = kegel(M, x + 2.5, 17.4, 5.6, 5, 0.7);
      vorn += pfad('l', k.l);
      if (detail) {
        z += k.z + zylinder(M, x, x + 5, 0, 16.4) + fries(M, x, x + 5, 16.1, 0.62);
        t += rund(M, x + 2.05, 4, 0.9, 2.4) + rund(M, x + 2.05, 10, 0.9, 2.4);
      }
    }
    // Tor mit Gewände
    vorn += pfad('l', rund(M, 132.6, 0, 4.8, 6.4));
    if (detail) {
      t += rundOffen(M, 132.1, 0, 5.8, 6.9) + rundOffen(M, 131.6, 0, 6.8, 7.4);
      z += L(M, [135, 0], [135, 3.9]) + rundOffen(M, 133.1, 0, 3.8, 5.8);
      for (const x of [127.3, 142.7]) plus(forium(M, x, 6.8, 2.6, 3.6, 2));
      for (const x of [127.3, 142.7]) t += rund(M, x - 0.6, 1.6, 1.2, 2.6);
      t += rund(M, 134.4, 15.2, 1.2, 2.6) + rund(M, 132, 13.6, 0.9, 1.8) + rund(M, 137.1, 13.6, 0.9, 1.8);
      t += gesims(M, 124, 146, 12.8);
      z += quader(M, 124, 0.4, 12, 0.6, 1) + quader(M, 146, 0.4, 12, 0.6, -1);
    }
    return hinten + vorn + pfad('t', t) + pfad('z', z);
  }

  // Felsrücken unter dem Schloss: Schraffur, Schichtfugen und Klüfte; tief = Unterkante in Bildpunkten unter der Hofebene
  function fels(M, g, tief, detail = 1) {
    const k = tief / 78, X = M.X;
    const zacken = [[151, 26], [140, 58], [128, 44], [112, 70], [96, 52], [80, 76], [60, 56], [44, 78], [26, 50], [10, 66], [0, 30]];
    let body = `<path class="hf" d="M${r(X(-4))} ${g}H${r(X(154))}${zacken.map(([x, y]) => `L${r(X(x))} ${r(g + y * k)}`).join('')}Z"/>`;
    if (detail) {
      let z = '';
      // Schichtfugen, leicht geneigt
      for (const [x1, y1, x2, y2] of [[4, 14, 60, 20], [70, 12, 146, 9], [18, 34, 54, 40], [84, 30, 124, 26], [100, 50, 112, 56], [34, 52, 52, 58]]) {
        z += `M${r(X(x1))} ${r(g + y1 * k)}Q${r(X((x1 + x2) / 2))} ${r(g + (y1 + y2) / 2 * k + 6)} ${r(X(x2))} ${r(g + y2 * k)}`;
      }
      // Klüfte
      for (const [x, y, dx, dy] of [[30, 2, 3, 22], [88, 3, -4, 18], [126, 4, 2, 16], [62, 24, 3, 14], [14, 22, -2, 12]]) {
        z += `M${r(X(x))} ${r(g + y * k)}l${r(dx * M.s * 0.5)} ${r(dy * k * 0.5)}l${r(-dx * M.s * 0.3)} ${r(dy * k * 0.5)}`;
      }
      body += pfad('bgl', z) + pfad('z', z);
    }
    return body;
  }

  // ---------- Konstruktionshilfen in Bildpunkten ----------
  // Achse: rote Strichpunktlinie mit Kreis und Buchstabe (Kreis aus kurzen Stücken, damit er durchgezogen bleibt)
  function achse(x, yKreis, yUnten, name) {
    let k = '';
    for (let i = 0; i < 12; i++) {
      const a1 = (i * Math.PI) / 6, a2 = ((i + 1) * Math.PI) / 6;
      k += `M${r(x + 14 * Math.cos(a1))} ${r(yKreis + 14 * Math.sin(a1))}L${r(x + 14 * Math.cos(a2))} ${r(yKreis + 14 * Math.sin(a2))}`;
    }
    return pfad('ax', `M${r(x)} ${r(yKreis + 14)}V${r(yUnten)}`) + pfad('ax', k) + text(x, yKreis + 8, name, 'achse', 'text-anchor="middle"');
  }
  // Höhenkote: gepunktete Höhenlinie von x1 bis x2, Dreieck bei xm, Text rechts davon
  function kote(x1, x2, y, xm, label) {
    return pfad('hl', `M${r(x1)} ${r(y)}H${r(x2)}`) + pfad('m', `M${r(xm)} ${r(y)}l-8 -13h16Z`) + text(xm + 12, y - 6, label, 'kote');
  }

  // stand: 'heute' (Koten und Länge), 'plan' (Burg gestrichelt, abgetragener Fels gelb) oder 'tuerme' (mit geplantem Bergfried und Turmhöhen)
  function neuschwansteinAnsicht({ stand = 'heute' } = {}) {
    const plan = stand === 'plan', tuerme = stand === 'tuerme';

    if (plan) {
      const s = 5, ox = 90, g = 355;
      const M = { X: m => ox + m * s, Y: m => g - m * s, s };
      let body = fels(M, g, 104, 0) + `<g class="geplant">${koerper(M, 1, false)}</g>`;
      // Felskuppe vor dem Bau: bis zu 8 m höher als die spätere Hofebene
      const kuppe = [[-4, 0], [8, 5], [22, 3.5], [40, 8], [58, 5], [76, 7.5], [96, 4], [118, 6.5], [136, 3], [154, 0]];
      const kd = 'M' + kuppe.map(([x, y]) => P(M, x, y)).join('L');
      body += `<path class="hs" d="${kd}Z"/>`;
      body += pfad('bgl', kd) + pfad('a', kd);
      body += text(M.X(75), g + 40, 'bis zu 8 m Fels abgetragen', 'akz hell', 'text-anchor="middle"');
      body += pfad('d', 'M680 44h54') + text(748, 53, 'geplant');
      return svg(900, g + 124, body);
    }

    if (tuerme) {
      const s = 4.6, ox = 83, g = 444, tief = 80;
      const M = { X: m => ox + m * s, Y: m => g - m * s, s };
      let body = fels(M, g, tief) + koerper(M, 1, true);
      body += kote(M.X(74.5), 790, M.Y(90), 796, '+90,00') + kote(M.X(41.5), 790, M.Y(65), 796, '+65,00') + kote(M.X(98.6), 790, M.Y(45), 796, '+45,00');
      body += kote(M.X(150.5), 790, g, 796, '±0,00');
      body += text(M.X(76), M.Y(84) + 12, 'Bergfried', 'gross akz') + text(M.X(76), M.Y(84) + 46, '90 m, nie gebaut', 'akz');
      body += text(M.X(32.8), M.Y(64) + 6, 'Treppenturm', 'gross', 'text-anchor="end"') + text(M.X(32.8), M.Y(64) + 40, '65 m', '', 'text-anchor="end"');
      body += text(M.X(102.5), M.Y(45) + 40, 'Viereckturm', 'gross') + text(M.X(102.5), M.Y(45) + 74, '45 m');
      return svg(900, g + tief + 24, body);
    }

    const s = 4.8, ox = 120, g = 372, tief = 140;
    const M = { X: m => ox + m * s, Y: m => g - m * s, s };
    let body = '';
    body += achse(M.X(38), 32, g + 14, '1') + achse(M.X(96), 32, g + 14, '2') + achse(M.X(135), 32, g + 14, '3');
    body += fels(M, g, tief) + koerper(M, 1, false);
    body += kote(M.X(41.5), 790, M.Y(65), 796, '+65,00') + kote(M.X(98.6), 790, M.Y(45), 796, '+45,00');
    body += kote(20, M.X(-4.5), g, 34, '±0,00');
    body += massH(M.X(0), M.X(150), g + tief + 14, 'rund 150 m');
    return svg(900, g + tief + 61, body);
  }

  // ---------- Baustelle: ein Dampfkran zieht das Material am Gerüst vorbei auf den Fels ----------
  function neuschwansteinKran() {
    const tal = 470, hof = 190;
    // Fels mit Schichtfugen
    let body = `<path class="hf" d="M352 ${tal}L366 420L386 380L392 320L410 262L418 216L438 ${hof}H880V${tal}Z"/>` + boden(20, 352, tal);
    let fz = 'M392 300Q520 292 640 306T880 300M372 400Q470 392 600 404T880 398M410 250Q560 246 700 254T880 250M386 352Q500 356 640 348T880 352';
    fz += 'M520 ' + (hof + 12) + 'l6 20l-4 18M760 330l-5 22l6 20M620 420l4 18l-3 22M470 360l-6 16';
    body += pfad('bgl', fz) + pfad('z', fz);

    // Gerüst aus Holz: Ständer, Riegel, Streben, Bühne mit Bohlen, Geländer, Leiter
    let gl = '', gt = '', gz = '';
    for (const x of [270, 340]) gl += `M${x} ${hof - 26}V${tal}M${x + 6} ${hof}V${tal}`;
    for (const y of [hof, 284, 378]) gl += `M262 ${y}H${y === hof ? 438 : 352}M262 ${y + 6}H352`;
    gt += `M276 ${hof + 6}L340 284M276 290L340 ${hof + 6}M276 290L340 378M340 290L276 378M276 384L340 ${tal}M340 384L276 ${tal}`;
    for (let x = 266; x < 436; x += 9) gz += `M${x} ${hof}v6`;
    gl += `M262 ${hof - 26}H346M262 ${hof - 13}H346`;
    for (const [x, y] of [[276, hof + 6], [340, 284], [276, 290], [340, 378], [276, 384]]) gz += kreis(x + 3, y + 2, 2.4);
    gt += `M296 ${hof + 6}V284M312 ${hof + 6}V284`;
    for (let y = hof + 18; y < 284; y += 12) gz += `M296 ${y}H312`;
    body += pfad('l', gl) + pfad('t', gt) + pfad('z', gz);

    // Mauer im Bau: Ziegel im Verband, unten schon mit Kalkstein verkleidet
    body += `<path class="lf" d="M660 ${hof}V120H720V96H790V120H830V146H860V${hof}Z"/>`;
    let lagen = '';
    for (let y = hof - 7, i = 0; y > 96; y -= 7, i++) {
      if (y > 150) continue;
      const [x1, x2] = y >= 146 ? [660, 860] : y >= 120 ? [660, 830] : [720, 790];
      lagen += `M${x1} ${y}H${x2}`;
      for (let x = x1 + (i % 2 ? 14 : 7); x < x2 - 3; x += 14) lagen += `M${x} ${y}v7`;
    }
    body += pfad('z', lagen);
    // Verkleidung: große Kalksteinquader im unteren Bereich
    let quader = `M660 154H860`;
    for (let y = 154, i = 0; y < hof; y += 12, i++) {
      quader += `M660 ${y}H860`;
      for (let x = 660 + (i % 2 ? 22 : 44); x < 858; x += 44) quader += `M${x} ${y}v12`;
    }
    body += pfad('t', quader);

    // Dampfkran: Gittermast, Gitterausleger, Rückhalt, Kessel mit Nieten, Schornstein, Seiltrommel mit Zahnrad
    let kl = '', kt = '', kz = '';
    kl += `M432 ${hof}V82M448 ${hof}V82M428 82H452`;
    for (let y = hof; y > 86; y -= 18) kt += `M432 ${y}L448 ${y - 18}M448 ${y}L432 ${y - 18}M432 ${y}H448`;
    kl += `M440 78L198 46M440 98L204 56`;
    for (let i = 0; i < 10; i++) {
      const k1 = i / 10, k2 = (i + 1) / 10;
      const ox1 = 440 - 242 * k1, oy1 = 78 - 32 * k1, ux2 = 440 - 236 * k2, uy2 = 98 - 42 * k2;
      kt += `M${r(ox1)} ${r(oy1)}L${r(ux2)} ${r(uy2)}`;
      const ox2 = 440 - 242 * k2, oy2 = 78 - 32 * k2;
      kt += `M${r(ux2)} ${r(uy2)}L${r(ox2)} ${r(oy2)}`;
    }
    kl += `M444 80L548 ${hof}M450 92L556 ${hof}`;
    kl += `M474 ${hof}V132A20 20 0 0 1 514 132V${hof}M488 116V74H500V116M484 74H504`;
    for (let y = 140; y < hof; y += 12) kz += `M476 ${y}H512`;
    for (let y = 146; y < hof; y += 12) for (let x = 480; x < 512; x += 8) kz += kreis(x, y, 1.1);
    kl += kreis(458, hof - 22, 13);
    kz += kreis(458, hof - 22, 4) + kreis(472, hof - 34, 6);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      kz += `M${r(458 + 4 * Math.cos(a))} ${r(hof - 22 + 4 * Math.sin(a))}L${r(458 + 13 * Math.cos(a))} ${r(hof - 22 + 13 * Math.sin(a))}`;
    }
    kt += `M${458} ${hof - 35}L440 84M440 84L200 52V258` + kreis(440, 84, 5) + kreis(200, 52, 5);
    kt += kreis(500, 56, 7) + kreis(514, 38, 9) + kreis(532, 20, 11);
    body += `<g class="akzent">${pfad('l', kl)}${pfad('t', kt)}${pfad('z', kz)}</g>`;
    // Haken, Gehänge und Steinblock am Seil
    body += pfad('t', 'M200 258l-6 6v6M188 270l-12 0M212 270l12 0M200 270L176 284M200 270L224 284');
    body += `<path class="lf" d="M176 284h48v32h-48Z"/>` + pfad('z', 'M176 300h48M192 284v16M208 300v16');
    // Fuhrwerk im Tal mit Speichenrädern und Steinladung
    body += pfad('l', `M70 426h104v22h-104Z` + kreis(94, 458, 12) + kreis(150, 458, 12) + 'M70 440l-42 10');
    let fw = 'M82 426v-16h30v16M118 426v-12h34v12';
    for (const cx of [94, 150]) for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      fw += `M${cx} 458L${r(cx + 11 * Math.cos(a))} ${r(458 + 11 * Math.sin(a))}`;
    }
    body += pfad('t', fw) + pfad('z', 'M70 437h104M96 410v16M136 414v12');

    body += text(566, 56, 'Dampfkran', 'gross akz');
    body += pfad('t', 'M234 330H262') + text(228, 339, 'Gerüst', '', 'text-anchor="end"');
    body += text(700, hof + 46, 'Mauern aus Ziegeln', 'hell', 'text-anchor="middle"');
    body += text(700, hof + 82, 'Kalksteinverkleidung', 'hell', 'text-anchor="middle"');
    return svg(900, 500, body);
  }

  // ---------- Längsschnitt durch den Palas (schematisch): fünf Geschosse, der Thronsaal reicht über zwei davon ----------
  function palasSchnitt() {
    const s = 10, ox = 30, g = 496, L0 = 52;
    const X = m => ox + m * s, Y = m => g - m * s;
    const Pp = (x, y) => `${r(X(x))} ${r(Y(y))}`;
    const rect = (cls, x1, y1, x2, y2) => `<path class="${cls}" d="M${Pp(x1, y1)}H${r(X(x2))}V${r(Y(y2))}H${r(X(x1))}Z"/>`;
    let body = '', l = '', t = '', z = '', st = '', sz = '';

    // Achsen
    const ax = (x, name) => {
      let k = '';
      for (let i = 0; i < 12; i++) {
        const a1 = (i * Math.PI) / 6, a2 = ((i + 1) * Math.PI) / 6;
        k += `M${r(x + 14 * Math.cos(a1))} ${r(30 + 14 * Math.sin(a1))}L${r(x + 14 * Math.cos(a2))} ${r(30 + 14 * Math.sin(a2))}`;
      }
      return pfad('ax', `M${r(x)} 44V${g + 30}`) + pfad('ax', k) + text(x, 38, name, 'achse', 'text-anchor="middle"');
    };
    body += ax(X(0.75), '1') + ax(X(30), '2') + ax(X(L0 - 0.75), '3');

    // Fundament im Fels
    body += `<path class="hs" d="M${r(X(-2))} ${g}H${r(X(L0 + 1.2))}V${g + 42}L${r(X(40))} ${g + 34}L${r(X(26))} ${g + 46}L${r(X(10))} ${g + 36}L${r(X(-2))} ${g + 44}Z"/>`;
    for (const x of [-0.5, L0 - 2]) body += rect('hf', x, 0, x + 2.5, -3.2);

    // Außenmauern aus Ziegeln mit Fensteröffnungen im Schnitt
    for (const x of [0, L0 - 1.5]) {
      body += rect('hf', x, 0, x + 1.5, 28);
      for (const [y1, y2] of [[1.2, 3.6], [6.2, 8.8], [11.2, 13.8], [16.5, 20.5], [22.5, 26.5]]) {
        if (x > 0 && y1 > 15) continue;
        body += rect('lf', x, y1, x + 1.5, y2);
        z += `M${r(X(x + 0.75))} ${r(Y(y1))}V${r(Y(y2))}`;
      }
    }
    // Thronsaalwand Ost mit hohen Fenstern
    for (const [y1, y2] of [[16.2, 21], [22.4, 26.8]]) body += rect('lf', L0 - 1.5, y1, L0, y2) + pfad('z', `M${r(X(L0 - 0.75))} ${r(Y(y1))}V${r(Y(y2))}`);

    // Decken als Platten mit Schraffur
    for (const h of [5, 10]) body += rect('hf', 1.5, h - 0.45, L0 - 1.5, h);
    body += rect('hf', 1.5, 14.55, 30, 15) + rect('hf', 1.5, 21.05, 30, 21.5) + rect('hf', 1.5, 27.55, 30, 28);

    // Dach: Sparren, Kehlbalken, Hängesäulen, Pfetten, Deckung
    l += `M${Pp(-0.6, 28)}L${Pp(2, 38)}H${r(X(L0 - 2))}L${Pp(L0 + 0.6, 28)}M${Pp(-0.6, 28)}H${r(X(L0 + 0.6))}`;
    t += `M${Pp(0.5, 28.6)}L${Pp(2.6, 37.3)}H${r(X(L0 - 2.6))}L${Pp(L0 - 0.5, 28.6)}`;
    t += `M${Pp(1.8, 33)}H${r(X(L0 - 1.8))}`;
    for (const x of [8, 17, 26, 35, 44]) {
      t += `M${Pp(x, 28)}V${r(Y(37.3))}`;
      z += `M${Pp(x, 28.2)}L${Pp(x - 3.6, 33)}M${Pp(x, 28.2)}L${Pp(x + 3.6, 33)}M${Pp(x, 33)}L${Pp(x - 3.2, 37.3)}M${Pp(x, 33)}L${Pp(x + 3.2, 37.3)}`;
      z += `M${Pp(x - 0.3, 37.3)}h6v-6h-6Z`;
    }
    for (let x = 3; x < L0 - 2; x += 1.6) z += `M${Pp(x, 37.6)}V${r(Y(38))}`;

    // Wände innen
    for (const x of [10, 19]) t += `M${Pp(x, 0)}V${r(Y(14.55))}M${Pp(x, 15)}V${r(Y(21.05))}M${Pp(x, 21.5)}V${r(Y(27.55))}`;
    t += `M${Pp(34, 5)}V${r(Y(10) + 4)}M${Pp(34, 10)}V${r(Y(14.55))}`;
    // Türen
    for (const [x, y] of [[10, 0], [19, 5], [10, 10], [19, 15], [10, 21.5]]) z += `M${Pp(x - 0.6, y)}V${r(Y(y + 2.4))}H${r(X(x + 0.6))}V${r(Y(y))}`;

    // Thronsaal: 20 m lang, 13 m hoch; Stahlgerüst mit Stützen und Fachwerkträgern, zwei Arkadenreihen, Apsis mit Podest
    const xa = 30.5, xe = 50.5, y0 = 15, y1 = 28;
    const saal = `M${Pp(xa, y0)}V${r(Y(y1))}H${r(X(xe))}V${r(Y(y0))}Z`;
    // Fachwerkträger unter dem Boden und unter der Decke
    const traeger = (yu, yo) => {
      let d = `M${Pp(xa, yu)}H${r(X(xe))}M${Pp(xa, yo)}H${r(X(xe))}`;
      for (let x = xa, i = 0; x < xe - 0.1; x += 1.25, i++) d += `M${Pp(x, i % 2 ? yo : yu)}L${Pp(x + 1.25, i % 2 ? yu : yo)}`;
      return d;
    };
    st += traeger(13.6, 15) + traeger(28, 29.4);
    // Stützen der Arkaden (Stahlkern), in zwei Reihen übereinander
    const stuetzen = [32.4, 35.8, 39.2, 42.6, 46];
    for (const x of stuetzen) {
      st += `M${Pp(x - 0.15, 15)}V${r(Y(28))}M${Pp(x + 0.15, 15)}V${r(Y(28))}`;
      sz += `M${Pp(x - 0.5, 20.2)}H${r(X(x + 0.5))}M${Pp(x - 0.5, 26.2)}H${r(X(x + 0.5))}M${Pp(x - 0.4, 15.4)}H${r(X(x + 0.4))}`;
    }
    // Arkadenbögen
    const bogenR = (xl, xr, yk) => `M${Pp(xl, yk)}A${r((xr - xl) / 2 * s)} ${r((xr - xl) / 2 * s)} 0 0 1 ${Pp(xr, yk)}`;
    let ark = '';
    const reihe = [xa + 0.3, ...stuetzen, 49.2];
    for (let i = 0; i < reihe.length - 1; i++) {
      ark += bogenR(reihe[i] + 0.15, reihe[i + 1] - 0.15, 20.2) + bogenR(reihe[i] + 0.15, reihe[i + 1] - 0.15, 26.2);
    }
    ark += `M${Pp(xa, 21.5)}H${r(X(xe))}M${Pp(xa, 21.1)}H${r(X(xe))}`;
    for (let x = xa + 0.3; x < xe; x += 0.5) sz += `M${Pp(x, 21.5)}V${r(Y(22.3))}`;
    sz += `M${Pp(xa, 22.3)}H${r(X(xe))}`;
    // Apsis mit Podest und Stufen
    ark += `M${Pp(49.2, 15)}V${r(Y(25))}` + `M${Pp(49.2, 25)}A${r(1.3 * s)} ${r(1.3 * s)} 0 0 1 ${Pp(50.5, 26.3)}`;
    for (let k = 0; k < 4; k++) sz += `M${Pp(46.8 + k * 0.6, 15 + k * 0.3)}V${r(Y(15.3 + k * 0.3))}H${r(X(50.5))}`;
    // Leuchter
    sz += `M${Pp(40.6, 27.55)}V${r(Y(24.6))}` + kreis(X(40.6), Y(24), 0.9 * s) + `M${Pp(39.4, 24)}H${r(X(41.8))}`;
    for (let i = 0; i < 7; i++) sz += `M${Pp(39.7 + i * 0.3, 24)}v-6`;

    // Speiseaufzug: Schacht, Kabine, Seile, Umlenkrolle
    t += `M${Pp(25, 0)}V${r(Y(14.55))}M${Pp(28, 0)}V${r(Y(14.55))}`;
    l += `M${Pp(25.4, 6.5)}h${r(2.2 * s)}v${r(-3 * s)}h${r(-2.2 * s)}Z`;
    z += `M${Pp(25.4, 5.3)}H${r(X(27.6))}M${Pp(26.5, 6.5)}V${r(Y(13.6))}M${Pp(27.6, 13.6)}V${r(Y(9.4))}` + kreis(X(27), Y(13.6), 0.6 * s);
    z += `M${Pp(27.3, 9.4)}h6v-14h-6Z`;
    for (const y of [0, 5, 10]) z += `M${Pp(25, y + 0.2)}V${r(Y(y + 2.4))}`;

    // Warmluftheizung: Ofen mit Feuerraum und Rost, Warmluftkanal im Mauerwerk mit Gittern je Geschoss
    l += `M${Pp(38, 0)}V${r(Y(3.5))}H${r(X(46))}V${r(Y(0))}`;
    z += `M${Pp(39.4, 0.6)}V${r(Y(2.2))}A${r(1.2 * s)} ${r(1.2 * s)} 0 0 1 ${Pp(41.8, 2.2)}V${r(Y(0.6))}Z`;
    for (let x = 39.7; x < 41.6; x += 0.45) z += `M${Pp(x, 0.9)}V${r(Y(1.4))}`;
    z += `M${Pp(43, 0.8)}h${r(2.2 * s)}v${r(-1.6 * s)}h${r(-2.2 * s)}Z`;
    t += `M${Pp(46, 3)}H${r(X(47.6))}V${r(Y(14.55))}M${Pp(46, 3.6)}H${r(X(47))}V${r(Y(14.55))}`;
    for (const y of [6.5, 11.5]) z += `M${Pp(46.4, y)}h-6M${Pp(46.4, y + 0.4)}h-6M${Pp(46.4, y + 0.8)}h-6`;
    for (const x of [40, 42, 44]) {
      t += `M${Pp(x, 3.5)}q5 -10 0 -20q-5 -10 0 -20q5 -10 0 -20q-5 -10 0 -20l-5 7m5 -7l5 7`;
    }

    // fließendes Wasser: Steigleitung mit Zapfstelle in jedem Geschoss
    z += `M${Pp(22.6, 0)}V${r(Y(26))}M${Pp(22.9, 0)}V${r(Y(26))}`;
    for (const y of [1.6, 6.6, 11.6, 16.6, 23]) z += `M${Pp(22.9, y)}h8v6`;

    body += pfad('l', l) + pfad('t', t) + pfad('t', ark) + pfad('z', z);
    body += `<g class="akzent">${pfad('t', st)}${pfad('z', sz)}</g>` + pfad('a', saal);
    body += boden(X(-2), X(L0 + 1.2), g);

    const lx = X(L0) + 26;
    body += pfad('t', `M${r(X(L0) + 5)} ${r(Y(24))}H${lx - 6}`) + text(lx, Y(24) + 4, 'Thronsaal', 'gross akz') +
      text(lx, Y(24) + 38, 'Stahlgerüst', 'akz') + text(lx, Y(24) + 70, '20 m lang,', 'akz') + text(lx, Y(24) + 102, '13 m hoch', 'akz');
    body += pfad('t', `M${r(X(28))} ${r(Y(9))}H${r(X(37.6))}M${r(X(47.8))} ${r(Y(9))}H${lx - 6}`) + text(lx, Y(9) + 4, 'Speiseaufzug', 'gross');
    body += pfad('t', `M${r(X(46))} ${r(Y(1.5))}H${lx - 6}`) + text(lx, Y(1.5) + 4, 'Heizung', 'gross') + text(lx, Y(1.5) + 38, 'mit warmer Luft');
    return svg(900, 556, body);
  }

  Object.assign(Zeichnung, { neuschwansteinAnsicht, neuschwansteinKran, palasSchnitt });
})();
