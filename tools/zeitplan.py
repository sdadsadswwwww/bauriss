"""Arbeitet den Zeitplan des Playbooks ab: Reel, Carousel und Story des Tages; bei leerem Vorrat eine Wiederholung.

Aufruf:  python tools/zeitplan.py              regulärer Lauf aus dem Workflow
         python tools/zeitplan.py --warten     wartet bis zur nächsten fälligen Uhrzeit (höchstens 75 Minuten), veröffentlicht nichts
         python tools/zeitplan.py --probelauf  zeigt, was der Lauf täte, ruft die Schnittstelle aber nicht auf
                                               (mit --datum JJJJ-MM-TT und --uhrzeit HH:MM für einen anderen Zeitpunkt)

Regeln (Playbook vom 14.11.2026, gleich für alle Kanäle des Betreibers):
- Reel zur "reel_uhrzeit", Carousel zur "uhrzeit" aus plan.json; beides erledigt tools/publish.py.
- Story fünf Minuten nach dem Carousel: out/<post>/story.jpg (entsteht mit tools/reel.py).
- Steht für heute nichts im Plan, erscheint ein älterer Beitrag erneut als Reel und Story: mindestens 30 Tage alt,
  kein Beitrag zweimal in 90 Tagen, die mit den besten Zahlen zuerst (zahlen.json), sonst die ältesten.
  Gibt es keinen solchen Beitrag, bleibt der Tag leer.
- GitHub startet Läufe verspätet. Der Workflow startet deshalb eine Stunde vor der Uhrzeit und wartet (--warten).

Dieselbe Datei liegt in allen Kanälen; Unterschiede der Kanäle stecken in tools/publish.py.
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish  # noqa: E402

ROOT = publish.ROOT
ZAHLEN = ROOT / 'zahlen.json'
WARTEN_HOECHSTENS = 75 * 60      # Sekunden
STORY_ABSTAND = 5 * 60           # Sekunden zwischen Carousel und Story
WIEDERHOLEN_AB_TAGEN = 30
WIEDERHOLEN_SPERRE_TAGE = 90


def lies(pfad):
    return json.loads(Path(pfad).read_text(encoding='utf-8'))


def schreibe_protokoll(protokoll):
    publish.PROTOKOLL.write_text(json.dumps(protokoll, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def reel_modus(plan):
    """"zusaetzlich": Reel mittags und Carousel abends. "statt": nur das Reel. "aus": nur das Carousel."""
    return publish.reel_modus(plan) if hasattr(publish, 'reel_modus') else 'zusaetzlich'


def uhrzeiten(plan, eintrag=None):
    eintrag = eintrag or {}
    return (eintrag.get('reel_uhrzeit', plan.get('reel_uhrzeit', '12:30')), eintrag.get('uhrzeit', plan['uhrzeit']))


def erschienen(protokoll, post, art):
    """art: None für das Carousel, 'reel' oder 'story'. Wiederholungen zählen nicht."""
    return any(e['post'] == post and e.get('art') == art and not e.get('wiederholung') for e in protokoll)


def hauptbeitrag_erschienen(protokoll, post, modus):
    return erschienen(protokoll, post, 'reel' if modus == 'statt' else None)


def rufe_publish(schalter):
    """Ruft tools/publish.py auf. Liefert False, wenn es mit einem Fehler endet; der Lauf geht trotzdem weiter."""
    try:
        publish.main(schalter)
        return True
    except SystemExit as ende:
        if ende.code in (None, 0):
            return True
        print(ende.code)
        return False


def zugang(config):
    token = os.environ.get('IG_ACCESS_TOKEN')
    bild_basis = os.environ.get('IMAGE_BASE_URL', '').rstrip('/')
    if not token or not bild_basis:
        sys.exit('IG_ACCESS_TOKEN und IMAGE_BASE_URL müssen gesetzt sein.')
    basis = f'{publish.HOST}/{config["api_version"]}'
    return token, bild_basis, basis, publish.finde_konto(basis, token, config)


def sende_story(name, config):
    token, bild_basis, basis, konto_id = zugang(config)
    adresse = f'{bild_basis}/out/{name}/story.jpg'
    publish.pruefe_bildadressen([adresse])
    container = publish.anfrage('POST', f'{basis}/{konto_id}/media', token, {'media_type': 'STORIES', 'image_url': adresse})['id']
    publish.warte_bis_fertig(basis, container, token)
    return publish.anfrage('POST', f'{basis}/{konto_id}/media_publish', token, {'creation_id': container})['id']


def story(plan, eintrag, jetzt, heute, probelauf):
    """Story zum heutigen Post, sobald das Carousel draußen ist. Liefert False bei einem Fehler."""
    name = eintrag['post']
    protokoll = lies(publish.PROTOKOLL)
    if erschienen(protokoll, name, 'story'):
        print(f'Die Story zu {name} ist bereits veröffentlicht.')
        return True
    if not eintrag.get('freigabe'):
        return True
    if not hauptbeitrag_erschienen(protokoll, name, reel_modus(plan)):
        print(f'Die Story zu {name} folgt nach dem Carousel.')
        return True
    if not (ROOT / 'out' / name / 'story.jpg').exists():
        print(f'Zu {name} gibt es keine Story (out/{name}/story.jpg fehlt). Sie entsteht mit tools/reel.py.')
        return True
    if probelauf:
        print(f'Probelauf: Die Story zu {name} würde jetzt veröffentlicht.')
        return True
    # Abstand zum Carousel, falls es in diesem Lauf erschienen ist
    zeit = next((e['zeit'] for e in reversed(protokoll) if e['post'] == name and e.get('art') != 'story' and e['datum'] == heute), None)
    if zeit:
        seit = (jetzt.hour * 60 + jetzt.minute - int(zeit[:2]) * 60 - int(zeit[3:])) * 60
        if 0 <= seit < STORY_ABSTAND:
            time.sleep(STORY_ABSTAND - seit)
    medium = sende_story(name, lies(ROOT / 'config.json'))
    protokoll = lies(publish.PROTOKOLL)
    protokoll.append({'post': name, 'art': 'story', 'datum': heute, 'zeit': publish.berlin_jetzt().strftime('%H:%M'), 'media_id': medium})
    schreibe_protokoll(protokoll)
    print(f'Story zu {name} veröffentlicht.')
    return True


def video_adresse(name, config):
    if hasattr(publish, 'finde_video'):
        return publish.finde_video(name, config)[0]
    bild_basis = os.environ.get('IMAGE_BASE_URL', '').rstrip('/')
    if bild_basis and (ROOT / 'out' / name / 'reel.mp4').exists():
        return f'{bild_basis}/out/{name}/reel.mp4'
    return None


def waehle_wiederholung(protokoll, heute):
    """Der Beitrag, der heute wiederholt wird, oder None."""
    laeuft = next((e['post'] for e in protokoll if e.get('wiederholung') and e['datum'] == heute), None)
    if laeuft:
        return laeuft
    tag = dt.date.fromisoformat(heute)
    erstmals, zuletzt = {}, {}
    for e in protokoll:
        if e.get('wiederholung'):
            zuletzt[e['post']] = max(zuletzt.get(e['post'], ''), e['datum'])
        elif e.get('art') != 'story':
            erstmals.setdefault(e['post'], e['datum'])
    reichweite = {}
    if ZAHLEN.exists():
        for m in lies(ZAHLEN).get('medien', []):
            reichweite[m['post']] = max(reichweite.get(m['post'], 0), m.get('reichweite') or 0)
    kandidaten = [p for p, d in erstmals.items()
                  if (tag - dt.date.fromisoformat(d)).days >= WIEDERHOLEN_AB_TAGEN
                  and (p not in zuletzt or (tag - dt.date.fromisoformat(zuletzt[p])).days >= WIEDERHOLEN_SPERRE_TAGE)
                  and (ROOT / 'out' / p / 'story.jpg').exists() and (ROOT / 'posts' / f'{p}.json').exists()]
    kandidaten.sort(key=lambda p: (-reichweite.get(p, 0), erstmals[p]))
    return kandidaten[0] if kandidaten else None


def wiederholung(plan, jetzt, heute, probelauf):
    """Für heute steht nichts im Plan: einen älteren Beitrag als Reel und Story wiederholen."""
    protokoll = lies(publish.PROTOKOLL)
    name = waehle_wiederholung(protokoll, heute)
    if not name:
        print(f'Für {heute} ist kein Post geplant und kein Beitrag ist alt genug für eine Wiederholung '
              f'(mindestens {WIEDERHOLEN_AB_TAGEN} Tage). Der Tag bleibt leer.')
        return True
    print(f'Für {heute} ist kein Post geplant. Wiederholt wird {name}.')
    config = lies(ROOT / 'config.json')
    erledigt = {e.get('art') for e in protokoll if e.get('wiederholung') and e['datum'] == heute}
    reel_zeit, post_zeit = uhrzeiten(plan)
    uhr = jetzt.strftime('%H:%M')

    def vermerke(art, medium, link=None):
        stand = lies(publish.PROTOKOLL)
        stand.append({'post': name, 'art': art, 'wiederholung': True, 'datum': heute,
                      'zeit': publish.berlin_jetzt().strftime('%H:%M'), 'media_id': medium, **({'permalink': link} if link else {})})
        schreibe_protokoll(stand)

    if reel_modus(plan) != 'aus' and 'reel' not in erledigt and uhr >= reel_zeit:
        adresse = video_adresse(name, config)
        if not adresse:
            print(f'Zu {name} liegt kein Video mehr vor. Es erscheint nur die Story.')
        elif probelauf:
            print(f'Probelauf: Das Reel zu {name} würde jetzt wiederholt ({adresse}).')
        else:
            post = lies(ROOT / 'posts' / f'{name}.json')
            try:
                text = publish.baue_reel_caption(post)
            except TypeError:
                text = publish.baue_reel_caption(post, 'zusaetzlich')
            token, _, basis, konto_id = zugang(config)
            container = publish.anfrage('POST', f'{basis}/{konto_id}/media', token,
                                        {'media_type': 'REELS', 'video_url': adresse, 'caption': 'Aus dem Archiv: ' + text,
                                         'share_to_feed': 'true', 'thumb_offset': '2000' if hasattr(publish, 'finde_video') else '9500'})['id']
            publish.warte_bis_fertig(basis, container, token)
            medium = publish.anfrage('POST', f'{basis}/{konto_id}/media_publish', token, {'creation_id': container})['id']
            link = publish.anfrage('GET', f'{basis}/{medium}?fields=permalink', token).get('permalink')
            vermerke('reel', medium, link)
            print(f'Reel wiederholt: {link}')
    if 'story' not in erledigt and uhr >= post_zeit:
        if probelauf:
            print(f'Probelauf: Die Story zu {name} würde jetzt wiederholt.')
        else:
            vermerke('story', sende_story(name, config))
            print(f'Story zu {name} wiederholt.')
    return True


def warten(plan, jetzt, heute):
    protokoll = lies(publish.PROTOKOLL)
    eintrag = next((e for e in plan['posts'] if e['datum'] == heute), None)
    reel_zeit, post_zeit = uhrzeiten(plan, eintrag)
    modus = reel_modus(plan)
    ziele = []
    if not eintrag:
        ziele = [reel_zeit, post_zeit]
    elif eintrag.get('freigabe'):
        if modus == 'zusaetzlich' and not erschienen(protokoll, eintrag['post'], 'reel'):
            ziele.append(reel_zeit)
        if not hauptbeitrag_erschienen(protokoll, eintrag['post'], modus):
            ziele.append(post_zeit)
    for ziel in sorted(ziele):
        sekunden = (jetzt.replace(hour=int(ziel[:2]), minute=int(ziel[3:]), second=0, microsecond=0) - jetzt).total_seconds()
        if 0 < sekunden <= WARTEN_HOECHSTENS:
            print(f'Es ist {jetzt:%H:%M} Uhr, fällig um {ziel} Uhr. Warte {sekunden / 60:.0f} Minuten.', flush=True)
            time.sleep(sekunden + 5)
            return
    print(f'Es ist {jetzt:%H:%M} Uhr. Nichts abzuwarten.')


def main(argv=None):
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--warten', action='store_true', help='bis zur nächsten fälligen Uhrzeit warten, nichts veröffentlichen')
    parser.add_argument('--probelauf', action='store_true', help='nur zeigen, was der Lauf täte')
    parser.add_argument('--datum', help='nur mit --probelauf: so tun, als wäre dieser Tag (JJJJ-MM-TT)')
    parser.add_argument('--uhrzeit', help='nur mit --probelauf: so tun, als wäre es diese Uhrzeit (HH:MM)')
    args = parser.parse_args(argv)
    if (args.datum or args.uhrzeit) and not args.probelauf:
        sys.exit('--datum und --uhrzeit gelten nur zusammen mit --probelauf.')

    jetzt = publish.berlin_jetzt()
    if args.datum:
        jetzt = dt.datetime.combine(dt.date.fromisoformat(args.datum), jetzt.time())
    if args.uhrzeit:
        jetzt = jetzt.replace(hour=int(args.uhrzeit[:2]), minute=int(args.uhrzeit[3:]))
    heute = jetzt.date().isoformat()
    plan = lies(publish.PLAN)
    if args.warten:
        warten(plan, jetzt, heute)
        return

    eintrag = next((e for e in plan['posts'] if e['datum'] == heute), None)
    in_ordnung = True
    try:
        if eintrag:
            if args.datum or args.uhrzeit:
                print(f'Geplant für {heute}: {eintrag["post"]}. Reel und Carousel prüft tools/publish.py --probelauf.')
            else:
                zusatz = ['--probelauf'] if args.probelauf else []
                # Beide Schritte laufen, auch wenn einer scheitert. tools/publish.py achtet selbst auf Uhrzeit und Doppelposts.
                in_ordnung = rufe_publish(['--reel'] + zusatz) and in_ordnung
                in_ordnung = rufe_publish(zusatz) and in_ordnung
            in_ordnung = story(plan, eintrag, jetzt, heute, args.probelauf) and in_ordnung
        else:
            in_ordnung = wiederholung(plan, jetzt, heute, args.probelauf)
    except SystemExit as ende:
        if ende.code not in (None, 0):
            print(ende.code)
            in_ordnung = False
    if not in_ordnung:
        sys.exit(1)


if __name__ == '__main__':
    main()
