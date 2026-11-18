// Zeichnungen: Golden Gate Bridge, San Francisco. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Hauptspannweite 1280 m, Seitenfelder je 343 m, Pylone 227 m über dem Wasser, Durchfahrtshöhe 67 m,
// Fachwerkträger 7,6 m hoch, Brücke 27 m breit, Netz 3 m (10 ft) über die Träger hinaus, Kabel 92 cm mit 61 Bündeln,
// Südpfeiler 34 m unter Niedrigwasser gegründet und 13 m (44 ft) über das Wasser. Kabeldurchhang, Geländeform,
// Wassertiefe und Abstufung der Pylone sind nach Fotos vereinfacht.
(function () {
  const { r, svg, pfad, text, kreis, massV, massH } = Z;

  const SPANN = 1280, SEITE = 343, TURM = 227, DECK = 67, TRAEGER = 7.6, SATTEL = 224, TIEF = 80;

  // Höhe der Kabel über dem Wasser an der Stelle x (0 = Südpylon, 1280 = Nordpylon)
  function kabel(x) {
    if (x >= 0 && x <= SPANN) return TIEF + (SATTEL - TIEF) * ((x - SPANN / 2) / (SPANN / 2)) ** 2;
    const t = x < 0 ? (x + SEITE) / SEITE : (SPANN + SEITE - x) / SEITE;
    return DECK + 4 + (SATTEL - DECK - 4) * (0.35 * t + 0.65 * t * t);
  }

  // Pylon in Seitenansicht, dreimal abgestuft
  function pylon(X, Y, x) {
    const stufen = [[13, 100, 8], [100, 170, 6.5], [170, TURM, 5]];
    let d = '';
    for (const [a, b, hw] of stufen) d += `M${r(X(x - hw))} ${r(Y(a))}V${r(Y(b))}H${r(X(x + hw))}V${r(Y(a))}`;
    let t = '';
    for (const h of [40, 100, 140, 170, 200]) {
      const hw = h < 100 ? 8 : h < 170 ? 6.5 : 5;
      t += `M${r(X(x - hw))} ${r(Y(h - 4))}H${r(X(x + hw))}`;
    }
    return { l: d, t };
  }

  // ausschnitt: Südufer bis zur Mitte, größer (Titelblatt); mass: mit Maßlinien und Ortsnamen
  function bruecke({ ausschnitt = false, mass = false } = {}) {
    const von = ausschnitt ? -130 : -420, bis = ausschnitt ? 470 : SPANN + SEITE + 77;
    const links = ausschnitt ? 20 : 80, s = (880 - links) / (bis - von);
    const oben = mass ? 70 : 30, g = oben + TURM * s;
    const X = m => links + (m - von) * s, Y = h => g - h * s;
    const a = Math.max(von, -SEITE), b = Math.min(bis, SPANN + SEITE);
    let l = '', t = '', akz = '';

    // Kabel
    let kab = '';
    for (let x = a; x <= b; x += 5) kab += `${kab ? 'L' : 'M'}${r(X(x))} ${r(Y(kabel(x)))}`;
    l += kab;
    // Fahrbahnträger
    l += `M${r(X(a))} ${r(Y(DECK + TRAEGER))}H${r(X(b))}M${r(X(a))} ${r(Y(DECK))}H${r(X(b))}`;
    // Hänger
    const abstand = ausschnitt ? 15 : 30;
    for (let x = a + abstand; x < b; x += abstand) {
      if (Math.abs(x) < 9 || Math.abs(x - SPANN) < 9) continue;
      t += `M${r(X(x))} ${r(Y(kabel(x)))}V${r(Y(DECK + TRAEGER))}`;
    }
    // Fachwerk im Träger
    for (let x = a; x + 15 <= b; x += 15) t += `M${r(X(x))} ${r(Y(DECK))}L${r(X(x + 7.5))} ${r(Y(DECK + TRAEGER))}L${r(X(x + 15))} ${r(Y(DECK))}`;
    // Pylone und Pfeiler
    for (const px of [0, SPANN]) {
      if (px < von || px > bis) continue;
      const p = pylon(X, Y, px);
      l += p.l;
      t += p.t;
      l += `M${r(X(px - 12))} ${r(Y(0))}V${r(Y(13))}H${r(X(px + 12))}V${r(Y(0))}`;
    }

    // Südufer mit Fort Point und Ankerblock
    const sf = -SEITE - 10;
    let ufer = '';
    if (von < -SEITE) {
      ufer += `M${r(X(von))} ${r(Y(20))}H${r(X(sf - 30))}L${r(X(sf))} ${r(Y(0))}`;
      l += `M${r(X(-SEITE))} ${r(Y(20))}V${r(Y(DECK + 4))}H${r(X(-SEITE + 14))}V${r(Y(20))}`;
      // Bogen über Fort Point
      t += `M${r(X(-SEITE - 70))} ${r(Y(20))}Q${r(X(-SEITE - 35))} ${r(Y(DECK + 10))} ${r(X(-SEITE))} ${r(Y(20))}`;
      l += `M${r(X(von))} ${r(Y(DECK + TRAEGER))}H${r(X(-SEITE))}`;
    }
    // Nordufer: Fels von Marin
    if (bis > SPANN) {
      ufer += `M${r(X(SPANN - 40))} ${r(Y(0))}L${r(X(SPANN + 30))} ${r(Y(18))}L${r(X(SPANN + 160))} ${r(Y(45))}L${r(X(SPANN + SEITE))} ${r(Y(DECK - 2))}L${r(X(bis))} ${r(Y(DECK + 30))}`;
      l += `M${r(X(SPANN + SEITE - 14))} ${r(Y(DECK - 2))}V${r(Y(DECK + 4))}H${r(X(SPANN + SEITE))}`;
    }
    l += ufer;
    // Wasser
    const wEnde = bis > SPANN ? SPANN - 40 : bis, wAnf = Math.max(sf, von);
    let wellen = '';
    for (let x = X(wAnf) + 20; x + 34 <= X(wEnde) - 10; x += 60) wellen += `M${r(x)} ${r(g + 14)}q8 -6 17 0t17 0`;
    t += wellen;
    l += `M${r(X(wAnf))} ${r(g)}H${r(X(wEnde))}`;

    let body = pfad('t', t) + pfad('l', l) + akz;
    let h = g + 30;
    if (mass) {
      body += pfad('d', `M${r(X(0) - 12)} ${r(Y(TURM))}H${links - 30}`);
      body += massV(links - 30, Y(TURM), g, '227 m', -1);
      body += massH(X(0), X(SPANN), g + 46, '1280 m');
      body += text(links - 40, g + 130, 'San Francisco', 'gross');
      body += text(880 - 20, g + 130, 'Marin', 'gross', 'text-anchor="end"');
      h = g + 156;
    }
    return svg(900, r(h), body);
  }

  // Südpfeiler im Schnitt: Schutzring im offenen Wasser, darin trockengepumpt
  function pfeiler() {
    const s = 8, w = 150, Yh = h => w - h * s, sohle = Yh(-34), grund = Yh(-27);
    const fl = 520, fr = 790, pl = 575, pr = 735;
    // Meeresgrund
    let body = `<path class="hf" d="M30 ${grund}H${fl}V${sohle + 40}H${fr}V${grund}H870V${sohle + 40}H30Z"/>`;
    body += pfad('l', `M30 ${grund}H${fl}M${fr} ${grund}H870`);
    // Schutzring (Fender) als zwei Wände
    body += `<path class="lf" d="M${fl - 14} ${Yh(4)}H${fl}V${grund + 30}H${fl - 14}Z"/><path class="lf" d="M${fr} ${Yh(4)}H${fr + 14}V${grund + 30}H${fr}Z"/>`;
    // Pfeiler bis 13 m über das Wasser, darauf der Fuß des Pylons
    body += `<path class="af" d="M${pl} ${sohle}H${pr}V${Yh(13)}H${pl}Z"/>`;
    body += pfad('l', `M${pl} ${sohle}H${pr}V${Yh(13)}H${pl}ZM${pl + 30} ${Yh(13)}V30M${pr - 30} ${Yh(13)}V30M${pl + 22} 30h12M${pr - 34} 30h12`);
    // Wasser außen, innen trocken
    let wellen = '';
    for (let x = 50; x + 34 < fl - 30; x += 60) wellen += `M${x} ${w + 16}q8 -6 17 0t17 0`;
    body += pfad('l', `M30 ${w}H${fl - 14}M${fr + 14} ${w}H870`) + pfad('t', wellen + `M${fr + 30} ${w + 16}q8 -6 17 0t17 0`);
    body += pfad('d', `M${fl} ${w}H${pl}M${pr} ${w}H${fr}`);
    // Zugangssteg auf Pfählen, vom Ufer her
    let steg = `M30 ${w - 36}H${fl - 14}`;
    for (let x = 60; x < fl - 20; x += 70) steg += `M${x} ${w - 36}V${grund}`;
    body += pfad('t', steg);
    body += text(40, w - 56, 'Zugangssteg vom Ufer');
    body += pfad('t', `M${fl - 7} ${Yh(4) - 4}L${fl - 40} 56`) + text(fl - 46, 48, 'Schutzring', '', 'text-anchor="end"');
    body += text(40, 250, 'innen leer gepumpt:', 'hell') + text(40, 284, '35,6 Mio. Liter', 'hell');
    body += pfad('t', `M372 258H${(fl + pl) / 2}`);
    body += massV(840, w, sohle, '34 m');
    return svg(900, sohle + 50, body);
  }

  // Querschnitt eines Tragkabels: 61 Bündel aus Paralleldraht
  function kabelSchnitt() {
    const cx = 290, cy = 290, R = 236, d = 50;
    let body = `<path class="lf" d="${kreis(cx, cy, R)}"/>` + pfad('l', kreis(cx, cy, R));
    let buendel = '';
    let akzent = '';
    // hexagonale Anordnung: 1 + 6 + 12 + 18 + 24 = 61
    for (let q = -4; q <= 4; q++) {
      for (let rr = Math.max(-4, -q - 4); rr <= Math.min(4, -q + 4); rr++) {
        const x = cx + d * (q + rr / 2), y = cy + d * rr * 0.866;
        if (q === 4 && rr === -2) akzent = kreis(x, y, 23);
        else buendel += kreis(x, y, 23);
      }
    }
    body += pfad('t', buendel) + `<path class="af" d="${akzent}"/>` + pfad('a', akzent);
    body += massH(cx - R, cx + R, cy + R + 30, '92 cm');
    const ax = cx + d * 3, ay = cy - d * 2 * 0.866;
    body += pfad('t', `M${r(ax + 20)} ${r(ay - 14)}L590 120`);
    body += text(600, 112, '1 Bündel', 'gross akz') + text(600, 148, 'rund 452 Drähte');
    body += text(600, 300, '61 Bündel', 'gross') + text(600, 336, 'je Kabel');
    body += text(600, 430, '27.572 Drähte', 'gross') + text(600, 466, 'je 4,9 mm dick');
    return svg(900, cy + R + 76, body);
  }

  // Querschnitt der Fahrbahn mit dem Netz darunter
  function netz() {
    const s = 18, xl = 450 - 13.5 * s, xr = 450 + 13.5 * s, top = 130, unten = top + TRAEGER * s, ueber = 3 * s;
    let body = '';
    // Hänger
    body += pfad('t', `M${r(xl + 12)} 30V${top}M${r(xr - 12)} 30V${top}`);
    body += massH(xl, xr, 66, '27 m');
    // Fahrbahn und zwei Fachwerkträger
    let l = `M${r(xl)} ${top}H${r(xr)}M${r(xl)} ${r(top + 14)}H${r(xr)}`;
    let t = '';
    for (const x of [xl, xr - 24]) {
      l += `M${r(x)} ${top}V${r(unten)}H${r(x + 24)}V${top}`;
      t += `M${r(x)} ${top}L${r(x + 24)} ${r(unten)}M${r(x + 24)} ${top}L${r(x)} ${r(unten)}`;
    }
    // Querträger unten
    t += `M${r(xl + 24)} ${r(unten - 10)}H${r(xr - 24)}M${r(xl + 24)} ${r(unten - 10)}L450 ${r(top + 14)}L${r(xr - 24)} ${r(unten - 10)}`;
    body += pfad('t', t) + pfad('l', l);
    // Autos auf der Fahrbahn
    let autos = '';
    for (const x of [330, 470]) autos += `M${x} ${top}v-20h18l8 -12h34l8 12h18v20` + kreis(x + 18, top - 2, 7) + kreis(x + 70, top - 2, 7);
    body += pfad('t', autos);
    // Netz, an beiden Seiten 3 m über die Träger hinaus
    const n0 = xl - ueber, n1 = xr + ueber, ny = unten + 26;
    let masche = '';
    for (let x = n0 + 24; x < n1; x += 24) {
      const y = ny + 50 * (1 - ((x - 450) / (n1 - 450)) ** 2);
      masche += `M${r(x)} ${r(ny)}V${r(y)}`;
    }
    body += pfad('a', `M${r(n0)} ${r(ny)}Q450 ${r(ny + 100)} ${r(n1)} ${r(ny)}M${r(n0)} ${r(ny)}H${r(xl)}M${r(xr)} ${r(ny)}H${r(n1)}`);
    body += pfad('a', masche.replace(/V/g, 'V'));
    body += massH(n0, xl, ny + 24, '3 m');
    body += massV(xl - 80, top, unten, '7,6 m', -1);
    body += text(450, ny + 106, 'Netz aus Manilaseil', 'gross akz', 'text-anchor="middle"');
    // Wasser tief unten
    let wellen = '';
    for (let x = 60; x + 34 < 860; x += 60) wellen += `M${x} ${r(ny + 150)}q8 -6 17 0t17 0`;
    body += pfad('t', wellen) + text(450, ny + 200, '67 m tiefer: das Wasser', 'hell', 'text-anchor="middle"');
    body += pfad('t', `M${r(xr + 4)} ${r(top + 60)}L${r(xr + 70)} ${r(top + 30)}`) + text(r(xr + 76), r(top + 36), 'Träger');
    return svg(900, r(ny + 230), body);
  }

  Object.assign(Zeichnung, { bruecke, pfeiler, kabelSchnitt, netz });
})();
