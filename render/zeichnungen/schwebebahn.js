// Zeichnungen: Wuppertaler Schwebebahn. Schematisch; Schiene rund 12 m über dem Fluss.
(function () {
  const { r, svg, pfad, text, kreis, massV } = Z;

  const wellen = (x1, x2, y) => {
    let d = '';
    for (let x = x1; x + 34 <= x2; x += 52) d += `M${x} ${y}q8 -6 17 0t17 0`;
    return d;
  };

  // Wagen in der Seitenansicht: hängt an zwei Fahrgestellen unter der Schiene
  function wagen(x, schiene, lang) {
    const y = schiene + 34, h = 56;
    let l = `M${x} ${y}h${lang}v${h}h${-lang}Z`, t = '';
    for (const fx of [x + lang * 0.2, x + lang * 0.8]) {
      l += `M${r(fx)} ${y}V${schiene + 6}` + kreis(fx - 9, schiene - 5, 7) + kreis(fx + 9, schiene - 5, 7);
    }
    for (let fx = x + 14; fx + 26 <= x + lang - 10; fx += 36) t += `M${r(fx)} ${y + 10}h26v22h-26Z`;
    return pfad('l', l) + pfad('t', t);
  }

  // Seitenansicht über der Wupper. tuffi: der Elefant, der 1950 aus dem Wagen sprang
  function schwebebahnSeite({ tuffi = false } = {}) {
    const wasser = 440, schiene = 200, oben = 150;
    let l = `M20 ${oben}H880M20 ${schiene}H880`, t = '';
    // Fachwerkträger
    for (let x = 20; x < 880; x += 43) t += `M${x} ${schiene}L${r(x + 21.5)} ${oben}L${x + 43} ${schiene}`;
    // Stützen: schräge Beine, die beiderseits am Ufer stehen
    for (const x of [150, 750]) l += `M${x - 10} ${oben}L${x - 34} ${wasser + 16}M${x + 10} ${oben}L${x + 34} ${wasser + 16}M${x - 26} ${wasser - 60}H${x + 26}`;
    let body = pfad('t', t + wellen(40, 870, wasser) + wellen(70, 870, wasser + 34)) + pfad('l', l);
    body += wagen(tuffi ? 150 : 215, schiene, 230) + wagen(tuffi ? 388 : 453, schiene, 230);
    if (tuffi) {
      // Elefant im Sprung
      const ex = 668, ey = 318;
      body += pfad('a', `M${ex} ${ey}q-34 -30 -70 -10q-20 12 -16 40l-10 26m26 -22l-2 28m44 -30l6 26m20 -32l12 22M${ex} ${ey}q22 2 26 22q2 16 -8 30q-8 8 -14 2M${ex - 6} ${ey + 6}q-16 6 -14 26`);
      body += pfad('t', `M${ex - 60} ${wasser - 26}l-12 -16m34 14l2 -20m30 22l14 -14`);
      body += text(ex - 96, ey + 22, 'Tuffi', 'gross akz', 'text-anchor="end"') + text(ex - 96, ey + 56, 'Juli 1950', 'akz', 'text-anchor="end"');
    } else {
      body += massV(820, schiene, wasser, '12 m');
      body += text(450, wasser + 70, 'Wupper', '', 'text-anchor="middle"');
    }
    return svg(900, 520, body);
  }

  // Querschnitt durch das Tal: Häuser bis ans Ufer, frei ist nur der Raum über dem Fluss
  function schwebebahnQuer() {
    const ufer = 450, wasser = 510, schiene = 246, oben = 206;
    let l = '', t = '';
    // Häuserzeilen
    for (const [x0, breite, hoch] of [[40, 130, 270], [170, 110, 320], [652, 110, 300], [762, 118, 250]]) {
      l += `M${x0} ${ufer}v${-hoch}l${breite / 2} -40l${breite / 2} 40v${hoch}`;
      for (let y = ufer - hoch + 30; y < ufer - 40; y += 58) for (let x = x0 + 20; x + 22 < x0 + breite; x += 40) t += `M${x} ${y}h22v32h-22Z`;
    }
    // Ufermauern und Flussbett
    l += `M20 ${ufer}H320V${wasser + 40}H580V${ufer}H880`;
    // Stützjoch: zwei schräge Beine, oben ein Querträger
    l += `M300 ${ufer}L390 ${oben}H510L600 ${ufer}M406 ${oben}V${schiene}M494 ${oben}V${schiene}M392 ${schiene}h28M480 ${schiene}h28`;
    let body = pfad('t', t + wellen(330, 580, wasser)) + pfad('l', l);
    // zwei Wagen, einer je Richtung
    for (const x of [406, 494]) {
      body += pfad('a', `M${x} ${schiene + 6}v24M${x - 26} ${schiene + 30}h52v64h-52ZM${x - 18} ${schiene + 40}h36v22h-36Z` + kreis(x, schiene - 6, 7));
    }
    body += massV(614, schiene, wasser, '12 m');
    body += text(450, wasser + 34, 'Wupper', 'hell', 'text-anchor="middle"');
    body += text(450, oben - 54, 'zwei Gleise,', '', 'text-anchor="middle"') + text(450, oben - 22, 'je eine Schiene', '', 'text-anchor="middle"');
    return svg(900, 580, body);
  }

  Object.assign(Zeichnung, { schwebebahnSeite, schwebebahnQuer });
})();
