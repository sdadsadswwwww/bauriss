// Baut ein Blatt aus den Daten eines Posts (posts/<name>.json).
// Seit 20.11.2026 im CAD-Look: Jede Zeichnung steht in einem Ansichtsfenster mit Kopfleiste und Befehlszeile;
// optional zeigen Detailfenster einen Ausschnitt derselben Zeichnung vergrößert (Feld figur.details).
function render(post, nr) {
  const sl = post.slides[nr - 1];
  const zwei = n => String(n).padStart(2, '0');
  const komma = n => n.toFixed(2).replace('.', ',');

  // Kopfleiste: Ansicht aus figur.ansicht oder aus dem Namen der Zeichnung geraten
  function ansichtVon(f) {
    if (f.ansicht) return f.ansicht;
    const n = (f.fn || '').toLowerCase();
    if (/grundriss|plan|karte|netz|lage|umweg/.test(n)) return 'Oben';
    if (/schnitt|profil|querschnitt|kabel|vortrieb/.test(n)) return 'Schnitt';
    if (/zeitleiste|vergleich/.test(n)) return 'Diagramm';
    return 'Vorne';
  }
  const BEFEHLE = ['_LINIE Nächster Punkt:', '_BEMASSUNG Erste Hilfslinie:', '_SCHRAFF Interne Punkte wählen:',
    '_ZOOM Fenster', '_BOGEN Endpunkt angeben:', '_VERSETZ Abstand angeben:', '_SPIEGELN Erster Punkt der Achse:'];

  // Bezugsrahmen der Detailfenster in die Hauptzeichnung setzen (SVG-Einheiten der Zeichnung)
  function mitBezug(svg, details) {
    let bez = '';
    details.forEach((d, i) => {
      const [x, y, w, h] = d.box, n = d.name || String.fromCharCode(65 + i);
      bez += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` +
        `<circle cx="${x + w}" cy="${y}" r="15"/><text x="${x + w}" y="${y + 7}" text-anchor="middle">${n}</text>`;
    });
    return svg.replace(/<\/svg>\s*$/, `<g class="bezug">${bez}</g></svg>`);
  }
  // Detailfenster: dasselbe SVG mit anderem Ausschnitt
  function detailFenster(svg, d, i) {
    const n = d.name || String.fromCharCode(65 + i);
    const ecke = d.ecke || (i ? 'ul' : 'or');
    const [bx, by, bw, bh] = d.box;
    const breite = d.breite || 300, hoehe = d.hoehe || Math.round(breite * bh / bw) + 28;
    const lage = (ecke[0] === 'o' ? 'top:0;' : 'bottom:0;') + (ecke[1] === 'r' ? 'right:0;' : 'left:0;');
    const ausschnitt = svg.replace(/viewBox="[^"]*"/, `viewBox="${bx} ${by} ${bw} ${bh}"`)
      .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid meet"');
    return `<div class="detail" style="${lage}width:${breite}px;height:${hoehe}px">` +
      `<div class="dk"><span><b>DETAIL ${n}</b> · ${d.titel || ''}</span><span>${d.massstab || ''}</span></div>${ausschnitt}</div>`;
  }

  let figur = '';
  if (sl.figur) {
    const f = sl.figur;
    let zeichnung = Zeichnung[f.fn](f);
    const details = f.details || [];
    let fenster = '';
    if (details.length) {
      fenster = details.map((d, i) => detailFenster(zeichnung, d, i)).join('');
      zeichnung = mitBezug(zeichnung, details);
    }
    const befehl = f.befehl || (details.length ? '_DETAIL Bezugspunkt angeben:' : BEFEHLE[(nr + +post.nr) % BEFEHLE.length]);
    const k = (+post.nr * 7.31 + nr * 13.7) % 100;
    const koord = `X ${komma(20 + k * 1.37)} Y ${komma(10 + ((k * 3.1) % 90))} Z 0,00`;
    figur = `<div class="figur"><div class="vp">` +
      `<div class="vp-kopf"><span class="reiter">Modell</span><span>[-] [<b>${ansichtVon(f)}</b>] [2D-Drahtmodell]</span>` +
      `<span class="rechts">Ebene: ${(f.ebene || post.titel).toUpperCase()}</span></div>` +
      `<div class="vp-befehl"><span class="prompt">Befehl:</span><span>${befehl}</span><span class="koord">${koord}</span></div></div>` +
      `${zeichnung}${fenster}</div>`;
  }

  const absaetze = (sl.text || []).map(p => `<p>${p}</p>`).join('');
  const kicker = sl.kicker ? `<div class="kicker">${sl.kicker}</div>` : '';
  const kopf = `${kicker}<h2>${sl.headline}</h2>${absaetze}`;
  // Eigenschaften-Palette: [["Gruppe"], ["Name", "Wert"], …]
  const palette = sl.eigenschaften
    ? `<div class="palette"><div class="pk"><span>Eigenschaften</span><b>Block</b></div>` +
      sl.eigenschaften.map(z => (z.length === 1 ? `<div class="gr">${z[0]}</div>` : `<div class="z"><span>${z[0]}</span><span>${z[1]}</span></div>`)).join('') +
      `</div>`
    : '';
  let inhalt;

  if (sl.typ === 'cover') {
    // hohe Zeichnung rechts
    inhalt = `<div class="spalte">${kicker}<div class="zahl">${sl.zahl}</div><h1>${sl.headline}</h1>${absaetze}</div>${figur}`;
  } else if (sl.typ === 'cover-breit') {
    // breite Zeichnung unten; mit Eigenschaften steht die Palette rechts neben Zahl und Überschrift
    inhalt = palette
      ? `<div class="kopfzeile"><div>${kicker}<div class="zahl">${sl.zahl}</div><h1>${sl.headline}</h1>${absaetze}</div>${palette}</div>${figur}`
      : `${kicker}<div class="titel"><div class="zahl">${sl.zahl}</div><h1>${sl.headline}</h1></div>${absaetze}${figur}`;
  } else if (sl.typ === 'bild-rechts') {
    inhalt = `<div class="spalte">${kopf}</div>${figur}`;
  } else if (sl.typ === 'balken') {
    // Ohne "anzeige" sind die Werte Prozent; mit "anzeige" richtet sich die Länge nach dem größten Wert.
    const max = Math.max(...sl.balken.map(b => b.wert));
    const reihen = sl.balken.map(b =>
      `<div class="reihe${b.akzent ? ' akz' : ''}"><div class="kopf"><span class="wert">${b.anzeige || b.wert.toLocaleString('de-DE') + ' %'}</span><span class="wer">${b.name}</span></div>` +
      `<div class="bahn"><i style="width:${b.anzeige ? (b.wert / max) * 100 : b.wert}%"></i></div><div class="zusatz">${b.zusatz}</div></div>`).join('');
    inhalt = `${kopf}<div class="tafel">${reihen}</div><div class="fuss">${sl.fuss || ''}</div>`;
  } else if (sl.typ === 'punkte') {
    const punkte = sl.punkte.map(p =>
      `<div class="punkt"><div class="wert">${p.wert}</div><div><div class="wer">${p.name}</div><div class="zusatz">${p.zusatz || ''}</div></div></div>`).join('');
    inhalt = `${kopf}<div class="kennzahlen">${punkte}</div><div class="fuss">${sl.fuss || ''}</div>`;
  } else if (sl.typ === 'outro') {
    inhalt = `${Zeichnung.marke()}<h2>${sl.headline}</h2>${absaetze}<div class="konto">Folgen: ${post.konto}</div>` +
      `<div class="quellen">Quellen: ${post.quellen.join(' · ')}</div>`;
  } else {
    inhalt = `${kopf}${figur}`;
  }

  document.getElementById('sheet').innerHTML =
    `<div class="rahmen"></div><div class="inhalt ${sl.typ}">${inhalt}</div>` +
    `<div class="schild"><div>${Zeichnung.marke()}<span class="name">Bauriss</span></div>` +
    `<div>Nr. ${post.nr} · ${post.titel}</div><div class="blatt">Blatt ${zwei(nr)}/${zwei(post.slides.length)}</div></div>`;
}
