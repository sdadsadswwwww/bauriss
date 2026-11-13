"""Holt den Text eines Wikipedia-Artikels und zeigt Fundstellen zu Suchmustern.

Aufruf:  python tools/wiki.py "Müngstener Brücke"                        Anfang des Artikels
         python tools/wiki.py "Müngstener Brücke" Baukosten "\\d+ Meter"   Fundstellen mit Umgebung
         python tools/wiki.py --sprache en "Golden Gate Bridge" cost

Der Text liegt danach in .cache/wiki/ (nicht im Repository). Muster sind reguläre Ausdrücke.
Jede Zahl aus Wikipedia braucht für einen Post eine zweite Quelle, siehe AUTOMATIK.md.
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BREITE = 220


def hole(titel, sprache):
    ziel = ROOT / '.cache' / 'wiki' / f'{sprache}-{re.sub(r"[^A-Za-z0-9äöüÄÖÜß]+", "_", titel)}.txt'
    if ziel.exists():
        return ziel.read_text(encoding='utf-8')
    url = (f'https://{sprache}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1'
           f'&redirects=1&titles={urllib.parse.quote(titel)}')
    req = urllib.request.Request(url, headers={'User-Agent': 'bauriss-recherche/1.0 (Skript)'})
    with urllib.request.urlopen(req, timeout=60) as antwort:
        seiten = json.loads(antwort.read().decode('utf-8'))['query']['pages']
    text = next(iter(seiten.values())).get('extract', '')
    if not text:
        sys.exit(f'Kein Artikel "{titel}" in der {sprache}-Wikipedia gefunden.')
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(text, encoding='utf-8')
    return text


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--sprache', default='de')
    parser.add_argument('titel')
    parser.add_argument('muster', nargs='*')
    args = parser.parse_args()
    text = hole(args.titel, args.sprache)
    print(f'{args.titel}: {len(text)} Zeichen')
    if not args.muster:
        print(text[:4000])
        return
    flach = text.replace('\n', ' ')
    for muster in args.muster:
        print(f'=== {muster}')
        letzte, anzahl = -10 ** 9, 0
        for m in re.finditer(muster, flach, re.IGNORECASE):
            if m.start() - letzte < BREITE:
                continue
            letzte = m.start()
            print('  …' + flach[max(0, m.start() - BREITE):m.end() + BREITE] + '…')
            anzahl += 1
            if anzahl >= 5:
                break
        if not anzahl:
            print('  (keine Fundstelle)')


if __name__ == '__main__':
    main()
