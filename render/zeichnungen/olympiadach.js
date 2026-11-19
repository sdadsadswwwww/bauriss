// Zeichnungen: Olympiastadion München mit Zeltdach. Schematisch.
// Belegt: Masten über dem Stadion 70 m, Rundseil 440 m, Ankerquader bis 4000 t,
// Netzmaschen 75 cm, Acrylglasplatten etwa 3 × 3 m. Alle übrigen Proportionen nach Fotos vereinfacht.
(function () {
  const { r, svg, pfad, text, kreis, boden, massH } = Z;

  // Ansicht der Zeltlandschaft: vorn die Ränge, das Netz in Buckeln, dahinter die Masten
  function zeltLandschaft({ beschriftet = false } = {}) {
    const g = 500;
    const tief = [[30, g], [290, g - 170], [500, g - 150], [700, g - 160], [880, g]];
    const hoch = [[160, 250], [400, 170], [600, 230], [790, 270]];
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
    let body = '';
    // Masten hinter dem Netz, oben mit Hängeseil zum Hochpunkt
    let ml = '', mt = '';
    for (const [px, py] of hoch) {
      const tx = px + 30, ty = py - (px === 400 ? 110 : 100);
      ml += `M${px + 60} ${g}L${tx} ${ty}`;
      mt += `M${tx} ${ty}L${px} ${py}M${tx} ${ty}L${Math.min(px + 100, 860)} ${g}`;
    }
    body += pfad('t', mt) + pfad('l', ml);
    // Netz als deckende Fläche, darauf zwei Linien als Maschenandeutung
    body += `<path class="lf" d="${kurve(0)}Z"/>`;
    body += pfad('t', kurve(24) + kurve(48));
    body += pfad(beschriftet ? 'a' : 'l', kurve(0));
    // Ränge als Erdwall
    let stufen = `M40 ${g}`;
    for (let i = 0; i < 8; i++) stufen += 'h28v-12';
    body += `<path class="lf" d="${stufen}V${g}Z"/><path class="hs" d="${stufen}V${g}Z"/>` + pfad('l', stufen + `V${g}`);
    body += boden(20, 880, g);
    if (beschriftet) {
      body += pfad('t', 'M120 128L132 254') + text(40, 120, 'Seilnetz', 'gross akz');
      body += text(450, 50, 'Mast, 70 m', 'gross');
      body += text(40, g + 44, 'Ränge');
    }
    return svg(900, 560, body);
  }

  // Wettbewerbsmodell 1967: Holzstäbe, darüber ein gespannter Nylonstrumpf
  function strumpfModell() {
    const brett = 400;
    let body = `<path class="hf" d="M80 ${brett}H820V${brett + 30}H80Z"/>`;
    // Stäbe
    body += pfad('l', `M250 ${brett}V140M470 ${brett}V90M650 ${brett}V170M380 ${brett}V230`);
    // Strumpf als Haut, von Stab zu Stab gespannt
    const haut = `M100 ${brett}Q170 250 250 140Q360 200 470 90Q560 200 650 170Q740 260 800 ${brett}`;
    body += pfad('a', haut);
    body += pfad('t', `M140 ${brett}Q200 280 250 175Q360 235 470 130Q560 235 650 205Q720 290 760 ${brett}`);
    body += pfad('t', 'M200 128L246 160') + text(40, 120, 'Holzstäbe', 'gross');
    body += pfad('t', 'M600 72L585 150') + text(560, 60, 'Nylonstrumpf', 'gross akz');
    body += text(450, 470, 'Modell im Maßstab 1 : 1000', '', 'text-anchor="middle"');
    return svg(900, 490, body);
  }

  // Grundriss: das Dach über der Westtribüne, vorn gehalten vom Rundseil
  function rundseilPlan() {
    const cx = 500, cy = 300;
    let body = '';
    // Dachfläche zwischen Rundseil und Außenrand
    const dach = 'M440 83Q150 300 440 517Q-150 300 440 83Z';
    body += `<path class="hs" d="${dach}"/>` + pfad('t', 'M440 83Q-150 300 440 517');
    // Stadion: Außenrand, Laufbahn, Spielfeld
    body += `<ellipse class="l" cx="${cx}" cy="${cy}" rx="360" ry="220"/>`;
    body += `<ellipse class="l" cx="${cx}" cy="${cy}" rx="210" ry="130"/>`;
    body += `<ellipse class="t" cx="${cx}" cy="${cy}" rx="170" ry="95"/>`;
    body += pfad('t', `M425 252h150v97h-150ZM500 252v97`);
    // Rundseil und die beiden Anker
    body += pfad('bgl', 'M440 83Q150 300 440 517') + pfad('a', 'M440 83Q150 300 440 517');
    body += `<path class="af" d="M427 70h26v26h-26ZM427 504h26v26h-26Z"/>`;
    body += pfad('t', 'M458 66L486 48') + text(494, 50, 'Betonanker, bis 4000 t');
    body += pfad('t', 'M366 452L320 556') + text(140, 590, 'Rundseil, 440 m lang', 'gross akz');
    body += text(176, 312, 'Dach', 'gross hell');
    return svg(900, 620, body);
  }

  // Ausschnitt der Dachhaut: Seilnetz mit 75-cm-Maschen, darauf eine Acrylglasplatte
  function netzDetail() {
    const x0 = 60, y0 = 40, m = 60, nx = 13, ny = 6;
    let seile = '', knoten = '';
    for (let i = 0; i <= nx; i++) seile += `M${x0 + i * m} ${y0}V${y0 + ny * m}`;
    for (let j = 0; j <= ny; j++) seile += `M${x0} ${y0 + j * m}H${x0 + nx * m}`;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) knoten += kreis(x0 + i * m, y0 + j * m, 4);
    let body = pfad('t', seile) + pfad('l', knoten);
    // Platten: eine hervorgehoben, Nachbarn gestrichelt, leicht überlappend
    body += pfad('d', `M534 94h244v244h-244Z`);
    body += pfad('a', `M300 100h240v240h-240Z`);
    body += massH(x0, x0 + m, y0 + ny * m + 30, '75 cm');
    body += pfad('t', 'M420 342V436') + text(300, 462, 'Acrylglasplatte, etwa 3 × 3 m', 'akz');
    return svg(900, 490, body);
  }

  Object.assign(Zeichnung, { zeltLandschaft, strumpfModell, rundseilPlan, netzDetail });
})();
