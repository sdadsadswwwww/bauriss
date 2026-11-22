// Zeichnungen: Burj Khalifa, Dubai. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Höhe 828 m, Beton bis 606 m gepumpt, 850 Betonpfähle (rund 200 große, 650 kleine) unter einer Bodenplatte;
// Vergleich: Taipei 101 mit 508 m, Berliner Fernsehturm mit 368 m; Stahl aus dem Palast der Republik in Berlin.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Breite und Rücksprünge des Turms, Form der Spitze, Länge und Lage der
// Pfähle, Dicke der Platte, Umrisse von Taipei 101, Fernsehturm und Palast der Republik.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV } = Z;

  const HOCH = 828, PUMPE = 606;
  // Rücksprünge der Flügel: [bis Höhe, halbe Breite] links und rechts versetzt (die Flügel steigen spiralförmig ab)
  const LINKS = [[110, 36], [210, 31], [300, 26], [380, 21], [450, 16], [510, 12], [560, 9], [600, 6.5]];
  const RECHTS = [[150, 36], [250, 30], [340, 24], [415, 19], [480, 14], [535, 10.5], [585, 7.5], [600, 6.5]];

  // Umriss des Turms als Pfad; x = Mitte, g = Bodenlinie in Pixeln
  function umrissBurj(x, g, s) {
    const Y = h => g - h * s;
    let d = `M${r(x - 36 * s)} ${r(g)}`;
    LINKS.forEach(([h, w], i) => {
      d += `V${r(Y(h))}`;
      const naechste = LINKS[i + 1];
      if (naechste) d += `H${r(x - naechste[1] * s)}`;
    });
    // Spitze: verjüngt sich von 600 m bis 828 m
    d += `L${r(x - 2.5 * s)} ${r(Y(740))}L${r(x - 0.8 * s)} ${r(Y(HOCH))}H${r(x + 0.8 * s)}L${r(x + 2.5 * s)} ${r(Y(740))}L${r(x + 6.5 * s)} ${r(Y(600))}`;
    for (let i = RECHTS.length - 1; i >= 0; i--) {
      const [h, w] = RECHTS[i];
      const unten = i ? RECHTS[i - 1][0] : 0;
      d += `H${r(x + w * s)}V${r(Y(unten))}`;
    }
    return d + 'Z';
  }
  // Fugen der Rücksprünge als dünne Linien, ausgedünnt
  function fugenBurj(x, g, s) {
    const Y = h => g - h * s;
    let t = '';
    for (const h of [210, 380, 510]) t += `M${r(x - 5 * s)} ${r(Y(h))}V${r(Y(h + 60))}`;
    return t + `M${r(x)} ${r(g)}V${r(Y(600))}`;
  }

  function umrissTaipei(x, g, s) {
    const Y = h => g - h * s;
    let d = `M${r(x - 20 * s)} ${r(g)}V${r(Y(90))}`;
    // acht ausladende Abschnitte
    for (let i = 0; i < 8; i++) {
      const h0 = 90 + i * 40;
      d += `H${r(x - 17 * s)}L${r(x - 23 * s)} ${r(Y(h0 + 40))}`;
    }
    d += `H${r(x - 9 * s)}V${r(Y(448))}L${r(x - 1 * s)} ${r(Y(508))}H${r(x + 1 * s)}L${r(x + 9 * s)} ${r(Y(448))}V${r(Y(410))}H${r(x + 23 * s)}`;
    for (let i = 7; i >= 0; i--) {
      const h0 = 90 + i * 40;
      d += `L${r(x + 17 * s)} ${r(Y(h0))}${i ? `H${r(x + 23 * s)}` : ''}`;
    }
    return d + `H${r(x + 20 * s)}V${r(g)}Z`;
  }

  function umrissFernsehturm(x, g, s) {
    const Y = h => g - h * s;
    const schaft = `M${r(x - 9 * s)} ${r(g)}L${r(x - 4.5 * s)} ${r(Y(200))}M${r(x + 9 * s)} ${r(g)}L${r(x + 4.5 * s)} ${r(Y(200))}`;
    const kugel = kreis(x, Y(213), 16 * s);
    const spitze = `M${r(x - 3 * s)} ${r(Y(228))}V${r(Y(250))}L${r(x - 1 * s)} ${r(Y(368))}H${r(x + 1 * s)}L${r(x + 3 * s)} ${r(Y(250))}V${r(Y(228))}`;
    return { schaft, kugel, spitze };
  }

  // Höhenvergleich, ruhig: Burj Khalifa gelb, daneben Taipei 101 und Berliner Fernsehturm
  function burjVergleich({ reel = false } = {}) {
    const s = 0.45, g = 430, H = 450;
    const xb = 260, xt = 520, xf = 730;
    let body = `<g class="akzent"><path class="lf" d="${umrissBurj(xb, g, s)}"/></g>` + pfad('t', fugenBurj(xb, g, s));
    body += `<path class="lf" d="${umrissTaipei(xt, g, s)}"/>`;
    const f = umrissFernsehturm(xf, g, s);
    body += pfad('l', f.schaft + f.spitze) + `<path class="lf" d="${f.kugel}"/>`;
    body += boden(20, 880, g);
    if (!reel) {
      body += text(xb + 34, g - HOCH * s + 22, '828 m', 'riesig akz');
      body += text(xt, g - 508 * s - 20, 'Taipei 101', 'gross', 'text-anchor="middle"');
      body += text(xf, g - 368 * s - 20, 'Berlin', 'gross', 'text-anchor="middle"');
    }
    return svg(900, H, body);
  }

  // Ansicht des Turms. hoch: für bild-rechts (460 breit); pumpe: Betonleitung bis 606 m gelb
  function burjTurm({ pumpe = false, reel = false } = {}) {
    if (!pumpe) {
      const s = 1.0, g = 866, H = 896, x = 170;
      let body = `<path class="lf" d="${umrissBurj(x, g, s)}"/>` + pfad('t', fugenBurj(x, g, s));
      body += boden(20, 410, g);
      if (!reel) body += massV(310, g - HOCH * s, g, '828 m', 1, 40);
      return svg(430, H, body);
    }
    const s = 0.62, g = 545, H = 565, x = 330;
    let body = `<path class="lf" d="${umrissBurj(x, g, s)}"/>` + pfad('t', fugenBurj(x, g, s).replace(/M[^M]*$/, ''));
    // Betonleitung im Kern bis 606 m, Pumpe am Fuß
    const yp = g - PUMPE * s;
    body += pfad('a', `M${r(x - 120)} ${r(g - 8)}H${r(x)}V${r(yp)}`);
    body += `<path class="af" d="M${r(x - 160)} ${r(g - 30)}h44v30h-44Z"/>`;
    body += pfad('a', `M${r(x + 12)} ${r(yp)}H${r(x + 150)}`);
    body += boden(20, 880, g);
    if (!reel) body += text(x + 160, yp + 20, '606 m', 'riesig akz');
    return svg(900, H, body);
  }

  // Gründung im Schnitt: Turmfuß, Bodenplatte gelb, Pfähle im Boden (ausgedünnt)
  function burjPfaehle({ reel = false } = {}) {
    const g = 150, H = 540, pl = 150, pr = 750, dicke = 40;
    let body = `<path class="hs" d="M20 ${g}H880V${H - 6}H20Z"/>` + pfad('l', `M20 ${g}H${pl}M${pr} ${g}H880`);
    // Pfähle: lang und kurz im Wechsel
    let p = '';
    for (let i = 0; i <= 16; i++) {
      const x = pl + 20 + ((pr - pl - 40) * i) / 16;
      const lang = i % 2 === 0;
      p += `M${r(x - 6)} ${g + dicke}V${lang ? H - 40 : H - 170}H${r(x + 6)}V${g + dicke}`;
    }
    body += `<path class="lf" d="${p}"/>` + pfad('l', p);
    body += `<path class="af" d="M${pl} ${g}H${pr}V${g + dicke}H${pl}Z"/>`;
    // Turmfuß über der Platte, oben abgebrochen
    let bruch = `M${pl + 80} ${g}V40`;
    for (let x = pl + 80; x < pr - 80; x += 40) bruch += `L${x + 20} 28L${x + 40} 40`;
    body += `<path class="lf" d="${bruch}V${g}Z"/>`;
    body += pfad('t', `M450 ${g}V40`);
    if (!reel) body += `<rect class="platte" x="290" y="${H - 120}" width="320" height="56" rx="6"/>` + text(450, H - 80, '850 Pfähle', 'gross akz', 'text-anchor="middle"');
    return svg(900, H, body);
  }

  // Palast der Republik (Berlin) und Burj Khalifa (Dubai), dazwischen der Weg des Stahls
  function burjPalast({ reel = false } = {}) {
    const g = 440, H = 520;
    let body = '';
    // Palast: langer flacher Block mit Fensterbändern
    const pl = 40, pr = 400, ph = 120;
    body += `<path class="lf" d="M${pl} ${g}V${g - ph}H${pr}V${g}Z"/>`;
    let bander = '';
    for (const y of [g - 95, g - 70, g - 45]) bander += `M${pl + 12} ${y}H${pr - 12}`;
    body += pfad('t', bander);
    // Turm, Ausschnitt mit Spitze
    const s = 0.5, x = 760;
    body += `<g class="akzent"><path class="lf" d="${umrissBurj(x, g, s)}"/></g>`;
    body += boden(20, 880, g);
    // Weg des Stahls gestrichelt mit Pfeil
    body += pfad('d', `M${pr - 20} ${g - ph - 20}C480 120 600 110 ${x - 40} 150`);
    body += pfad('l', `M${x - 40} 150l-18 -6M${x - 40} 150l-12 14`);
    if (!reel) {
      body += text((pl + pr) / 2, g + 56, 'Berlin', 'gross', 'text-anchor="middle"');
      body += text(x, g + 56, 'Dubai', 'gross akz', 'text-anchor="middle"');
    }
    return svg(900, H, body);
  }

  Object.assign(Zeichnung, { burjVergleich, burjTurm, burjPfaehle, burjPalast });
})();
