// Zeichnungen: Reichstagsgebäude, Berlin. Maße in Metern, s = Pixel pro Meter; schematisch.
// Belegt: Gebäude 138 m lang; Dachterrasse (Fußpunkt der Kuppel) 24 m über Gelände; Glaskuppel 23,5 m hoch,
// Scheitel 47 m über Gelände, Durchmesser rund 40 m (Wikipedia: 38 m); Aussichtsplattform in rund 40 m Höhe;
// Wallot-Kuppel von 1894: höchster Punkt 75 m; Spiegeltrichter mit 360 Spiegeln über dem Plenarsaal;
// zwei gegenläufige Rampen von je 230 m; Öffnung am Scheitel 10 m breit.
// Ohne Maßzahl und nur nach Fotos vereinfacht: Ecktürme, Portikus mit Giebel, Sockel, Fensterreihen,
// Form von Tambour, Laterne und Rippen der alten Kuppel, Form des Trichters, Lage der Rampen, Plenarsaal.
(function () {
  const { r, svg, pfad, text, boden, massV } = Z;

  const LANG = 138, DACH = 24, KH = 23.5, KR = 20, ALT = 75;

  // Glaskuppel als halbes Ellipsoid in Ansicht: Umriss, Ringe, Rippen. X, Y: Meter -> Pixel
  function glaskuppel(X, Y, { schnitt = false } = {}) {
    const umriss = `M${r(X(-KR))} ${r(Y(DACH))}A${r(X(KR) - X(0))} ${r(Y(DACH) - Y(DACH + KH))} 0 0 1 ${r(X(KR))} ${r(Y(DACH))}`;
    let ringe = '';
    for (const q of [0.25, 0.5, 0.72, 0.88]) {
      const h = DACH + q * KH, w = KR * Math.sqrt(1 - q * q);
      ringe += `M${r(X(-w))} ${r(Y(h))}H${r(X(w))}`;
    }
    let rippen = '';
    if (!schnitt) {
      for (const c of [0.42, 0.78]) {
        const rx = X(KR * c) - X(0), ry = Y(DACH) - Y(DACH + KH);
        rippen += `M${r(X(KR * c))} ${r(Y(DACH))}A${r(rx)} ${r(ry)} 0 0 0 ${r(X(0))} ${r(Y(DACH + KH))}`;
        rippen += `M${r(X(-KR * c))} ${r(Y(DACH))}A${r(rx)} ${r(ry)} 0 0 1 ${r(X(0))} ${r(Y(DACH + KH))}`;
      }
    }
    return { umriss, linien: ringe + rippen };
  }

  // Alte Kuppel von Wallot: Tambour, Kuppel, Laterne bis 75 m (Form schematisch)
  function wallotKuppel(X, Y) {
    return `M${r(X(-17))} ${r(Y(DACH))}V${r(Y(39))}H${r(X(17))}V${r(Y(DACH))}` +
      `M${r(X(-17))} ${r(Y(39))}C${r(X(-16))} ${r(Y(54))} ${r(X(-8))} ${r(Y(62))} ${r(X(-3.5))} ${r(Y(64))}` +
      `M${r(X(17))} ${r(Y(39))}C${r(X(16))} ${r(Y(54))} ${r(X(8))} ${r(Y(62))} ${r(X(3.5))} ${r(Y(64))}` +
      `M${r(X(-3.5))} ${r(Y(64))}V${r(Y(70))}H${r(X(3.5))}V${r(Y(64))}Z` +
      `M${r(X(0))} ${r(Y(70))}V${r(Y(ALT))}`;
  }

  // Westansicht. kuppel: 'neu' | 'alt' | 'beide' (alt gestrichelt, neu gelb); beschriftet: Höhen und Namen
  function reichstagAnsicht({ kuppel = 'neu', beschriftet = false, akzent = true, reel = false } = {}) {
    const zeigen = beschriftet && !reel;
    const s = zeigen ? 4.8 : 5.9;
    const hoch = kuppel === 'neu' ? 47.5 : ALT;
    const oben = zeigen ? 30 : 16, unten = 26;
    const g = Math.round(oben + hoch * s);
    const xm = zeigen && kuppel === 'beide' ? 450 : 450;
    const X = m => xm + m * s, Y = h => g - h * s;
    const L = LANG / 2;
    let body = '';
    // Hauptbau und Ecktürme
    const turm = (a, b) => `M${r(X(a))} ${r(Y(0))}V${r(Y(31))}H${r(X(b))}V${r(Y(0))}Z`;
    body += `<path class="lf" d="M${r(X(-L + 15))} ${r(Y(0))}V${r(Y(DACH))}H${r(X(L - 15))}V${r(Y(0))}Z"/>`;
    body += `<path class="lf" d="${turm(-L, -L + 16)}"/><path class="lf" d="${turm(L - 16, L)}"/>`;
    // Gesims, Sockel, Fensterreihen (ausgedünnt)
    let t = `M${r(X(-L + 16))} ${r(Y(21))}H${r(X(L - 16))}M${r(X(-L))} ${r(Y(5))}H${r(X(L))}` +
      `M${r(X(-L))} ${r(Y(28))}H${r(X(-L + 16))}M${r(X(L - 16))} ${r(Y(28))}H${r(X(L))}`;
    body += pfad('t', t);
    let f = '';
    for (const a of [-L + 20, -L + 28, -L + 36, L - 40, L - 32, L - 24]) {
      f += `M${r(X(a))} ${r(Y(8))}h${r(3 * s)}v${r(-7 * s)}h${r(-3 * s)}Z`;
      f += `M${r(X(a))} ${r(Y(15))}h${r(3 * s)}v${r(-4 * s)}h${r(-3 * s)}Z`;
    }
    for (const a of [-L + 5, L - 11]) f += `M${r(X(a))} ${r(Y(10))}h${r(6 * s)}v${r(-12 * s)}h${r(-6 * s)}Z`;
    body += pfad('z', f);
    // Portikus mit sechs Säulen und Giebel
    body += `<path class="lf" d="M${r(X(-21))} ${r(Y(5))}V${r(Y(22))}H${r(X(21))}V${r(Y(5))}Z"/>`;
    body += `<path class="lf" d="M${r(X(-22))} ${r(Y(22))}L${r(X(0))} ${r(Y(30))}L${r(X(22))} ${r(Y(22))}Z"/>`;
    let sl = '';
    for (const a of [-17, -10.2, -3.4, 3.4, 10.2, 17]) sl += `M${r(X(a))} ${r(Y(5))}V${r(Y(20.5))}`;
    body += pfad('l', sl) + pfad('t', `M${r(X(-21))} ${r(Y(20.5))}H${r(X(21))}`);
    // Treppe vor dem Portikus
    body += pfad('t', `M${r(X(-26))} ${r(Y(0))}V${r(Y(2.5))}H${r(X(-23))}V${r(Y(5))}H${r(X(23))}V${r(Y(2.5))}H${r(X(26))}V${r(Y(0))}`);
    // Kuppeln
    const gk = glaskuppel(X, Y);
    const neu = `<path class="lf" d="${gk.umriss}Z"/>` + pfad('t', gk.linien) + pfad('l', gk.umriss);
    const alt = pfad('l', wallotKuppel(X, Y));
    if (kuppel === 'neu') body += akzent ? `<g class="akzent">${neu}</g>` : neu;
    if (kuppel === 'alt') body += akzent ? `<g class="akzent">${alt}</g>` : alt;
    if (kuppel === 'beide') body += `<g class="geplant">${alt}</g><g class="akzent">${neu}</g>`;
    body += boden(20, 880, g);
    if (zeigen) {
      if (kuppel !== 'neu') body += massV(X(-L) - 30, Y(ALT), g, '75 m', -1, 40);
      if (kuppel !== 'alt') body += massV(X(L) + 30, Y(47), g, '47 m', 1, 40);
      if (kuppel === 'beide') {
        body += text(X(6.5), Y(69), '1894', 'gross');
        body += text(X(21), Y(42), '1999', 'gross akz');
      }
    }
    return svg(900, g + unten, body);
  }

  // Schnitt durch die Glaskuppel: Spiegeltrichter über dem Plenarsaal, Rampen innen, Plattform
  function kuppelSchnitt({ reel = false } = {}) {
    const zeigen = !reel;
    const s = 13, unten = 9, oben = 53.5;
    const X = m => 450 + m * s, Y = h => 24 + (oben - h) * s;
    let body = '';
    const gk = glaskuppel(X, Y, { schnitt: true });
    // Dachterrasse, Decke und Boden des Plenarsaals (Ausschnitt)
    body += `<path class="hf" d="M${r(X(-31))} ${r(Y(DACH))}H${r(X(-KR))}V${r(Y(DACH - 1.6))}H${r(X(-31))}Z"/>`;
    body += `<path class="hf" d="M${r(X(KR))} ${r(Y(DACH))}H${r(X(31))}V${r(Y(DACH - 1.6))}H${r(X(KR))}Z"/>`;
    body += pfad('t', `M${r(X(-KR))} ${r(Y(DACH - 0.8))}H${r(X(KR))}`);
    body += pfad('l', `M${r(X(-31))} ${r(Y(unten + 1))}H${r(X(31))}`);
    body += pfad('t', `M${r(X(-29))} ${r(Y(DACH - 1.6))}V${r(Y(unten + 1))}M${r(X(29))} ${r(Y(DACH - 1.6))}V${r(Y(unten + 1))}`);
    // Sitzreihen im Plenarsaal (wenige Stufen)
    body += pfad('t', `M${r(X(-18))} ${r(Y(unten + 1))}V${r(Y(unten + 2.2))}H${r(X(-12))}V${r(Y(unten + 1))}` +
      `M${r(X(12))} ${r(Y(unten + 1))}V${r(Y(unten + 2.2))}H${r(X(18))}V${r(Y(unten + 1))}`);
    // Kuppel
    body += pfad('l', gk.umriss) + pfad('z', gk.linien);
    // Rampen im Schnitt: je Umlauf ein Querschnitt der Rampe an der Innenseite, links und rechts
    let ra = '';
    for (const h of [27, 31, 35, 38.4]) {
      const q = (h - DACH) / KH, w = KR * Math.sqrt(1 - q * q) - 0.5;
      for (const seite of [-1, 1]) {
        const xa = X(seite * w), xb = X(seite * (w - 1.8));
        ra += `M${r(Math.min(xa, xb))} ${r(Y(h))}H${r(Math.max(xa, xb))}V${r(Y(h) + 8)}H${r(Math.min(xa, xb))}Z`;
      }
    }
    body += `<path class="lf" d="${ra}"/>`;
    // Aussichtsplattform in rund 40 m Höhe
    const qp = (40.7 - DACH) / KH, wp = KR * Math.sqrt(1 - qp * qp) - 0.8;
    body += pfad('l', `M${r(X(-wp))} ${r(Y(40.7))}H${r(X(-6))}M${r(X(6))} ${r(Y(40.7))}H${r(X(wp))}`);
    // Spiegeltrichter (gelb): oben breit, unten schmal über dem Plenarsaal
    const tri = `M${r(X(-7.5))} ${r(Y(45))}L${r(X(-1.6))} ${r(Y(DACH - 0.8))}H${r(X(1.6))}L${r(X(7.5))} ${r(Y(45))}Z`;
    let sp = '';
    for (const h of [28, 32, 36, 40]) {
      const w = 1.6 + (7.5 - 1.6) * (h - DACH + 0.8) / (45 - DACH + 0.8);
      sp += `M${r(X(-w))} ${r(Y(h))}H${r(X(w))}`;
    }
    body += `<g class="akzent"><path class="lf" d="${tri}"/>${pfad('t', sp)}</g>`;
    // Licht nach unten
    body += pfad('d', `M${r(X(-4))} ${r(Y(DACH - 2))}L${r(X(-7))} ${r(Y(16.5))}M${r(X(4))} ${r(Y(DACH - 2))}L${r(X(7))} ${r(Y(16.5))}`);
    if (zeigen) {
      body += pfad('t', `M${r(X(6.6))} ${r(Y(44.5))}L${r(X(8.6))} ${r(Y(48.6))}`);
      body += text(X(8.6), Y(49.8), '360 Spiegel', 'gross akz');
      body += pfad('t', `M${r(X(-17.5))} ${r(Y(31) - 2)}L${r(X(-21.2))} ${r(Y(33))}`);
      body += text(X(-21.6), Y(33) + 12, 'Rampen', 'gross', 'text-anchor="end"');
      body += text(X(0), Y(unten + 1) - 22, 'Plenarsaal', 'gross hell', 'text-anchor="middle"');
    }
    return svg(900, Math.round(Y(unten) + 6), body);
  }

  Object.assign(Zeichnung, { reichstagAnsicht, kuppelSchnitt });
})();
