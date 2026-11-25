// Zeichnungen: Flughafen Berlin Brandenburg (BER) in Schönefeld. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Nordbahn 3600 m, Südbahn 4000 m, Abstand der Bahnen 1900 m, Versatz 1250 m, Terminal in der Mitte zwischen
// den Bahnen; Hauptgebäude Terminal 1 32 m hoch (Ansicht nur als Ausschnitt), Hauptpier 715 m; nach Baubeginn ein zusätzliches Geschoss;
// ursprünglich geplante Entrauchung: Rauch über Ventilatoren erst in den Keller, dann seitwärts nach außen.
// Ohne Maßzahl und nur nach Fotos und Plänen vereinfacht: Rollwege, Form der Piers, Dachüberstand, Stützen, Fassade,
// Vorfahrt, Zahl und Höhe der Geschosse, Lage von Schacht und Ventilator. Bahnen waagerecht statt in ihrer Richtung.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV, massH } = Z;

  // Lageplan: Südbahn von 0 bis 4000 m, Nordbahn um 1250 m nach Osten versetzt (Ostenden), 1900 m nördlich
  // beschriftet: Namen der Bahnen, Terminal, Abstand; akzent: Terminal gelb
  function berLageplan({ beschriftet = false, reel = false } = {}) {
    const zeigen = beschriftet && !reel;
    const s = 820 / 5250, ox = 40;
    const oben = zeigen ? 76 : 30;
    const X = m => ox + m * s, Y = m => oben + (1900 - m) * s; // m: Abstand nach Norden von der Südbahn
    const bahn = (x1, x2, y, b) => `M${r(X(x1))} ${r(Y(y) - b / 2)}H${r(X(x2))}V${r(Y(y) + b / 2)}H${r(X(x1))}Z`;
    let body = '';
    // Rollwege parallel zu den Bahnen, kurze Abzweige zur Bahn, zwei Verbindungen über das Vorfeld (schematisch)
    let rw = `M${r(X(1650))} ${r(Y(1740))}H${r(X(5250))}M${r(X(0))} ${r(Y(160))}H${r(X(4000))}`;
    for (const x of [1900, 2700, 3500, 4300, 5000]) rw += `M${r(X(x))} ${r(Y(1900))}V${r(Y(1740))}`;
    for (const x of [250, 1050, 1850, 2650, 3450, 3750]) rw += `M${r(X(x))} ${r(Y(0))}V${r(Y(160))}`;
    rw += `M${r(X(2200))} ${r(Y(1740))}V${r(Y(160))}M${r(X(3950))} ${r(Y(1740))}V${r(Y(160))}`;
    body += pfad('t', rw);
    // Vorfeld vor dem Terminal
    body += pfad('d', `M${r(X(2350))} ${r(Y(1560))}H${r(X(3800))}V${r(Y(340))}H${r(X(2350))}Z`);
    // Bahnen
    body += `<path class="lf" d="${bahn(1650, 5250, 1900, 16)}"/><path class="lf" d="${bahn(0, 4000, 0, 18)}"/>`;
    // Mittellinien gestrichelt
    body += pfad('d', `M${r(X(1750))} ${r(Y(1900))}H${r(X(5150))}M${r(X(100))} ${r(Y(0))}H${r(X(3900))}`);
    // Terminal: Hauptpier 715 m (Nord–Süd), Hauptgebäude östlich davon, Seitenpiers nach Osten
    const px = 3000, pm = 950, ph = 715, pb = 14, ab = 10, al = 46;
    const x0 = X(px), y1 = Y(pm + ph / 2), y2 = Y(pm - ph / 2);
    const term = `M${r(x0)} ${r(y1)}h${pb}V${r(y2)}h${-pb}Z` +
      `M${r(x0 + pb)} ${r(y1)}h${al}v${ab}h${-al}Z` +
      `M${r(x0 + pb)} ${r(y2 - ab)}h${al}v${ab}h${-al}Z` +
      `M${r(x0 + pb + 10)} ${r(Y(pm) - 22)}h36v44h-36Z`;
    body += `<g class="akzent"><path class="lf" d="${term}"/></g>`;
    let H = Math.round(Y(0) + 40);
    if (zeigen) {
      body += text(X(1650), Y(1900) - 30, 'Nordbahn 3,6 km', 'gross');
      body += text(X(0), Y(0) + 56, 'Südbahn 4 km', 'gross');
      body += pfad('t', `M${r(x0 + pb + 50)} ${r(Y(pm))}H${r(X(3950) + 22)}`);
      body += text(X(3950) + 28, Y(pm) + 12, 'Terminal', 'gross akz');
      const xm = X(1500);
      body += pfad('t', `M${r(xm - 10)} ${r(Y(1900))}H${r(X(1650) - 4)}`);
      body += massV(xm, Y(1900), Y(0) - 10, '1900 m', -1, 40);
      H = Math.round(Y(0) + 80);
    }
    return svg(900, H, body);
  }

  // Ansicht des Terminals 1 von der Vorfahrt (Ausschnitt aus der Mitte): großes Flachdach auf schlanken Stützen,
  // Glasfassade, Vorfahrt auf Stelzen. Höhe 32 m als Proportion. akzent: 'geschoss' hebt ein Geschoss hervor
  function berTerminal({ akzent = '', reel = false } = {}) {
    const s = 6.6, zeigen = !reel && akzent;
    const top = zeigen ? 92 : 24;
    const X = m => 450 + m * s, Y = h => top + (32 - h) * s;
    const G = Y(0), L = -66, R = 66;
    const id = `bt-${akzent}-${reel ? 1 : 0}`;
    let inner = '';
    // Fassade, Geschosse (schematisch), Pfosten
    inner += pfad('l', `M${r(X(L))} ${r(Y(28.5))}H${r(X(R))}`);
    let gl = '';
    for (const h of [7, 14, 21]) gl += `M${r(X(L))} ${r(Y(h))}H${r(X(R))}`;
    inner += pfad('t', gl);
    let pf = '';
    for (let m = L; m <= R; m += 7.5) pf += `M${r(X(m))} ${r(Y(7))}V${r(Y(28.5))}`;
    inner += pfad('z', pf);
    if (akzent === 'geschoss') {
      inner += `<g class="akzent"><path class="lf" d="M${r(X(L))} ${r(Y(21))}H${r(X(R))}V${r(Y(14))}H${r(X(L))}Z"/></g>`;
    }
    // Dach
    inner += `<path class="lf" d="M${r(X(L))} ${r(Y(28.5))}H${r(X(R))}V${r(Y(32))}H${r(X(L))}Z"/>`;
    inner += pfad('t', `M${r(X(L))} ${r(Y(30.2))}H${r(X(R))}`);
    // Stützen vor der Fassade
    let st = '';
    for (const m of [-56, -28, 0, 28, 56]) st += `M${r(X(m) - 5)} ${r(Y(28.5))}V${r(G)}M${r(X(m) + 5)} ${r(Y(28.5))}V${r(G)}`;
    inner += pfad('l', st);
    // Vorfahrt auf Stelzen
    inner += `<path class="lf" d="M${r(X(L))} ${r(Y(7))}H${r(X(R))}V${r(Y(5.4))}H${r(X(L))}Z"/>`;
    let vs = '';
    for (let m = -63; m <= 63; m += 9) vs += `M${r(X(m))} ${r(Y(5.4))}V${r(G)}`;
    inner += pfad('t', vs);
    let body = `<clipPath id="${id}"><rect x="20" y="0" width="860" height="${r(G + 30)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    body += boden(20, 880, G);
    if (zeigen) {
      body += pfad('t', `M${r(X(-30))} ${r(Y(17.5))}L${r(X(-42))} ${r(top - 26)}`);
      body += text(40, top - 36, 'ein Geschoss mehr', 'gross akz');
    }
    return svg(900, Math.round(G + 24), body);
  }

  // Schnitt (Ausschnitt): geplanter Weg des Rauchs aus dem oberen Geschoss über Ventilatoren in den Keller und seitwärts hinaus
  function berRauch({ reel = false } = {}) {
    const zeigen = !reel;
    const s = 9.5, X = m => 50 + m * s, Y = h => 40 + (38 - h) * s;
    let body = '';
    // Geschossdecken (schematisch), Kellersohle und Dach, Ausschnitt
    let d = '';
    for (const h of [0, 9, 18, 27]) d += `M${r(X(0))} ${r(Y(h))}H${r(X(78))}`;
    body += pfad('l', d);
    body += `<path class="hf" d="M${r(X(0))} ${r(Y(-8))}H${r(X(78))}V${r(Y(-9))}H${r(X(0))}Z"/>`;
    body += `<path class="lf" d="M${r(X(-1))} ${r(Y(36))}H${r(X(79))}V${r(Y(37.4))}H${r(X(-1))}Z"/>`;
    body += pfad('t', `M${r(X(0))} ${r(Y(-8))}V${r(Y(36))}`);
    body += pfad('l', `M${r(X(78))} ${r(Y(-8))}V${r(Y(36))}`);
    // Stützen
    let st = '';
    for (const m of [20, 40, 60]) st += `M${r(X(m))} ${r(Y(-8))}V${r(Y(36))}`;
    body += pfad('z', st);
    // Rauch unter dem Dach des oberen Geschosses
    let w = '';
    for (let m = 22; m < 42; m += 4.2) w += `M${r(X(m))} ${r(Y(33))}q10 -14 20 0`;
    body += pfad('t', w);
    // Weg des Rauchs: zum Schacht, hinunter in den Keller, seitwärts hinaus (gelb)
    const sx = 52;
    const weg = `M${r(X(36))} ${r(Y(30.5))}H${r(X(sx))}V${r(Y(-4))}H${r(X(80))}`;
    body += pfad('bgl', weg) + `<g class="akzent">${pfad('l', weg)}</g>`;
    body += `<path class="af" d="M${r(X(80))} ${r(Y(-4) - 12)}l22 12l-22 12Z"/>`;
    body += pfad('a', `M${r(X(sx) - 10)} ${r(Y(13))}l10 18l10 -18`);
    // Ventilator im Keller
    const vx = X(66), vy = Y(-4);
    body += `<path class="lf" d="${kreis(vx, vy, 26)}"/>`;
    body += pfad('t', `M${r(vx)} ${r(vy)}l0 -20M${r(vx)} ${r(vy)}l17 10M${r(vx)} ${r(vy)}l-17 10`);
    if (zeigen) {
      body += text(X(2), Y(30), 'Rauch', 'gross');
      body += text(X(4), Y(-4) + 13, 'Keller', 'gross');
    }
    return svg(900, Math.round(Y(-9) + 12), body);
  }

  Object.assign(Zeichnung, { berLageplan, berTerminal, berRauch });
})();
