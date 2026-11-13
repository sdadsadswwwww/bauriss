// Baut ein Blatt aus den Daten eines Posts (posts/<name>.json).

const r1 = n => Math.round(n * 10) / 10;

// Marke: ein T-Konto mit doppeltem Abschlussstrich.
function marke() {
  return `<svg class="marke" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<path class="mt" d="M16 26H84M50 26V70"/><path class="ma" d="M16 82H84M16 91H84"/></svg>`;
}

// Papierkorn und Flecken: zwei Rauschfelder, die das Blatt nur abdunkeln.
function korn() {
  return `<svg class="korn" xmlns="http://www.w3.org/2000/svg"><defs>` +
    `<filter id="kf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>` +
    `<feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0.55 -0.2"/></filter>` +
    `<filter id="ff" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="3" seed="11"/>` +
    `<feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.1  0 0 0 0.6 -0.27"/></filter></defs>` +
    `<rect width="100%" height="100%" filter="url(#ff)"/><rect width="100%" height="100%" filter="url(#kf)"/></svg>`;
}

// Guilloche: n gegeneinander verschobene Wellenkreise, wie auf Banknoten und Wertpapieren.
function wellenkreis(R, k, n, a, b) {
  let d = '';
  for (let j = 0; j < n; j++) {
    const ph = 2 * Math.PI * j / n;
    for (let i = 0; i < 720; i++) {
      const t = 2 * Math.PI * i / 720;
      const r = R * (a + b * Math.cos(k * t + ph));
      d += (i ? 'L' : 'M') + r1(r * Math.cos(t)) + ' ' + r1(r * Math.sin(t));
    }
    d += 'Z';
  }
  return d;
}
function rosette() {
  const d = wellenkreis(100, 24, 8, 0.9, 0.09) + wellenkreis(100, 16, 12, 0.62, 0.17) + wellenkreis(100, 9, 10, 0.29, 0.14) +
    wellenkreis(100, 36, 2, 0.99, 0.008) + wellenkreis(100, 3, 6, 0.07, 0.05);
  return `<svg class="gui rosette" xmlns="http://www.w3.org/2000/svg" viewBox="-101 -101 202 202"><path d="${d}"/></svg>`;
}
// Guillochenband über der Fußzeile: verflochtene Sinuslinien
function band() {
  let d = '';
  for (let j = 0; j < 6; j++) {
    for (let x = 0; x <= 1080; x += 4) d += (x ? 'L' : 'M') + x + ' ' + r1(15 + 12 * Math.sin(2 * Math.PI * x / 72 + Math.PI * j / 3));
  }
  return `<svg class="gui band" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 30" preserveAspectRatio="none"><path d="${d}"/></svg>`;
}

// Runder Stempel: Umschrift, Mittelzeile, Datum. Der Filter franst die Kanten aus wie Stempelfarbe auf Papier.
function stempel(s) {
  return `<svg class="stempel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs>` +
    `<filter id="sf"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>` +
    `<filter id="sl"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.75"/><feComposite in="SourceGraphic" operator="in"/></filter>` +
    `<path id="kreis" d="M150 150m-112 0a112 112 0 1 1 224 0a112 112 0 1 1 -224 0"/></defs>` +
    `<g filter="url(#sl)"><g filter="url(#sf)"><circle cx="150" cy="150" r="140" stroke-width="6"/><circle cx="150" cy="150" r="132" stroke-width="1.6"/><circle cx="150" cy="150" r="94" stroke-width="2.4"/>` +
    `<text class="rund"><textPath href="#kreis" startOffset="0">${s.umschrift}</textPath></text>` +
    `<line x1="72" y1="128" x2="228" y2="128"/><line x1="72" y1="176" x2="228" y2="176"/>` +
    `<text class="klein" x="150" y="112" text-anchor="middle">${s.oben || ''}</text>` +
    `<text class="mitte" x="150" y="164" text-anchor="middle">${s.mitte}</text>` +
    `<text class="klein" x="150" y="202" text-anchor="middle">${s.unten || ''}</text></g></g></svg>`;
}

// Journal: Zeilen mit Datum, Buchungstext und Betrag. spalten = Überschriften der drei Spalten.
function journal(zeilen, spalten, eng) {
  const kopf = spalten ? `<div class="kopfzeile">${spalten.map(s => `<div>${s}</div>`).join('')}</div>` : '';
  const reihen = zeilen.map(z =>
    `<div class="zeile${z.akzent ? ' akz' : ''}"><div>${z.datum}</div><div class="wer">${z.text || ''}</div><div class="betrag">${z.betrag}</div></div>`).join('');
  return `<div class="buch${eng ? ' eng' : ''}">${kopf}${reihen}</div>`;
}

