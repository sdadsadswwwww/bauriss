// Zeichnungen: Eurotunnel (Kanaltunnel). Schematisch, Höhen stark überhöht.
// Belegt: Länge 50,5 km, davon 38 km unter dem Meer; rund 40 m unter dem Meeresgrund, tiefster Punkt 75 m unter dem Meeresspiegel;
// Fahrtunnel 7,6 m, Servicetunnel 4,8 m, Abstand der Fahrtunnel rund 30 m, Querschläge alle 375 m; 6 Bohrmaschinen von England, 5 von Frankreich.
(function () {
  const { r, svg, pfad, text, kreis, massH, massV } = Z;

  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${x} ${y}q8 -6 17 0t17 0`;
    return d;
  };

  // Längsschnitt von Folkestone bis Coquelles. km 0 = Portal England, Küste England bei km 9, Küste Frankreich bei km 47.
  function eurotunnelProfil({ beschriftet = false } = {}) {
    const ox = 60, sx = 780 / 50.5, meer = beschriftet ? 210 : 190, sy = 2.4;
    const X = km => ox + km * sx, Y = m => meer + m * sy;
    const kE = 9, kF = 47;
    // Meeresgrund, schematisch
    const grund = [[kE, 0], [12, 22], [18, 32], [25, 32], [32, 35], [38, 30], [43, 30], [kF, 0]];
    // Tunnelachse: gut 40 m unter dem Grund, tiefster Punkt 75 m unter dem Meeresspiegel
    const achse = [[0, -40], [5, 10], [kE, 38], [12, 62], [18, 72], [25, 72], [32, 75], [38, 70], [43, 70], [kF, 42], [50.5, -12]];
    const P = pts => pts.map(([km, m], i) => `${i ? 'L' : 'M'}${r(X(km))} ${r(Y(m))}`).join('');
    // Land: Klippen in England, flacher in Frankreich
    const landE = `M30 ${r(Y(-40))}H${r(X(7.6))}L${r(X(kE))} ${r(Y(0))}`;
    const landF = `M${r(X(kF))} ${r(Y(0))}L${r(X(48))} ${r(Y(-12))}H870`;
    const unten = Y(110);
    let body = `<path class="hs" d="${landE}${P(grund).replace('M', 'L')}${landF.replace('M', 'L')}V${r(unten)}H30Z"/>`;
    body += pfad('l', landE + P(grund).replace('M', 'L') + landF.replace('M', 'L'));
    body += pfad('t', wellen(r(X(kE) + 20), r(X(kF) - 30), meer) + wellen(r(X(kE) + 46), r(X(kF) - 60), meer + 34));
    body += pfad('t', `M${r(X(kE))} ${meer}H${r(X(kF))}`);
    // Tunnel
    const tunnel = P(achse);
    body += pfad('bgl', tunnel) + pfad('a', tunnel);
    body += text(40, r(Y(-40)) - 22, 'England', 'gross') + text(860, r(Y(-12)) - 22, 'Frankreich', 'gross', 'text-anchor="end"');
    if (!beschriftet) {
      body += text(450, meer - 30, 'Ärmelkanal', 'gross', 'text-anchor="middle"');
      body += massH(X(kE), X(kF), r(unten) + 30, '38 km unter dem Meer');
      return svg(900, r(unten) + 80, body);
    }
    // Beschriftet: 40 m unter dem Grund, tiefster Punkt
    body += pfad('bgl', `M${r(X(25))} ${r(Y(32) + 4)}V${r(Y(72) - 4)}`);
    body += pfad('t', `M${r(X(25))} ${r(Y(32) + 4)}V${r(Y(72) - 4)}M${r(X(25) - 6)} ${r(Y(32) + 10)}l12 -12M${r(X(25) - 6)} ${r(Y(72) + 2)}l12 -12`);
    body += text(X(25) + 14, Y(52) + 10, 'rund 40 m', 'akz hell');
    body += pfad('t', `M${r(X(32))} ${r(Y(75) + 6)}V${r(Y(75) + 26)}`);
    body += text(X(32), Y(75) + 54, 'tiefster Punkt:', 'hell', 'text-anchor="middle"') + text(X(32), Y(75) + 86, '75 m unter dem Meer', 'hell', 'text-anchor="middle"');
    body += text(450, meer - 30, 'Ärmelkanal', 'gross', 'text-anchor="middle"');
    body += massH(X(0), X(50.5), r(unten) + 30, '50,5 km');
    return svg(900, r(unten) + 80, body);
  }

  // Querschnitt: zwei Fahrtunnel, dazwischen der Servicetunnel, verbunden durch einen Querschlag
  function eurotunnelQuerschnitt() {
    const s = 18, cy = 260, xl = 450 - 15 * s, xr = 450 + 15 * s, R = 3.8 * s, Rs = 2.4 * s;
    let body = `<path class="hs" d="M30 60H870V460H30Z"/>`;
    // Querschlag zwischen den Röhren
    body += `<path class="lf" d="M${xl} ${cy + 8}H${xr}V${cy + 44}H${xl}Z"/>`;
    body += `<g class="akzent">` + pfad('l', `M${r(xl + R - 4)} ${cy + 8}H${r(450 - Rs + 4)}M${r(xl + R - 4)} ${cy + 44}H${r(450 - Rs + 4)}M${r(450 + Rs - 4)} ${cy + 8}H${r(xr - R + 4)}M${r(450 + Rs - 4)} ${cy + 44}H${r(xr - R + 4)}`) + `</g>`;
    for (const [x, k] of [[xl, R], [450, Rs], [xr, R]]) body += `<path class="lf" d="${kreis(x, cy, k)}"/>`;
    // Züge in den Fahrtunneln, ein Fahrzeug im Servicetunnel
    for (const x of [xl, xr]) body += pfad('t', `M${r(x - 0.75 * R)} ${r(cy + 0.62 * R)}H${r(x + 0.75 * R)}`) + pfad('l', `M${r(x - 0.55 * R)} ${r(cy + 0.55 * R)}V${r(cy - 0.62 * R)}Q${r(x)} ${r(cy - 0.82 * R)} ${r(x + 0.55 * R)} ${r(cy - 0.62 * R)}V${r(cy + 0.55 * R)}Z`);
    body += pfad('t', `M${r(450 - 0.8 * Rs)} ${r(cy + 0.6 * Rs)}H${r(450 + 0.8 * Rs)}`) + pfad('l', `M${r(450 - 0.45 * Rs)} ${r(cy + 0.55 * Rs)}v-26h${r(0.9 * Rs)}v26Z`);
    body += text(xl, 112, 'Fahrtunnel', 'gross hell', 'text-anchor="middle"') + text(xr, 112, 'Fahrtunnel', 'gross hell', 'text-anchor="middle"');
    body += text(450, 150, 'Servicetunnel', 'gross akz hell', 'text-anchor="middle"');
    body += massH(xl - R, xl + R, cy + R + 30, '7,6 m') + massH(xr - R, xr + R, cy + R + 30, '7,6 m') + massH(450 - Rs, 450 + Rs, cy + Rs + 30, '4,8 m');
    body += massH(xl, xr, 406, 'Abstand rund 30 m');
    return svg(900, 470, body);
  }

  // Draufsicht: elf Bohrmaschinen starten an zwei Küsten und graben in beide Richtungen
  function vortriebe() {
    const y = 250, xE = 230, xF = 690, xT = 470;
    let body = '';
    // Küsten
    body += pfad('t', `M${xE + 40} 120Q${xE + 20} ${y} ${xE + 50} 380M${xF - 40} 120Q${xF - 20} ${y} ${xF - 50} 380`);
    body += pfad('t', wellen(xE + 80, xF - 80, 150) + wellen(xE + 100, xF - 90, 352));
    // je eine Röhre als Linie, drei Röhren nebeneinander
    const pfeil = (x1, x2, yy) => {
      const d = x2 > x1 ? 1 : -1;
      return `M${x1} ${yy}H${x2}m${-12 * d} -8l${12 * d} 8l${-12 * d} 8`;
    };
    let akz = '', grau = '';
    for (const dy of [-26, 0, 26]) {
      grau += pfeil(xE - 10, 60, y + dy);
      akz += pfeil(xE + 10, xT - 8, y + dy) + pfeil(xF - 10, xT + 8, y + dy);
    }
    for (const dy of [-13, 13]) grau += pfeil(xF + 10, 840, y + dy);
    body += pfad('l', grau) + pfad('a', akz);
    body += pfad('d', `M${xT} 180V320`);
    body += `<rect class="lf" x="${xE - 10}" y="${y - 44}" width="20" height="88"/><rect class="lf" x="${xF - 10}" y="${y - 44}" width="20" height="88"/>`;
    body += text(xE, 70, 'England', 'gross', 'text-anchor="middle"') + text(xE, 104, '6 Maschinen', '', 'text-anchor="middle"');
    body += text(xF, 70, 'Frankreich', 'gross', 'text-anchor="middle"') + text(xF, 104, '5 Maschinen', '', 'text-anchor="middle"');
    body += text(xT, 426, 'Treffpunkt unter dem Meer', 'gross akz', 'text-anchor="middle"') + text(xT, 462, '1. Dezember 1990', 'akz', 'text-anchor="middle"');
    body += text(60, 330, 'ins Land') + text(840, 330, 'ins Land', '', 'text-anchor="end"');
    return svg(900, 490, body);
  }

  Object.assign(Zeichnung, { eurotunnelProfil, eurotunnelQuerschnitt, vortriebe });
})();
