// Zeichnungen: Göltzschtalbrücke. Maße in Metern; Bogenzahl und Talprofil sind schematisch.
(function () {
  const { r, svg, pfad, text, massV, massH } = Z;

  const LANG = 574, HOCH = 78, FELDER = 30, FELD = LANG / FELDER, PFEILER = 1.8;
  const ETAGEN = [0, 20, 40, 59, HOCH];
  // Höhe des Geländes über dem Talgrund: in der Mitte 0, an den Enden fast auf Gleishöhe
  const gelaende = x => HOCH * ((x - LANG / 2) / 300) ** 2;

  // ausschnitt: nur die Mitte, größer gezeichnet (für das Titelblatt); mass: mit Maßlinien
  function bruecke({ ausschnitt = false, mass = false } = {}) {
    const s = ausschnitt ? 4 : 1.36, von = ausschnitt ? 177 : 0, bis = ausschnitt ? 397 : LANG;
    const ox = (900 - (bis - von) * s) / 2, g = 46 + 81 * s;
    const X = m => ox + (m - von) * s, Y = h => g - h * s;
    const rr = (FELD - 2 * PFEILER) / 2;
    let l = '', t = '';

    for (let i = 0; i <= FELDER; i++) {
      const x = i * FELD;
      if (x < von - FELD || x > bis + FELD || i === FELDER / 2) continue;
      // Pfeiler vom Gleis bis ins Gelände
      t += `M${r(X(x - PFEILER))} ${r(Y(HOCH))}V${r(Y(gelaende(x)))}M${r(X(x + PFEILER))} ${r(Y(HOCH))}V${r(Y(gelaende(x)))}`;
    }
    for (let i = 0; i < FELDER; i++) {
      const xl = i * FELD, xr = xl + FELD;
      if (xr < von || xl > bis) continue;
      const mitte = i === FELDER / 2 - 1;
      if (i === FELDER / 2) continue;
      const boden = Math.max(gelaende(xl), gelaende(xr));
      if (mitte) {
        // zwei große Bögen übereinander statt acht kleiner
        const R = FELD - PFEILER;
        for (const scheitel of [ETAGEN[2] - 2.2, HOCH - 2.2]) {
          l += `M${r(X(xl + PFEILER))} ${r(Y(scheitel - R))}A${r(R * s)} ${r(R * s)} 0 0 1 ${r(X(xl + 2 * FELD - PFEILER))} ${r(Y(scheitel - R))}`;
        }
        l += `M${r(X(xl))} ${r(Y(ETAGEN[2]))}H${r(X(xl + 2 * FELD))}`;
        continue;
      }
      for (let k = 0; k < 4; k++) {
        if (boden > ETAGEN[k + 1] - 7) continue;
        const scheitel = ETAGEN[k + 1] - 2.2;
        l += `M${r(X(xl + PFEILER))} ${r(Y(scheitel - rr))}A${r(rr * s)} ${r(rr * s)} 0 0 1 ${r(X(xr - PFEILER))} ${r(Y(scheitel - rr))}`;
        if (k < 3) t += `M${r(X(xl))} ${r(Y(ETAGEN[k + 1]))}H${r(X(xr))}`;
      }
    }
    // Fahrbahn mit Brüstung
    const a = Math.max(von, 0), b = Math.min(bis, LANG);
    l += `M${r(X(a))} ${r(Y(HOCH))}H${r(X(b))}M${r(X(a))} ${r(Y(HOCH + 2.4))}H${r(X(b))}`;

    // Gelände mit Schraffur, in der Talmitte der Fluss
    // In der Gesamtansicht läuft das Gelände hinter den Brückenenden eben weiter
    const hoehe = x => gelaende(Math.min(Math.max(x, 0), LANG));
    const schritt = ausschnitt ? 4 : 11, rand = ausschnitt ? 8 : 22;
    let hang = '', schraffur = '';
    for (let x = a - rand; x <= b + rand; x += schritt) {
      hang += `${hang ? 'L' : 'M'}${r(X(x))} ${r(Y(hoehe(x)))}`;
      schraffur += `M${r(X(x))} ${r(Y(hoehe(x)))}l${ausschnitt ? '-7 9' : '-4 5'}`;
    }
    let body = pfad('t', t + schraffur) + pfad('l', l + hang);
    body += pfad('a', `M${r(X(LANG / 2) - 34)} ${r(g + 12)}q8 -7 17 0t17 0t17 0t17 0`);

    if (ausschnitt) {
      // Zug auf der Brücke
      const zy = Y(HOCH + 2.4), zx = X(232);
      let zug = `M${r(zx)} ${r(zy)}v${r(-3.4 * s)}h${r(2.4 * s)}v${r(-1.6 * s)}h${r(1.2 * s)}v${r(1.6 * s)}h${r(5 * s)}v${r(-1.4 * s)}h${r(3 * s)}v${r(4.8 * s)}Z`;
      for (let k = 1; k <= 4; k++) zug += `M${r(zx + (2 + k * 10.4) * s)} ${r(zy)}v${r(-3.6 * s)}h${r(8.6 * s)}v${r(3.6 * s)}Z`;
      body += pfad('l', zug);
    }
    if (mass) {
      body += pfad('d', `M${r(X(LANG / 2 + 40))} ${r(g)}H${r(X(LANG) + 22)}`);
      body += massV(X(LANG) + 22, Y(HOCH), g, '78 m') + massH(X(0), X(LANG), g + 34, '574 m');
    }
    return svg(900, g + (mass ? 78 : 30), body);
  }

  // Bogen mit Last und Stützlinie: bleibt die Linie im Mauerwerk, trägt der Bogen
  function bogenStatik() {
    const cx = 450, cy = 400, ri = 150, ra = 190, rm = 170;
    let l = `M${cx - ri} ${cy}A${ri} ${ri} 0 0 1 ${cx + ri} ${cy}M${cx - ra} ${cy}A${ra} ${ra} 0 0 1 ${cx + ra} ${cy}`;
    l += `M${cx - ra} ${cy}V530M${cx - ri} ${cy}V530M${cx + ri} ${cy}V530M${cx + ra} ${cy}V530M190 176H710`;
    // Fugen zwischen den Keilsteinen
    let t = '';
    for (let w = 10; w < 180; w += 10) {
      const c = Math.cos((w * Math.PI) / 180), sn = Math.sin((w * Math.PI) / 180);
      t += `M${r(cx - ri * c)} ${r(cy - ri * sn)}L${r(cx - ra * c)} ${r(cy - ra * sn)}`;
    }
    for (let y = cy + 26; y < 530; y += 26) t += `M${cx - ra} ${y}h${ra - ri}M${cx + ri} ${y}h${ra - ri}`;
    // Last von oben
    let last = '';
    for (let x = 300; x <= 600; x += 60) last += `M${x} 96V166M${x - 9} 152L${x} 168L${x + 9} 152`;
    const stuetz = `M${cx - rm} 530V${cy}A${rm} ${rm} 0 0 1 ${cx + rm} ${cy}V530`;
    const auflager = `M${cx - rm - 9} 548L${cx - rm} 532L${cx - rm + 9} 548M${cx + rm - 9} 548L${cx + rm} 532L${cx + rm + 9} 548`;

    let body = pfad('l', l + last) + pfad('t', t) + pfad('a', stuetz + auflager) + pfad('l', 'M150 532H750');
    body += text(626, 110, 'Last des Zuges', 'gross');
    body += pfad('t', `M${cx + 126} ${cy - 118}L690 262`) + text(696, 258, 'Stützlinie', 'gross akz') + text(696, 292, 'Weg des Drucks', 'akz');
    body += text(20, 430, 'Pfeiler') + text(20, 464, 'aus Ziegeln');
    return svg(900, 560, body);
  }

  // Mauerwerk im Läuferverband, darunter ein Ziegel im Dresdner Format
  function ziegelverband() {
    const lang = 139, hoch = 32, fuge = 5;
    let mauer = '';
    for (let zeile = 0; zeile < 6; zeile++) {
      const y = 24 + zeile * (hoch + fuge);
      for (let x = (zeile % 2 ? -lang / 2 : 0) - fuge; x < 900; x += lang + fuge) {
        mauer += `M${r(x)} ${y}h${lang}v${hoch}h${-lang}Z`;
      }
    }
    let body = `<clipPath id="mauer"><rect x="20" y="16" width="860" height="236"/></clipPath><g clip-path="url(#mauer)">${pfad('t', mauer)}</g>`;
    body += `<rect class="l" x="20" y="16" width="860" height="236"/>`;

    // ein Ziegel in Schrägansicht mit Maßen
    const x0 = 270, y0 = 430, b = 260, h = 61, dx = 78, dy = -52;
    body += `<path class="af" d="M${x0} ${y0}h${b}v${h}h${-b}Z"/>`;
    body += pfad('a', `M${x0} ${y0}l${dx} ${dy}h${b}l${-dx} ${-dy}M${x0 + b + dx} ${y0 + dy}v${h}l${-dx} ${-dy}`);
    body += massH(x0, x0 + b, y0 + h + 22, '27,7 cm') + massV(x0 - 24, y0, y0 + h, '6,5 cm', -1);
    body += pfad('t', `M${x0 + b + dx / 2 + 6} ${y0 + h + dy / 2 + 4}L${x0 + b + 120} ${y0 + h + 10}`);
    body += text(x0 + b + 126, y0 + h + 18, '13,6 cm tief') + text(x0 + b + 126, y0 - 30, 'Dresdner', 'gross') + text(x0 + b + 126, y0 + 4, 'Format');
    return svg(900, 560, body);
  }

  Object.assign(Zeichnung, { bruecke, bogenStatik, ziegelverband });
})();
