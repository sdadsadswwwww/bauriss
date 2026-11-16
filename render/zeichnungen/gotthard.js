// Zeichnungen: Gotthard-Basistunnel. Höhen in Metern über Meer, Längen in Kilometern; Gebirgsprofil schematisch.
(function () {
  const { r, svg, pfad, text, massV, massH } = Z;

  const LANG = 57, NORD = 460, SUED = 312, SCHEITEL = 549;
  // Gebirge über der Tunnelachse; belegt ist nur der Piz Vatgira (2983 m, rund 27 km ab Nordportal)
  const BERG = [[0, 460], [3, 1250], [7, 2050], [11, 1700], [15, 2500], [19, 2250], [23, 2700], [27, 2983], [31, 2450], [35, 2800], [40, 2100], [45, 2350], [50, 1400], [54, 800], [57, 312]];

  function gotthardProfil({ beschriftet = false } = {}) {
    const ox = 150, sx = 10.8, g = 560, sy = 0.155;
    const X = km => ox + km * sx, Y = m => g - m * sy;
    const kamm = BERG.map(([km, m], i) => `${i ? 'L' : 'M'}${r(X(km))} ${r(Y(m))}`).join('');
    const tunnel = `M${r(X(0))} ${r(Y(NORD))}L${r(X(27))} ${r(Y(SCHEITEL))}L${r(X(LANG))} ${r(Y(SUED))}`;

    let body = `<path class="hf" d="${kamm}L${r(X(LANG))} ${r(Y(120))}H${r(X(0))}Z"/>`;
    body += pfad('bgl', tunnel) + pfad('a', tunnel);
    body += text(X(0) - 12, Y(NORD) + 9, 'Erstfeld', '', 'text-anchor="end"') + text(X(LANG) + 12, Y(SUED) + 9, 'Bodio');
    body += massH(X(0), X(LANG), g + 6, '57 km');

    if (beschriftet) {
      body += text(X(27), Y(2983) - 46, 'Piz Vatgira', 'gross', 'text-anchor="middle"') + text(X(27), Y(2983) - 14, '2983 m', '', 'text-anchor="middle"');
      body += pfad('bgl', `M${r(X(27))} ${r(Y(2983) + 8)}V${r(Y(SCHEITEL) - 8)}`) + pfad('a', `M${r(X(27))} ${r(Y(2983) + 8)}V${r(Y(SCHEITEL) - 8)}m-9 -16l9 16l9 -16M${r(X(27) - 9)} ${r(Y(2983) + 24)}l9 -16l9 16`);
      body += text(X(27) + 22, Y(1700), 'über 2000 m', 'gross akz hell') + text(X(27) + 22, Y(1700) + 34, 'Fels darüber', 'akz hell');
    }
    return svg(900, g + 50, body);
  }

  // Alte Bergstrecke und Basistunnel als Höhenlinien nebeneinander
  function gotthardVergleich() {
    const g = 430, sy = 0.27;
    const Y = m => g - m * sy;
    const alt = `M70 ${r(Y(NORD))}L330 ${r(Y(1106))}`, scheitel = `M330 ${r(Y(1106))}L470 ${r(Y(1151))}L520 ${r(Y(1142))}`, ab = `M520 ${r(Y(1142))}L830 ${r(Y(SUED))}`;
    const neu = `M70 ${r(Y(NORD))}L430 ${r(Y(SCHEITEL))}L830 ${r(Y(SUED))}`;
    let body = pfad('l', alt + ab) + pfad('d', scheitel) + pfad('a', neu) + pfad('t', `M40 ${g}H860`);
    body += text(70, g + 36, 'Erstfeld', '', 'text-anchor="middle"') + text(830, g + 36, 'Bodio', '', 'text-anchor="middle"');
    body += text(425, Y(1151) - 56, 'Bergstrecke von 1882', 'gross', 'text-anchor="middle"') + text(425, Y(1151) - 22, 'Scheitel auf 1151 m, Tunnel 15 km', '', 'text-anchor="middle"');
    body += text(430, Y(SCHEITEL) + 58, 'Basistunnel', 'gross akz', 'text-anchor="middle"') + text(430, Y(SCHEITEL) + 92, 'Scheitel auf 549 m', 'akz', 'text-anchor="middle"');
    body += massV(450, Y(1151) + 6, Y(SCHEITEL) - 6, '600 m');
    return svg(900, g + 60, body);
  }

  // Draufsicht: zwei Röhren, Querschläge, zwei Multifunktionsstellen
  function roehrenPlan() {
    const y1 = 190, y2 = 310, h = 15, xa = 40, xb = 800;
    let l = '', t = '';
    for (const y of [y1, y2]) l += `M${xa} ${y - h}H${xb}M${xa} ${y + h}H${xb}`;
    for (let x = xa + 20; x < xb; x += 20) t += `M${x} ${y1 + h}V${y2 - h}`;
    let body = pfad('t', t);
    // Multifunktionsstellen mit Spurwechsel
    for (const [x, name] of [[290, 'Sedrun'], [550, 'Faido']]) {
      body += `<rect class="lf" x="${x - 46}" y="${y1 + h}" width="92" height="${y2 - y1 - 2 * h}"/>`;
      body += pfad('l', `M${x - 40} ${y1 + h}L${x + 40} ${y2 - h}M${x + 40} ${y1 + h}L${x - 40} ${y2 - h}`);
      body += text(x, y2 + h + 44, name, 'gross', 'text-anchor="middle"') + text(x, y2 + h + 78, 'Nothalt', '', 'text-anchor="middle"');
    }
    body += pfad('l', l);
    // Züge in Fahrtrichtung
    body += `<rect class="af" x="620" y="${y1 - 8}" width="96" height="16" rx="7"/>` + pfad('a', `M728 ${y1}h34m-11 -8l11 8l-11 8`);
    body += `<rect class="af" x="140" y="${y2 - 8}" width="96" height="16" rx="7"/>` + pfad('a', `M128 ${y2}h-34m11 -8l-11 8l11 8`);
    body += text(xa, y1 - h - 22, 'Nord: Erstfeld') + text(xb, y1 - h - 22, 'Süd: Bodio', '', 'text-anchor="end"');
    body += massV(xb + 30, y1, y2, '40 m');
    body += pfad('t', `M420 104V${y1 + h + 24}`) + text(420, 56, 'Querschlag', 'gross', 'text-anchor="middle"') + text(420, 90, 'alle 325 m', '', 'text-anchor="middle"');
    return svg(900, 440, body);
  }

  // Durchschlag in der Draufsicht: zwei Vortriebe treffen sich, der Versatz ist übertrieben gezeichnet
  function durchschlag() {
    const xm = 450, yl = 170, yr = 182, h = 46;
    let body = pfad('l', `M40 ${yl - h}H${xm}M40 ${yl + h}H${xm}M${xm} ${yr - h}H860M${xm} ${yr + h}H860M${xm} ${yl - h}V${yr - h}M${xm} ${yl + h}V${yr + h}`);
    body += pfad('d', `M40 ${yl}H${xm}M${xm} ${yr}H860`);
    // Tunnelbohrmaschine von Süden
    body += pfad('a', `M${xm + 6} ${yr - h + 6}V${yr + h - 6}M${xm + 6} ${yr - h + 14}H${xm + 150}V${yr + h - 14}H${xm + 6}`);
    body += text(60, yl - h - 22, 'von Sedrun') + text(840, yr - h - 22, 'von Faido, mit Bohrmaschine', '', 'text-anchor="end"');
    body += pfad('t', `M${xm - 10} ${yl + 4}L${xm - 60} 300M${xm + 10} ${yr - 4}L${xm - 44} 300`);
    body += text(xm, 344, '8 cm seitlich, 1 cm in der Höhe', 'gross akz', 'text-anchor="middle"') + text(xm, 380, 'Abweichung beim Durchschlag', 'akz', 'text-anchor="middle"');
    return svg(900, 410, body);
  }

  Object.assign(Zeichnung, { gotthardProfil, gotthardVergleich, roehrenPlan, durchschlag });
})();
