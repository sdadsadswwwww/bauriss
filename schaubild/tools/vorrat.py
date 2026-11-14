"""Zählt den Vorrat an fertigen Tagen je Art und schreibt ihn als eine Zeile nach vorrat.csv.

Aufruf:  python tools/vorrat.py     (im Workflow "Vorrat zählen"; läuft auch lokal)

Playbook vom 14.11.2026: Ab morgen sollen 7 Tage fertig bereitliegen. Gezählt wird lückenlos ab morgen:
Ein Tag zählt für eine Art, wenn der Post im Plan freigegeben ist und das Teil vorliegt
(Karussell: alle Blätter out/<post>/NN.jpg, Reel: das Video, Story: out/<post>/story.jpg).
Die Zeile hat keine Kopfzeile, weil die Playbook-Tabelle des Betreibers sie direkt einliest:
Kanal, Karussell, Reel, Story, reicht bis, fehlt bis zum Soll, Stand (Zeitpunkt der letzten Änderung).
"""
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish  # noqa: E402

ROOT = publish.ROOT
SOLL = 7
NAMEN = {'der.bauriss': 'Bauriss', 'das.kassenbuch': 'Kassenbuch', 'das.schaubild': 'Schaubild'}


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    config = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
    plan = json.loads(publish.PLAN.read_text(encoding='utf-8'))
    jetzt = publish.berlin_jetzt()
    nach_datum = {e['datum']: e for e in plan['posts']}

    def liegt_vor(eintrag, art):
        name = eintrag['post']
        ordner = ROOT / 'out' / name
        if art == 'karussell':
            post = json.loads((ROOT / 'posts' / f'{name}.json').read_text(encoding='utf-8'))
            return all((ordner / f'{nr:02d}.jpg').exists() for nr in range(1, len(post['slides']) + 1))
        if art == 'reel':
            if hasattr(publish, 'finde_video'):
                return bool(publish.finde_video(name, config)[0])
            return (ordner / 'reel.mp4').exists()
        return (ordner / 'story.jpg').exists()

    tage = {}
    for art in ('karussell', 'reel', 'story'):
        tage[art] = 0
        for i in range(1, SOLL + 1):
            eintrag = nach_datum.get((jetzt.date() + dt.timedelta(days=i)).isoformat())
            if not eintrag or not eintrag.get('freigabe') or not liegt_vor(eintrag, art):
                break
            tage[art] += 1
    knapp = min(tage.values())
    reicht_bis = (jetzt.date() + dt.timedelta(days=knapp)).strftime('%d.%m.%Y') if knapp else 'kein Vorrat'
    kanal = NAMEN.get(config['konto'], config['konto'])
    zeile = [kanal, tage['karussell'], tage['reel'], tage['story'], reicht_bis, SOLL - knapp, jetzt.strftime('%d.%m.%Y %H:%M')]
    ziel = ROOT / 'vorrat.csv'
    text = ','.join(str(z) for z in zeile)
    # Nur schreiben, wenn sich außer der Uhrzeit etwas geändert hat: "Stand" ist der Zeitpunkt der letzten Änderung.
    alt = ziel.read_text(encoding='utf-8').strip().split(',') if ziel.exists() else []
    if alt[:6] != [str(z) for z in zeile[:6]]:
        ziel.write_text(text + '\n', encoding='utf-8')
    print(text)


if __name__ == '__main__':
    main()
