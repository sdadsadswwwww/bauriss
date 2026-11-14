"""Erzeugt die Musik zu einem Reel als WAV-Datei. Nur Standardbibliothek, keine fremden Aufnahmen.

Aufruf:  python tools/musik.py 002-oekostrom              -> out/002-oekostrom/musik.wav (zum Anhören)
         python tools/musik.py 002-oekostrom ziel.wav

Die Musik wird aus Sinustönen berechnet und gehört damit vollständig dem Kanal: keine Lizenz, keine
Rechte Dritter. Sie folgt dem Ablauf des Reels (render/reel.html, Konstante ZEIT):

  0,0 – 1,0 s   ein leiser Flächenklang, während die Frage steht
  1,0 – 7,0 s   gezupfte Töne, die lauter werden, während sich die Kurve zeichnet
  7,2 s         ein Glockenakkord, wenn die Zahl erscheint
  danach        der Akkord klingt aus

Tonart und Muster hängen von der Nummer des Posts ab, damit nicht jedes Reel gleich klingt.
Stimmung (Feld reel.stimmung im Post): "neutral" löst nach Dur auf, "ernst" bleibt in Moll, ist
langsamer und leiser und verzichtet auf die Glocken. "ernst" gilt für Themen wie Tod, Krankheit,
Unfälle, Arbeitslosigkeit, Insolvenzen.
"""
import json
import math
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RATE = 44100
ZEIT = {'start': 1.0, 'ende': 7.0, 'zahl': 7.2}   # wie in render/reel.html
STIMMUNGEN = ('neutral', 'ernst')

GRUNDTOENE = (57, 55, 59, 52)                      # A, G, H, E (MIDI), nach Nummer des Posts
MUSTER = ((0, 1, 2, 3, 2, 1), (0, 2, 1, 3, 2, 3), (3, 2, 1, 0, 1, 2))
# Akkorde als Halbtöne über dem Grundton der Moll-Tonart
FOLGE = {
    'neutral': ((0, 3, 7), (-4, 0, 3), (3, 7, 10), (-2, 2, 5)),    # i – VI – III – VII
    'ernst': ((0, 3, 7), (-4, 0, 3), (5, 8, 12), (0, 3, 7)),       # i – VI – iv – i
}
SCHLUSS = {'neutral': (3, 7, 10, 17), 'ernst': (0, 3, 7, 14)}      # III mit None bzw. i mit None


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


class Spur:
    def __init__(self, dauer):
        self.n = int(dauer * RATE)
        self.l = [0.0] * self.n
        self.r = [0.0] * self.n

    def ton(self, start, frequenz, dauer, staerke, teiltoene, huelle, links=1.0, rechts=1.0):
        """Addiert einen Ton. teiltoene: [(Vielfaches, Anteil)], huelle(t, dauer) -> 0..1."""
        a = int(start * RATE)
        for i in range(max(0, a), min(self.n, a + int(dauer * RATE))):
            t = (i - a) / RATE
            wert = 0.0
            for vielfaches, anteil in teiltoene:
                wert += anteil * math.sin(2 * math.pi * frequenz * vielfaches * t)
            wert *= staerke * huelle(t, dauer)
            self.l[i] += wert * links
            self.r[i] += wert * rechts

    def echo(self, abstand, anteil):
        d = int(abstand * RATE)
        for kanal in (self.l, self.r):
            for i in range(d, self.n):
                kanal[i] += kanal[i - d] * anteil


def zupfen(t, dauer):
    return min(1.0, t / 0.005) * math.exp(-t * 5.0) * min(1.0, (dauer - t) / 0.05)


def glocke(t, dauer):
    return min(1.0, t / 0.004) * math.exp(-t * 2.2) * min(1.0, (dauer - t) / 0.2)


def flaeche(t, dauer):
    return min(1.0, t / 0.45) * min(1.0, (dauer - t) / 0.7)


