// Zeichnungen: Jungfraubahn, Kleine Scheidegg – Jungfraujoch. Höhen in Metern über Meer; schematisch, nicht maßstäblich.
// Belegt: Kleine Scheidegg rund 2064 m, Eigergletscher 2320 m, Eismeer 3160 m, Jungfraujoch 3454 m, Jungfrau 4158 m;
// offene Strecke bis Eigergletscher, danach Tunnel durch Eiger und Mönch; Stationen Eigerwand (1903) und Eismeer (1905)
// mit Ausblick aus dem Fels; der Plan von Guyer-Zeller führte weiter bis auf den Jungfraugipfel.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Umriss der Berge, Höhen von Eiger und Mönch, Lage der Stationen in der
// Waagrechten, Verlauf des Tunnels, die geplante Fortsetzung; der Schnitt durch die Nordwand ist eine Prinzipskizze.
(function () {
  const { r, svg, pfad, text, kreis, boden } = Z;

  // Ansicht von Norden: senkrecht überhöht, Höhe h in Metern -> y
  const TOP = 74, K = 0.16;
  const Y = h => TOP + (4200 - h) * K;
  const GRUND = Y(1700);
  // Grat von links (Kleine Scheidegg) über Eiger, Mönch, Joch zur Jungfrau
  const GRAT = [[20, Y(2010)], [60, Y(2045)], [120, Y(2130)], [150, Y(2210)], [190, Y(2330)], [262, Y(3960)],
    [300, Y(3600)], [340, Y(3420)], [430, Y(3500)], [490, Y(3800)], [560, Y(4100)], [620, Y(3720)],
    [680, Y(3510)], [735, Y(3800)], [800, Y(4158)], [845, Y(3500)], [880, Y(3000)]];
  // Stationen: x und Höhe
  const ST = {
    scheidegg: [60, 2064], gletscher: [188, 2320], eigerwand: [238, 2865], eismeer: [392, 3160], joch: [680, 3454],
  };
  const P = k => [ST[k][0], Y(ST[k][1])];

  function gratPfad() {
    return GRAT.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)} ${r(y)}`).join('');
  }

  // beschriftung: 'titel' | 'idee' | 'ende' | 'etappen' | 'keine'
  function jbBerge({ beschriftung = 'titel', plan = false, reel = false } = {}) {
    const zeigen = reel ? 'keine' : beschriftung;
    const [sx, sy] = P('scheidegg'), [gx, gy] = P('gletscher'), [wx, wy] = P('eigerwand'),
      [ex, ey] = P('eismeer'), [jx, jy] = P('joch');
    let body = '';
    const umriss = gratPfad();
    body += `<path class="lf" d="${umriss}L880 ${r(GRUND)}L20 ${r(GRUND)}Z"/>`;
    body += pfad('l', umriss);
    // Strecke: offen bis Eigergletscher, dann im Berg
    const offen = `M${sx} ${r(sy - 3)}L120 ${r(Y(2140) - 3)}L150 ${r(Y(2210) - 3)}L${gx} ${r(gy - 3)}`;
    const tunnel = `M${gx} ${r(gy - 3)}C214 ${r(gy - 24)} 230 ${r(wy + 40)} ${wx} ${r(wy)}` +
      `C270 ${r(wy - 40)} 330 ${r(ey + 10)} ${ex} ${r(ey)}C480 ${r(ey - 12)} 600 ${r(jy + 8)} ${jx} ${r(jy)}`;
    body += pfad('a', offen + tunnel);
    if (plan) {
      // geplante Fortsetzung bis auf den Gipfel, im Berg ansteigend
      const weiter = `M${jx} ${r(jy)}C740 ${r(jy + 12)} 788 ${r(jy - 25)} 796 ${r(Y(4110))}`;
      body += `<g class="geplant">${pfad('l', weiter)}</g>`;
    }
    // Stationen
    let st = '';
    for (const k of ['scheidegg', 'gletscher', 'eigerwand', 'eismeer', 'joch']) {
      const [x, y] = P(k);
      st += `<path class="lf" d="${kreis(x, k === 'scheidegg' || k === 'gletscher' ? y - 3 : y, 9)}"/>`;
    }
    body += `<g class="akzent">${st}</g>`;
    body += boden(20, 880, GRUND);

    const gipfel = (x, y, t, kl = 'gross') => text(x, y, t, kl, 'text-anchor="middle"');
    if (zeigen === 'titel' || zeigen === 'idee') {
      body += gipfel(250, Y(3960) - 22, 'Eiger') + gipfel(560, Y(4100) - 22, 'Mönch') + gipfel(782, Y(4158) - 22, 'Jungfrau');
    }
    if (zeigen === 'titel') {
      body += text(jx - 40, jy + 70, '3454 m', 'gross akz', 'text-anchor="middle"');
    }
    if (zeigen === 'idee') {
      body += text(40, GRUND - 18, 'Kleine Scheidegg', '', '');
    }
    if (zeigen === 'ende') {
      body += gipfel(250, Y(3960) - 22, 'Eiger') + gipfel(782, Y(4158) - 22, '4158 m', 'mass');
      body += text(jx - 40, jy + 70, '3454 m', 'gross akz', 'text-anchor="middle"');
    }
    if (zeigen === 'etappen') {
      body += text(gx + 24, gy + 56, '1898', 'gross', '');
      body += text(wx - 50, wy + 4, '1903', 'gross', 'text-anchor="end"');
      body += text(ex - 10, ey + 64, '1905', 'gross', 'text-anchor="middle"');
      body += text(jx, jy + 66, '1912', 'gross akz', 'text-anchor="middle"');
    }
    const oben = zeigen === 'keine' ? Y(4158) - 24 : 0;
    const h = GRUND + 14 - oben;
    return svg(900, r(h), oben ? `<g transform="translate(0 ${r(-oben)})">${body}</g>` : body);
  }

  // Schnitt durch die Nordwand: links die Luft, rechts der Fels mit dem Tunnel, dazwischen ein Stollen zum Fenster
  function jbFenster({ reel = false } = {}) {
    const H = 520;
    // Wandlinie von oben nach unten, leicht zerklüftet
    const wand = [[318, 20], [300, 80], [312, 140], [288, 210], [296, 262], [276, 330], [286, 400], [262, 460], [250, H - 20]];
    const wx = y => {
      for (let i = 1; i < wand.length; i++) {
        const [x1, y1] = wand[i - 1], [x2, y2] = wand[i];
        if (y <= y2) return x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
      }
      return wand[wand.length - 1][0];
    };
    const wl = wand.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
    let body = `<path class="hf" d="${wl}L880 ${H - 20}L880 20Z"/>`;
    // Tunnel als Hufeisenprofil, Mitte x 640
    const tx = 640, tb = 400, tw = 170, th = 190;
    const tunnel = `M${tx - tw / 2} ${tb}V${tb - th + tw / 2}A${tw / 2} ${tw / 2} 0 0 1 ${tx + tw / 2} ${tb - th + tw / 2}V${tb}Z`;
    // Stollen vom Tunnel zur Wand
    const so = 300, su = 380;
    const stollen = `M${r(wx(so))} ${so}H${tx - tw / 2 + 2}V${su}H${r(wx(su))}Z`;
    body += `<path class="lf" d="${stollen}"/>` + `<path class="lf" d="${tunnel}"/>`;
    body += pfad('l', `M${r(wx(so))} ${so}H${tx - tw / 2}M${r(wx(su))} ${su}H${tx - tw / 2}`);
    body += pfad('l', tunnel);
    // Gleis und Zug im Tunnel
    body += pfad('t', `M${tx - 60} ${tb - 14}H${tx + 60}`);
    body += pfad('t', `M${tx - 50} ${tb - 20}V${tb - 120}Q${tx - 50} ${tb - 136} ${tx - 34} ${tb - 136}H${tx + 34}Q${tx + 50} ${tb - 136} ${tx + 50} ${tb - 120}V${tb - 20}Z`);
    // Fenster in der Wand
    body += pfad('a', `M${r(wx(so) - 2)} ${so + 6}L${r(wx(su) - 2)} ${su - 6}`);
    if (!reel) {
      body += text(40, 120, 'Nordwand', 'gross', '');
      body += pfad('t', `M${r(wx(340) - 18)} 340H200V440`);
      body += text(40, 480, 'Fenster', 'gross akz', '');
      body += `<rect class="platte" x="${tx - 76}" y="${tb + 28}" width="152" height="50" rx="6"/>`;
      body += text(tx, tb + 66, 'Tunnel', 'gross', 'text-anchor="middle"');
    }
    return svg(900, H, body);
  }

  Object.assign(Zeichnung, { jbBerge, jbFenster });
})();
