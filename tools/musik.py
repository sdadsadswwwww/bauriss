"""Erzeugt die Musik zu einem Reel: ein ruhiges Klangbett in D-Dur, vollständig aus Code berechnet.

Aufruf:  python tools/musik.py <ziel.wav> <sekunden>

Keine Aufnahmen, keine fremden Klänge, keine Zufallswerte: Jeder Ton ist eine berechnete Schwingung.
Damit gibt es an der Musik keine Rechte Dritter, und dieselbe Dauer ergibt immer dieselbe Datei.
Das Stück besteht aus drei Stimmen: einer Fläche aus liegenden Akkorden, einem leisen Bass und
einzelnen gezupften Tönen mit Nachhall. Es wiederholt sich alle 32 Sekunden und blendet am Ende aus.
"""
import math
import struct
import sys
import wave

RATE = 32000
TAKT = 8.0          # Sekunden je Akkord
SCHRITT = 0.5       # Raster der gezupften Töne
EINBLENDEN = 1.2
AUSBLENDEN = 3.5

# Je Akkord: Basston, Töne der Fläche, gezupfte Töne als (Schritt im Takt, Ton). Töne als MIDI-Nummern.
AKKORDE = [
    (38, (50, 57, 64, 66), ((0, 74), (3, 69), (6, 66), (8, 76), (11, 74), (14, 69))),   # D mit None
    (35, (47, 54, 57, 62), ((0, 71), (3, 66), (6, 74), (8, 78), (11, 74), (14, 71))),   # h-Moll mit Septime
    (43, (43, 50, 54, 59), ((0, 74), (3, 71), (6, 69), (8, 78), (11, 74), (14, 71))),   # G mit großer Septime
    (45, (45, 52, 59, 64), ((0, 73), (3, 69), (6, 76), (8, 73), (11, 71), (14, 69))),   # A ohne Terz
]
# Im zweiten Durchgang kommen zwei hohe, leise Töne dazu, damit sich die Wiederholung nicht gleich anhört.
ZUGABE = ((4, 81), (12, 78))


def frequenz(ton):
    return 440.0 * 2 ** ((ton - 69) / 12)


def flaeche(ton, laut, verstimmung):
    """Ein liegender Ton, links und rechts leicht gegeneinander verstimmt (ergibt ein langsames Schweben)."""
    an, aus = 2.2, 3.2
    n = int((TAKT + aus) * RATE)
    n_an, n_halten = int(an * RATE), int(TAKT * RATE)
    huelle = [math.sin(0.5 * math.pi * i / n_an) ** 2 if i < n_an
              else 1.0 if i < n_halten
              else math.cos(0.5 * math.pi * (i - n_halten) / (n - n_halten)) ** 2 for i in range(n)]
    kanaele = []
    for faktor in (1 - verstimmung, 1 + verstimmung):
        w = 2 * math.pi * frequenz(ton) * faktor / RATE
        kanaele.append([laut * h * (math.sin(w * i) + 0.2 * math.sin(2 * w * i)) for i, h in enumerate(huelle)])
    return kanaele


def zupfton(ton, laut):
    """Ein kurzer, weich ausklingender Ton, ähnlich einer Kalimba."""
    n = int(3.0 * RATE)
    w = 2 * math.pi * frequenz(ton) / RATE
    anschlag = int(0.006 * RATE)
    return [laut * min(1.0, i / anschlag) * (
        math.exp(-i / (0.9 * RATE)) * math.sin(w * i)
        + 0.30 * math.exp(-i / (0.5 * RATE)) * math.sin(2 * w * i)
        + 0.10 * math.exp(-i / (0.3 * RATE)) * math.sin(3 * w * i)) for i in range(n)]


def mische(ziel, start, klang, faktor=1.0):
    ende = min(len(ziel), start + len(klang))
    if ende > start:
        ziel[start:ende] = [a + faktor * b for a, b in zip(ziel[start:ende], klang)]


def stueck(dauer):
    """Liefert das Stück in der gewünschten Länge als (links, rechts), Werte zwischen -1 und 1."""
    n = int(dauer * RATE)
    links, rechts = [0.0] * n, [0.0] * n
    zupf_l, zupf_r = [0.0] * n, [0.0] * n
    flaechen, toene = {}, {}

    takt = 0
    while takt * TAKT < dauer:
        bass, lage, motiv = AKKORDE[takt % len(AKKORDE)]
        start = int(takt * TAKT * RATE)
        for ton, laut in [(bass, 0.11)] + [(t, 0.075) for t in lage]:
            if (ton, laut) not in flaechen:
                flaechen[(ton, laut)] = flaeche(ton, laut, 0.0016)
            l, r = flaechen[(ton, laut)]
            mische(links, start, l)
            mische(rechts, start, r)
        noten = [(s, t, 0.17) for s, t in motiv]
        if (takt // len(AKKORDE)) % 2 == 1:
            noten += [(s, t, 0.07) for s, t in ZUGABE]
        for nr, (schritt, ton, laut) in enumerate(sorted(noten)):
            if (ton, laut) not in toene:
                toene[(ton, laut)] = zupfton(ton, laut)
            wo = start + int(schritt * SCHRITT * RATE)
            seite = 0.68 if nr % 2 else 0.32          # die Töne wandern leicht zwischen links und rechts
            mische(zupf_l, wo, toene[(ton, laut)], 1 - seite)
            mische(zupf_r, wo, toene[(ton, laut)], seite)
        takt += 1

    # Nachhall der gezupften Töne: jedes Echo springt auf die andere Seite und wird leiser
    echo = int(0.75 * RATE)
    for i in range(echo, n):
        zupf_l[i] += 0.36 * zupf_r[i - echo]
        zupf_r[i] += 0.36 * zupf_l[i - echo]

    n_ein, n_aus = int(EINBLENDEN * RATE), int(min(AUSBLENDEN, dauer / 3) * RATE)
    for kanal, zupf in ((links, zupf_l), (rechts, zupf_r)):
        for i in range(n):
            wert = kanal[i] + zupf[i]
            if i < n_ein:
                wert *= math.sin(0.5 * math.pi * i / n_ein) ** 2
            if i >= n - n_aus:
                wert *= math.cos(0.5 * math.pi * (i - (n - n_aus)) / n_aus) ** 2
            kanal[i] = wert
    spitze = max(max(abs(x) for x in links), max(abs(x) for x in rechts)) or 1.0
    faktor = 0.71 / spitze                          # Spitze bei etwa -3 dB
    return [x * faktor for x in links], [x * faktor for x in rechts]


def schreibe(ziel, dauer):
    links, rechts = stueck(dauer)
    daten = bytearray()
    for l, r in zip(links, rechts):
        daten += struct.pack('<hh', int(l * 32767), int(r * 32767))
    with wave.open(str(ziel), 'wb') as datei:
        datei.setnchannels(2)
        datei.setsampwidth(2)
        datei.setframerate(RATE)
        datei.writeframes(bytes(daten))
    mittel = math.sqrt(sum(x * x for x in links) / len(links))
    return max(abs(x) for x in links + rechts), mittel


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    spitze, mittel = schreibe(sys.argv[1], float(sys.argv[2]))
    print(f'{sys.argv[1]}: {float(sys.argv[2]):.1f} s, Spitze {20 * math.log10(spitze):.1f} dB, '
          f'Mittel {20 * math.log10(mittel):.1f} dB')
