// Zeichnungen: Eurotunnel (Kanaltunnel). Schematisch, Höhen stark überhöht.
// Belegt: Länge 50,5 km, davon 38 km unter dem Meer; in einer Kreideschicht, rund 40 m unter dem Meeresgrund, tiefster Punkt
// 75 m unter dem Meeresspiegel; Fahrtunnel 7,6 m, Servicetunnel 4,8 m, Abstand der Fahrtunnel rund 30 m, Querschläge alle 375 m;
// 6 Bohrmaschinen von England, 5 von Frankreich; Durchschlag am 1. Dezember 1990, seitlich gut 35 cm Abweichung.
// Schematisch und ohne Maßzahl: Küsten, Meeresgrund, Gesteinsschichten über und unter der Kreideschicht, Tübbinge, Gleise,
// Fahrleitung, Fahrzeuge, Bohrmaschinen. Seit 20.11.2026 als CAD-Konstruktion mit Achsen, Koten, Schraffuren und Ausrüstung.
// Lesbare Vorlage (seit 21.11.2026): Mit lesbar: true zeichnet jede Funktion ruhig (profilRuhig, querschnittRuhig,
// vortriebeRuhig), ohne Achsen, Koten und Kleinteile, mit höchstens fünf großen Beschriftungen (Schrift 34/40/60 px,
// Linien ab 2 px); mit reel: true zusätzlich ohne Maß- und Hinweislinien. Ohne lesbar bleibt alles wie zuvor.
(function () {
  const { r, svg, pfad, text, kreis, massH, massV } = Z;

  // ---------- CAD-Hilfen ----------
  const PI = Math.PI;
  const rausch = (i, k = 1) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const zug = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
  const zu = pts => zug(pts) + 'Z';
  const rechteck = (x, y, w, h) => `M${r(x)} ${r(y)}h${r(w)}v${r(h)}h${r(-w)}Z`;
  function schar(b, w, a, v = 0.5) {
    const [x0, y0, x1, y1] = b, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    const dx = Math.cos((w * PI) / 180), dy = Math.sin((w * PI) / 180);
    let d = '';
    for (let t = -R + a * v; t < R; t += a) {
      const px = cx - dy * t, py = cy + dx * t;
      d += `M${r(px - dx * R)} ${r(py - dy * R)}L${r(px + dx * R)} ${r(py + dy * R)}`;
    }
    return d;
  }
  // Kalkstein/Kreide: Lagen mit versetzten Stoßfugen
  function mauer(b, h, w) {
    const [x0, y0, x1, y1] = b;
    let d = '', z = 0;
    for (let y = y0; y < y1; y += h, z++) {
      d += `M${r(x0)} ${r(y)}H${r(x1)}`;
      for (let x = x0 + (z % 2 ? w / 2 : 0); x < x1; x += w) d += `M${r(x)} ${r(y)}v${r(h)}`;
    }
    return d;
  }
  // Ton/Mergel: kurze waagerechte Striche, versetzt
  function striche(b, h, w) {
    const [x0, y0, x1, y1] = b;
    let d = '', z = 0;
    for (let y = y0 + h / 2; y < y1; y += h, z++) for (let x = x0 + (z % 2 ? w * 0.8 : 0); x < x1; x += w * 1.6) d += `M${r(x)} ${r(y)}h${r(w)}`;
    return d;
  }
  function punkte(b, a) {
    const [x0, y0, x1, y1] = b;
    let d = '', i = 0;
    for (let y = y0 + a / 2; y < y1; y += a * 0.8) for (let x = x0 + (i % 2) * a * 0.5; x < x1; x += a, i++) {
      d += `M${r(x + (rausch(i, 5) - 0.5) * a * 0.6)} ${r(y + (rausch(i, 6) - 0.5) * a * 0.5)}l1.2 0.6`;
    }
    return d;
  }
  // Wellen auf der Wasserfläche
  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${r(x)} ${r(y)}q8 -6 17 0t17 0`;
    return d;
  };
  // Fläche: Inhalt nur innerhalb des Umrisses d (und optional d2), ohne Aussparungen (Rechtecke [x, y, b, h])
  function flaeche(id, d, inhalt, cls = 'z', loecher = [], d2 = '') {
    const frei = 'M-200 -200H1200V1400H-200Z' + loecher.map(([x, y, b, h]) => rechteck(x, y, b, h)).join('');
    let s = `<clipPath id="${id}a"><path d="${d}"/></clipPath><clipPath id="${id}f"><path clip-rule="evenodd" d="${frei}"/></clipPath>`;
    if (d2) s += `<clipPath id="${id}b"><path d="${d2}"/></clipPath>`;
    const innen = `<g clip-path="url(#${id}f)"><path class="${cls}" d="${inhalt}"/></g>`;
    return s + `<g clip-path="url(#${id}a)">${d2 ? `<g clip-path="url(#${id}b)">${innen}</g>` : innen}</g>`;
  }
  const kote = (x, y, inhalt) => pfad('m', `M${r(x)} ${r(y)}l-7 -12h14zM${r(x - 10)} ${r(y)}h62`) + text(x + 12, y - 8, inhalt, 'kote');
  const bruchH = (x1, x2, y, n = 3) => {
    let d = `M${r(x1)} ${r(y)}`;
    for (let k = 1; k <= n; k++) { const x = x1 + ((x2 - x1) * k) / (n + 1); d += `L${r(x - 6)} ${r(y)}L${r(x - 2)} ${r(y - 9)}L${r(x + 2)} ${r(y + 9)}L${r(x + 6)} ${r(y)}`; }
    return d + `L${r(x2)} ${r(y)}`;
  };
  // Polylinie [km, m] linear abfragen
  const bei = (pts, km) => {
    if (km <= pts[0][0]) return pts[0][1];
    for (let i = 0; i + 1 < pts.length; i++) if (km <= pts[i + 1][0]) {
      const [k1, m1] = pts[i], [k2, m2] = pts[i + 1];
      return m1 + ((m2 - m1) * (km - k1)) / (k2 - k1);
    }
    return pts[pts.length - 1][1];
  };

  // Längsschnitt von Folkestone bis Coquelles. km 0 = Portal England, Küste England bei km 9, Küste Frankreich bei km 47.
  function eurotunnelProfil({ beschriftet = false, lesbar = false, reel = false } = {}) {
    if (lesbar) return profilRuhig(beschriftet, reel);
    const id = beschriftet ? 'epb' : 'epa';
    const ox = 60, sx = 780 / 50.5, meer = beschriftet ? 210 : 190, sy = 2.4;
    const X = km => ox + km * sx, Y = m => meer + m * sy;
    const kE = 9, kF = 47, unten = Y(110);
    // Meeresgrund, schematisch
    const GRUND = [[kE, 0], [10, 9], [12, 22], [15, 29], [18, 32], [25, 32], [28, 34], [32, 35], [35, 33], [38, 30], [43, 30], [45, 18], [kF, 0]];
    // Tunnelachse: gut 40 m unter dem Grund, tiefster Punkt 75 m unter dem Meeresspiegel
    const ACHSE = [[0, -40], [5, 10], [kE, 38], [12, 62], [18, 72], [25, 72], [32, 75], [38, 70], [43, 70], [kF, 42], [50.5, -12]];
    const glatt = km => bei(ACHSE, km);
    // Oberfläche: Land England mit Klippe, Meeresgrund mit leichter Unruhe, flaches Land in Frankreich
    const oberflaeche = [[30, Y(-40)]];
    for (let km = -1.5, i = 0; km < 7.6; km += 0.5, i++) oberflaeche.push([X(km), Y(-40 + (rausch(i, 3) - 0.5) * 3)]);
    oberflaeche.push([X(7.6), Y(-40)], [X(8.1), Y(-37)], [X(8.35), Y(-12)], [X(8.7), Y(-5)], [X(kE), Y(0)]);
    for (let km = kE + 0.5, i = 0; km < kF; km += 0.5, i++) oberflaeche.push([X(km), Y(bei(GRUND, km) + (rausch(i, 7) - 0.5) * 2.2)]);
    oberflaeche.push([X(kF), Y(0)], [X(47.6), Y(-8)], [X(48.2), Y(-12)]);
    for (let km = 48.7, i = 0; X(km) < 870; km += 0.5, i++) oberflaeche.push([X(km), Y(-12 + (rausch(i, 9) - 0.5) * 2)]);
    oberflaeche.push([870, Y(-12)]);
    const boden = zu(oberflaeche.concat([[870, unten], [30, unten]]));

    // Gesteinsschichten parallel zur Achse: Kreideschicht um den Tunnel (oben −14 m, unten +12 m)
    const schicht = dm => { const p = []; for (let km = -3; km <= 54; km += 0.5) p.push([X(km), Y(glatt(km) + dm)]); return p; };
    const kOben = schicht(-14), kUnten = schicht(12), oben2 = schicht(-30), unten2 = schicht(30);
    const band = (a, b) => zu(a.concat(b.slice().reverse()));
    const B = [20, 60, 880, unten + 10];
    const loecher = [];
    if (beschriftet) loecher.push([X(25) + 8, Y(52) - 16, 166, 34], [X(32) - 168, Y(75) + 16, 336, 66]);
    let body = '';
    body += flaeche(`${id}1`, boden, mauer(B, 8, 18), 'z', loecher, zu([[-50, -500], [950, -500], ...oben2.slice().reverse()]));
    body += flaeche(`${id}2`, boden, schar(B, 45, 9), 'z', loecher, band(oben2, kOben));
    body += flaeche(`${id}3`, boden, schar(B, -45, 6) + punkte(B, 9), 'z', loecher, band(kOben, kUnten));
    body += flaeche(`${id}4`, boden, schar(B, 0, 7), 'z', loecher, band(kUnten, unten2));
    body += flaeche(`${id}5`, boden, striche(B, 7, 9), 'z', loecher, band(unten2, [[-50, 900], [950, 900]]));
    // Schichtgrenzen
    body += flaeche(`${id}g`, boden, zug(kOben) + zug(kUnten), 't', loecher) + flaeche(`${id}h`, boden, zug(oben2) + zug(unten2), 'd', loecher);
    // Gelände, Meeresgrund, Schnittbegrenzung
    body += pfad('l', zug(oberflaeche));
    body += pfad('t', `M30 ${r(Y(-40))}V${r(unten)}M870 ${r(Y(-12))}V${r(unten)}` + bruchH(30, 870, unten, 4));
    // Meer: Wasserspiegel, Wellen
    body += pfad('t', `M${r(X(kE))} ${meer}H${r(X(kF))}`);
    body += pfad('z', wellen(r(X(kE) + 20), r(X(kF) - 30), meer + 16) + wellen(r(X(kE) + 46), r(X(kF) - 60), meer + 34) + wellen(r(X(kE) + 30), r(X(kF) - 40), meer + 52));
    // Tunnel: Röhre als Band, Ringfugen, Achse
    const achsPts = []; for (let km = 0; km <= 50.5 + 1e-6; km += 0.25) achsPts.push([X(km), Y(glatt(km))]);
    const oben = achsPts.map(([x, y]) => [x, y - 4]), untenB = achsPts.map(([x, y]) => [x, y + 4]).reverse();
    body += `<g class="akzent"><path class="lf" d="${zu(oben.concat(untenB))}"/></g>`;
    let rf = '';
    for (let km = 0.375; km < 50.5; km += 0.375) rf += `M${r(X(km))} ${r(Y(glatt(km)) - 3)}v6`;
    body += pfad('z', rf) + pfad('ax', zug([[X(-1.5), Y(-40)], ...achsPts, [X(52), Y(-12)]]));
    // Portale
    body += pfad('l', `M${r(X(0))} ${r(Y(-40) - 8)}v14M${r(X(0) - 10)} ${r(Y(-40) - 8)}h10M${r(X(50.5))} ${r(Y(-12) - 8)}v14M${r(X(50.5))} ${r(Y(-12) - 8)}h10`);
    // Koten
    body += kote(X(41.5), meer, '±0');
    body += text(40, r(Y(-40)) - 22, 'England', 'gross') + text(860, r(Y(-12)) - 22, 'Frankreich', 'gross', 'text-anchor="end"');
    body += text(450, meer - 30, 'Ärmelkanal', 'gross', 'text-anchor="middle"');
    if (!beschriftet) {
      body += pfad('ax', `M${r(X(kE))} ${r(meer - 14)}V${r(unten + 38)}M${r(X(kF))} ${r(meer - 14)}V${r(unten + 38)}`);
      body += massH(X(kE), X(kF), r(unten) + 30, '38 km unter dem Meer');
      return svg(900, r(unten) + 80, body);
    }
    // Beschriftet: 40 m unter dem Grund, tiefster Punkt
    body += pfad('ax', `M${r(X(0))} ${r(Y(-40) + 10)}V${r(unten + 38)}M${r(X(50.5))} ${r(Y(-12) + 10)}V${r(unten + 38)}`);
    body += pfad('hl', `M${r(X(26))} ${r(Y(75))}H${r(X(40))}`);
    body += pfad('bgl', `M${r(X(25))} ${r(Y(32) + 4)}V${r(Y(72) - 6)}`);
    body += pfad('t', `M${r(X(25))} ${r(Y(32) + 4)}V${r(Y(72) - 6)}M${r(X(25) - 6)} ${r(Y(32) + 10)}l12 -12M${r(X(25) - 6)} ${r(Y(72))}l12 -12`);
    body += text(X(25) + 14, Y(52) + 10, 'rund 40 m', 'akz hell');
    body += pfad('t', `M${r(X(32))} ${r(Y(75) + 6)}V${r(Y(75) + 14)}`);
    body += text(X(32), Y(75) + 40, 'tiefster Punkt:', 'hell', 'text-anchor="middle"') + text(X(32), Y(75) + 72, '75 m unter dem Meer', 'hell', 'text-anchor="middle"');
    body += massH(X(0), X(50.5), r(unten) + 30, '50,5 km');
    return svg(900, r(unten) + 80, body);
  }

  // Querschnitt: zwei Fahrtunnel, dazwischen der Servicetunnel, verbunden durch einen Querschlag
  function eurotunnelQuerschnitt({ lesbar = false, reel = false } = {}) {
    if (lesbar) return querschnittRuhig(reel);
    const s = 18, cy = 260, xl = 450 - 15 * s, xr = 450 + 15 * s, R = 3.8 * s, Rs = 2.4 * s, dA = 9, dS = 7;
    const loecher = [[64, 100, 232, 40], [604, 100, 232, 40], [301, 138, 298, 40], [xl - 46, 368, 92, 28], [xr - 46, 368, 92, 28], [404, 343, 92, 28], [306, 416, 288, 28]];
    // Kreide: Schichtfugen und Schraffur
    let fugen = '';
    for (let y = 108, i = 0; y < 460; y += 26, i++) {
      fugen += 'M';
      for (let x = 30; x <= 870; x += 10) fugen += `${x > 30 ? 'L' : ''}${x} ${r(y + (x - 450) * 0.02 + 2 * Math.sin((x + i * 37) / 60))}`;
    }
    let body = flaeche('eqk', rechteck(30, 96, 840, 364), schar([30, 60, 870, 460], 45, 11) + punkte([30, 60, 870, 460], 13), 'z', loecher);
    body += flaeche('eqf', rechteck(30, 96, 840, 364), fugen, 't', loecher);
    body += pfad('t', bruchH(30, 870, 96, 4) + bruchH(30, 870, 460, 4) + `M30 96V460M870 96V460`);

    // Querschläge zwischen den Röhren (Gehweghöhe), mit Türen und Fluchtweg
    const qO = 242, qU = 288;
    body += `<path class="lf" d="${rechteck(xl, qO, xr - xl, qU - qO)}"/>`;
    const a1 = xl + R + dA - 4, a2 = 450 - Rs - dS + 4, b1 = 450 + Rs + dS - 4, b2 = xr - R - dA + 4;
    body += `<g class="akzent">${pfad('l', `M${r(a1)} ${qO}H${r(a2)}M${r(a1)} ${qU}H${r(a2)}M${r(b1)} ${qO}H${r(b2)}M${r(b1)} ${qU}H${r(b2)}`)}</g>`;
    let qz = '';
    for (const [x1, x2] of [[a1, a2], [b1, b2]]) {
      qz += rechteck(x1 + 8, qO + 4, 4, qU - qO - 4) + rechteck(x2 - 12, qO + 4, 4, qU - qO - 4);
      qz += `M${r(x1 + 4)} ${qU}l4 4M${r(x2 - 4)} ${qU}l-4 4`;
    }
    body += pfad('t', qz);
    body += pfad('a', `M${r(a1 + 20)} 270H${r(a2 - 22)}m-10 -7l10 7l-10 7M${r(b2 - 20)} 270H${r(b1 + 22)}m10 -7l-10 7l10 7`);

    // Röhre mit Tübbingring, Sohle, Gehwegen
    function roehre(x, Ri, d, yF, gehweg) {
      let s2 = `<path class="lf" d="${kreis(x, cy, Ri + d)}"/>` + pfad('l', kreis(x, cy, Ri));
      let z = '';
      for (let k = 0; k < 8; k++) {
        const w = ((k * 45 + 22.5) * PI) / 180;
        z += `M${r(x + Ri * Math.cos(w))} ${r(cy + Ri * Math.sin(w))}L${r(x + (Ri + d) * Math.cos(w))} ${r(cy + (Ri + d) * Math.sin(w))}`;
      }
      // Sohlbeton unter der Fahrbahn
      const hx = Math.sqrt(Ri * Ri - (yF - cy) ** 2);
      const sohle = `M${r(x - hx)} ${r(yF)}H${r(x + hx)}A${r(Ri)} ${r(Ri)} 0 0 1 ${r(x - hx)} ${r(yF)}Z`;
      s2 += flaeche(`eqs${Math.round(x)}`, sohle, schar([x - Ri, yF, x + Ri, cy + Ri], 45, 5), 'z');
      let t = `M${r(x - hx)} ${r(yF)}H${r(x + hx)}`;
      if (gehweg) {
        const yW = cy + 0.36 * Ri, wx = Math.sqrt(Ri * Ri - (yW - cy) ** 2), gx = 0.6 * Ri;
        t += `M${r(x - wx)} ${r(yW)}H${r(x - gx)}V${r(yF)}M${r(x + wx)} ${r(yW)}H${r(x + gx)}V${r(yF)}`;
        for (const sg of [-1, 1]) {
          // Kabelrohre im Gehweg, Handlauf an der Wand
          for (let k = 0; k < 3; k++) z += kreis(x + sg * (gx + 6 + k * 7), yW + 7, 2.4);
          const hy = cy - 0.05 * Ri, hxw = Math.sqrt(Ri * Ri - (hy - cy) ** 2);
          z += `M${r(x + sg * hxw)} ${r(hy)}h${r(-sg * 6)}` + kreis(x + sg * (hxw - 8), hy, 1.8);
        }
      }
      return s2 + pfad('z', z) + pfad('t', t);
    }
    const yF = cy + 0.55 * R, yF2 = cy + 0.5 * Rs;
    body += roehre(xl, R, dA, yF, true) + roehre(xr, R, dA, yF, true);
    body += `<g class="akzent"><path class="lf" d="${kreis(450, cy, Rs + dS)}"/></g>`;
    body += roehre(450, Rs, 0, yF2, false).replace(/<path class="lf"[^>]*\/>/, '');
    let sz = '';
    for (let k = 0; k < 6; k++) {
      const w = ((k * 60 + 30) * PI) / 180;
      sz += `M${r(450 + Rs * Math.cos(w))} ${r(cy + Rs * Math.sin(w))}L${r(450 + (Rs + dS) * Math.cos(w))} ${r(cy + (Rs + dS) * Math.sin(w))}`;
    }
    body += pfad('z', sz);

    // Gleise, Entwässerung und Fahrleitung in beiden Fahrtunneln
    for (const x of [xl, xr]) {
      let t = '', z = '';
      for (const sg of [-1, 1]) {
        const xs = x + sg * 12.9;
        t += rechteck(xs - 7, yF - 2, 14, 5);
        z += rechteck(xs - 1.5, yF - 7, 3, 5);
      }
      z += kreis(x, yF + 12, 4) + kreis(x, yF + 12, 2.2);
      const yC = cy - 0.52 * R;
      t += `M${x} ${r(cy - R)}V${r(yC - 16)}M${x - 10} ${r(yC - 16)}h20`;
      z += `M${x - 8} ${r(yC - 12)}L${x + 8} ${r(yC - 12)}M${x} ${r(yC - 12)}V${r(yC)}` + kreis(x, yC - 12, 1.8) + kreis(x, yC, 2);
      // Leuchten an der Wand
      for (const sg of [-1, 1]) {
        const ly = cy - 0.45 * R, lx = x + sg * Math.sqrt(R * R - (ly - cy) ** 2);
        z += rechteck(lx - (sg > 0 ? 6 : 0), ly - 3, 6, 6);
      }
      body += pfad('t', t) + pfad('z', z);
    }
    // Zug im linken Fahrtunnel (schematisch): Wagenkasten, Fenster, Drehgestell, Räder
    const zx = xl, zb = 0.52 * R, zu1 = yF - 13, zo = cy - 0.3 * R;
    body += `<path class="lf" d="M${r(zx - zb)} ${r(zu1)}V${r(zo)}Q${r(zx)} ${r(cy - 0.52 * R)} ${r(zx + zb)} ${r(zo)}V${r(zu1)}Z"/>`;
    let zt = rechteck(zx - zb + 6, cy - 0.2 * R, 18, 14) + rechteck(zx + zb - 24, cy - 0.2 * R, 18, 14) + rechteck(zx - 7, cy - 0.22 * R, 14, zu1 - (cy - 0.22 * R) - 4);
    zt += rechteck(zx - 26, zu1, 52, 6);
    let zz = kreis(zx - 12.9, yF - 9, 4.5) + kreis(zx + 12.9, yF - 9, 4.5) + `M${r(zx - zb)} ${r(zo + 8)}H${r(zx + zb)}`;
    body += pfad('t', zt) + pfad('z', zz);
    // Fahrzeug im Servicetunnel
    body += `<path class="lf" d="${rechteck(450 - 24, yF2 - 22, 48, 17)}"/>` + pfad('t', rechteck(450 + 6, yF2 - 19, 14, 8)) + pfad('z', kreis(450 - 14, yF2 - 4, 3.5) + kreis(450 + 14, yF2 - 4, 3.5));

    // Mittellinien der Röhren
    let ml = '';
    for (const [x, k] of [[xl, R + dA], [450, Rs + dS], [xr, R + dA]]) ml += `M${r(x - k - 12)} ${cy}H${r(x + k + 12)}M${x} ${r(cy - k - 12)}V${r(cy + k + 12)}`;
    body += pfad('ax', ml);
    // Hilfslinien für den Achsabstand
    body += pfad('m', `M${xl} 396V414M${xr} 396V414`);

    body += text(xl, 130, 'Fahrtunnel', 'gross hell', 'text-anchor="middle"') + text(xr, 130, 'Fahrtunnel', 'gross hell', 'text-anchor="middle"');
    body += text(450, 168, 'Servicetunnel', 'gross akz hell', 'text-anchor="middle"');
    body += massH(xl - R, xl + R, cy + R + 30, '7,6 m') + massH(xr - R, xr + R, cy + R + 30, '7,6 m') + massH(450 - Rs, 450 + Rs, cy + Rs + 30, '4,8 m');
    body += massH(xl, xr, 406, 'Abstand rund 30 m');
    return svg(900, 470, body);
  }

  // Draufsicht: elf Bohrmaschinen starten an zwei Küsten und graben in beide Richtungen
  function vortriebe({ lesbar = false, reel = false } = {}) {
    if (lesbar) return vortriebeRuhig(reel);
    const y = 230, xE = 230, xF = 690, xT = 470;
    let body = '';
    // Küstenlinien mit Tiefenlinien zur See und Höhenlinien an Land
    const kueste = (x0, sg, versatz, i0) => {
      const p = [];
      for (let yy = 116, i = 0; yy <= 384; yy += 8, i++) {
        const bucht = sg * 22 * Math.sin(((yy - 116) / 268) * PI);
        p.push([x0 + bucht + versatz + (rausch(i + i0, 3) - 0.5) * 5, yy]);
      }
      return zug(p);
    };
    body += pfad('l', kueste(xE + 34, -1, 0, 0) + kueste(xF - 34, 1, 0, 40));
    body += pfad('z', kueste(xE + 34, -1, 22, 0) + kueste(xE + 34, -1, 46, 0) + kueste(xF - 34, 1, -22, 40) + kueste(xF - 34, 1, -46, 40));
    body += pfad('t', kueste(xE + 34, -1, -24, 7).replace(/^M/, 'M') + kueste(xF - 34, 1, 24, 47));
    body += pfad('t', `M${r(xE + 34)} 116l-8 -10M${r(xF - 34)} 116l8 -10`);
    body += pfad('z', wellen(xE + 110, xF - 110, 150) + wellen(xE + 120, xF - 120, 330) + wellen(xE + 140, xF - 140, 352));

    // Röhren als Doppellinien, Bohrmaschinen am Kopf jeder Röhre
    const roehre = (x1, x2, yy) => `M${r(Math.min(x1, x2))} ${yy - 4}H${r(Math.max(x1, x2))}M${r(Math.min(x1, x2))} ${yy + 4}H${r(Math.max(x1, x2))}`;
    const tbm = (xk, yy, d) => {
      // xk = Bohrkopf, d = Vortriebsrichtung (+1 nach rechts)
      const x0 = d > 0 ? xk - 26 : xk;
      return { umriss: rechteck(x0, yy - 6, 26, 12), kopf: `M${r(xk)} ${yy - 8}V${yy + 8}`, fein: `M${r(xk - d * 6)} ${yy - 6}V${yy + 6}M${r(xk - d * 14)} ${yy - 6}V${yy + 6}M${r(xk - d * 26)} ${yy}h${r(-d * 30)}` };
    };
    let akzL = '', akzLf = '', akzK = '', grL = '', grLf = '', grK = '', fein = '', tr = '';
    for (const dy of [-26, 0, 26]) {
      // England seewärts (treffen Frankreich), England landwärts
      tr += roehre(xE + 10, xT, y + dy) + roehre(xE - 10, 64, y + dy);
      let m = tbm(xT - 2, y + dy, 1); akzLf += m.umriss; akzK += m.kopf; fein += m.fein;
      m = tbm(64, y + dy, -1); grLf += m.umriss; grK += m.kopf; fein += m.fein;
      // Frankreich seewärts, leicht versetzt (gut 35 cm, übertrieben)
      tr += roehre(xF - 10, xT, y + dy + 2);
      m = tbm(xT + 2, y + dy + 2, -1); akzLf += m.umriss; akzK += m.kopf; fein += m.fein;
    }
    for (const dy of [-13, 13]) {
      tr += roehre(xF + 10, 836, y + dy);
      const m = tbm(836, y + dy, 1); grLf += m.umriss; grK += m.kopf; fein += m.fein;
    }
    body += pfad('t', tr);
    body += `<path class="lf" d="${grLf}"/>` + pfad('l', grK);
    body += `<g class="akzent"><path class="lf" d="${akzLf}"/>${pfad('l', akzK)}</g>`;
    body += pfad('z', fein);
    // Achse und Treffpunkt
    body += pfad('ax', `M50 ${y}H850`) + pfad('d', `M${xT} 170V290`);
    // Startplätze an den Küsten mit Schacht
    body += `<path class="lf" d="${rechteck(xE - 10, y - 44, 20, 88)}${rechteck(xF - 10, y - 44, 20, 88)}"/>`;
    body += pfad('t', `M${xE - 10} ${y - 44}l20 88M${xE + 10} ${y - 44}l-20 88` + kreis(xF, y - 30, 6) + kreis(xF, y + 30, 6));
    // Pfeile der Vortriebsrichtung
    body += pfad('t', `M${xE + 30} ${y - 52}h40m-8 -6l8 6l-8 6M${xE - 30} ${y - 52}h-40m8 -6l-8 6l8 6M${xF - 30} ${y - 52}h-40m8 -6l-8 6l8 6M${xF + 30} ${y - 52}h40m-8 -6l8 6l-8 6`);
    body += pfad('t', `M${xT} 300V398`);
    body += text(xE, 60, 'England', 'gross', 'text-anchor="middle"') + text(xE, 94, '6 Maschinen', '', 'text-anchor="middle"');
    body += text(xF, 60, 'Frankreich', 'gross', 'text-anchor="middle"') + text(xF, 94, '5 Maschinen', '', 'text-anchor="middle"');
    body += text(40, 430, 'Treffpunkt unter dem Meer', 'gross akz') + text(40, 466, '1. Dezember 1990', 'akz');
    body += text(60, 300, 'ins Land') + text(840, 160, 'ins Land', '', 'text-anchor="end"');
    return svg(900, 490, body);
  }

  // =============================================================================================
  // Lesbare Vorlage: ruhige Fassungen. Zeichenfläche 900 breit, eine Einheit ist ein Pixel im Blatt.
  // =============================================================================================

  // Band gleicher Dicke um eine Linie (senkrecht zur Laufrichtung um d versetzt)
  const bandUm = (pts, d) => {
    const o = [], u = [];
    pts.forEach(([x, y], i) => {
      const [xa, ya] = pts[Math.max(0, i - 1)], [xb, yb] = pts[Math.min(pts.length - 1, i + 1)];
      const l = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / l, ny = (xb - xa) / l;
      o.push([x + nx * d, y + ny * d]);
      u.push([x - nx * d, y - ny * d]);
    });
    return zu(o.concat(u.reverse()));
  };

  // Längsschnitt, ruhig. Ohne beschriftet (Titelblatt, Reel): Boden schraffiert, Tunnel gelb, ein Maß „38 km“.
  // Mit beschriftet (Blatt „Die Route“): nur die Kreideschicht schraffiert und gelb gefasst, Tunnel weiß, „rund 40 m“ groß.
  function profilRuhig(beschriftet, reel) {
    const id = beschriftet ? 'erb' : 'era';
    const ox = 60, sx = 780 / 50.5, sy = beschriftet ? 3.2 : 2.4, meer = beschriftet ? 212 : 176;
    const X = km => ox + km * sx, Y = m => meer + m * sy;
    const kE = 9, kF = 47, unten = r(Y(beschriftet ? 108 : 90));
    // Meeresgrund und Tunnelachse wie in der CAD-Fassung (schematisch)
    const GRUND = [[kE, 0], [10, 9], [12, 22], [15, 29], [18, 32], [25, 32], [28, 34], [32, 35], [35, 33], [38, 30], [43, 30], [45, 18], [kF, 0]];
    const ACHSE = [[0, -40], [5, 10], [kE, 38], [12, 62], [18, 72], [25, 72], [32, 75], [38, 70], [43, 70], [kF, 42], [50.5, -12]];
    const glatt = km => bei(ACHSE, km);
    const oberflaeche = [[30, Y(-40)]];
    for (let km = -1.5, i = 0; km < 7.6; km += 0.5, i++) oberflaeche.push([X(km), Y(-40 + (rausch(i, 3) - 0.5) * 3)]);
    oberflaeche.push([X(7.6), Y(-40)], [X(8.1), Y(-37)], [X(8.35), Y(-12)], [X(8.7), Y(-5)], [X(kE), Y(0)]);
    for (let km = kE + 0.5, i = 0; km < kF; km += 0.5, i++) oberflaeche.push([X(km), Y(bei(GRUND, km) + (rausch(i, 7) - 0.5) * 2.2)]);
    oberflaeche.push([X(kF), Y(0)], [X(47.6), Y(-8)], [X(48.2), Y(-12)]);
    for (let km = 48.7, i = 0; X(km) < 870; km += 0.5, i++) oberflaeche.push([X(km), Y(-12 + (rausch(i, 9) - 0.5) * 2)]);
    oberflaeche.push([870, Y(-12)]);
    const boden = zu(oberflaeche.concat([[870, unten], [30, unten]]));
    const achsPts = [];
    for (let km = 0; km <= 50.5 + 1e-6; km += 0.25) achsPts.push([X(km), Y(glatt(km))]);

    let body = '';
    if (beschriftet) {
      // Kreideschicht um den Tunnel (oben −14 m, unten +12 m): schraffiert, Grenzen gelb
      const schicht = dm => { const p = []; for (let km = -3; km <= 54; km += 0.5) p.push([X(km), Y(glatt(km) + dm)]); return p; };
      const kOben = schicht(-14), kUnten = schicht(12);
      body += flaeche(`${id}k`, boden, zu(kOben.concat(kUnten.slice().reverse())), 'hs');
      body += flaeche(`${id}g`, boden, zug(kOben) + zug(kUnten), 'a');
    } else {
      body += pfad('hs', boden);
    }
    // Schnittbegrenzung, Gelände und Meeresgrund
    body += pfad('t', `M30 ${r(Y(-40))}V${unten}H870V${r(Y(-12))}`) + pfad('l', zug(oberflaeche));
    // Meer: Wasserspiegel und zwei Reihen Wellen
    const welle = (m, k1, k2) => wellen(r(X(k1)), r(X(k2)), r(Y(m)));
    body += pfad('t', `M${r(X(kE))} ${meer}H${r(X(kF))}` + welle(9, 10.8, 45.6) + welle(20, 12.8, 44));
    // Tunnel als Band, Portale als Punkte
    const portale = `<path class="lf" d="${kreis(X(0), Y(-40), 8)}${kreis(X(50.5), Y(-12), 8)}"/>`;
    if (beschriftet) body += `<path class="lf" d="${bandUm(achsPts, 4)}"/>` + portale;
    else body += pfad('bgl', zug(achsPts)) + `<path class="af" d="${bandUm(achsPts, 3)}"/><g class="akzent">${portale}</g>`;
    body += text(40, r(Y(-40)) - 26, 'England', 'gross') + text(860, r(Y(-12)) - 26, 'Frankreich', 'gross', 'text-anchor="end"');

    if (!beschriftet) {
      // Fürs Reel ohne Maß, oben und unten knapp beschnitten
      if (reel) return svg(900, unten - r(Y(-40)) + 60, `<g transform="translate(0 ${30 - r(Y(-40))})">${body}</g>`);
      // Ein großes Maß von Küste zu Küste
      const ym = unten + 28, x1 = r(X(kE)), x2 = r(X(kF));
      body += pfad('m', `M${x1} ${unten + 8}V${ym + 10}M${x2} ${unten + 8}V${ym + 10}M${x1} ${ym}H${x2}M${x1 - 7} ${ym + 7}l14 -14M${x2 - 7} ${ym + 7}l14 -14`);
      body += text((x1 + x2) / 2, ym + 56, '38 km', 'riesig mass', 'text-anchor="middle"');
      return svg(900, unten + 106, body);
    }
    // Blatt „Die Route“: Abstand zwischen Meeresgrund und Tunnel groß und gelb, Gesamtlänge als Maß
    const xm = r(X(25)), y1 = r(Y(32)) + 7, y2 = r(Y(72)) - 10;
    if (!reel) body += pfad('a', `M${xm} ${y1}V${y2}M${xm - 10} ${y1 + 15}L${xm} ${y1}L${xm + 10} ${y1 + 15}M${xm - 10} ${y2 - 15}L${xm} ${y2}L${xm + 10} ${y2 - 15}`);
    body += text(xm + 24, r(Y(58)) - 18, 'rund 40 m', 'riesig akz hell');
    body += text(X(31), r(Y(87)) + 48, 'Kreideschicht', 'gross akz hell', 'text-anchor="middle"');
    if (!reel) body += massH(X(0), X(50.5), unten + 28, '50,5 km', 40);
    return svg(900, unten + (reel ? 30 : 90), body);
  }

  // Querschnitt, ruhig: drei Röhren im schraffierten Gestein, Servicetunnel und Querschläge gelb, fünf Beschriftungen.
  // Von den Maßen bleibt nur der Fahrtunnel (7,6 m); Servicetunnel 4,8 m und Abstand rund 30 m stehen in der CAD-Fassung.
  function querschnittRuhig(reel) {
    const s = 20, cy = 310, xl = 450 - 15 * s, xr = 450 + 15 * s, R = 3.8 * s, Rs = 2.4 * s, dA = 10, dS = 8;
    const oben = cy - 290, unten = cy + 270;
    // Gestein als Schraffur, mit freien Feldern für die Beschriftungen
    const fels = rechteck(30, oben, 840, unten - oben);
    const loecher = reel ? [] : [[20, cy - 200, 260, 54], [620, cy - 200, 260, 54], [284, cy - 136, 332, 54],
      [xl - R - 14, cy + 104, 2 * R + 28, 66], [336, cy + 160, 228, 50]];
    let body = flaeche('erq', fels, fels, 'hs', loecher);

    // Querschläge zwischen den Röhren: gelb gefasst, Pfeile zum Servicetunnel
    const qO = cy - 22, qU = cy + 24;
    body += `<path class="lf" d="${rechteck(xl, qO, xr - xl, qU - qO)}"/>`;
    const a1 = xl + R + dA - 3, a2 = 450 - Rs - dS + 3, b1 = 450 + Rs + dS - 3, b2 = xr - R - dA + 3;
    body += `<g class="akzent">${pfad('l', `M${a1} ${qO}H${a2}M${a1} ${qU}H${a2}M${b1} ${qO}H${b2}M${b1} ${qU}H${b2}`)}</g>`;
    body += pfad('a', `M${a1 + 26} ${cy + 1}H${a2 - 22}m-13 -9l13 9l-13 9M${b2 - 26} ${cy + 1}H${b1 + 22}m13 -9l-13 9l13 9`);

    // Röhre: Tübbingring, Sohle schraffiert
    const roehre = (x, Ri, d, yF, gelb) => {
      const ring = `<path class="lf" d="${kreis(x, cy, Ri + d)}"/>`;
      const hx = Math.sqrt(Ri * Ri - (yF - cy) ** 2);
      const sohle = `M${r(x - hx)} ${r(yF)}H${r(x + hx)}A${r(Ri)} ${r(Ri)} 0 0 1 ${r(x - hx)} ${r(yF)}Z`;
      return (gelb ? `<g class="akzent">${ring}</g>` : ring) + pfad('hs', sohle) + pfad('t', kreis(x, cy, Ri) + `M${r(x - hx)} ${r(yF)}H${r(x + hx)}`);
    };
    const yF = cy + 0.55 * R, yF2 = cy + 0.5 * Rs;
    body += roehre(xl, R, dA, yF, false) + roehre(xr, R, dA, yF, false) + roehre(450, Rs, dS, yF2, true);
    // Zug von vorn in jedem Fahrtunnel, Fahrzeug im Servicetunnel (schematisch)
    const zugVorn = x => {
      const zb = 0.5 * R, zo = cy - 0.3 * R, zu1 = yF - 10;
      return `<path class="lf" d="M${r(x - zb)} ${r(zu1)}V${r(zo)}Q${r(x)} ${r(cy - 0.58 * R)} ${r(x + zb)} ${r(zo)}V${r(zu1)}Z"/>` +
        pfad('t', rechteck(x - zb + 8, cy - 0.18 * R, 22, 16) + rechteck(x + zb - 30, cy - 0.18 * R, 22, 16) + `M${r(x - 24)} ${r(zu1)}v10M${r(x + 24)} ${r(zu1)}v10`);
    };
    body += zugVorn(xl) + zugVorn(xr);
    body += `<path class="lf" d="${rechteck(450 - 24, yF2 - 28, 48, 20)}"/>` + pfad('punkt', kreis(450 - 13, yF2 - 4, 4) + kreis(450 + 13, yF2 - 4, 4));

    body += text(xl, cy - 160, 'Fahrtunnel', 'gross', 'text-anchor="middle"') + text(xr, cy - 160, 'Fahrtunnel', 'gross', 'text-anchor="middle"');
    body += text(450, cy - 96, 'Servicetunnel', 'gross akz', 'text-anchor="middle"');
    body += text(450, cy + 196, 'Querschlag', 'akz', 'text-anchor="middle"');
    if (!reel) {
      // ein Maß am Fahrtunnel, Hinweislinien vom Wort zu beiden Querschlägen
      body += massH(xl - R, xl + R, cy + 118, '7,6 m', 40);
      body += `<g class="akzent">${pfad('t', `M404 ${cy + 156}L330 ${qU + 4}M496 ${cy + 156}L570 ${qU + 4}`)}</g>`;
    }
    return svg(900, cy + 290, body);
  }

  // Draufsicht, ruhig: Land schraffiert, elf Bohrmaschinen, die sechs unter dem Meer gelb und sichtbar versetzt
  function vortriebeRuhig(reel) {
    const y = 314, xE = 240, xF = 660, xT = 450, yo = 134, yu = 494;
    const kueste = (x0, sg, i0) => {
      const p = [];
      for (let yy = yo, i = 0; yy <= yu; yy += 8, i++) p.push([x0 + sg * 22 * Math.sin(((yy - yo) / (yu - yo)) * PI) + (rausch(i + i0, 3) - 0.5) * 5, yy]);
      return p;
    };
    const kE = kueste(xE + 34, -1, 0), kF = kueste(xF - 34, 1, 40);
    let body = pfad('hs', zu([[20, yo], ...kE, [20, yu]]) + zu([[880, yo], ...kF, [880, yu]]));
    body += pfad('l', zug(kE) + zug(kF));
    body += pfad('t', wellen(300, 600, yo + 42) + wellen(300, 420, yu - 42) + wellen(486, 606, yu - 42));

    // Röhren als Doppellinien, Bohrmaschine am Kopf jeder Röhre (xk = Bohrkopf, d = Vortriebsrichtung)
    const rohr = (x1, x2, yy) => `M${Math.min(x1, x2)} ${yy - 7}H${Math.max(x1, x2)}M${Math.min(x1, x2)} ${yy + 7}H${Math.max(x1, x2)}`;
    const tbm = (xk, yy, d) => ({ koerper: rechteck(d > 0 ? xk - 40 : xk, yy - 11, 40, 22), kopf: `M${xk} ${yy - 15}V${yy + 15}` });
    let rohre = '', gelbK = '', gelbL = '', weissK = '', weissL = '';
    for (const dy of [-44, 0, 44]) {
      // England unter das Meer und ins Land; Frankreich unter das Meer, seitlich versetzt (gut 35 cm, übertrieben)
      rohre += rohr(xE + 10, xT - 45, y + dy) + rohr(xE - 10, 110, y + dy) + rohr(xF - 10, xT + 45, y + dy + 10);
      let m = tbm(xT - 5, y + dy, 1); gelbK += m.koerper; gelbL += m.kopf;
      m = tbm(xT + 5, y + dy + 10, -1); gelbK += m.koerper; gelbL += m.kopf;
      m = tbm(70, y + dy, -1); weissK += m.koerper; weissL += m.kopf;
    }
    for (const dy of [-22, 22]) {
      rohre += rohr(xF + 10, 790, y + 5 + dy);
      const m = tbm(830, y + 5 + dy, 1); weissK += m.koerper; weissL += m.kopf;
    }
    body += pfad('t', rohre);
    body += `<path class="lf" d="${weissK}"/>` + pfad('l', weissL);
    body += `<g class="akzent"><path class="lf" d="${gelbK}"/>${pfad('l', gelbL)}</g>`;
    // Startplätze an den Küsten, Pfeile der Vortriebsrichtung
    body += `<path class="lf" d="${rechteck(xE - 10, y - 68, 20, 136)}${rechteck(xF - 10, y - 58, 20, 136)}"/>`;
    const pfeil = (x, d) => `M${x} ${y - 90}h${d * 56}m${-d * 12} -8l${d * 12} 8l${-d * 12} 8`;
    body += pfad('t', pfeil(xE + 44, 1) + pfeil(xE - 44, -1) + pfeil(xF - 44, -1) + pfeil(xF + 44, 1));

    body += text(xE, 58, 'England', 'gross', 'text-anchor="middle"') + text(xE, 102, '6 Maschinen', '', 'text-anchor="middle"');
    body += text(xF, 58, 'Frankreich', 'gross', 'text-anchor="middle"') + text(xF, 102, '5 Maschinen', '', 'text-anchor="middle"');
    // Treffpunkt unter dem Meer: Pfeil und das eine große Maß
    if (!reel) body += pfad('a', `M${xT} ${yu + 18}V${y + 86}m-11 16l11 -16l11 16`);
    body += text(xT, yu + 78, 'gut 35 cm', 'riesig akz', 'text-anchor="middle"');
    return svg(900, yu + 114, body);
  }

  Object.assign(Zeichnung, { eurotunnelProfil, eurotunnelQuerschnitt, vortriebe });
})();
