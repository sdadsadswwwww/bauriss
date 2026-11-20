// Zeichnungen: Olympiastadion München mit Zeltdach. Schematisch.
// Belegt: Masten über dem Stadion 70 m, Rundseil 440 m, Ankerquader bis 4000 t,
// Netzmaschen 75 cm, Acrylglasplatten etwa 3 × 3 m (= 4 × 4 Maschen), Modell im Maßstab 1 : 1000.
// Alle übrigen Proportionen nach Fotos vereinfacht und ohne Maßzahl: Lage und Neigung der Masten, Abspannseile,
// Hochpunkte, Ränge, Laufbahn, Klemmen an den Knoten, Halter der Platten, Holzstäbe und Strumpf im Modell.
(function () {
  const { r, svg, pfad, text, kreis, boden, massH } = Z;

  // ---- Hilfen ----
  // quadratische Bézier-Kurven abtasten: Punkte [P0, C1, P1, C2, P2, ...] -> Liste von [x, y]
  function abtasten(p, n = 24) {
    const out = [p[0]];
    for (let i = 0; i + 2 < p.length; i += 2) {
      const [a, c, b] = [p[i], p[i + 1], p[i + 2]];
      for (let k = 1; k <= n; k++) {
        const t = k / n, u = 1 - t;
        out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
      }
    }
    return out;
  }
  const zug = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
  // Netzraster: zwei Scharen diagonaler Linien im Rechteck x0..x1, y0..y1
  function diagonalen(x0, y0, x1, y1, a) {
    let d = '';
    const h = y1 - y0;
    for (let x = x0 - h; x <= x1; x += a) d += `M${r(x)} ${r(y1)}L${r(x + h)} ${r(y0)}M${r(x)} ${r(y0)}L${r(x + h)} ${r(y1)}`;
    return d;
  }
  function achse(x1, y1, x2, y2, name, kx, ky) {
    return pfad('ax', `M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}`) + pfad('m', kreis(kx, ky, 15)) +
      text(kx, ky + 8, name, 'achse', 'text-anchor="middle"');
  }

  // Ansicht der Zeltlandschaft: vorn die Ränge, darüber das Netz zwischen Rundseil und Hochpunkten, dahinter die Masten
  function zeltLandschaft({ beschriftet = false } = {}) {
    const g = 480, H = 540;
    const tief = [[30, g], [290, 300], [500, 318], [700, 306], [880, g]];
    const hoch = [[160, 238], [400, 150], [600, 218], [790, 258]];
    const kurve = dy => {
      const pk = [];
      tief.forEach((t, i) => { pk.push(t); if (hoch[i]) pk.push(hoch[i]); });
      const P = pk.map(([x, y], i) => (i === 0 || i === pk.length - 1 ? [x, y] : [x, y + dy]));
      let d = `M${P[0][0]} ${P[0][1]}`;
      for (let i = 1; i < P.length; i++) {
        const [ax, ay] = P[i - 1], [bx, by] = P[i], mx = r((ax + bx) / 2);
        d += `C${mx} ${ay} ${mx} ${by} ${bx} ${by}`;
      }
      return d;
    };
    const rand = `C670 296 230 296 30 ${g}`;
    const netz = `${kurve(0)}${rand}Z`;
    const id = `od-netz-${beschriftet ? 1 : 0}`;
    let body = `<clipPath id="${id}"><path d="${netz}"/></clipPath>`;

    // Masten hinter dem Netz: Rohr, Kopf, Achse, Abspannseile zu Ankern im Boden, Hängeseile zu den Hochpunkten
    let ml = '', mt = '', mz = '', ax = '', anker = '';
    for (const [px, py] of hoch) {
      const fx = px === 400 ? 322 : px + 60, tx = px + 30, ty = py - (px === 400 ? 110 : 96);
      const n = Math.hypot(tx - fx, ty - g), ux = (tx - fx) / n, uy = (ty - g) / n, nx = -uy, ny = ux;
      ml += `M${r(fx + nx * 6)} ${r(g + ny * 6)}L${r(tx + nx * 3)} ${r(ty + ny * 3)}L${r(tx - nx * 3)} ${r(ty - ny * 3)}L${r(fx - nx * 6)} ${r(g - ny * 6)}`;
      for (let k = 0.18; k < 0.95; k += 0.16) mz += `M${r(fx + (tx - fx) * k + nx * 5)} ${r(g + (ty - g) * k + ny * 5)}l${r(-nx * 10)} ${r(-ny * 10)}`;
      ax += `M${r(fx - ux * 14)} ${r(g - uy * 14)}L${r(tx + ux * 26)} ${r(ty + uy * 26)}`;
      mt += `M${r(tx - 7)} ${r(ty - 3)}h14v8h-14z`;
      // Hängeseile in einem Fächer zum Hochpunkt, dort ein Ring
      for (const dx of [-16, 0, 16]) mt += `M${r(tx)} ${r(ty + 4)}L${r(px + dx)} ${r(py + Math.abs(dx) * 0.5)}`;
      mz += kreis(px, py, 5);
      // Abspannseile nach hinten
      const a1 = Math.min(tx + 120, 862), a2 = Math.min(tx + 64, 862);
      mt += `M${r(tx)} ${r(ty + 2)}L${a1} ${g}M${r(tx)} ${r(ty + 2)}L${a2} ${g}`;
      for (const a of [a1, a2]) anker += `M${a - 9} ${g}h18v12h-18z`;
      // Fußgelenk
      mt += `M${r(fx - 10)} ${g}l10 -12l10 12`;
    }
    body += pfad('ax', ax) + pfad('t', mt) + pfad('z', mz) + pfad('l', ml);
    body += `<path class="hf" d="${anker}"/>`;

    // Netz als deckende Fläche, darin Maschenraster, Plattenfugen und Höhenlinien
    body += `<path class="lf" d="${netz}"/>`;
    const maschen = diagonalen(20, 130, 890, g, 13), fugen = diagonalen(20, 130, 890, g, 52);
    const inNetz = pfad('z', maschen) + pfad('t', fugen + kurve(26) + kurve(52) + kurve(78));
    body += `<g clip-path="url(#${id})">${inNetz}</g>`;
    body += pfad(beschriftet ? 'a' : 'l', kurve(0) + `M880 ${g}${rand}`);
    // Klemmen am Randseil
    let kl = '';
    for (let i = 1; i < 30; i++) {
      const t = i / 30, u = 1 - t;
      const x = u ** 3 * 880 + 3 * u * u * t * 670 + 3 * u * t * t * 230 + t ** 3 * 30;
      const y = u ** 3 * g + 3 * u * u * t * 296 + 3 * u * t * t * 296 + t ** 3 * g;
      kl += `M${r(x)} ${r(y - 4)}v8`;
    }
    body += pfad('t', kl);

    // Ränge unter dem Dach (links) und gegenüber (rechts) als geschnittener Erdwall mit Sitzreihen
    let links = `M60 ${g}`, sitze = '';
    for (let i = 0; i < 9; i++) {
      links += 'h26v-9';
      sitze += `M${66 + i * 26} ${g - 9 * (i + 1)}v-5h10`;
    }
    links += `h20L330 ${g}Z`;
    let rechts = `M610 ${g}`;
    for (let i = 0; i < 6; i++) rechts += 'v-9h26';
    rechts += `L860 ${g}Z`;
    for (let i = 0; i < 6; i++) sitze += `M${616 + i * 26} ${g - 9 * (i + 1)}v-5h10`;
    for (const d of [links, rechts]) body += `<path class="lf" d="${d}"/><path class="hs" d="${d}"/>`;
    body += pfad('z', sitze);
    // Spielfeld
    body += pfad('t', `M340 ${g - 3}H600`);
    body += boden(20, 880, g);
    if (beschriftet) {
      body += pfad('t', 'M120 128L132 262') + text(40, 120, 'Seilnetz', 'gross akz');
      body += text(462, 48, 'Mast, 70 m', 'gross');
      body += text(40, g + 46, 'Ränge');
    }
    return svg(900, H, body);
  }

  // Wettbewerbsmodell 1967: Holzstäbe, darüber ein gespannter Nylonstrumpf
  function strumpfModell() {
    const brett = 440, H = 520;
    let body = '';
    // Grundplatte im Schnitt
    body += `<path class="hf" d="M80 ${brett}H820V${brett + 30}H80Z"/>`;
    body += pfad('z', `M80 ${brett + 8}H820`);
    // Stäbe: Rundholz, unten in die Platte gesteckt
    const staebe = [[250, 140], [470, 90], [650, 170], [380, 236]];
    let sl = '', sd = '', sz = '';
    for (const [x, y] of staebe) {
      sl += `M${x - 4} ${brett}V${y + 4}Q${x} ${y - 3} ${x + 4} ${y + 4}V${brett}`;
      sd += `M${x - 4} ${brett}V${brett + 22}H${x + 4}V${brett}`;
      sz += `M${x} ${brett - 6}V${y + 10}` + kreis(x, y + 2, 7);
    }
    // Strumpf als Haut, von Stab zu Stab gespannt
    const P = [[100, brett], [170, 250], [250, 140], [360, 200], [470, 90], [560, 200], [650, 170], [740, 260], [800, brett]];
    const haut = abtasten(P);
    const unterkante = abtasten([[140, brett], [200, 280], [250, 175], [360, 235], [470, 130], [560, 235], [650, 205], [720, 290], [760, brett]]);
    // Maschenbild: Fäden von der Haut zur Platte und Reihen dazwischen
    let maschen = '';
    for (let i = 3; i < haut.length - 3; i += 3) {
      const [x, y] = haut[i];
      const xb = 100 + ((x - 100) / 700) * 700;
      maschen += `M${r(x)} ${r(y)}Q${r(x)} ${r((y + brett) / 2)} ${r(xb)} ${brett}`;
    }
    for (const f of [0.18, 0.36, 0.54, 0.72]) maschen += zug(haut.map(([x, y]) => [x, y + f * (brett - y)]));
    body += pfad('d', sd) + pfad('l', sl) + pfad('z', sz);
    body += `<g class="akzent">${pfad('z', maschen)}</g>`;
    body += pfad('a', zug(haut));
    body += pfad('t', zug(unterkante));
    // Stecknadeln am Rand
    let nadeln = '';
    for (const x of [100, 120, 780, 800]) nadeln += `M${x} ${brett}v-14` + kreis(x, brett - 17, 3);
    body += pfad('t', nadeln);
    // Achsen der beiden hohen Stäbe
    body += pfad('ax', `M470 ${brett + 26}V64M250 ${brett + 26}V118`);
    body += pfad('t', 'M200 128L244 160') + text(40, 120, 'Holzstäbe', 'gross');
    body += pfad('t', 'M600 72L585 150') + text(560, 60, 'Nylonstrumpf', 'gross akz');
    body += text(450, brett + 66, 'Modell im Maßstab 1 : 1000', '', 'text-anchor="middle"');
    return svg(900, H, body);
  }

  // Grundriss: das Dach über der Westtribüne, vorn gehalten vom Rundseil
  function rundseilPlan() {
    const cx = 520, cy = 316, H = 640;
    const N = [460, 92], S = [460, 540];
    const seil = `M${N[0]} ${N[1]}Q140 ${cy} ${S[0]} ${S[1]}`;
    const dach = `${seil}Q-240 ${cy} ${N[0]} ${N[1]}Z`;
    let body = `<clipPath id="od-dach"><path d="${dach}"/></clipPath>`;
    // Stadion: Außenrand, Ränge mit Reihen und Treppen, Laufbahn, Spielfeld
    const ell = (rx, ry, cls) => `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
    body += ell(330, 214, 'l') + ell(205, 128, 'l');
    for (let k = 1; k < 10; k++) body += ell(205 + k * 12.5, 128 + k * 8.6, 'z');
    let treppen = '';
    for (let a = 0; a < 360; a += 12) {
      const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
      treppen += `M${r(cx + 205 * c)} ${r(cy + 128 * s)}L${r(cx + 330 * c)} ${r(cy + 214 * s)}`;
    }
    body += pfad('z', treppen);
    for (let k = 0; k <= 6; k++) body += ell(166 + k * 5, 96 + k * 4, k === 0 || k === 6 ? 't' : 'z');
    body += pfad('t', `M440 262h160v108h-160ZM520 262v108` + kreis(520, 316, 18) + `M440 286h28v60h-28M600 286h-28v60h28`);
    // Dachfläche: Seilnetz zwischen Rundseil und Außenrand
    body += `<path class="lf" d="${dach}"/>`;
    body += `<g clip-path="url(#od-dach)">${pfad('z', diagonalen(-20, 60, 520, 580, 12))}${pfad('t', diagonalen(-20, 60, 520, 580, 48))}</g>`;
    body += pfad('l', `M${S[0]} ${S[1]}Q-240 ${cy} ${N[0]} ${N[1]}`);
    // Masten außerhalb, Hängeseile zu den Hochpunkten, Abspannseile nach außen
    let mast = '', seile = '';
    for (const [mx, my, hx, hy] of [[70, 218, 236, 230], [70, 414, 236, 402]]) {
      mast += kreis(mx, my, 9) + `M${mx - 13} ${my}h26M${mx} ${my - 13}v26`;
      seile += `M${mx} ${my}L${hx} ${hy}M${mx} ${my}L${hx + 30} ${hy + (hy < cy ? -60 : 60)}M${mx} ${my}L36 ${my + (my < cy ? -58 : 58)}`;
      mast += kreis(hx, hy, 5);
    }
    body += pfad('t', seile) + pfad('l', mast);
    // Rundseil mit Klemmen und den beiden Ankern
    body += pfad('bgl', seil) + pfad('a', seil);
    let klemmen = '';
    for (let i = 1; i < 26; i++) {
      const t = i / 26, u = 1 - t;
      const x = u * u * N[0] + 2 * u * t * 140 + t * t * S[0], y = u * u * N[1] + 2 * u * t * cy + t * t * S[1];
      const dx = 2 * u * (140 - N[0]) + 2 * t * (S[0] - 140), dy = 2 * u * (cy - N[1]) + 2 * t * (S[1] - cy), n = Math.hypot(dx, dy);
      klemmen += `M${r(x - (dy / n) * 7)} ${r(y + (dx / n) * 7)}L${r(x + (dy / n) * 7)} ${r(y - (dx / n) * 7)}`;
    }
    body += pfad('t', klemmen);
    body += `<path class="af" d="M${N[0] - 13} ${N[1] - 13}h26v26h-26ZM${S[0] - 13} ${S[1] - 13}h26v26h-26Z"/>`;
    // Achsen
    body += achse(40, cy, 840, cy, 'A', 862, cy);
    body += achse(cx, 70, cx, 584, '1', cx, 600);
    // Beschriftung
    body += pfad('t', `M${N[0] - 6} ${N[1] - 14}L436 58`) + text(430, 50, 'Betonanker, bis 4000 t', '', 'text-anchor="end"');
    body += pfad('t', 'M330 470L300 586') + text(30, 614, 'Rundseil, 440 m lang', 'gross akz');
    body += text(176, 292, 'Dach', 'gross hell');
    return svg(900, H, body);
  }

  // Ausschnitt der Dachhaut: Seilnetz mit 75-cm-Maschen und Klemmen an den Knoten, darauf eine Acrylglasplatte
  function netzDetail() {
    const x0 = 40, y0 = 40, m = 60, nx = 9, ny = 6, x1 = x0 + nx * m, y1 = y0 + ny * m;
    let seile = '', klemmen = '', bolzen = '';
    // jedes Netzseil als Seilpaar
    for (let i = 0; i <= nx; i++) { const x = x0 + i * m; seile += `M${x - 1.6} ${y0 - 14}V${y1 + 14}M${x + 1.6} ${y0 - 14}V${y1 + 14}`; }
    for (let j = 0; j <= ny; j++) { const y = y0 + j * m; seile += `M${x0 - 14} ${y - 1.6}H${x1 + 14}M${x0 - 14} ${y + 1.6}H${x1 + 14}`; }
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      const x = x0 + i * m, y = y0 + j * m;
      klemmen += `M${x} ${y - 8}L${x + 8} ${y}L${x} ${y + 8}L${x - 8} ${y}Z`;
      bolzen += kreis(x, y - 4.5, 1.3) + kreis(x + 4.5, y, 1.3) + kreis(x, y + 4.5, 1.3) + kreis(x - 4.5, y, 1.3) + kreis(x, y, 2.4);
    }
    let body = pfad('t', seile) + `<path class="lf" d="${klemmen}"/>` + pfad('z', bolzen);
    // Platten: eine hervorgehoben (4 × 4 Maschen), Nachbarn gestrichelt
    const px = x0 + 2 * m + 4, py = y0 + m + 4, pw = 4 * m - 8;
    body += pfad('d', `M${px + pw + 8} ${py}H${x1 + 10}M${px + pw + 8} ${py}V${py + pw}H${x1 + 10}M${px - 8} ${py}H${x0 - 10}M${px - 8} ${py}V${py + pw}H${x0 - 10}`);
    let halter = '';
    for (const [hx, hy] of [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]]) halter += kreis(px + hx * pw, py + hy * pw, 4);
    body += `<g class="akzent">${pfad('t', halter + `M${px + 10} ${py + 10}h${pw - 20}v${pw - 20}h${-(pw - 20)}z`)}</g>`;
    body += pfad('a', `M${px} ${py}h${pw}v${pw}h${-pw}Z`);
    body += massH(x0, x0 + m, y1 + 36, '75 cm');
    body += pfad('t', `M${px + pw / 2} ${py + pw}V${y1 + 30}`) + text(200, 466, 'Acrylglasplatte, etwa 3 × 3 m', 'akz');
    return svg(900, 490, body);
  }

  Object.assign(Zeichnung, { zeltLandschaft, strumpfModell, rundseilPlan, netzDetail });
})();