// Kurve der Journalwerte auf logarithmischer Skala: jede Netzlinie ist das Tausendfache der vorigen.
function kurve(zeilen) {
  const W = 898, H = 250, oben = 26, unten = 34, links = 96;
  const lg = zeilen.map(z => Math.log10(z.wert));
  const max = Math.ceil(Math.max(...lg) / 3) * 3;
  const x = i => links + (W - links - 14) * i / (zeilen.length - 1);
  const y = v => H - unten - (H - oben - unten) * v / max;
  const namen = { 0: '1', 3: '1 Tsd.', 6: '1 Mio.', 9: '1 Mrd.', 12: '1 Bio.', 15: '1 Brd.' };
  let netz = '';
  for (let v = 0; v <= max; v += 3) netz += `<line class="netz" x1="${links}" x2="${W}" y1="${r1(y(v))}" y2="${r1(y(v))}"/><text x="${links - 12}" y="${r1(y(v) + 7)}" text-anchor="end">${namen[v]}</text>`;
  const pkt = lg.map((v, i) => `${r1(x(i))} ${r1(y(v))}`);
  const lauf = 'M' + pkt.join('L');
  const kreise = lg.map((v, i) => `<circle class="${zeilen[i].akzent ? 'akz' : ''}" cx="${r1(x(i))}" cy="${r1(y(v))}" r="${zeilen[i].akzent ? 10 : 7}"/>`).join('');
  const n = zeilen.length - 1;
  return `<div class="kurve"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${netz}` +
    `<path class="flaeche" d="${lauf}L${r1(x(n))} ${y(0)}L${r1(x(0))} ${y(0)}Z"/><path class="lauf" d="${lauf}"/>${kreise}` +
    `<text x="${links}" y="${H - 6}">${zeilen[0].datum}</text><text class="akz" x="${W}" y="${H - 6}" text-anchor="end">${zeilen[n].datum}</text>` +
    `<text x="${(links + W) / 2}" y="${H - 6}" text-anchor="middle">Mark je Dollar · jede Linie = × 1000</text></svg></div>`;
}

function render(post, nr) {
  const sl = post.slides[nr - 1];
  const zwei = n => String(n).padStart(2, '0');
  const absaetze = (sl.text || []).map(p => `<p>${p}</p>`).join('');
  const kicker = sl.kicker ? `<div class="kicker">${sl.kicker}</div>` : '';
  const kopf = `${kicker}<h2>${sl.headline}</h2>${absaetze}`;
  const fuss = sl.fuss ? `<div class="fuss">${sl.fuss}</div>` : '';
  const stmp = sl.stempel ? stempel(sl.stempel) : '';
  let inhalt;

  if (sl.typ === 'cover') {
    inhalt = `${rosette()}${kicker}<div class="zahl">${sl.zahl}</div><div class="einheit">${sl.einheit}</div><h1>${sl.headline}</h1>${absaetze}` +
      (sl.zeilen ? journal(sl.zeilen, sl.spalten) : '') + stmp;
  } else if (sl.typ === 'journal') {
    inhalt = `${kopf}${journal(sl.zeilen, sl.spalten, sl.zeilen.length > 7)}${sl.zeilen[0].wert ? kurve(sl.zeilen) : ''}${fuss}`;
  } else if (sl.typ === 'balken') {
    // Die Werte sind Prozent.
    const reihen = sl.balken.map(b =>
      `<div class="reihe${b.akzent ? ' akz' : ''}"><div class="kopf"><span class="wert">${b.wert.toLocaleString('de-DE')} %</span><span class="wer">${b.name}</span></div>` +
      `<div class="bahn"><i style="width:${b.wert}%"></i></div><div class="zusatz">${b.zusatz}</div></div>`).join('');
    inhalt = `${kopf}${reihen}${fuss}`;
  } else if (sl.typ === 'punkte') {
    const punkte = sl.punkte.map(p =>
      `<div class="punkt"><div class="wert">${p.wert}</div><div><div class="wer">${p.name}</div><div class="zusatz">${p.zusatz || ''}</div></div></div>`).join('');
    inhalt = `${kopf}<div class="kennzahlen">${punkte}</div>${fuss}`;
  } else if (sl.typ === 'konto') {
    const seite = s => `<div class="seite"><div class="titel">${s.titel}</div><div class="wort">${s.wort}</div>` +
      s.posten.map(p => `<div class="posten"><div class="wer">${p.name}</div><div class="zusatz">${p.zusatz}</div></div>`).join('') + `</div>`;
    inhalt = `${kopf}<div class="tkonto">${seite(sl.soll)}${seite(sl.haben)}</div>${stmp}`;
  } else if (sl.typ === 'gleichung') {
    inhalt = `${rosette()}${kopf}<div class="gleichung-block"><div class="wert">${sl.oben.wert}<span class="weg">${sl.oben.gestrichen || ''}</span></div><div class="wer">${sl.oben.name}</div>` +
      `<div class="ist">=</div><div class="unten"><div class="wert">${sl.unten.wert}<span>${sl.unten.name}</span></div></div></div>${fuss}`;
  } else if (sl.typ === 'outro') {
    inhalt = `<div class="siegel">${rosette()}${marke()}</div><h2>${sl.headline}</h2>${absaetze}<div class="konto">Folgen: ${post.konto}</div>` +
      `<div class="quellen">Quellen: ${post.quellen.join(' · ')}</div>`;
  } else {
    inhalt = `${rosette()}${kopf}${fuss}${stmp}`;
  }

  document.getElementById('sheet').innerHTML =
    `<div class="folio">Folio ${post.nr} · ${zwei(nr)}</div>` +
    `<div class="inhalt ${sl.typ}">${inhalt}</div>${band()}` +
    `<div class="schild"><div>${marke()}<span class="name">Kassenbuch</span></div>` +
    `<div>Nr. ${post.nr} · ${post.titel}</div><div class="blatt">Blatt ${zwei(nr)}/${zwei(post.slides.length)}</div></div>` +
    `${korn()}<div class="rahmen"></div>`;
}
