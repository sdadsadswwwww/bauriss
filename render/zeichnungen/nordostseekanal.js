// Zeichnungen: Nord-Ostsee-Kanal. Schematisch; Karten ohne Inseln und nicht maßstäblich.
// Belegt: Länge 98 km, Umweg rund 460 km, Durchfahrtshöhe 42 m, Profil 1895 (67 m breit, Sohle 22 m, 9 m tief),
// Profil heute (162 m breit, Sohle 90 m, 11 m tief). Tiefen im Profil überhöht.
(function () {
  const { r, svg, pfad, text, kreis, massV, massH } = Z;

  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${x} ${y}q8 -6 17 0t17 0`;
    return d;
  };

  // Lageplan Schleswig-Holstein: der Kanal von der Elbe zur Kieler Förde
  function nokKarte() {
    const land = 'M300 20L285 90L230 130L175 150L235 185L205 250L190 320Q215 375 255 395L330 440L420 500H880V395L770 410L815 320L860 245L790 215L692 205L672 258L655 195L598 172L640 150L590 95L560 20Z';
    const sued = 'M20 500V455Q180 440 300 480L330 500Z';
    const kanal = 'M255 395Q370 305 520 268Q610 248 672 258';
    let body = `<path class="hf" d="${land}"/><path class="hf" d="${sued}"/>`;
    body += pfad('bgl', kanal) + pfad('a', kanal);
    for (const [x, y] of [[255, 395], [520, 268], [672, 258]]) body += `<path class="lf" d="${kreis(x, y, 9)}"/>`;
    body += pfad('t', 'M266 400L338 416');
    body += text(24, 230, 'Nordsee', 'gross') + text(720, 120, 'Ostsee', 'gross') + text(70, 425, 'Elbe');
    body += text(345, 425, 'Brunsbüttel', 'hell') + text(520, 240, 'Rendsburg', 'hell', 'text-anchor="middle"') + text(690, 296, 'Kiel', 'hell');
    body += text(400, 372, '98 km', 'gross akz hell');
    return svg(900, 500, body);
  }

  // Übersicht: der Seeweg um Skagen und die Abkürzung durch den Kanal
  function nokUmweg() {
    const land = 'M318 492L296 440L306 350L288 260L310 180L372 140L430 125L446 170L428 240L452 300L440 360L478 418L530 455L700 462L880 445V540H372Z';
    const sued = 'M20 540V524L200 520L300 508L340 540Z';
    const schweden = 'M770 20L800 160L780 280L830 350L880 340V20Z';
    const weg = 'M250 480C170 330 190 130 300 70Q440 0 540 90C600 150 590 300 492 410';
    const kanal = 'M318 492Q400 440 478 418';
    let body = `<path class="hf" d="${land}"/><path class="hf" d="${sued}"/><path class="hf" d="${schweden}"/>`;
    body += pfad('d', weg) + pfad('l', 'M492 410l14.7 -6.4M492 410l4.5 -15.4');
    body += pfad('bgl', kanal) + pfad('a', kanal);
    body += text(30, 400, 'Nordsee', 'gross') + text(620, 410, 'Ostsee', 'gross');
    body += text(440, 100, 'Skagen', '', 'text-anchor="middle"');
    body += text(615, 200, 'Umweg') + text(615, 234, '460 km');
    body += text(410, 515, 'Kanal 98 km', 'gross akz hell');
    return svg(900, 540, body);
  }

  // Hochbrücke im Schnitt quer zum Kanal: 42 Meter frei über dem Wasser (5 Pixel pro Meter)
  function nokBruecke() {
    const s = 5, wasser = 430, unten = wasser - 42 * s, oben = unten - 12, gel = 300;
    const xl = 450 - 33.5 * s, xr = 450 + 33.5 * s, sl = 450 - 11 * s, sr = 450 + 11 * s, sohle = wasser + 9 * s;
    let body = `<path class="hf" d="M20 ${gel}H170L${xl} ${wasser}L${sl} ${sohle}H${sr}L${xr} ${wasser}L730 ${gel}H880V510H20Z"/>`;
    body += pfad('t', wellen(xl + 12, xr - 6, wasser));
    // Fahrbahn, Bogen mit Hängern, Pfeiler
    let l = `M20 ${oben}H880M20 ${unten}H880M250 ${oben}Q450 ${oben - 216} 650 ${oben}`;
    l += `M238 ${unten}V${r(gel + (238 - 170) * (wasser - gel) / (xl - 170))}M262 ${unten}V${r(gel + (262 - 170) * (wasser - gel) / (xl - 170))}`;
    l += `M638 ${unten}V${r(wasser - (638 - xr) * (wasser - gel) / (730 - xr))}M662 ${unten}V${r(wasser - (662 - xr) * (wasser - gel) / (730 - xr))}`;
    l += `M84 ${unten}V${gel}M96 ${unten}V${gel}M804 ${unten}V${gel}M816 ${unten}V${gel}`;
    let t = '';
    for (let x = 290; x <= 610; x += 40) {
      const u = (x - 250) / 400;
      t += `M${x} ${oben}V${r(oben - 432 * u * (1 - u))}`;
    }
    body += pfad('t', t) + pfad('l', l);
    // Kriegsschiff von vorn, Masten bis knapp unter die Brücke
    body += pfad('a', `M400 ${wasser - 4}v-22h100v22M424 ${wasser - 26}v-30h52v30M438 ${wasser - 56}v-34h24v34M450 ${wasser - 90}V${unten + 12}M428 ${wasser - 130}h44M436 ${wasser - 170}h28`);
    body += massV(572, unten, wasser, '42 m');
    return svg(900, 510, body);
  }

  // Querschnitt des Kanals. Ohne Option das Profil von 1895, mit heute: true das heutige mit dem alten gestrichelt darin.
  function nokProfil({ heute = false } = {}) {
    const s = heute ? 5 : 11, v = heute ? 20 : 22, gel = heute ? 104 : 156, wasser = gel + 22;
    const prof = (breit, sohle, tief) => {
      const a = 450 - breit * s / 2, b = 450 - sohle * s / 2, y = wasser + tief * v;
      return { a: r(a), b: r(b), c: r(900 - b), d: r(900 - a), y: r(y) };
    };
    const alt = prof(67, 22, 9), neu = heute ? prof(162, 90, 11) : alt;
    const hoch = neu.y + 96;
    const aus = neu.a - 22, ein = 900 - aus;
    let body = `<path class="hf" d="M20 ${gel}H${aus}L${neu.a} ${wasser}L${neu.b} ${neu.y}H${neu.c}L${neu.d} ${wasser}L${ein} ${gel}H880V${hoch}H20Z"/>`;
    body += pfad('t', wellen(neu.a + 14, neu.d - 6, wasser));
    if (heute) {
      body += `<g class="geplant">${pfad('l', `M${alt.a} ${wasser}L${alt.b} ${alt.y}H${alt.c}L${alt.d} ${wasser}`)}</g>`;
      body += text(450, wasser + 78, '1895', 'gross', 'text-anchor="middle"') + text(450, wasser + 118, '67 m', '', 'text-anchor="middle"');
      body += massH(neu.a, neu.d, gel - 40, '162 m') + massV(neu.c - 26, wasser, neu.y, '11 m', -1);
      body += massH(neu.b, neu.c, neu.y + 44, '90 m');
    } else {
      // Dampfer von vorn, als Größenvergleich ohne Maß
      body += pfad('a', `M410 ${wasser - 4}v-26h80v26M430 ${wasser - 30}v-26h40v26M444 ${wasser - 56}v-30h12v30`);
      body += massH(neu.a, neu.d, gel - 110, '67 m') + massV(neu.b + 46, wasser, neu.y, '9 m');
      body += massH(neu.b, neu.c, neu.y + 44, '22 m');
    }
    body += text(34, hoch - 22, 'Tiefe überhöht', 'mass hell');
    return svg(900, hoch, body);
  }

  // Längsschnitt, stark verkürzt: Schleusen an beiden Enden, dazwischen ein Wasserstand
  function nokSchleusen() {
    const kanal = 240, sohle = 340;
    let body = `<path class="hf" d="M20 390L190 ${sohle}H710L880 390V450H20Z"/>`;
    // Schleusenkammern mit je zwei Toren
    let l = '', tore = '';
    for (const x of [250, 650]) {
      l += `M${x - 60} ${sohle}V${kanal - 50}h18V${sohle}M${x + 42} ${sohle}V${kanal - 50}h18V${sohle}`;
      tore += `M${x - 34} ${sohle}V${kanal - 34}M${x + 34} ${sohle}V${kanal - 34}`;
    }
    body += pfad('l', l) + pfad('a', tore);
    // Wasserstände: Elbe mit Flut und Ebbe, Kanal, Ostsee mit Windstau
    body += pfad('l', `M20 208H190M310 ${kanal}H590M710 ${kanal + 4}H880`);
    body += pfad('d', 'M20 276H190M710 216H880');
    body += pfad('t', wellen(326, 580, kanal + 22));
    // Dampfer im Kanal
    body += pfad('l', `M395 ${kanal}l10 16h90l10 -16M420 ${kanal}v-20h56v20M440 ${kanal - 20}v-22h12v22`);
    body += text(250, 150, 'Brunsbüttel', 'gross', 'text-anchor="middle"') + text(650, 150, 'Kiel-Holtenau', 'gross', 'text-anchor="middle"');
    body += text(30, 194, 'Flut') + text(30, 314, 'Ebbe') + text(722, 202, 'Windstau');
    body += text(450, kanal + 72, 'ein Wasserstand', 'akz', 'text-anchor="middle"');
    body += text(30, 60, 'Elbe') + text(870, 60, 'Ostsee', '', 'text-anchor="end"');
    return svg(900, 450, body);
  }

  Object.assign(Zeichnung, { nokKarte, nokUmweg, nokBruecke, nokProfil, nokSchleusen });
})();
