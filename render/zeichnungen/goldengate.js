// Zeichnungen: Golden Gate Bridge, San Francisco. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Hauptspannweite 1280 m, Seitenfelder je 343 m, Pylone 227 m über dem Wasser, Durchfahrtshöhe 67 m,
// Fachwerkträger 7,6 m hoch, Brücke 27 m breit, Netz 3 m (10 ft) über die Träger hinaus, Kabel 92 cm mit 61 Bündeln
// zu rund 452 Drähten (61 × 452 = 27.572), Südpfeiler 34 m unter Niedrigwasser gegründet und 13 m (44 ft) über das Wasser.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Kabeldurchhang, Abstand der Hänger und Fachwerkfelder, Abstufung und
// Rippen der Pylone, Schutzring, Geländeform, Wassertiefe, Ankerblöcke, Zugangssteg, Querschnitt der Fahrbahn.
// Lesbare Vorlage (seit 21.11.2026): Mit lesbar: true zeichnet jede Funktion ruhig, ohne Achsen, Koten und Kleinteile,
// mit ausgedünnten Hängern, Fachwerken und Bündeln und höchstens vier großen Beschriftungen (Schrift 34/40/60 px, Linien ab 2 px).
(function () {
  const { r, svg, pfad, text, kreis, massV, massH } = Z;

  const SPANN = 1280, SEITE = 343, TURM = 227, DECK = 67, TRAEGER = 7.6, SATTEL = 224, TIEF = 80;

  // ---- CAD-Zeichen: Achse mit Kreis oben, Höhenkote (Dreieck auf der Höhe, Text darüber oder darunter) ----
  function achse(x, yU, yO, name) {
    return pfad('ax', `M${r(x)} ${r(yU)}V${r(yO)}`) + pfad('m', kreis(x, yO - 15, 15)) +
      text(x, yO - 7, name, 'achse', 'text-anchor="middle"');
  }
  function kote(x, y, inhalt, seite = 1, unten = false, kl = 'kote') {
    const d = `M${r(x)} ${r(y)}l-8 ${unten ? 14 : -14}h16zM${r(x)} ${r(y)}h${r(seite * 92)}`;
    return pfad('m', d) + text(x + seite * 16, unten ? y + 32 : y - 8, inhalt, kl, seite > 0 ? '' : 'text-anchor="end"');
  }
  const wellen = (x1, x2, y, schritt = 60) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += schritt) d += `M${r(x)} ${r(y)}q8 -6 17 0t17 0`;
    return d;
  };

  // Höhe der Kabel über dem Wasser an der Stelle x (0 = Südpylon, 1280 = Nordpylon)
  function kabel(x) {
    if (x >= 0 && x <= SPANN) return TIEF + (SATTEL - TIEF) * ((x - SPANN / 2) / (SPANN / 2)) ** 2;
    const t = x < 0 ? (x + SEITE) / SEITE : (SPANN + SEITE - x) / SEITE;
    return DECK + 4 + (SATTEL - DECK - 4) * (0.35 * t + 0.65 * t * t);
  }
  // Hänger: Hauptfeld 84 Felder, Seitenfelder je 22 Felder (schematisch)
  function haenger() {
    const xs = [];
    for (let i = 1; i < 84; i++) xs.push((SPANN * i) / 84);
    for (let i = 1; i < 22; i++) xs.push(-SEITE + (SEITE * i) / 22, SPANN + (SEITE * i) / 22);
    return xs.sort((a, b) => a - b);
  }
  // Abstufungen des Pylons in Seitenansicht: [von, bis, halbe Tiefe]
  const STUFEN = [[13, 75, 10.5], [75, 125, 9.4], [125, 165, 8.3], [165, 200, 7.3], [200, 222, 6.3], [222, TURM, 5.4]];

  // Pylon in Seitenansicht: Umriss als deckende Fläche, Rippen, Bänder, Sattelhaube
  function pylon(X, Y, x) {
    let pts = [];
    STUFEN.forEach(([a, b, hw], i) => {
      const fase = i ? Math.min(0.9, STUFEN[i - 1][2] - hw) : 0;
      pts.push([x - hw - fase, a], [x - hw, a + fase], [x - hw, b]);
    });
    const rechts = pts.map(([px, h]) => [2 * x - px, h]).reverse();
    pts = pts.concat(rechts);
    const umriss = pts.map(([px, h], i) => `${i ? 'L' : 'M'}${r(X(px))} ${r(Y(h))}`).join('') + 'Z';
    let t = '', z = '';
    STUFEN.forEach(([a, b, hw], i) => {
      if (i === STUFEN.length - 1) return;
      // Rippen: zwei vertiefte Felder je Stufe
      for (const v of [-1, 1]) {
        z += `M${r(X(x + v * (hw - 1.4)))} ${r(Y(a + 2.5))}V${r(Y(b - 3.5))}`;
        z += `M${r(X(x + v * (hw - 2.6)))} ${r(Y(a + 2.5))}V${r(Y(b - 3.5))}`;
      }
      z += `M${r(X(x))} ${r(Y(a + 2.5))}V${r(Y(b - 3.5))}`;
      // Band unter jedem Rücksprung, Stoßfugen
      t += `M${r(X(x - hw))} ${r(Y(b - 2.5))}H${r(X(x + hw))}M${r(X(x - hw))} ${r(Y(a + 1.5))}H${r(X(x + hw))}`;
      for (let h = a + 10; h < b - 6; h += 10) z += `M${r(X(x - hw + 0.4))} ${r(Y(h))}H${r(X(x - hw + 1.4))}M${r(X(x + hw - 1.4))} ${r(Y(h))}H${r(X(x + hw - 0.4))}`;
    });
    // Sattelhaube auf dem Turmkopf
    const hk = STUFEN[STUFEN.length - 1][2];
    t += `M${r(X(x - hk))} ${r(Y(SATTEL - 1))}H${r(X(x + hk))}`;
    t += `M${r(X(x - hk + 1))} ${r(Y(TURM))}Q${r(X(x))} ${r(Y(TURM + 2.2))} ${r(X(x + hk - 1))} ${r(Y(TURM))}`;
    z += `M${r(X(x - 2.4))} ${r(Y(SATTEL))}Q${r(X(x))} ${r(Y(SATTEL + 1.8))} ${r(X(x + 2.4))} ${r(Y(SATTEL))}`;
    return `<path class="lf" d="${umriss}"/>` + pfad('t', t) + pfad('z', z);
  }

  // Fahrbahnträger: Gurte, Pfosten, Strebenfachwerk, Fahrbahn und Geländer zwischen xa und xb
  function traeger(X, Y, xa, xb, fein) {
    const feld = SPANN / 168;
    const l = `M${r(X(xa))} ${r(Y(DECK))}H${r(X(xb))}M${r(X(xa))} ${r(Y(DECK + TRAEGER))}H${r(X(xb))}`;
    let st = '', z = '';
    const k0 = Math.ceil((xa + SEITE) / feld), k1 = Math.floor((xb + SEITE) / feld);
    for (let k = k0; k <= k1; k++) {
      const x = -SEITE + k * feld;
      st += `M${r(X(x))} ${r(Y(DECK))}V${r(Y(DECK + TRAEGER))}`;
      if (x + feld <= xb) {
        const auf = k % 2 === 0;
        st += `M${r(X(x))} ${r(Y(auf ? DECK : DECK + TRAEGER))}L${r(X(x + feld))} ${r(Y(auf ? DECK + TRAEGER : DECK))}`;
      }
      // Knotenbleche
      z += `M${r(X(x - 0.7))} ${r(Y(DECK + 0.8))}H${r(X(x + 0.7))}M${r(X(x - 0.7))} ${r(Y(DECK + TRAEGER - 0.8))}H${r(X(x + 0.7))}`;
    }
    let t = `M${r(X(xa))} ${r(Y(DECK + TRAEGER + 0.7))}H${r(X(xb))}`;
    // Geländer mit Pfosten, unterer Windverband als zweite Linie
    z += `M${r(X(xa))} ${r(Y(DECK + TRAEGER + 1.9))}H${r(X(xb))}M${r(X(xa))} ${r(Y(DECK + 0.6))}H${r(X(xb))}`;
    for (let x = Math.ceil(xa / 3) * 3; x <= xb; x += 3) z += `M${r(X(x))} ${r(Y(DECK + TRAEGER + 0.7))}V${r(Y(DECK + TRAEGER + 1.9))}`;
    if (fein) t += st; else z += st;
    return pfad('l', l) + pfad('t', t) + pfad('z', z);
  }

  // Gelände und Meeresgrund als geschnittene, schraffierte Fläche; unten = tiefste gezeichnete Höhe
  function gelaende(X, Y, von, bis, unten) {
    const sf = -SEITE - 10;
    const pts = [[von - 50, 20], [sf - 30, 20], [sf, 0], [-250, -12], [-60, -26], [0, -27], [200, -40], [640, -52],
      [1000, -44], [1200, -18], [SPANN - 40, 0], [SPANN + 30, 18], [SPANN + 160, 45], [SPANN + SEITE, DECK - 2], [bis + 60, DECK + 30]];
    const zug = p => p.map(([x, h], i) => `${i ? 'L' : 'M'}${r(X(x))} ${r(Y(h))}`).join('');
    const linie = zug(pts);
    const flaeche = linie + `L${r(X(bis + 60))} ${r(Y(unten))}L${r(X(von - 50))} ${r(Y(unten))}Z`;
    // Schichtlinien im Grund
    let z = '';
    const see = pts.filter(([x]) => x > sf && x < SPANN - 40);
    for (const tiefe of [8, 18]) z += zug(see.map(([x, h]) => [x, h - tiefe]));
    return { flaeche, linie, z };
  }

  // ausschnitt: Südpylon bis über die Mitte hinaus, groß (Titelblatt); mass: ganze Brücke mit Maßen, Kote und Ortsnamen
  function bruecke({ ausschnitt = false, mass = false, lesbar = false, reel = false } = {}) {
    if (lesbar) return ausschnitt ? brueckeNah(reel) : brueckeGanz(mass && !reel);
    const von = ausschnitt ? -95 : -420, bis = ausschnitt ? 385 : SPANN + SEITE + 77;
    const links = ausschnitt ? 20 : 80, s = (880 - links) / (bis - von);
    const H = ausschnitt ? 560 : mass ? 620 : 420;
    const g = mass ? 470 : 60 + TURM * s;
    const X = m => links + (m - von) * s, Y = h => g - h * s;
    const fein = ausschnitt;
    const unten = -(H - g - 2) / s;
    const a = Math.max(von, -SEITE), b = Math.min(bis, SPANN + SEITE);
    const id = `gg-rahmen-${ausschnitt ? 1 : 2}`;
    let body = `<clipPath id="${id}"><rect x="0" y="0" width="900" height="${r(H)}"/></clipPath>`;
    let inhalt = '';

    // Gelände, Wasser
    const gl = gelaende(X, Y, von, bis, Math.max(unten, -80));
    inhalt += `<path class="hs" d="${gl.flaeche}"/>` + pfad('z', gl.z) + pfad('l', gl.linie);
    const wA = Math.max(-SEITE - 10, von), wE = Math.min(SPANN - 40, bis);
    inhalt += pfad('l', `M${r(X(wA))} ${r(g)}H${r(X(wE))}`);
    inhalt += pfad('t', wellen(X(wA) + 24, X(wE) - 10, g + 14, ausschnitt ? 60 : 44));

    // Achsen der Pylone
    for (const [px, n] of [[0, '1'], [SPANN, '2']]) {
      if (px < von || px > bis) continue;
      inhalt += achse(X(px), Y(Math.max(unten, -45)) - 4, Y(TURM) - 22, n);
    }
    // Höhenlinien
    inhalt += pfad('hl', `M${r(X(0))} ${r(Y(TURM))}H${r(ausschnitt ? 880 : X(SPANN) + 30)}`);
    if (ausschnitt) inhalt += pfad('hl', `M${r(X(40))} ${r(Y(DECK))}H880`);

    // Hänger mit Kabelschellen
    let ht = '', hz = '';
    for (const x of haenger()) {
      if (x <= a || x >= b) continue;
      const hk = kabel(x);
      const d = `M${r(X(x))} ${r(Y(hk))}V${r(Y(DECK + TRAEGER + 0.7))}`;
      if (fein) ht += d; else hz += d;
      hz += `M${r(X(x - 0.9))} ${r(Y(hk + 0.9))}H${r(X(x + 0.9))}M${r(X(x - 0.9))} ${r(Y(hk - 0.9))}H${r(X(x + 0.9))}`;
    }
    inhalt += pfad('t', ht) + pfad('z', hz);

    // Fahrbahnträger im Hängebereich und auf den Zufahrten
    inhalt += traeger(X, Y, Math.max(von, -SEITE - 60), Math.min(bis, SPANN + SEITE + 40), fein);
    // Zufahrt San Francisco: Stützen bis auf das Gelände, Bogen über Fort Point
    if (von < -SEITE) {
      let st = '';
      for (const x of [-SEITE - 50, -SEITE - 25]) st += `M${r(X(x - 1))} ${r(Y(DECK))}V${r(Y(20))}M${r(X(x + 1))} ${r(Y(DECK))}V${r(Y(20))}`;
      inhalt += pfad('t', st);
      inhalt += pfad('l', `M${r(X(-SEITE - 70))} ${r(Y(20))}Q${r(X(-SEITE - 35))} ${r(Y(DECK + 10))} ${r(X(-SEITE))} ${r(Y(20))}`);
    }
    // Ankerblöcke
    for (const [x0, x1, hb] of [[-SEITE - 6, -SEITE + 16, 20], [SPANN + SEITE - 16, SPANN + SEITE + 6, DECK - 2]]) {
      if (x1 < von || x0 > bis) continue;
      const d = `M${r(X(x0))} ${r(Y(hb))}V${r(Y(DECK + 9))}H${r(X(x1))}V${r(Y(hb))}Z`;
      inhalt += `<path class="lf" d="${d}"/><path class="hs" d="${d}"/>`;
    }

    // Pfeiler mit Schutzring (Süd) und auf Fels (Nord)
    if (von <= 0) {
      inhalt += pfad('d', `M${r(X(-13))} ${r(Y(-34))}V${r(Y(4))}M${r(X(13))} ${r(Y(-34))}V${r(Y(4))}M${r(X(-13))} ${r(Y(-34))}H${r(X(13))}`);
      const ring = `M${r(X(-22))} ${r(Y(-29))}V${r(Y(4))}H${r(X(22))}V${r(Y(-29))}Z`;
      inhalt += `<path class="lf" d="${ring}"/>` + pfad('t', `M${r(X(-22))} ${r(Y(1.5))}H${r(X(22))}M${r(X(-22))} ${r(Y(-6))}H${r(X(22))}`);
      inhalt += `<path class="lf" d="M${r(X(-13))} ${r(Y(4))}V${r(Y(13))}H${r(X(13))}V${r(Y(4))}Z"/>`;
    }
    if (bis >= SPANN) inhalt += `<path class="lf" d="M${r(X(SPANN - 12))} ${r(Y(5))}V${r(Y(13))}H${r(X(SPANN + 12))}V${r(Y(5))}Z"/>`;
    // Pylone
    for (const px of [0, SPANN]) if (px >= von && px <= bis) inhalt += pylon(X, Y, px);

    // Kabel, an den Pylonen über den Sattel geführt
    const schritt = ausschnitt ? 2 : 4;
    const stueck = (x0, x1, dh = 0) => {
      if (x1 <= x0) return '';
      let d = '';
      for (let x = x0; x < x1 + schritt; x += schritt) {
        const xx = Math.min(x, x1);
        d += `${d ? 'L' : 'M'}${r(X(xx))} ${r(Y(kabel(xx) - dh))}`;
      }
      return d;
    };
    const hk = STUFEN[STUFEN.length - 1][2];
    inhalt += pfad('l', stueck(a, Math.min(b, -hk)) + stueck(hk, Math.min(b, SPANN - hk)) + stueck(SPANN + hk, b));
    // Unterseite des Kabels (92 cm) als zweite feine Linie
    inhalt += pfad('z', stueck(Math.max(a, hk), Math.min(b, SPANN - hk), 0.92));

    body += `<g clip-path="url(#${id})">${inhalt}</g>`;

    // Koten und Maße
    if (ausschnitt) {
      body += kote(860, Y(TURM), '+227,00', -1);
      body += kote(860, Y(DECK), '+67,00', -1, true);
      body += kote(860, g, '±0,00', -1);
    }
    if (mass) {
      body += kote(X(SPANN / 2) - 46, Y(TURM), '+227,00');
      body += massV(links - 30, Y(TURM), g, '227 m', -1);
      body += pfad('t', `M${r(links - 38)} ${r(Y(TURM))}H${r(X(0) - 12)}`);
      body += massH(X(0), X(SPANN), g + 52, '1280 m');
      body += text(links - 40, g + 130, 'San Francisco', 'gross');
      body += text(880 - 20, g + 130, 'Marin', 'gross', 'text-anchor="end"');
    }
    return svg(900, H, body);
  }

  // Südpfeiler im Schnitt: Schutzring im offenen Wasser, darin trockengepumpt
  function pfeiler({ lesbar = false, reel = false } = {}) {
    if (lesbar) return pfeilerRuhig(reel);
    const s = 8, w = 200, Yh = h => w - h * s, sohle = Yh(-34), grund = Yh(-27), H = 530;
    const fl = 420, fr = 740, pl = 490, pr = 670, cx = (pl + pr) / 2, dw = 16;
    let body = '';
    // Meeresgrund, im Ring ausgehoben bis zur Sohle
    const grundD = `M30 ${grund}H${fl - dw}V${grund + 30}H${fl}V${sohle}H${fr}V${grund + 30}H${fr + dw}V${grund}H880V${H - 6}H30Z`;
    body += `<path class="hs" d="${grundD}"/>` + pfad('l', `M30 ${grund}H${fl - dw}M${fr + dw} ${grund}H880M${fl} ${sohle}H${fr}`);
    let schicht = '';
    for (const dy of [26, 58]) schicht += `M30 ${grund + dy}q60 -8 120 0t120 0t120 0M${fr + dw} ${grund + dy}q35 -6 70 0t70 0`;
    body += pfad('z', schicht + `M${fl} ${sohle + 22}H${fr}`);
    // Schutzring: zwei geschnittene Betonwände mit Fugen
    for (const x of [fl - dw, fr]) {
      const d = `M${x} ${Yh(4)}H${x + dw}V${grund + 30}H${x}Z`;
      body += `<path class="lf" d="${d}"/><path class="hf" d="${d}"/>`;
    }
    let fugen = '';
    for (let y = Yh(4) + 40; y < grund + 20; y += 40) fugen += `M${fl - dw} ${y}h${dw}M${fr} ${y}h${dw}`;
    body += pfad('t', fugen);
    // Pfeiler bis 13 m über das Wasser, darauf die Füße des Pylons
    body += `<path class="af" d="M${pl} ${sohle}H${pr}V${Yh(13)}H${pl}Z"/>`;
    body += pfad('l', `M${pl} ${sohle}H${pr}V${Yh(13)}H${pl}Z`);
    // Ankerstangen der Pylonfüße im Pfeiler (verdeckt)
    let anker = '';
    for (const x0 of [pl + 22, pr - 58]) for (let i = 0; i <= 3; i++) anker += `M${x0 + i * 12} ${Yh(13)}V${Yh(2)}`;
    body += pfad('d', anker);
    // Pylonfüße: Fußplatten und Zellen, oben abgebrochen
    let fuss = '', zellen = '';
    for (const x0 of [pl + 18, pr - 62]) {
      fuss += `M${x0 - 6} ${Yh(13)}h56v-8h-56ZM${x0} ${Yh(13) - 8}V40M${x0 + 44} ${Yh(13) - 8}V40`;
      zellen += `M${x0 + 11} ${Yh(13) - 8}V40M${x0 + 22} ${Yh(13) - 8}V40M${x0 + 33} ${Yh(13) - 8}V40`;
      for (let y = Yh(13) - 30; y > 50; y -= 22) zellen += `M${x0} ${y}h44`;
      fuss += `M${x0 - 4} 40l10 -6l10 8l10 -8l10 8l10 -6l6 4`;
    }
    body += pfad('l', fuss) + pfad('z', zellen);
    // Wasser außen, innen trocken (Wasserstand gestrichelt)
    body += pfad('l', `M30 ${w}H${fl - dw}M${fr + dw} ${w}H880`);
    body += pfad('t', wellen(150, fl - dw - 20, w + 16) + wellen(fr + dw + 16, 860, w + 16) + wellen(60, fl - dw - 20, w + 44, 90));
    body += pfad('d', `M${fl} ${w}H${pl}M${pr} ${w}H${fr}`);
    // Zugangssteg auf Pfählen mit Kreuzverbänden, links abgebrochen
    let steg = `M44 ${w - 36}H${fl - dw}M44 ${w - 46}H${fl - dw}`;
    let verband = '';
    const pfaehle = [];
    for (let x = 80; x < fl - 30; x += 64) pfaehle.push(x);
    for (const x of pfaehle) steg += `M${x - 3} ${w - 36}V${grund}M${x + 3} ${w - 36}V${grund}`;
    for (let i = 0; i + 1 < pfaehle.length; i++) {
      const xa = pfaehle[i] + 3, xb = pfaehle[i + 1] - 3;
      verband += `M${xa} ${w - 32}L${xb} ${w - 6}M${xb} ${w - 32}L${xa} ${w - 6}`;
    }
    for (let x = 52; x < fl - dw; x += 16) verband += `M${x} ${w - 46}v-12`;
    verband += `M44 ${w - 58}H${fl - dw}`;
    body += pfad('t', steg) + pfad('z', verband);
    body += pfad('l', `M44 ${w - 64}l-8 10l12 8l-8 10l8 10l-6 8`);
    // Achse und Koten
    body += achse(cx, H - 10, 36, '1');
    body += pfad('hl', `M${pr} ${Yh(13)}H880M${pr} ${sohle}H880`);
    body += kote(862, Yh(13), '+13,00', -1) + kote(862, w, '±0,00', -1) + kote(862, sohle, '−34,00', -1, true, 'kote hell');
    // Beschriftung
    body += text(40, w - 82, 'Zugangssteg vom Ufer');
    body += pfad('t', `M${fr + 8} ${Yh(4) - 2}V52`) + text(880, 40, 'Schutzring', '', 'text-anchor="end"');
    body += text(40, 40, 'innen leer gepumpt:', 'akz') + text(40, 74, '35,6 Mio. Liter', 'akz');
    body += pfad('t', `M374 32H${(fl + pl) / 2}V300`);
    return svg(900, H, body);
  }

  // Querschnitt eines Tragkabels: 61 Bündel aus Paralleldraht, je 452 Drähte
  function kabelSchnitt({ lesbar = false, reel = false } = {}) {
    if (lesbar) return kabelRuhig(reel);
    const cx = 290, cy = 296, R = 236, d = 50, rb = 23;
    // 452 Drähte eines Bündels: Dreiecksgitter, die 452 innersten Punkte
    const gitter = [];
    const a = 1.97;
    for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) {
      const x = a * (i + j / 2), y = a * j * 0.866;
      gitter.push([x, y, x * x + y * y]);
    }
    gitter.sort((p, q) => p[2] - q[2]);
    const draehte = gitter.slice(0, 452);
    let body = `<path class="lf" d="${kreis(cx, cy, R + 7)}"/>` + pfad('t', kreis(cx, cy, R + 2));
    // Achsen
    body += pfad('ax', `M${cx - R - 34} ${cy}H${cx + R + 34}M${cx} ${cy - R - 30}V${cy + R + 22}`);
    let buendel = '', drahtD = '', akzentB = '', akzentD = '';
    let ax = 0, ay = 0;
    for (let q = -4; q <= 4; q++) {
      for (let rr = Math.max(-4, -q - 4); rr <= Math.min(4, -q + 4); rr++) {
        const x = cx + d * (q + rr / 2), y = cy + d * rr * 0.866;
        const akz = q === 4 && rr === -2;
        if (akz) { ax = x; ay = y; }
        let dd = '';
        for (const [px, py] of draehte) dd += kreis(x + px, y + py, 0.82);
        if (akz) { akzentB += kreis(x, y, rb); akzentD += dd; } else { buendel += kreis(x, y, rb); drahtD += dd; }
      }
    }
    body += pfad('z', drahtD) + pfad('t', buendel);
    body += `<g class="akzent">${pfad('z', akzentD)}</g>` + pfad('a', akzentB);
    body += pfad('l', kreis(cx, cy, R + 7));
    body += massH(cx - R - 7, cx + R + 7, cy + R + 40, '92 cm');
    body += pfad('t', `M${r(ax + 22)} ${r(ay - 12)}L590 64`);
    body += text(600, 58, '1 Bündel', 'gross akz') + text(600, 94, 'rund 452 Drähte');
    body += text(600, 166, '61 Bündel', 'gross') + text(600, 202, 'je Kabel');
    body += text(600, 274, '27.572 Drähte', 'gross') + text(600, 310, 'je 4,9 mm dick');
    return svg(900, cy + R + 86, body);
  }

  // Querschnitt der Fahrbahn mit dem Netz darunter
  function netz({ lesbar = false, reel = false } = {}) {
    if (lesbar) return netzRuhig(reel);
    const s = 18, xl = 450 - 13.5 * s, xr = 450 + 13.5 * s, top = 130, unten = top + TRAEGER * s, ueber = 3 * s, bt = 22;
    let body = '';
    // Mittelachse
    body += pfad('ax', `M450 ${r(unten + 12)}V110M450 80V64`) + pfad('m', kreis(450, 49, 15)) + text(450, 57, 'M', 'achse', 'text-anchor="middle"');
    // Hänger
    body += pfad('t', `M${r(xl + bt / 2)} 40V${top}M${r(xr - bt / 2)} 40V${top}`);
    body += pfad('z', `M${r(xl + bt / 2 - 3)} 40V${top}M${r(xr - bt / 2 + 3)} 40V${top}`);
    body += massH(xl, xr, 72, '27 m');
    // Fahrbahnplatte mit Belag, Bordsteinen und Geländern
    let l = `M${r(xl)} ${top}H${r(xr)}M${r(xl)} ${r(top + 12)}H${r(xr)}`;
    let t = '', z = `M${r(xl)} ${top - 3}H${r(xr)}`;
    for (const x of [xl + bt + 40, xr - bt - 40]) t += `M${r(x)} ${top}v-8h${x < 450 ? -10 : 10}`;
    for (const x of [xl + 4, xr - 4]) z += `M${r(x)} ${top}V${top - 26}M${r(x - 4)} ${top - 26}h8`;
    // Fahrstreifen
    for (let i = 1; i < 6; i++) {
      const x = xl + bt + 40 + (i * (xr - xl - 2 * bt - 80)) / 6;
      z += `M${r(x - 8)} ${top - 1}h16`;
    }
    // zwei Fachwerkträger
    for (const x of [xl, xr - bt]) {
      l += `M${r(x)} ${top}V${r(unten)}H${r(x + bt)}V${top}`;
      t += `M${r(x)} ${r(top + 12)}L${r(x + bt)} ${r(unten)}M${r(x + bt)} ${r(top + 12)}L${r(x)} ${r(unten)}`;
      z += `M${r(x + 4)} ${top}V${r(unten)}M${r(x + bt - 4)} ${top}V${r(unten)}`;
    }
    // Querträger als Fachwerk mit Pfosten
    const q0 = xl + bt, q1 = xr - bt, qo = top + 12, qu = unten - 6;
    l += `M${r(q0)} ${r(qu)}H${r(q1)}`;
    const nf = 8;
    for (let i = 0; i <= nf; i++) {
      const x = q0 + (i * (q1 - q0)) / nf;
      t += `M${r(x)} ${r(qo)}V${r(qu)}`;
      if (i < nf) {
        const xn = q0 + ((i + 1) * (q1 - q0)) / nf;
        t += i < nf / 2 ? `M${r(x)} ${r(qo)}L${r(xn)} ${r(qu)}` : `M${r(x)} ${r(qu)}L${r(xn)} ${r(qo)}`;
      }
    }
    // Längsträger unter der Platte
    for (let i = 1; i < 12; i++) z += `M${r(q0 + (i * (q1 - q0)) / 12 - 4)} ${r(qo)}h8v8h-8z`;
    body += pfad('z', z) + pfad('t', t) + pfad('l', l);
    // Autos auf der Fahrbahn
    let autos = '';
    for (const x of [318, 486]) autos += `M${x} ${top - 4}v-18h18l8 -12h34l8 12h18v18` + kreis(x + 18, top - 6, 7) + kreis(x + 70, top - 6, 7);
    body += pfad('t', autos);
    // Netz, an beiden Seiten 3 m über die Träger hinaus, an Auslegern gehalten
    const n0 = xl - ueber, n1 = xr + ueber, ny = unten + 26;
    const tief = x => ny + 50 * (1 - ((x - 450) / (n1 - 450)) ** 2);
    let ausleger = '';
    for (const [x, xa] of [[xl, n0], [xr, n1]]) ausleger += `M${r(x)} ${r(unten - 4)}L${r(xa)} ${r(ny)}M${r(x)} ${r(unten)}V${r(ny)}H${r(xa)}`;
    body += pfad('t', ausleger);
    let masche = '';
    for (let x = n0 + 18; x < n1 - 4; x += 18) masche += `M${r(x)} ${r(ny)}V${r(tief(x))}`;
    for (let i = 1; i <= 3; i++) {
      let d = '';
      for (let x = n0; x <= n1 + 0.1; x += 18) d += `${d ? 'L' : 'M'}${r(x)} ${r(ny + (tief(x) - ny) * (i / 4))}`;
      masche += d;
    }
    body += `<g class="akzent">${pfad('z', masche)}</g>`;
    let rand = '';
    for (let x = n0; x <= n1 + 0.1; x += 6) rand += `${rand ? 'L' : 'M'}${r(x)} ${r(tief(x))}`;
    body += pfad('a', rand + `M${r(n0)} ${r(ny)}H${r(n1)}`);
    body += massH(n0, xl, ny + 30, '3 m');
    body += massV(xl - 80, top, unten, '7,6 m', -1);
    body += text(450, ny + 112, 'Netz aus Manilaseil', 'gross akz', 'text-anchor="middle"');
    // Wasser tief unten
    body += pfad('t', wellen(60, 860, r(ny + 156)));
    body += text(450, ny + 204, '67 m tiefer: das Wasser', 'hell', 'text-anchor="middle"');
    body += pfad('t', `M${r(xr + 4)} ${r(top + 60)}L${r(xr + 70)} ${r(top + 30)}`) + text(r(xr + 76), r(top + 36), 'Träger');
    return svg(900, r(ny + 228), body);
  }

  // =============================================================================================
  // Lesbare Vorlage (lesbar: true): ruhige Fassungen ohne Achsen, Koten und Kleinteile.
  // reel: true lässt außerdem Maß- und Hinweislinien weg, weil das Reel allen Text entfernt.

  const rahmen = (id, H, inhalt) =>
    `<clipPath id="${id}"><rect x="0" y="0" width="900" height="${r(H)}"/></clipPath><g clip-path="url(#${id})">${inhalt}</g>`;
  // Kabellinie zwischen x0 und x1 (Meter), alle n Meter ein Punkt
  const zug = (X, Y, x0, x1, n) => {
    let d = '';
    for (let x = x0; x < x1 + n; x += n) {
      const xx = Math.min(x, x1);
      d += `${d ? 'L' : 'M'}${r(X(xx))} ${r(Y(kabel(xx)))}`;
    }
    return d;
  };
  // Pylon ohne Rippen: Umriss mit den Rücksprüngen ab der Höhe ab, dazu je ein Band auf Höhe eines Rücksprungs
  function pylonRuhig(X, Y, x, ab) {
    const li = [], re = [];
    STUFEN.forEach(([a, b, hw], i) => {
      const u = i ? a : ab;
      li.push([x - hw, u], [x - hw, b]);
      re.unshift([x + hw, b], [x + hw, u]);
    });
    const umriss = li.concat(re).map(([px, h], i) => `${i ? 'L' : 'M'}${r(X(px))} ${r(Y(h))}`).join('') + 'Z';
    let band = '';
    STUFEN.slice(0, -1).forEach(([, b, hw]) => { band += `M${r(X(x - hw))} ${r(Y(b))}H${r(X(x + hw))}`; });
    return { umriss, band };
  }

  // Titelblatt: Südpylon groß und gelb, Kabel nach beiden Seiten, jeder zweite Hänger, Fachwerk nur als Zickzack
  function brueckeNah(reel) {
    const s = 1.7, von = -165, bis = von + 900 / s, oben = reel ? 30 : 84, g = oben + TURM * s, H = Math.round(g + 50);
    const X = m => (m - von) * s, Y = h => g - h * s;
    const fm = SPANN / 84, fs = SEITE / 22, yo = Y(DECK + TRAEGER), yu = Y(DECK);
    // Wasser, am Schutzring ausgespart
    let inhalt = pfad('l', `M0 ${r(g)}H${r(X(-22))}M${r(X(22))} ${r(g)}H900`);
    inhalt += pfad('t', wellen(22, X(-22) - 12, g + 20, 64) + wellen(54, X(-22) - 12, g + 39, 128) +
      wellen(X(22) + 28, 890, g + 20, 64) + wellen(X(22) + 60, 890, g + 39, 128));
    // Pfeiler im Schutzring
    inhalt += `<path class="lf" d="M${r(X(-22))} ${H + 6}V${r(Y(4))}H${r(X(22))}V${H + 6}"/>`;
    inhalt += `<path class="lf" d="M${r(X(-13))} ${r(Y(4))}V${r(Y(13))}H${r(X(13))}V${r(Y(4))}Z"/>`;
    // jeder zweite Hänger
    let ht = '';
    for (let k = 2; k * fm < bis; k += 2) ht += `M${r(X(k * fm))} ${r(Y(kabel(k * fm)))}V${r(yo)}`;
    for (let k = 2; -k * fs > von; k += 2) ht += `M${r(X(-k * fs))} ${r(Y(kabel(-k * fs)))}V${r(yo)}`;
    inhalt += pfad('t', ht);
    // Fachwerkträger: zwei Gurte, dazwischen nur die Streben
    let zick = '';
    for (let k = Math.floor(von / fs) - 1; k * fm < bis + fm; k++) {
      const x = k < 0 ? k * fs : k * fm;
      zick += `${zick ? 'L' : 'M'}${r(X(x))} ${r(k % 2 === 0 ? yo : yu)}`;
    }
    inhalt += pfad('t', zick) + pfad('l', `M0 ${r(yo)}H900M0 ${r(yu)}H900`);
    // Pylon in Gelb
    const p = pylonRuhig(X, Y, 0, 13);
    inhalt += `<g class="akzent"><path class="lf" d="${p.umriss}"/>${pfad('t', p.band)}</g>`;
    // Kabel
    const hk = STUFEN[STUFEN.length - 1][2];
    inhalt += pfad('l', zug(X, Y, von, -hk, 4) + zug(X, Y, hk, bis, 4));
    let body = rahmen('gg-ruhig-1', H, inhalt);
    body += text(X(0), Y(TURM) - 22, '227 m', 'riesig akz', 'text-anchor="middle"');
    return svg(900, H, body);
  }

  // Ganze Brücke im selben Maßstab für Länge und Höhe: Hauptfeld gelb, jeder vierte Hänger, Türme als Flächen.
  // mass: Spannweite groß und gelb, Breite der Einfahrt als Maß, Ortsnamen
  function brueckeGanz(mass) {
    const von = -430, bis = SPANN + SEITE + 47, s = 900 / (bis - von), tief = 96;
    const oben = mass ? 118 : 24, g = oben + TURM * s, H = Math.round(g + tief + (mass ? 158 : 4));
    const X = m => (m - von) * s, Y = h => g - h * s;
    const fm = SPANN / 84, fs = SEITE / 22, yd = Y(DECK + TRAEGER / 2);
    const ufer = [-SEITE - 10, SPANN - 40];
    // Gelände und Meeresgrund, Wasserspiegel
    const gl = gelaende(X, Y, von, bis, -tief / s);
    let inhalt = `<path class="hs" d="${gl.flaeche}"/>` + pfad('l', gl.linie);
    inhalt += pfad('t', `M${r(X(ufer[0]))} ${r(g)}H${r(X(ufer[1]))}`);
    // Zufahrt San Francisco auf Stützen, Ankerblock
    inhalt += pfad('t', `M${r(X(-SEITE - 52))} ${r(yd)}V${r(Y(20))}M${r(X(-SEITE - 26))} ${r(yd)}V${r(Y(20))}`);
    inhalt += `<path class="lf" d="M${r(X(-SEITE - 8))} ${r(Y(20))}V${r(Y(DECK + 9))}H${r(X(-SEITE + 16))}V${r(Y(20))}Z"/>`;
    // jeder vierte Hänger
    let ht = '';
    const haenger = x => { if ((kabel(x) - DECK - TRAEGER / 2) * s > 5) ht += `M${r(X(x))} ${r(Y(kabel(x)))}V${r(yd)}`; };
    for (let k = 4; k < 84; k += 4) haenger(k * fm);
    for (let k = 4; k < 22; k += 4) { haenger(-k * fs); haenger(SPANN + k * fs); }
    inhalt += pfad('t', ht);
    // Fahrbahn: Seitenfelder weiß, das Hauptfeld gelb
    inhalt += pfad('l', `M0 ${r(yd)}H${r(X(0))}M${r(X(SPANN))} ${r(yd)}H${r(X(SPANN + SEITE + 10))}`);
    inhalt += pfad('a', `M${r(X(0))} ${r(yd)}H${r(X(SPANN))}`);
    // Kabel, Südpfeiler im Wasser, Türme
    inhalt += pfad('l', zug(X, Y, -SEITE, SPANN + SEITE, 8));
    inhalt += `<path class="lf" d="M${r(X(-22))} ${r(Y(-28))}V${r(Y(13))}H${r(X(22))}V${r(Y(-28))}Z"/>`;
    inhalt += pfad('l punkt', pylonRuhig(X, Y, 0, 13).umriss + pylonRuhig(X, Y, SPANN, 8).umriss);
    let body = rahmen(mass ? 'gg-ruhig-2' : 'gg-ruhig-3', H, inhalt);
    if (mass) {
      const ym = oben - 28;
      body += pfad('a', `M${r(X(0))} ${ym}H${r(X(SPANN))}M${r(X(0))} ${ym - 12}v24M${r(X(SPANN))} ${ym - 12}v24`);
      body += text(X(SPANN / 2), ym - 24, '1280 m', 'riesig akz', 'text-anchor="middle"');
      body += massH(X(ufer[0]), X(ufer[1]), g + tief + 30, '1,6 km', 40);
      body += text(20, H - 22, 'San Francisco', 'gross') + text(880, H - 22, 'Marin', 'gross', 'text-anchor="end"');
    }
    return svg(900, H, body);
  }

  // Südpfeiler im Schnitt: Pfeiler gelb, Schutzring, außen Wasser, innen trocken; Steg nur als Linie auf Pfählen
  function pfeilerRuhig(reel) {
    const s = 8, w = 250, Yh = h => w - h * s, sohle = Yh(-34), grund = Yh(-27), H = 600;
    const fl = 350, fr = 710, pl = 440, pr = 620, dw = 18;
    // Meeresgrund, im Ring ausgehoben bis zur Sohle
    let body = `<path class="hs" d="M20 ${grund}H${fl - dw}V${grund + 30}H${fl}V${sohle}H${fr}V${grund + 30}H${fr + dw}V${grund}H880V${H - 6}H20Z"/>`;
    body += pfad('l', `M20 ${grund}H${fl - dw}M${fr + dw} ${grund}H880M${fl} ${sohle}H${fr}`);
    // Zugangssteg vom Ufer
    let steg = `M20 ${w - 38}H${fl - dw}M20 ${w - 50}H${fl - dw}`;
    for (const x of [70, 158, 246]) steg += `M${x} ${w - 38}V${grund}`;
    body += pfad('t', steg);
    // Wasser außen, innen trocken (Wasserstand gestrichelt)
    body += pfad('l', `M20 ${w}H${fl - dw}M${fr + dw} ${w}H880`);
    body += pfad('t', wellen(92, 150, w + 20) + wellen(180, 240, w + 20) + wellen(268, fl - dw - 10, w + 20) + wellen(fr + dw + 22, 870, w + 20) + wellen(fr + dw + 52, 870, w + 48, 90));
    body += pfad('d', `M${fl} ${w}H${pl}M${pr} ${w}H${fr}`);
    // Schutzring: zwei geschnittene Betonwände
    for (const x of [fl - dw, fr]) {
      const d = `M${x} ${Yh(4)}H${x + dw}V${grund + 30}H${x}Z`;
      body += `<path class="lf" d="${d}"/><path class="hf" d="${d}"/>`;
    }
    // Pfeiler bis 13 m über das Wasser, darauf die Füße des Pylons (oben abgebrochen)
    body += `<path class="af" d="M${pl} ${sohle}H${pr}V${Yh(13)}H${pl}Z"/>`;
    let fuss = '';
    for (const x0 of [pl + 18, pr - 62]) {
      fuss += `M${x0 - 6} ${Yh(13)}h56v-10h-56ZM${x0} ${Yh(13) - 10}V46M${x0 + 44} ${Yh(13) - 10}V46`;
      fuss += `M${x0} 46l11 -8l11 10l11 -10l11 8`;
    }
    body += pfad('l', fuss);
    if (!reel) {
      body += pfad('t', `M340 54H${(fl + pl) / 2}V${w + 90}M${fr + dw / 2} ${Yh(4) - 4}V84`);
      body += massV(pr + 24, w, sohle, '34 m', 1, 40);
    }
    body += text(40, 66, 'leer gepumpt', 'gross') + text(880, 66, 'Schutzring', 'gross', 'text-anchor="end"');
    return svg(900, H, body);
  }

  // Querschnitt eines Tragkabels: 61 Bündel als Kreise ohne die einzelnen Drähte, eines gelb
  function kabelRuhig(reel) {
    const cx = reel ? 450 : 268, cy = 262, R = 235, d = 50, rb = 19;
    let buendel = '', ax = 0, ay = 0;
    for (let q = -4; q <= 4; q++) {
      for (let rr = Math.max(-4, -q - 4); rr <= Math.min(4, -q + 4); rr++) {
        const x = cx + d * (q + rr / 2), y = cy + d * rr * 0.866;
        if (q === 2 && rr === 2) { ax = x; ay = y; } else buendel += kreis(x, y, rb);
      }
    }
    let body = pfad('t', buendel) + `<path class="af" d="${kreis(ax, ay, rb)}"/>` + pfad('l', kreis(cx, cy, R + 7));
    if (!reel) {
      body += massH(cx - R - 7, cx + R + 7, cy + R + 41, '92 cm', 40);
      body += pfad('t', `M${r(ax + rb + 10)} ${r(ay)}H536`);
    }
    if (reel) return svg(900, cy + R + 27, body);
    body += text(548, 150, '61 Bündel', 'gross');
    body += text(548, ay + 14, '1 Bündel', 'gross akz') + text(548, ay + 62, 'rund 452 Drähte', 'akz');
    return svg(900, cy + R + 103, body);
  }

  // Querschnitt der Fahrbahn mit dem Netz darunter: Netz gelb, Träger und Querträger ohne Kleinteile
  function netzRuhig(reel) {
    const s = 24, xl = 450 - 13.5 * s, xr = 450 + 13.5 * s, top = 150, unten = r(top + TRAEGER * s), ueber = 3 * s, bt = 30;
    // Hänger
    let body = pfad('t', `M${xl + bt / 2} 20V${top}M${xr - bt / 2} 20V${top}`);
    // Fahrbahnplatte, zwei Fachwerkträger, Querträger mit Streben
    let l = `M${xl} ${top}H${xr}M${xl} ${top + 14}H${xr}`, t = '';
    for (const x of [xl, xr - bt]) l += `M${x} ${top}V${unten}H${x + bt}V${top}`;
    const q0 = xl + bt, q1 = xr - bt, qo = top + 14, qu = unten - 8, nf = 6;
    l += `M${q0} ${qu}H${q1}`;
    for (let i = 0; i < nf; i++) {
      const x = q0 + (i * (q1 - q0)) / nf, xn = q0 + ((i + 1) * (q1 - q0)) / nf;
      if (i) t += `M${r(x)} ${qo}V${qu}`;
      t += i < nf / 2 ? `M${r(x)} ${qo}L${r(xn)} ${qu}` : `M${r(x)} ${qu}L${r(xn)} ${qo}`;
    }
    // Autos auf der Fahrbahn
    for (const x of [300, 514]) t += `M${x} ${top - 4}v-18h18l8 -12h34l8 12h18v18` + kreis(x + 18, top - 7, 7) + kreis(x + 68, top - 7, 7);
    body += pfad('t', t) + pfad('l', l);
    // Netz, an beiden Seiten 3 m über die Träger hinaus, an Auslegern gehalten
    const n0 = xl - ueber, n1 = xr + ueber, ny = unten + 28;
    const tief = x => ny + 62 * (1 - ((x - 450) / (n1 - 450)) ** 2);
    body += pfad('t', `M${xl} ${unten - 30}L${n0} ${ny}M${xr} ${unten - 30}L${n1} ${ny}M${xl} ${unten}V${ny}M${xr} ${unten}V${ny}`);
    let masche = '', mitte = '', rand = '';
    for (let x = n0 + 36; x < n1 - 4; x += 36) masche += `M${r(x)} ${r(ny)}V${r(tief(x))}`;
    for (let x = n0; x <= n1 + 0.1; x += 12) {
      mitte += `${mitte ? 'L' : 'M'}${r(x)} ${r((ny + tief(x)) / 2)}`;
      rand += `${rand ? 'L' : 'M'}${r(x)} ${r(tief(x))}`;
    }
    body += `<g class="akzent">${pfad('t', masche + mitte)}</g>` + pfad('a', rand + `M${n0} ${r(ny)}H${n1}`);
    if (!reel) body += massH(xl, xr, 54, '27 m', 40) + massH(n0, xl, ny + 40, '3 m', 40);
    body += text(450, ny + 116, 'Netz aus Manilaseil', 'gross akz', 'text-anchor="middle"');
    return svg(900, r(ny + 138), body);
  }

  Object.assign(Zeichnung, { bruecke, pfeiler, kabelSchnitt, netz });
})();