def erzeuge(pfad, dauer=11.0, nr=1, stimmung='neutral'):
    if stimmung not in STIMMUNGEN:
        sys.exit(f'Unbekannte Stimmung "{stimmung}", erlaubt: {", ".join(STIMMUNGEN)}.')
    ernst = stimmung == 'ernst'
    grund = GRUNDTOENE[nr % len(GRUNDTOENE)]
    muster = MUSTER[(nr // len(GRUNDTOENE)) % len(MUSTER)]
    folge, schluss = FOLGE[stimmung], SCHLUSS[stimmung]
    abschnitt = (ZEIT['ende'] - ZEIT['start']) / len(folge)          # Länge eines Akkords

    klang, melodie = Spur(dauer), Spur(dauer)
    sinus = [(1, 1.0)]

    def akkord_flaeche(start, laenge, akkord, staerke):
        for k, halbton in enumerate(akkord[:3]):
            f = hz(grund + halbton)
            klang.ton(start, f * 0.997, laenge, staerke, sinus, flaeche, links=1.0, rechts=0.55)
            klang.ton(start, f * 1.003, laenge, staerke, sinus, flaeche, links=0.55, rechts=1.0)
        klang.ton(start, hz(grund + akkord[0] - 12), laenge, staerke * 1.5, sinus, flaeche)

    # Fläche: Auftakt, vier Akkorde, Schlussakkord; die Enden überlappen
    akkord_flaeche(0.0, ZEIT['start'] + 0.7, folge[0], 0.10)
    for k, akkord in enumerate(folge):
        akkord_flaeche(ZEIT['start'] + k * abschnitt, abschnitt + 0.7, akkord, 0.13)
    akkord_flaeche(ZEIT['ende'], dauer - ZEIT['ende'], schluss, 0.16)

    # Gezupfte Töne, während sich die Kurve zeichnet: werden lauter
    schritte = 3 if ernst else 6
    zupfton = [(1, 1.0), (2, 0.35), (3, 0.12)]
    for k, akkord in enumerate(folge):
        toene = (*akkord, akkord[0] + 12)
        for s in range(schritte):
            start = ZEIT['start'] + k * abschnitt + s * abschnitt / schritte
            anteil = (start - ZEIT['start']) / (ZEIT['ende'] - ZEIT['start'])
            staerke = (0.16 + 0.22 * anteil) * (0.7 if ernst else 1.0)
            halbton = toene[muster[s * (len(muster) // schritte)]]
            seite = 0.35 + 0.3 * (s % 2)
            melodie.ton(start, hz(grund + 12 + halbton), 1.2, staerke, zupfton, zupfen, links=1 - seite + 0.35, rechts=seite + 0.35)

    # Wenn die Zahl erscheint: Glockenakkord, bei "ernst" nur ein tiefer, weicher Ton
    if ernst:
        melodie.ton(ZEIT['zahl'], hz(grund + 12), 3.0, 0.22, zupfton, glocke)
    else:
        glockenton = [(1, 1.0), (2.76, 0.30), (5.4, 0.10)]
        for k, halbton in enumerate(schluss):
            melodie.ton(ZEIT['zahl'] + k * 0.06, hz(grund + 24 + halbton), 3.4, 0.17, glockenton, glocke,
                        links=0.6 + 0.4 * (k % 2), rechts=1.0 - 0.4 * (k % 2))
    melodie.echo(0.375, 0.28)

    # Mischen, ein- und ausblenden, auf festen Spitzenwert bringen
    n = klang.n
    links = [klang.l[i] + melodie.l[i] for i in range(n)]
    rechts = [klang.r[i] + melodie.r[i] for i in range(n)]
    for i in range(n):
        t = i / RATE
        blende = min(1.0, t / 0.3) * min(1.0, (dauer - t) / 1.8)
        links[i] *= blende
        rechts[i] *= blende
    spitze = max(max(abs(x) for x in links), max(abs(x) for x in rechts)) or 1.0
    faktor = (0.55 if ernst else 0.7) / spitze

    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(pfad), 'wb') as datei:
        datei.setnchannels(2)
        datei.setsampwidth(2)
        datei.setframerate(RATE)
        datei.writeframes(b''.join(
            struct.pack('<hh', int(links[i] * faktor * 32767), int(rechts[i] * faktor * 32767)) for i in range(n)))
    return pfad


def fuer_post(post, pfad, dauer=11.0):
    """Liest Nummer und Stimmung aus posts/<post>.json und schreibt die Musik nach pfad."""
    daten = json.loads((ROOT / 'posts' / f'{post}.json').read_text(encoding='utf-8'))
    stimmung = (daten.get('reel') or {}).get('stimmung', 'neutral')
    return erzeuge(pfad, dauer=dauer, nr=int(daten['nr']), stimmung=stimmung)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    name = sys.argv[1]
    ziel = sys.argv[2] if len(sys.argv) > 2 else ROOT / 'out' / name / 'musik.wav'
    print(f'{name}: Musik -> {fuer_post(name, ziel)}')
