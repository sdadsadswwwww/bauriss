// Zeichnungen: Freiheitsstatue, New York. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Statue 46,05 m (Sockeloberkante bis Fackel), Boden bis Sockeloberkante 46,94 m, gesamt 92,99 m;
// Taille 10,67 m breit, Kopf 3,05 m breit, Scheitel 33,86 m über der Ferse, Tafel 7,19 × 4,14 m, sieben Strahlen;
// Sockel 27,13 m hoch, Seitenlänge unten 18,90 m, oben 12,01 m; Kupferhaut 2,4 mm auf einem Eisengerüst von Eiffel;
// 214 Kisten; 8.000 Fässer Zement von Dyckerhoff.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Umriss von Gewand, Arm, Fackel und Krone, Stufen des Fundaments,
// Mauern von Fort Wood, Gliederung des Sockels, Form des Gerüsts, Schiff, Kisten und Fässer.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV } = Z;

  const STATUE = 46.05, GESAMT = 92.99, SOCKEL = 46.94;
  const poly = (X, Y, pts) => 'M' + pts.map(([x, h]) => `${r(X(x))} ${r(Y(h))}`).join('L') + 'Z';

  // Statue: x = Mitte, y0 = Fußpunkt (Oberkante Sockel) in Pixeln. Liefert Flächen und Linien.
  function statue(x, y0, s, { offen = false } = {}) {
    const X = m => x + m * s, Y = h => y0 - h * s;
    const koerper = poly(X, Y, [
      [-5.4, 0], [-5.3, 6], [-4.9, 14], [-4.7, 21], [-4.9, 27.5], [-6.0, 34], [-6.6, 39.6],
      [-4.9, 39.6], [-4.2, 34], [-3.4, 29.4], [-1.0, 29.9], [1.0, 29.9], [3.6, 29.2], [4.7, 27.6],
      [4.9, 21], [5.2, 14], [5.3, 6], [5.4, 0]
    ]);
    const kopf = kreis(X(0), Y(31.3), 1.6 * s);
    let strahlen = '';
    for (let i = 0; i < 7; i++) {
      const w = (-72 + i * 24) * Math.PI / 180;
      const a = [X(1.6 * Math.sin(w)), Y(31.3 + 1.6 * Math.cos(w))], b = [X(4.3 * Math.sin(w)), Y(31.3 + 4.3 * Math.cos(w))];
      strahlen += `M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`;
    }
    const tafel = poly(X, Y, [[2.0, 15.4], [6.0, 16.6], [5.1, 23.6], [1.2, 22.4]]);
    const becher = poly(X, Y, [[-7.6, 40.0], [-3.9, 40.0], [-4.5, 42.3], [-7.0, 42.3]]);
    const flamme = `M${r(X(-6.9))} ${r(Y(42.3))}Q${r(X(-7.2))} ${r(Y(44.6))} ${r(X(-5.75))} ${r(Y(STATUE))}Q${r(X(-4.3))} ${r(Y(44.6))} ${r(X(-4.6))} ${r(Y(42.3))}Z`;
    // Falten des Gewands, wenige
    const falten = `M${r(X(-2.6))} ${r(Y(1))}L${r(X(-1.8))} ${r(Y(18))}M${r(X(0.6))} ${r(Y(1))}L${r(X(0.2))} ${r(Y(13))}M${r(X(-4.4))} ${r(Y(22))}L${r(X(3.8))} ${r(Y(25))}`;
    const fl = cls => `<path class="${cls}" d="${koerper}"/><path class="${cls}" d="${kopf}"/>`;
    const teile = offen
      ? pfad('l', koerper + kopf + strahlen + tafel + becher + flamme)
      : fl('lf') + pfad('l', strahlen) + `<path class="lf" d="${tafel}"/><path class="lf" d="${becher}"/><path class="lf" d="${flamme}"/>` + pfad('t', falten);
    return teile;
  }

  // Sockel mit Fundament und Mauern von Fort Wood; g = Bodenlinie
  function sockel(x, g, s) {
    const X = m => x + m * s, Y = h => g - h * s;
    const fort = poly(X, Y, [[-42, 0], [-40, 6], [40, 6], [42, 0]]);
    const fund = poly(X, Y, [[-14, 6], [-14, 11], [-12.5, 11], [-12.5, 15.5], [-11, 15.5], [-11, 19.8], [11, 19.8], [11, 15.5], [12.5, 15.5], [12.5, 11], [14, 11], [14, 6]]);
    const sock = poly(X, Y, [[-9.45, 19.8], [-9.45, 24], [-7.6, 25.5], [-7.2, 37.5], [-7.8, 38.5], [-7.8, 42.5], [-6.6, 43.5], [-6.0, SOCKEL], [6.0, SOCKEL], [6.6, 43.5], [7.8, 42.5], [7.8, 38.5], [7.2, 37.5], [7.6, 25.5], [9.45, 24], [9.45, 19.8]]);
    let t = '';
    for (const m of [-5, -2.5, 0, 2.5, 5]) t += `M${r(X(m - 0.7))} ${r(Y(39))}V${r(Y(42))}H${r(X(m + 0.7))}V${r(Y(39))}`;
    t += `M${r(X(-7.4))} ${r(Y(30))}H${r(X(7.4))}`;
    for (const m of [-30, -20, 20, 30]) t += `M${r(X(m))} ${r(Y(1))}V${r(Y(5))}`;
    return { fort, fund, sock, t };
  }

  // Ganzes Denkmal auf der Insel. akzent: '' | 'statue'; teilung: Beschriftung Frankreich/USA
  function libertyAnsicht({ hoehe = 450, akzent = '', mass = true, teilung = false, reel = false } = {}) {
    const oben = 16, unten = teilung ? 22 : 30;
    const s = (hoehe - oben - unten) / GESAMT, g = hoehe - unten, x = 450;
    const so = sockel(x, g, s);
    let body = `<path class="lf" d="${so.fort}"/><path class="lf" d="${so.fund}"/>`;
    const sockelFl = `<path class="lf" d="${so.sock}"/>` + pfad('t', so.t);
    body += sockelFl;
    const st = statue(x, g - SOCKEL * s, s);
    body += akzent === 'statue' ? `<g class="akzent">${st}</g>` : st;
    body += boden(20, 880, g);
    if (!reel && mass) body += massV(x + 230, g - GESAMT * s, g, '93 m', 1, 40);
    if (!reel && teilung) {
      const ys = g - (SOCKEL + 22) * s, yk = g - 33 * s;
      body += pfad('t', `M${r(x + 6.5 * s)} ${r(ys)}H${r(x + 150)}M${r(x + 10 * s)} ${r(yk)}H${r(x + 150)}`);
      body += text(x + 162, ys + 14, 'Frankreich', 'gross akz');
      body += text(x + 162, yk + 14, 'USA', 'gross');
    }
    return svg(900, hoehe, body);
  }

  // Statue allein, Haut offen, darin Eiffels Gerüst (für bild-rechts)
  function libertyGeruest({ reel = false } = {}) {
    const s = 16, W = 430, H = 850, x = 160, y0 = H - 56;
    const X = m => x + m * s, Y = h => y0 - h * s;
    let body = statue(x, y0, s, { offen: true });
    // Pylon: vier Pfosten, sich verjüngend, wenige Kreuzverbände
    const lagen = [0, 7, 14, 21, 28];
    const breit = h => 2.6 - h * 0.035;
    let p = `M${r(X(-breit(0)))} ${r(Y(0))}L${r(X(-breit(28)))} ${r(Y(28))}M${r(X(breit(0)))} ${r(Y(0))}L${r(X(breit(28)))} ${r(Y(28))}`;
    for (let i = 0; i < lagen.length; i++) {
      const h = lagen[i];
      p += `M${r(X(-breit(h)))} ${r(Y(h))}H${r(X(breit(h)))}`;
      if (i < lagen.length - 1) {
        const h2 = lagen[i + 1];
        p += `M${r(X(-breit(h)))} ${r(Y(h))}L${r(X(breit(h2)))} ${r(Y(h2))}M${r(X(breit(h)))} ${r(Y(h))}L${r(X(-breit(h2)))} ${r(Y(h2))}`;
      }
    }
    // Arm: Träger vom Pylon zur Fackel
    p += `M${r(X(-breit(28)))} ${r(Y(28))}L${r(X(-5.6))} ${r(Y(39.6))}M${r(X(-breit(21)))} ${r(Y(24))}L${r(X(-5.2))} ${r(Y(38))}`;
    // Nebengerüst zur Haut, ausgedünnt
    let n = '';
    for (const h of [7, 21]) n += `M${r(X(-breit(h)))} ${r(Y(h))}L${r(X(-4.9))} ${r(Y(h + 1))}M${r(X(breit(h)))} ${r(Y(h))}L${r(X(5.0))} ${r(Y(h + 1))}`;
    body += pfad('t', n) + pfad('a', p);
    body += pfad('l', `M20 ${r(y0)}H${W - 20}`) + pfad('t', `M${r(X(-7))} ${r(y0)}v30M${r(X(7))} ${r(y0)}v30`);
    if (!reel) {
      body += pfad('t', `M${r(X(5.25))} ${r(Y(10))}H${r(W - 155)}M${r(X(1.4))} ${r(Y(4))}H${r(W - 155)}`);
      body += text(W - 145, Y(10) - 16, 'Kupfer', '', '');
      body += text(W - 145, Y(4) + 40, 'Eisen', 'akz');
    }
    return svg(W, H, body);
  }

  // Fregatte im Schnitt, im Rumpf die Kisten
  function libertySchiff({ reel = false } = {}) {
    const H = 450, deck = 250, kiel = 360;
    let body = '';
    // Wasser zuerst, der Rumpf deckt es ab
    let w = 'M20 330';
    for (let x = 20; x < 880; x += 40) w += `q10 -10 20 0t20 0`;
    body += pfad('t', w);
    const rumpf = `M60 ${deck}H840L800 ${kiel - 20}Q790 ${kiel} 760 ${kiel}H140Q110 ${kiel} 100 ${kiel - 25}Z`;
    body += `<path class="lf" d="${rumpf}"/>`;
    // Kisten in zwei Lagen
    let k = '';
    for (let reihe = 0; reihe < 2; reihe++) {
      const y = deck + 14 + reihe * 42;
      const x0 = reihe ? 170 : 130, n = reihe ? 12 : 14;
      for (let i = 0; i < n; i++) k += `M${x0 + i * 46} ${y}h38v34h-38Z`;
    }
    body += `<g class="akzent"><path class="lf" d="${k}"/></g>`;
    // Masten, Rahen, Schornstein
    let m = '';
    for (const [xm, hm] of [[250, 60], [450, 40], [640, 70]]) m += `M${xm} ${deck}V${hm}M${xm - 60} ${hm + 50}h120M${xm - 46} ${hm + 110}h92`;
    body += pfad('l', m) + `<path class="lf" d="M532 ${deck}V170h36V${deck}Z"/>`;
    body += pfad('t', `M60 ${deck}L250 70M840 ${deck}L640 80`);
    if (!reel) body += `<rect class="platte" x="300" y="${kiel + 28}" width="300" height="50" rx="6"/>` + text(450, kiel + 66, '214 Kisten', 'gross akz', 'text-anchor="middle"');
    return svg(900, H, body);
  }

  // Sockel im Schnitt (Beton, schraffiert) und daneben Zementfässer
  function libertySockel({ reel = false } = {}) {
    const H = 540, g = 500, s = 10, x = 330;
    const X = m => x + m * s, Y = h => g - h * s;
    const so = sockel(x, g, s);
    let body = `<path class="hf" d="${so.fund}"/><path class="hf" d="${so.sock}"/>`;
    // Hohlraum im Inneren: Treppenschacht
    body += `<path class="lf" d="${poly(X, Y, [[-3.2, 21], [-3.2, SOCKEL - 0.6], [3.2, SOCKEL - 0.6], [3.2, 21]])}"/>`;
    body += pfad('t', `M${r(X(-3.2))} ${r(Y(30))}H${r(X(3.2))}M${r(X(-3.2))} ${r(Y(38))}H${r(X(3.2))}`);
    body += boden(20, 880, g);
    // Fässer: drei Lagen, gestapelt
    let f = '', b = '';
    const fass = (cx, yb) => {
      f += `M${cx - 30} ${yb}Q${cx - 38} ${yb - 40} ${cx - 30} ${yb - 80}H${cx + 30}Q${cx + 38} ${yb - 40} ${cx + 30} ${yb}Z`;
      b += `M${cx - 34} ${yb - 22}H${cx + 34}M${cx - 34} ${yb - 58}H${cx + 34}`;
    };
    for (let i = 0; i < 4; i++) fass(560 + i * 82, g);
    for (let i = 0; i < 3; i++) fass(601 + i * 82, g - 82);
    for (let i = 0; i < 2; i++) fass(642 + i * 82, g - 164);
    body += `<g class="akzent"><path class="lf" d="${f}"/></g>` + pfad('a', b);
    if (!reel) {
      body += text(683, g - 290, '8.000 Fässer', 'gross akz', 'text-anchor="middle"');
      body += pfad('t', `M${r(X(-4.5))} ${r(Y(33))}L${r(X(-14))} ${r(Y(33))}`);
      body += text(X(-14) - 10, Y(33) + 14, 'Beton', 'gross', 'text-anchor="end"');
    }
    return svg(900, H, body);
  }

  Object.assign(Zeichnung, { libertyAnsicht, libertyGeruest, libertySchiff, libertySockel });
})();
