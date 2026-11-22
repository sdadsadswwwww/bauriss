// Zeichnungen: Müngstener Brücke zwischen Solingen und Remscheid. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Gesamtlänge 465 m, Bogen 170 m Stützweite, Schienen 107 m über der Wupper, sechs Gerüstpfeiler (je zwei Bogen-,
// Zwischen- und Ankerpfeiler), Bogen im freien Vorbau aus zwei Hälften; Luftlinie 8 km, Schienenweg vorher 44 km.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Talprofil, Lage und Höhe der Pfeiler, Bogenform und -tiefe, Fachwerke,
// Pendelstützen, Kräne beim Vorbau; die Karte des Umwegs ist eine Skizze ohne Maßstab.
(function () {
  const { r, svg, pfad, text, kreis } = Z;

  const HALB = 232.5, BOGEN = 85, DECK = 107, TRAEGER = 7;
  // Gelände: Wupper bei x = 0, die Hänge steigen bis auf Gleishöhe an
  const gel = x => Math.min(DECK - 3, DECK * (Math.abs(x) / 225) ** 1.3);
  const KAEMPFER = gel(BOGEN);
  // Bogen: Untergurt vom Kämpfer bis 96 m, Obergurt von 58 m bis 99,5 m (schematisch)
  const unter = x => KAEMPFER + (96 - KAEMPFER) * (1 - (x / BOGEN) ** 2);
  const ober = x => 99.5 - (99.5 - 58) * (x / BOGEN) ** 2;
  const PFEILER = [-180, -130, -BOGEN, BOGEN, 130, 180];

  // teil: 'ganz' | 'vorbau'; akzent: 'bogen' | 'fahrbahn'; mass: 170 m über dem Bogen
  // halb: gezeigte halbe Breite in Metern (Ausschnitt um die Talmitte, damit die Brücke größer erscheint)
  function muengstenBruecke({ teil = 'ganz', akzent = 'bogen', mass = false, halb = 200, reel = false } = {}) {
    const s = 860 / (2 * halb), oben = mass && !reel ? 112 : 24;
    const X = m => 450 + m * s, Y = h => oben + (DECK - h) * s;
    const H = Math.round(Y(-8) + 4);
    const vorbau = teil === 'vorbau', luecke = 22;
    const id = `mb-${teil}-${akzent}-${halb}-${mass ? 1 : 0}`;
    let body = '';

    // Gelände als geschnittene Fläche
    let gl = '';
    for (let x = -HALB - 10; x <= HALB + 10; x += 5) gl += `${gl ? 'L' : 'M'}${r(X(x))} ${r(Y(gel(x)))}`;
    body += `<path class="hs" d="${gl}L${r(X(HALB + 10))} ${H}L${r(X(-HALB - 10))} ${H}Z"/>` + pfad('l', gl);
    // Wupper
    body += pfad('t', `M${r(X(-13))} ${r(Y(0) - 6)}q8 -6 17 0t17 0M${r(X(-13) + 34)} ${r(Y(0) - 6)}q8 -6 17 0`);

    // Gerüstpfeiler: verjüngt, mit wenigen Riegeln
    for (const x of PFEILER) {
      const hu = gel(x) - 2, ho = DECK - TRAEGER, hb = 4, hf = 4 + 0.09 * (ho - hu);
      const d = `M${r(X(x - hf))} ${r(Y(hu))}L${r(X(x - hb))} ${r(Y(ho))}H${r(X(x + hb))}L${r(X(x + hf))} ${r(Y(hu))}Z`;
      let riegel = '';
      const n = Math.max(1, Math.round((ho - hu) / 16));
      for (let i = 1; i < n; i++) {
        const h = hu + ((ho - hu) * i) / n, w = hf - ((hf - hb) * i) / n;
        riegel += `M${r(X(x - w))} ${r(Y(h))}H${r(X(x + w))}`;
      }
      body += `<path class="lf" d="${d}"/>` + pfad('t', riegel);
    }

    // Bogen mit Fachwerk
    const zug = (f, a, b) => {
      let d = '';
      for (let i = 0; i <= 40; i++) { const x = a + ((b - a) * i) / 40; d += `${i ? 'L' : 'M'}${r(X(x))} ${r(Y(f(x)))}`; }
      return d;
    };
    const bogenTeil = (a, b) => {
      let l = zug(unter, a, b) + zug(ober, a, b), t = '';
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const x = -BOGEN + (2 * BOGEN * i) / n;
        if (x < a - 0.1 || x > b + 0.1) continue;
        t += `M${r(X(x))} ${r(Y(unter(x)))}V${r(Y(ober(x)))}`;
        const x2 = x + (2 * BOGEN) / n;
        if (x2 <= b + 0.1) t += i < n / 2 ? `M${r(X(x))} ${r(Y(unter(x)))}L${r(X(x2))} ${r(Y(ober(x2)))}` : `M${r(X(x))} ${r(Y(ober(x)))}L${r(X(x2))} ${r(Y(unter(x2)))}`;
      }
      // Stirn am Kämpfer
      for (const e of [a, b]) if (Math.abs(Math.abs(e) - BOGEN) < 0.1) l += `M${r(X(e))} ${r(Y(unter(e)))}V${r(Y(ober(e)))}`;
      return pfad('t', t) + pfad('l', l);
    };
    let bg = vorbau ? bogenTeil(-BOGEN, -luecke) + bogenTeil(luecke, BOGEN) : bogenTeil(-BOGEN, BOGEN);
    if (akzent === 'bogen') bg = `<g class="akzent">${bg}</g>`;
    body += bg;
    if (vorbau) {
      // fehlendes Stück gestrichelt, Drehkrane an den Spitzen
      body += `<g class="geplant">${pfad('l', zug(unter, -luecke, luecke) + zug(ober, -luecke, luecke))}</g>`;
      for (const v of [-1, 1]) {
        const x = v * luecke, y = Y(ober(x));
        body += pfad('l', `M${r(X(x))} ${r(y)}v-34M${r(X(x))} ${r(y - 30)}l${r(-v * 26)} 10M${r(X(x))} ${r(y - 30)}l${r(v * 12)} 6`);
        body += pfad('t', `M${r(X(x) - v * 26)} ${r(y - 20)}v22`);
      }
    } else {
      // Pendelstützen zwischen Bogen und Fahrbahn
      let ps = '';
      for (let x = -BOGEN + 21.25; x < BOGEN - 1; x += 21.25) {
        if ((DECK - TRAEGER - ober(x)) * s > 6) ps += `M${r(X(x))} ${r(Y(ober(x)))}V${r(Y(DECK - TRAEGER))}`;
      }
      body += pfad('t', ps);
    }

    // Fahrbahnträger; beim Vorbau nur über den Seitenöffnungen
    const traeger = (a, b) => {
      let t = '';
      const n = Math.round((b - a) / 15);
      for (let i = 0; i < n; i++) {
        const x1 = a + ((b - a) * i) / n, x2 = a + ((b - a) * (i + 1)) / n;
        t += i % 2 ? `M${r(X(x1))} ${r(Y(DECK))}L${r(X(x2))} ${r(Y(DECK - TRAEGER))}` : `M${r(X(x1))} ${r(Y(DECK - TRAEGER))}L${r(X(x2))} ${r(Y(DECK))}`;
      }
      const l = `M${r(X(a))} ${r(Y(DECK))}H${r(X(b))}M${r(X(a))} ${r(Y(DECK - TRAEGER))}H${r(X(b))}`;
      return pfad('t', t) + pfad('l', l);
    };
    let fb = vorbau ? traeger(-HALB, -BOGEN) + traeger(BOGEN, HALB) : traeger(-HALB, HALB);
    if (akzent === 'fahrbahn') fb = `<g class="akzent">${fb}</g>` + pfad('a', `M${r(X(-HALB))} ${r(Y(DECK))}H${r(X(HALB))}`);
    body += fb;

    body = `<clipPath id="${id}"><rect x="20" y="0" width="860" height="${H}"/></clipPath><g clip-path="url(#${id})">${body}</g>`;
    if (mass && !reel) {
      const ym = oben - 30;
      body += pfad('a', `M${r(X(-BOGEN))} ${ym}H${r(X(BOGEN))}M${r(X(-BOGEN))} ${ym - 12}v24M${r(X(BOGEN))} ${ym - 12}v24`);
      body += text(450, ym - 22, '170 m', 'riesig akz', 'text-anchor="middle"');
    }
    return svg(900, H, body);
  }

  // Skizze: Luftlinie 8 km gegen den Umweg über Vohwinkel, Elberfeld und Barmen
  function muengstenUmweg({ reel = false } = {}) {
    const so = [150, 400], re = [750, 400], br = [450, 400];
    let body = '';
    // Wupper: von Barmen nach Westen, dann nach Süden zwischen den Städten hindurch
    body += pfad('t', 'M880 236C760 250 640 262 520 250S320 236 316 276S420 352 450 400S484 474 494 500');
    // Umweg gestrichelt über drei Bahnhöfe
    const umweg = `M${so[0]} ${so[1]}C120 260 160 170 250 160S420 110 470 112S640 130 680 170S780 300 ${re[0]} ${re[1]}`;
    body += pfad('d', umweg);
    for (const p of [[250, 160], [470, 112], [680, 170]]) body += `<path class="lf" d="${kreis(p[0], p[1], 7)}"/>`;
    // Luftlinie gelb, Brücke als Querstrich
    body += pfad('bgl', `M${so[0]} ${so[1]}H${re[0]}`) + pfad('a', `M${so[0]} ${so[1]}H${re[0]}`);
    body += pfad('a', `M${br[0]} ${br[1] - 16}v32`);
    for (const p of [so, re]) body += `<path class="lf" d="${kreis(p[0], p[1], 11)}"/>`;
    if (!reel) {
      body += text(so[0], 462, 'Solingen', 'gross', 'text-anchor="middle"');
      body += text(re[0], 462, 'Remscheid', 'gross', 'text-anchor="middle"');
      body += text(560, 382, '8 km', 'gross akz hell', 'text-anchor="middle"');
      body += text(470, 76, '44 km', 'gross hell', 'text-anchor="middle"');
    }
    return svg(900, 500, body);
  }

  Object.assign(Zeichnung, { muengstenBruecke, muengstenUmweg });
})();
