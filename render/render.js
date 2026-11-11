// Baut ein Blatt aus den Daten eines Posts (posts/<name>.json).
function render(post, nr) {
  const sl = post.slides[nr - 1];
  const zwei = n => String(n).padStart(2, '0');
  const figur = sl.figur ? `<div class="figur">${Zeichnung[sl.figur.fn](sl.figur)}</div>` : '';
  const absaetze = (sl.text || []).map(p => `<p>${p}</p>`).join('');
  const kicker = sl.kicker ? `<div class="kicker">${sl.kicker}</div>` : '';
  const kopf = `${kicker}<h2>${sl.headline}</h2>${absaetze}`;
  let inhalt;

  if (sl.typ === 'cover') {
    // hohe Zeichnung rechts
    inhalt = `<div class="spalte">${kicker}<div class="zahl">${sl.zahl}</div><h1>${sl.headline}</h1>${absaetze}</div>${figur}`;
  } else if (sl.typ === 'cover-breit') {
    // breite Zeichnung unten
    inhalt = `${kicker}<div class="titel"><div class="zahl">${sl.zahl}</div><h1>${sl.headline}</h1></div>${absaetze}${figur}`;
  } else if (sl.typ === 'bild-rechts') {
    inhalt = `<div class="spalte">${kopf}</div>${figur}`;
  } else if (sl.typ === 'balken') {
    // Ohne "anzeige" sind die Werte Prozent; mit "anzeige" richtet sich die Länge nach dem größten Wert.
    const max = Math.max(...sl.balken.map(b => b.wert));
    const reihen = sl.balken.map(b =>
      `<div class="reihe${b.akzent ? ' akz' : ''}"><div class="kopf"><span class="wert">${b.anzeige || b.wert.toLocaleString('de-DE') + ' %'}</span><span class="wer">${b.name}</span></div>` +
      `<div class="bahn"><i style="width:${b.anzeige ? (b.wert / max) * 100 : b.wert}%"></i></div><div class="zusatz">${b.zusatz}</div></div>`).join('');
    inhalt = `${kopf}${reihen}<div class="fuss">${sl.fuss || ''}</div>`;
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
