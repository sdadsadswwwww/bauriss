// Zeichnungen: St.-Pauli-Elbtunnel (Alter Elbtunnel), Hamburg. Schematisch, Höhen überhöht.
(function () {
  const { r, svg, pfad, text, kreis, boden, massV, massH } = Z;

  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${x} ${y}q8 -6 17 0t17 0`;
    return d;
  };

  // Schachtgebäude mit Kuppel, x = Mitte, y = Geländehöhe
  const kuppelbau = (x, y) => `M${x - 42} ${y}V${y - 44}H${x + 42}V${y}M${x - 34} ${y - 44}A34 30 0 0 1 ${x + 34} ${y - 44}M${x} ${y - 74}v-12`;

  // Längsschnitt: zwei Schächte, dazwischen die Röhre unter dem Flussbett
  function elbtunnelSchnitt() {
    const g = 190, xl = 150, xr = 750, sohle = 420, hoch = 52;
    let l = kuppelbau(xl, g) + kuppelbau(xr, g);
    // Schächte und Röhre, zur Mitte leicht fallend
    l += `M${xl - 30} ${g}V${sohle}H${xl + 30}M${xr + 30} ${g}V${sohle}H${xr - 30}`;
    l += `M${xl + 30} ${g}V${sohle - hoch}L450 ${sohle - hoch + 14}L${xr - 30} ${sohle - hoch}V${g}`;
    l += `M${xl + 30} ${sohle}L450 ${sohle + 14}L${xr - 30} ${sohle}`;
    // Ufer und Flussbett
    const bett = `M30 ${g}H${xl + 60}V${g + 22}Q450 ${g + 190} ${xr - 60} ${g + 22}V${g}H870`;
    let body = `<path class="hf" d="${bett}V560H30Z"/>`;
    body += `<path class="lf" d="M${xl - 30} ${g}V${sohle}H${xl + 30}L450 ${sohle + 14}L${xr - 30} ${sohle}H${xr + 30}V${g}H${xr - 30}V${sohle - hoch}L450 ${sohle - hoch + 14}L${xl + 30} ${sohle - hoch}V${g}Z"/>`;
    body += pfad('l', l) + pfad('t', wellen(xl + 70, xr - 60, g + 24));
    // Aufzugskörbe und ein Dampfer
    body += pfad('a', `M${xl - 20} ${g + 90}h40v44h-40ZM${xl} ${g}V${g + 90}M${xr - 20} ${sohle - 50}h40v44h-40ZM${xr} ${g}V${sohle - 50}`);
    body += pfad('l', `M400 ${g + 16}h110l-12 -18h-86ZM440 ${g - 2}v-26h18v26M470 ${g - 2}v-14`);
    body += text(xl, g - 104, 'St. Pauli', 'gross', 'text-anchor="middle"') + text(xr, g - 104, 'Steinwerder', 'gross', 'text-anchor="middle"');
    body += text(450, g + 78, 'Elbe', 'hell', 'text-anchor="middle"');
    body += massH(xl + 30, xr - 30, sohle + 44, '426,5 m') + massV(xr + 56, g, sohle, '24 m');
    return svg(900, 520, body);
  }

  // Lageplan: Fähren kreuzen den Strom, der Tunnel führt gerade hinüber
  function elbQuerung() {
    const yn = 120, ys = 360;
    let body = pfad('l', `M30 ${yn}H870M30 ${ys}H870`) + pfad('t', wellen(60, 860, 200) + wellen(90, 860, 280));
    // Stadt im Norden, Werften mit Sheddächern und Kränen im Süden
    let nord = '', sued = '';
    for (let x = 80; x < 840; x += 76) nord += `M${x} ${yn}v-${30 + ((x * 7) % 26)}h44v${30 + ((x * 7) % 26)}`;
    for (let x = 90; x < 560; x += 60) sued += `M${x} ${ys}v34l30 -18v18l30 -18v-16`;
    sued += `M640 ${ys}v-70h70M640 ${ys - 70}l-26 22M700 ${ys - 70}v26M760 ${ys}v-56h60M760 ${ys - 56}l-22 18M812 ${ys - 56}v22`;
    body += pfad('t', nord + sued);
    // Fähren mit Kurs
    for (const [x, y] of [[250, 215], [520, 265], [690, 190]]) {
      body += pfad('l', `M${x - 24} ${y}h48l-8 12h-32Z`) + pfad('d', `M${x - 40} ${yn + 8}L${x} ${y - 6}M${x + 6} ${y + 18}L${x + 46} ${ys - 8}`);
    }
    // Tunnel
    body += pfad('bgl', `M400 ${yn}V${ys}`) + pfad('a', `M394 ${yn}V${ys}M406 ${yn}V${ys}` + kreis(400, yn, 13) + kreis(400, ys, 13));
    body += text(30, yn - 74, 'St. Pauli: die Stadt', 'gross') + text(30, ys + 84, 'Steinwerder: Werften und Hafen', 'gross');
    body += text(424, 246, 'Tunnel', 'gross akz hell') + text(424, 280, '426,5 m', 'akz hell');
    return svg(900, 470, body);
  }

  // Schacht im Schnitt: vier Fahrkörbe heben Fuhrwerke und Autos 24 Meter tief
  function elbtunnelSchacht() {
    const g = 150, xa = 250, xb = 650, sohle = 580;
    let body = pfad('l', `M${xa - 30} ${g}V${g - 60}H${xb + 30}V${g}M${xa + 20} ${g - 60}A180 90 0 0 1 ${xb - 20} ${g - 60}M450 ${g - 150}v-18`);
    body += `<path class="hf" d="M60 ${g}H${xa}V${sohle}H${xb}V${g}H840V620H60Z"/>`;
    body += `<path class="lf" d="M${xa} ${g}V${sohle}H870V${sohle - 104}H${xb}V${g}Z"/>`;
    body += pfad('l', `M60 ${g}H840M${xa} ${g}V${sohle}H870M${xb} ${g}V${sohle - 104}H870`);
    // vier Aufzüge nebeneinander, die Körbe auf verschiedenen Höhen
    let fuehrung = '', korb = '';
    [300, 180, 356, 96].forEach((tief, i) => {
      const x = xa + i * 100;
      if (i) fuehrung += `M${x} ${g}V${sohle}`;
      korb += `M${x + 12} ${g + tief}h76v64h-76ZM${x + 50} ${g}V${g + tief}`;
    });
    body += pfad('t', fuehrung) + pfad('l', korb);
    // ein Automobil im dritten Korb
    const ax = xa + 222, ay = g + 356 + 58;
    body += pfad('a', `M${ax} ${ay - 12}h56v-14h-14l-6 -12h-22v26h-14Z` + kreis(ax + 14, ay - 8, 6) + kreis(ax + 44, ay - 8, 6));
    body += pfad('a', `M${xb + 60} ${sohle - 52}h130m-16 -10l16 10l-16 10`) + text(xb + 60, sohle - 70, 'zur Röhre', 'akz');
    body += text(20, g - 100, 'Schachtgebäude') + text(xb + 16, g + 60, '4 Aufzüge', 'hell') + text(xb + 16, g + 94, 'für Wagen', 'hell');
    body += massV(xa - 44, g, sohle, '24 m', -1);
    return svg(900, 630, body);
  }

  // Querschnitt unter dem Fluss: zwei Röhren, darüber nur drei Meter Schlick
  function elbtunnelQuerschnitt() {
    const s = 22, wasser = 50, bett = wasser + 9 * s, oben = wasser + 12 * s, rr = 3 * s, mitte = oben + rr;
    let body = `<path class="hf" d="M30 ${bett}H870V600H30Z"/>` + pfad('l', `M30 ${bett}H870`) + pfad('t', wellen(40, 860, wasser) + wellen(70, 860, wasser + 80));
    for (const x of [330, 570]) {
      body += `<path class="lf" d="${kreis(x, mitte, rr)}"/>` + pfad('t', kreis(x, mitte, rr - 7));
      // Fahrbahn, links und rechts erhöhte Gehwege
      body += pfad('l', `M${r(x - 48)} ${mitte + 36}H${r(x + 48)}M${r(x - 48)} ${mitte + 26}h14v10M${r(x + 48)} ${mitte + 26}h-14v10`);
    }
    // Fußgänger und Fuhrwerk
    body += pfad('a', kreis(298, mitte - 8, 6) + `M298 ${mitte - 2}v20m-8 -13h16M298 ${mitte + 18}l-7 8M298 ${mitte + 18}l7 8`);
    body += pfad('a', `M544 ${mitte + 6}h54v18h-54Z` + kreis(556, mitte + 29, 6) + kreis(586, mitte + 29, 6));
    body += massV(760, wasser, oben, '12 m') + massV(220, oben, oben + 2 * rr, '6 m', -1);
    body += pfad('t', `M450 ${bett + 3}V${oben - 3}M444 ${bett + 3}h12M444 ${oben - 3}h12M456 ${bett + 30}L500 ${bett - 34}`) + text(506, bett - 40, '3 m Schlick', 'gross akz');
    body += text(450, 570, 'Sohle: 24 m unter der Straße', 'hell', 'text-anchor="middle"');
    return svg(900, 600, body);
  }

  Object.assign(Zeichnung, { elbtunnelSchnitt, elbQuerung, elbtunnelSchacht, elbtunnelQuerschnitt });
})();
