// Diagramme für Schaubild. Jede Funktion liefert ein SVG als String.
// Alle Zahlen kommen aus dem Post (posts/<name>.json); hier wird nur gezeichnet.
(function () {
  const r = n => Math.round(n * 10) / 10;
  const svg = (w, h, body) =>
    `<svg class="fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  const text = (x, y, inhalt, cls = '', attr = '') => `<text x="${r(x)}" y="${r(y)}" class="${cls}" ${attr}>${inhalt}</text>`;

  // Liniendiagramm über Jahre.
  // o.reihen:  [{ von, werte: [...], akzent, flaeche, name, nameBei: { jahr, dy } }]   ein Wert pro Jahr ab "von"
  // o.achse:   [{ wert, text }]        waagerechte Hilfslinien mit Beschriftung
  // o.jahre:   [1950, 1970, ...]       Beschriftung der Zeitachse
  // o.marken:  [{ reihe, jahr, text, zeile2, seite: 'oben' | 'unten', anker: 'start' | 'middle' | 'end' }]
  // o.hoehe:   Höhe der Zeichenfläche (Breite ist immer 900)
  function linie(o) {
    const W = 900, H = o.hoehe || 700;
    const l = 20, rechts = 30, oben = 70, unten = 60;
    const alle = o.reihen.flatMap(s => s.werte);
    const von = Math.min(...o.reihen.map(s => s.von));
    const bis = Math.max(...o.reihen.map(s => s.von + s.werte.length - 1));
    const ymin = o.ymin ?? 0, ymax = o.ymax ?? Math.max(...alle);
    const X = j => l + ((j - von) / (bis - von)) * (W - l - rechts);
    const Y = v => H - unten - ((v - ymin) / (ymax - ymin)) * (H - oben - unten);
    let body = '', beschriftung = '';

    for (const a of o.achse || []) {
      body += `<path class="${a.wert === ymin ? 'grund' : 'netz'}" d="M${l} ${r(Y(a.wert))}H${W - rechts}"/>`;
      // Beschriftung kommt erst nach den Kurven aufs Blatt, mit Rand in Blattfarbe, damit sie lesbar bleibt
      beschriftung += text(l, a.wert === ymin ? Y(a.wert) - 10 : Y(a.wert) + 30, a.text, 'achse y');
    }
    for (const j of o.jahre || []) {
      body += `<path class="grund" d="M${r(X(j))} ${H - unten}v10"/>`;
      const anker = j === von ? 'start' : j === bis ? 'end' : 'middle';
      body += text(X(j), H - unten + 42, j, 'achse', `text-anchor="${anker}"`);
    }
    for (const s of o.reihen) {
      const punkte = s.werte.map((v, i) => `${r(X(s.von + i))} ${r(Y(v))}`);
      if (s.flaeche) {
        body += `<path class="flaeche" d="M${punkte.join('L')}L${r(X(s.von + s.werte.length - 1))} ${r(Y(ymin))}L${r(X(s.von))} ${r(Y(ymin))}Z"/>`;
      }
      body += `<path class="${s.akzent ? 'kurve akz' : 'kurve'}" d="M${punkte.join('L')}"/>`;
      if (s.name) {
        const j = s.nameBei.jahr;
        body += text(X(j), Y(s.werte[j - s.von]) + (s.nameBei.dy || -20), s.name, 'reihe' + (s.akzent ? ' akz' : ''), 'text-anchor="middle"');
      }
    }
    body += beschriftung;
    for (const m of o.marken || []) {
      const s = o.reihen[m.reihe || 0];
      const x = X(m.jahr), y = Y(s.werte[m.jahr - s.von]);
      const richtung = m.seite === 'unten' ? 1 : -1;
      const anker = m.anker || 'middle';
      body += `<circle class="punkt${s.akzent ? ' akz' : ''}" cx="${r(x)}" cy="${r(y)}" r="9"/>`;
      const y1 = richtung < 0 ? y - (m.zeile2 ? 62 : 26) : y + 48;
      body += text(x, y1, m.text, 'marke', `text-anchor="${anker}"`);
      if (m.zeile2) body += text(x, y1 + 34, m.zeile2, 'marke leise', `text-anchor="${anker}"`);
    }
    return svg(W, H, body);
  }

  // Säulen nebeneinander. o.saeulen: [{ wert, anzeige, name, akzent }]
  function saeulen(o) {
    const W = 900, H = o.hoehe || 640, unten = 60, oben = 70;
    const n = o.saeulen.length, luecke = 34;
    const b = (W - (n - 1) * luecke) / n;
    const max = Math.max(...o.saeulen.map(s => s.wert));
    let body = `<path class="grund" d="M0 ${H - unten}H${W}"/>`;
    o.saeulen.forEach((s, i) => {
      const x = i * (b + luecke), h = (s.wert / max) * (H - oben - unten);
      body += `<rect class="${s.akzent ? 'saeule akz' : 'saeule'}" x="${r(x)}" y="${r(H - unten - h)}" width="${r(b)}" height="${r(h)}"/>`;
      body += text(x + b / 2, H - unten - h - 16, s.anzeige, 'wert' + (s.akzent ? ' akz' : ''), 'text-anchor="middle"');
      body += text(x + b / 2, H - unten + 42, s.name, 'achse', 'text-anchor="middle"');
    });
    return svg(W, H, body);
  }

  // Marke: drei steigende Säulen in Schwarz, Rot, Gold auf einer Grundlinie
  function marke() {
    return '<svg class="marke" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<rect class="m1" x="13.5" y="57.5" width="19" height="27"/><rect class="m2" x="40" y="38" width="20" height="48"/>' +
      '<rect class="m3" x="68" y="14" width="20" height="72"/><path class="mb" d="M6 88.5H94"/></svg>';
  }

  window.Diagramm = { linie, saeulen, marke };
})();
