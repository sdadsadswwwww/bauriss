"""Holt die Zahlen der veröffentlichten Beiträge von Instagram und schreibt sie nach zahlen.json.

Aufruf:  python tools/zahlen.py     (im Workflow "Zahlen holen", braucht IG_ACCESS_TOKEN)

Das Playbook nutzt die Zahlen zweimal: Der Wochenbericht wertet aus, was besser ankommt, und
tools/zeitplan.py wiederholt bei leerem Vorrat zuerst die Beiträge mit der größten Reichweite.
Erfasst werden Carousels und Reels der letzten 90 Tage. Storys fehlen: Instagram gibt ihre Zahlen nur 24 Stunden heraus.
Verweigert Instagram die Zahlen (Berechtigung fehlt), steht der Grund in zahlen.json und der Lauf endet ohne Fehler.
"""
import datetime as dt
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish  # noqa: E402

ROOT = publish.ROOT
ZIEL = ROOT / 'zahlen.json'
TAGE = 90
NAMEN = {'reach': 'reichweite', 'saved': 'gespeichert', 'shares': 'geteilt', 'views': 'aufrufe',
         'likes': 'likes', 'comments': 'kommentare', 'total_interactions': 'interaktionen'}


def werte(antwort):
    ergebnis = {}
    for m in antwort.get('data', []):
        wert = (m.get('total_value') or {}).get('value')
        if wert is None and m.get('values'):
            wert = m['values'][0].get('value')
        if m.get('name') in NAMEN and wert is not None:
            ergebnis[NAMEN[m['name']]] = wert
    return ergebnis


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    token = os.environ.get('IG_ACCESS_TOKEN')
    if not token:
        sys.exit('IG_ACCESS_TOKEN ist nicht gesetzt.')
    config = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
    basis = f'{publish.HOST}/{config["api_version"]}'
    konto_id = publish.finde_konto(basis, token, config)
    jetzt = publish.berlin_jetzt()
    grenze = (jetzt.date() - dt.timedelta(days=TAGE)).isoformat()

    konto = publish.frage_still(f'{basis}/{konto_id}?fields=followers_count,media_count', token)
    ergebnis = {'stand': jetzt.strftime('%Y-%m-%dT%H:%M'),
                'konto': {'follower': konto.get('followers_count'), 'beitraege': konto.get('media_count')},
                'medien': []}
    if 'fehler' in konto:
        ergebnis['konto']['fehler'] = konto['fehler']
    fehler = set()
    for e in json.loads(publish.PROTOKOLL.read_text(encoding='utf-8')):
        if e.get('art') == 'story' or e['datum'] < grenze or not e.get('media_id'):
            continue
        zeile = {'post': e['post'], 'art': e.get('art') or 'carousel', 'datum': e['datum']}
        if e.get('wiederholung'):
            zeile['wiederholung'] = True
        for metriken in ('reach,saved,shares,views,likes,comments,total_interactions', 'reach,saved,shares,likes,comments', 'reach'):
            antwort = publish.frage_still(f'{basis}/{e["media_id"]}/insights?metric={metriken}', token)
            if 'fehler' not in antwort:
                zeile.update(werte(antwort))
                break
        else:
            zeile['fehler'] = antwort['fehler']
            fehler.add(antwort['fehler'])
        ergebnis['medien'].append(zeile)
        print(json.dumps(zeile, ensure_ascii=False))
    if fehler:
        ergebnis['fehler'] = sorted(fehler)
    ZIEL.write_text(json.dumps(ergebnis, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(ergebnis["medien"])} Beiträge, Follower: {ergebnis["konto"]["follower"]} -> zahlen.json')


if __name__ == '__main__':
    main()
