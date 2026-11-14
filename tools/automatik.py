"""Hilfen für den täglichen Automatik-Lauf. Der Ablauf steht in AUTOMATIK.md.

Aufruf:  python tools/automatik.py stand                          was ist geplant, was fehlt, welches Thema ist dran
         python tools/automatik.py pruefen <post>                 prüft Inhalt und Bilder eines Posts
         python tools/automatik.py einplanen <post> <datum> --thema "<Name>"
                                                                  prüft den Post und trägt ihn freigegeben in plan.json ein
         python tools/automatik.py aufraeumen                     löscht Bilder von Posts, die länger als 30 Tage online sind (außer story.jpg)

Dieses Skript veröffentlicht nichts. Das macht allein der Zeitplan in .github/workflows/post.yml.
"""
import argparse
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish  # noqa: E402  (Uhrzeit, Bildunterschrift und Grundprüfungen wie beim Veröffentlichen)

ROOT = publish.ROOT
THEMEN = ROOT / 'themen.json'
VORRAT_TAGE = 7                # Playbook vom 14.11.2026: so viele fertige Tage sollen ab morgen bereitliegen
JE_LAUF = 2                    # höchstens so viele Posts erstellt ein Lauf
VORRAT_WARNUNG = 3             # liegen weniger Tage bereit, steht eine Warnung im Bericht
HEUTE_BIS = '20:30'            # bis dahin erreicht ein Post für heute noch den letzten Lauf des Zeitplans
BILDER_BEHALTEN_TAGE = 30
SCHLUSSZEILE = 'Ein Bauwerk pro Tag'
BELEGE_AB = 10                 # ab dieser Nummer verlangt die Prüfung das Feld "belege"
TYPEN = {'cover', 'cover-breit', 'bild-unten', 'bild-rechts', 'balken', 'punkte', 'outro'}
WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']


def lies(pfad):
    return json.loads(Path(pfad).read_text(encoding='utf-8'))


def schreibe_plan(plan):
    zeilen = []
    for e in sorted(plan['posts'], key=lambda e: e['datum']):
        teile = [f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in e.items()]
        zeilen.append('    { ' + ', '.join(teile) + ' }')
    # Alle Einstellungen außer der Liste bleiben erhalten (Uhrzeit, Reel-Schalter und was später dazukommt)
    kopf = ''.join(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},\n' for k, v in plan.items() if k != 'posts')
    text = '{\n' + kopf + '  "posts": [\n' + ',\n'.join(zeilen) + '\n  ]\n}\n'
    publish.PLAN.write_text(text, encoding='utf-8')


def schreibe_themen(themen):
    zeilen = ['  ' + json.dumps(t, ensure_ascii=False) for t in themen]
    THEMEN.write_text('[\n' + ',\n'.join(zeilen) + '\n]\n', encoding='utf-8')


def posts_im_ordner():
    return sorted(p.stem for p in (ROOT / 'posts').glob('*.json'))


def naechste_nummer():
    nummern = [int(m.group(1)) for m in (re.match(r'(\d+)-', n) for n in posts_im_ordner()) if m]
    return f'{max(nummern, default=0) + 1:03d}'


# ---------- Prüfung eines Posts ----------

def sichtbar(text):
    """Länge des Textes, wie er auf dem Blatt steht: ohne Auszeichnung, &nbsp; als ein Zeichen."""
    return len(re.sub(r'<[^>]+>', '', text).replace('&nbsp;', ' '))


def pruefe_inhalt(name, post):
    """Liefert eine Liste von Fehlern im Inhalt des Posts (leer, wenn alles stimmt)."""
    fehler = []
    m = re.fullmatch(r'(\d{3,})-[a-z0-9]+(?:-[a-z0-9]+)*', name)
    if not m:
        return [f'Dateiname "{name}" hat nicht die Form NNN-kleinbuchstaben-mit-bindestrich.']
    nr = m.group(1)
    for feld in ('nr', 'titel', 'slides', 'quellen', 'caption', 'hashtags'):
        if not post.get(feld):
            fehler.append(f'Feld "{feld}" fehlt oder ist leer.')
    if fehler:
        return fehler
    if post['nr'] != nr:
        fehler.append(f'"nr" ist {post["nr"]}, der Dateiname sagt {nr}.')
    if len(post['titel']) > 23:
        fehler.append(f'Titel hat {len(post["titel"])} Zeichen, ins Schriftfeld passen 23.')

    skripte = (ROOT / 'render' / 'drawings.js').read_text(encoding='utf-8')
    if post.get('zeichnungen'):
        datei = ROOT / 'render' / 'zeichnungen' / f'{post["zeichnungen"]}.js'
        if datei.exists():
            skripte += datei.read_text(encoding='utf-8')
        else:
            fehler.append(f'Zeichnungsdatei fehlt: render/zeichnungen/{post["zeichnungen"]}.js')

    slides = post['slides']
    if not 7 <= len(slides) <= 9:
        fehler.append(f'{len(slides)} Blätter; erlaubt sind 7 bis 9.')
    for i, sl in enumerate(slides, 1):
        wo = f'Blatt {i}'
        typ = sl.get('typ')
        if typ not in TYPEN:
            fehler.append(f'{wo}: unbekannter Typ "{typ}".')
            continue
        if not sl.get('headline'):
            fehler.append(f'{wo}: "headline" fehlt.')
        if not isinstance(sl.get('text', []), list):
            fehler.append(f'{wo}: "text" muss eine Liste von Absätzen sein.')
            continue

        # Längen: gezählt wird der sichtbare Text, also ohne <em> und mit &nbsp; als ein Zeichen
        absaetze = sl.get('text', [])
        textlaenge = sum(sichtbar(a) for a in absaetze)
        ueberschrift = sichtbar(sl.get('headline', ''))
        woerter = [len(w) for w in re.sub(r'<[^>]+>', '', sl.get('headline', '')).replace('&nbsp;', ' ').split()]
        if re.search(r'\bMaße', sl.get('headline', '') + ' ' + sl.get('kicker', '')):
            fehler.append(f'{wo}: „Maße" wird in Großbuchstaben zu „MASSE". Anderes Wort nehmen, etwa „Abmessungen".')
        if sum(a.count('<em>') for a in absaetze) > 1:
            fehler.append(f'{wo}: höchstens eine Hervorhebung mit <em> pro Blatt.')
        if typ in ('cover', 'cover-breit'):
            zahl = str(sl.get('zahl', ''))
            if len(zahl) > 3:
                fehler.append(f'{wo}: "zahl" hat {len(zahl)} Zeichen, erlaubt sind 3.')
            grenze = 9 if typ == 'cover' else 10 if len(zahl) == 3 else 13
            if woerter and max(woerter) > grenze:
                fehler.append(f'{wo}: ein Wort der Überschrift hat {max(woerter)} Buchstaben, hier passen {grenze}.')
            if len(absaetze) != 1 or textlaenge > 140:
                fehler.append(f'{wo}: das Titelblatt hat genau einen Absatz mit höchstens 140 Zeichen (jetzt {len(absaetze)} Absätze, {textlaenge} Zeichen).')
        elif typ != 'outro':
            grenze = 20 if typ == 'bild-rechts' else 40
            if ueberschrift > grenze:
                fehler.append(f'{wo}: Überschrift hat {ueberschrift} Zeichen, erlaubt sind {grenze}.')
            if typ == 'bild-rechts' and woerter and max(woerter) > 10:
                fehler.append(f'{wo}: ein Wort der Überschrift hat {max(woerter)} Buchstaben, in die Spalte passen 10.')
            if typ in ('bild-unten', 'bild-rechts') and (len(absaetze) > 2 or textlaenge > 270):
                fehler.append(f'{wo}: neben einer Zeichnung höchstens zwei Absätze mit zusammen 270 Zeichen (jetzt {len(absaetze)} Absätze, {textlaenge} Zeichen).')
            if typ in ('punkte', 'balken'):
                if textlaenge > 200:
                    fehler.append(f'{wo}: Text über Kennzahlen oder Balken höchstens 200 Zeichen (jetzt {textlaenge}).')
                if sichtbar(sl.get('fuss', '')) > 90:
                    fehler.append(f'{wo}: "fuss" höchstens 90 Zeichen.')
        for p in sl.get('punkte') or []:
            if len(str(p.get('wert', ''))) > 9 or len(p.get('name', '')) > 30 or len(p.get('zusatz', '')) > 62:
                fehler.append(f'{wo}: Kennzahl "{p.get("wert")}": "wert" höchstens 9, "name" höchstens 30, "zusatz" höchstens 62 Zeichen.')
        for b in sl.get('balken') or []:
            if len(b.get('zusatz', '')) > 70 or len(str(b.get('anzeige', ''))) > 11:
                fehler.append(f'{wo}: Balken "{b.get("name")}": "zusatz" höchstens 70, "anzeige" höchstens 11 Zeichen.')

        if sl.get('figur'):
            fn = sl['figur'].get('fn', '')
            if not re.search(rf'\b{re.escape(fn)}\b', skripte):
                fehler.append(f'{wo}: Zeichnung "{fn}" gibt es weder in drawings.js noch in der Themen-Datei.')
        elif sl['typ'] in ('cover', 'cover-breit', 'bild-unten', 'bild-rechts'):
            fehler.append(f'{wo}: Typ "{sl["typ"]}" braucht eine Zeichnung ("figur").')
        if sl['typ'] == 'balken':
            if not 2 <= len(sl.get('balken') or []) <= 3:
                fehler.append(f'{wo}: "balken" braucht 2 bis 3 Einträge.')
            for b in sl.get('balken') or [{}]:
                if not isinstance(b.get('wert'), (int, float)) or not b.get('name') or 'zusatz' not in b:
                    fehler.append(f'{wo}: jeder Balken braucht "wert" (Zahl), "name" und "zusatz".')
                    break
        if sl['typ'] == 'punkte':
            punkte = sl.get('punkte') or []
            if not 2 <= len(punkte) <= 4 or any(not p.get('wert') or not p.get('name') for p in punkte):
                fehler.append(f'{wo}: "punkte" braucht 2 bis 4 Einträge mit "wert" und "name".')
    erstes, letztes = slides[0], slides[-1]
    if erstes.get('typ') not in ('cover', 'cover-breit'):
        fehler.append('Blatt 1 muss ein Titelblatt sein (cover oder cover-breit).')
    else:
        if erstes.get('kicker') != f'Bauwerk Nr. {nr}':
            fehler.append(f'Titelblatt: "kicker" muss "Bauwerk Nr. {nr}" lauten.')
        if not erstes.get('zahl'):
            fehler.append('Titelblatt: "zahl" fehlt.')
    if letztes.get('typ') != 'outro' or letztes.get('headline') != SCHLUSSZEILE:
        fehler.append(f'Letztes Blatt muss ein "outro" mit der Überschrift "{SCHLUSSZEILE}" sein.')
    if sum(1 for sl in slides if sl.get('typ') == 'outro') != 1:
        fehler.append('Es darf genau ein Schlussblatt geben.')

    quellen = post['quellen']
    if len(quellen) < 3 or not quellen[-1].startswith('Abruf '):
        fehler.append('Quellen: mindestens zwei Quellen und als letzter Eintrag "Abruf MM/JJJJ".')
    if not isinstance(post['caption'], list):
        fehler.append('"caption" muss eine Liste von Absätzen sein.')
    else:
        laenge = sum(len(a) for a in post['caption'])
        if not 220 <= laenge <= 330:
            fehler.append(f'"caption": die Absätze haben zusammen {laenge} Zeichen, erlaubt sind 220 bis 330.')
    tags = post['hashtags']
    if len(tags) != 8 or len(set(tags)) != 8 or any(not re.fullmatch(r'[a-z0-9äöüß]+', t) for t in tags):
        fehler.append('Hashtags: genau 8 verschiedene, klein geschrieben, ohne # und ohne Leerzeichen.')

    # Belege: seit Post 010 Pflicht, weil niemand mehr vorab durchsieht. Der Renderer beachtet das Feld nicht.
    if int(nr) >= BELEGE_AB:
        belege = post.get('belege')
        if not isinstance(belege, list) or len(belege) < 6:
            fehler.append('"belege" fehlt oder hat weniger als 6 Einträge: jede Angabe der Blätter mit ihren Fundstellen.')
        else:
            for b in belege:
                quellen_b = b.get('quellen') if isinstance(b, dict) else None
                if not b.get('angabe') or not isinstance(quellen_b, list) or not quellen_b \
                        or any(not str(q).startswith('http') for q in quellen_b):
                    fehler.append('"belege": jeder Eintrag braucht "angabe" und "quellen" (Liste von Adressen, die mit http beginnen).')
                    break
            if not any(len(b.get('quellen', [])) >= 2 for b in belege if isinstance(b, dict)):
                fehler.append('"belege": keine einzige Angabe hat zwei Quellen. Tragende Zahlen brauchen zwei.')
    return fehler


def pruefe_bilder(name, post):
    """Prüft die gerenderten Blätter: vorhanden, richtige Größe, nicht leer."""
    from PIL import Image

    fehler = []
    ordner = ROOT / 'out' / name
    for nr in range(1, len(post['slides']) + 1):
        bild = ordner / f'{nr:02d}.jpg'
        if not bild.exists():
            fehler.append(f'Bild fehlt: out/{name}/{bild.name}. Erst tools/render.py {name} ausführen.')
            continue
        with Image.open(bild) as im:
            if im.format != 'JPEG' or im.size != (1080, 1350):
                fehler.append(f'out/{name}/{bild.name}: {im.format} {im.size[0]} x {im.size[1]} statt JPEG 1080 x 1350.')
                continue
            hell = sum(im.convert('L').histogram()[151:]) / (1080 * 1350)
        # Ein Blatt ohne Inhalt (Fehler im Skript einer Zeichnung) zeigt nur den blauen Grund.
        if hell < 0.012:
            fehler.append(f'out/{name}/{bild.name} ist leer oder fast leer ({hell:.1%} helle Fläche). '
                          'Meist ein Fehler in der Zeichnungsdatei.')
    if not (ordner / 'uebersicht.jpg').exists():
        fehler.append(f'out/{name}/uebersicht.jpg fehlt.')
    story = ordner / 'story.jpg'
    if not story.exists():
        fehler.append(f'out/{name}/story.jpg fehlt. Erst tools/reel.py {name} ausführen (baut das Bild für die Story).')
    else:
        with Image.open(story) as im:
            if im.format != 'JPEG' or im.size != (1080, 1920):
                fehler.append(f'out/{name}/story.jpg: {im.format} {im.size[0]} x {im.size[1]} statt JPEG 1080 x 1920.')
    return fehler


def pruefe(name):
    datei = ROOT / 'posts' / f'{name}.json'
    if not datei.exists():
        return [f'posts/{name}.json gibt es nicht.']
    try:
        post = lies(datei)
    except ValueError as fehler:
        return [f'posts/{name}.json ist kein gültiges JSON: {fehler}']
    fehler = pruefe_inhalt(name, post)
    if fehler:
        return fehler
    caption = publish.baue_caption(post)
    if len(caption) > 2200:
        fehler.append(f'Bildunterschrift hat {len(caption)} Zeichen, erlaubt sind 2200.')
    return fehler + pruefe_bilder(name, post)


# ---------- Befehle ----------

def themen_vorschlag(themen):
    genutzt = sorted((t for t in themen if t.get('post')), key=lambda t: t['post'])
    letzte = [t['art'] for t in genutzt[-2:]]
    offen = [t for t in themen if not t.get('post')]
    passend = [t for t in offen if t['art'] not in letzte] or offen
    return genutzt, offen, passend


def befehl_stand(_args):
    jetzt = publish.berlin_jetzt()
    heute = jetzt.date()
    morgen = heute + dt.timedelta(days=1)
    plan = lies(publish.PLAN)
    eintraege = lies(publish.PROTOKOLL)
    modus = publish.reel_modus(plan)
    # Ein Tag gilt als erschienen, sobald das Carousel draußen ist; ersetzt das Reel das Carousel, zählt das Reel.
    erste = [e for e in eintraege if not e.get('wiederholung') and e.get('art') != 'story']   # ohne Storys und Wiederholungen
    protokoll = {e['post']: e for e in reversed(erste) if modus == 'statt' or e.get('art') != 'reel'}
    reels = {e['post']: e for e in erste if e.get('art') == 'reel'}
    nach_datum = {}
    warnungen = []
    for e in plan['posts']:
        if e['datum'] in nach_datum:
            warnungen.append(f'{e["datum"]} ist doppelt belegt.')
        nach_datum[e['datum']] = e

    print(f'Heute ist {WOCHENTAGE[heute.weekday()]}, {heute.isoformat()}, {jetzt:%H:%M} Uhr deutscher Zeit.')
    print('Die Automatik läuft ohne Enddatum; der Betreiber prüft alle drei Monate, ob es weitergeht.')
    if plan['posts']:
        letzter = max(plan['posts'], key=lambda e: e['datum'])
        print(f'Der Plan reicht bis {letzter["datum"]} ({letzter["post"]}).')

    fehlt = []
    for wort, tag in (('heute', heute), ('morgen', morgen)):
        e = nach_datum.get(tag.isoformat())
        if not e:
            print(f'{wort:6} {tag.isoformat()}: kein Post geplant')
            if wort == 'heute' and jetzt.strftime('%H:%M') > HEUTE_BIS:
                warnungen.append(f'Für heute fehlt ein Post und es ist nach {HEUTE_BIS} Uhr: Der Tag bleibt leer.')
            else:
                fehlt.append(tag)
            continue
        zustand = 'geplant'
        if e['post'] in protokoll:
            zustand = f'veröffentlicht um {protokoll[e["post"]]["zeit"]} Uhr'
        elif not e.get('freigabe'):
            zustand = 'geplant, aber NICHT freigegeben'
            warnungen.append(f'{e["post"]} ({e["datum"]}) ist nicht freigegeben.')
        if modus != 'aus':
            if e['post'] in reels:
                zustand += f', Reel veröffentlicht um {reels[e["post"]]["zeit"]} Uhr'
            elif publish.finde_video(e['post'], lies(ROOT / 'config.json'))[0]:
                zustand += ', Reel mit Musik liegt bereit'
            else:
                zustand += ', REEL FEHLT'
                warnungen.append(f'{e["post"]}: Das Reel fehlt in der Ablage auf GitHub. Das Video rendert GitHub nach dem Übertragen '
                                 '(Workflow "Reel rendern", einige Minuten). Fehlt es danach weiter: '
                                 'gh run list --workflow reel.yml --limit 3')
        print(f'{wort:6} {tag.isoformat()}: {e["post"]} – {zustand}')
        if e['post'] not in protokoll:
            for f in pruefe(e['post']):
                warnungen.append(f'{e["post"]}: {f}')

    for e in plan['posts']:
        if e['datum'] < heute.isoformat() and e['post'] not in protokoll:
            alter = (heute - dt.date.fromisoformat(e['datum'])).days
            if alter <= 7:
                warnungen.append(f'{e["post"]} war für {e["datum"]} geplant und ist nicht veröffentlicht worden. '
                                 'Ursache prüfen: gh run list --workflow post.yml --limit 6')
    geplant = {e['post'] for e in plan['posts']}
    for name in posts_im_ordner():
        if name not in geplant and name not in protokoll:
            warnungen.append(f'posts/{name}.json liegt im Ordner, steht aber nicht im Plan: Rest eines abgebrochenen Laufs. '
                             'Fertigstellen und einplanen oder mitsamt Zeichnung und Bildern entfernen; die Nummer ist sonst vergeben.')
    e_heute = nach_datum.get(heute.isoformat())
    if e_heute and e_heute['post'] not in protokoll and jetzt.strftime('%H:%M') > '20:00':
        warnungen.append(f'Der heutige Post {e_heute["post"]} ist um {jetzt:%H:%M} Uhr noch nicht veröffentlicht.')

    # Vorrat: die Tage ab übermorgen bis heute + VORRAT_TAGE. Heute und morgen hat die Schleife oben schon geprüft.
    for i in range(2, VORRAT_TAGE + 1):
        tag = heute + dt.timedelta(days=i)
        if tag.isoformat() not in nach_datum:
            fehlt.append(tag)
    vorrat = sum(1 for i in range(1, VORRAT_TAGE + 1) if (heute + dt.timedelta(days=i)).isoformat() in nach_datum)
    print(f'Vorrat: {vorrat} von {VORRAT_TAGE} Tagen ab morgen sind belegt.')
    if vorrat < VORRAT_WARNUNG:
        warnungen.append(f'Der Vorrat liegt bei {vorrat} Tagen, also unter {VORRAT_WARNUNG}. Das gehört als Warnung in den Bericht.')
    print()
    if fehlt:
        nummer = int(naechste_nummer())
        for i, tag in enumerate(fehlt[:JE_LAUF]):
            print(f'ZU ERSTELLEN: Post Nr. {nummer + i:03d} für {WOCHENTAGE[tag.weekday()]}, {tag.isoformat()}')
        if len(fehlt) > JE_LAUF:
            print(f'Weitere {len(fehlt) - JE_LAUF} freie Tage füllen die nächsten Läufe (höchstens {JE_LAUF} Posts je Lauf).')
    else:
        print(f'ZU ERSTELLEN: nichts. Der Vorrat für {VORRAT_TAGE} Tage ist voll.')

    themen = lies(THEMEN)
    genutzt, offen, passend = themen_vorschlag(themen)
    print()
    print('Zuletzt: ' + '; '.join(f'{t["post"][:3]} {t["name"]} ({t["art"]}, {t["region"]})' for t in genutzt[-5:]))
    print(f'Themenliste: {len(offen)} offen.' + (' Unter 30: Liste um mindestens 60 Themen ergänzen.' if len(offen) < 30 else ''))
    if fehlt and passend:
        print('Vorschlag (in dieser Reihenfolge): ' + '; '.join(f'{t["name"]} ({t["art"]}, {t["region"]})' for t in passend[:4]))

    print()
    if warnungen:
        print('WARNUNGEN:')
        for w in warnungen:
            print('  - ' + w)
    else:
        print('Keine Warnungen.')


def befehl_pruefen(args):
    fehler = pruefe(args.post)
    if fehler:
        print(f'{args.post}: {len(fehler)} Fehler')
        for f in fehler:
            print('  - ' + f)
        sys.exit(1)
    print(f'{args.post}: Inhalt und Bilder in Ordnung. Die Blätter trotzdem ansehen, bevor der Post eingeplant wird.')


def befehl_einplanen(args):
    try:
        tag = dt.date.fromisoformat(args.datum)
    except ValueError:
        sys.exit(f'"{args.datum}" ist kein Datum der Form JJJJ-MM-TT.')
    heute = publish.berlin_jetzt().date()
    if not heute <= tag <= heute + dt.timedelta(days=VORRAT_TAGE):
        sys.exit(f'{args.datum} liegt nicht zwischen heute und heute in {VORRAT_TAGE} Tagen. Weiter voraus plant die Automatik nicht.')
    plan = lies(publish.PLAN)
    if any(e['datum'] == args.datum for e in plan['posts']):
        sys.exit(f'{args.datum} ist schon belegt.')
    if any(e['post'] == args.post for e in plan['posts']):
        sys.exit(f'{args.post} steht schon im Plan.')
    nummer = args.post.split('-')[0]
    if any(n != args.post and n.split('-')[0] == nummer for n in posts_im_ordner()):
        sys.exit(f'Die Nummer {nummer} ist schon vergeben.')
    fehler = pruefe(args.post)
    if fehler:
        sys.exit(f'{args.post} wird nicht eingeplant:\n' + '\n'.join('  - ' + f for f in fehler))

    themen = lies(THEMEN)
    treffer = next((t for t in themen if t['name'].lower() == args.thema.lower()), None)
    if treffer and treffer.get('post'):
        sys.exit(f'Das Thema "{treffer["name"]}" ist schon als {treffer["post"]} erschienen.')
    if not treffer:
        if not (args.art and args.region):
            sys.exit(f'"{args.thema}" steht nicht in themen.json. Für ein neues Thema --art und --region angeben.')
        treffer = {'name': args.thema, 'art': args.art, 'region': args.region}
        themen.append(treffer)
    treffer['post'] = args.post
    schreibe_themen(themen)

    # "erstellt" hält fest, wann der Post fertig war (Playbook); veröffentlicht wird er am "datum".
    plan['posts'].append({'datum': args.datum, 'post': args.post, 'freigabe': True,
                          'erstellt': publish.berlin_jetzt().strftime('%Y-%m-%dT%H:%M')})
    schreibe_plan(plan)
    print(f'{args.post} ist für {args.datum} eingeplant und freigegeben. Jetzt committen und übertragen.')


def befehl_aufraeumen(_args):
    heute = publish.berlin_jetzt().date()
    geloescht = []
    for e in lies(publish.PROTOKOLL):
        ordner = ROOT / 'out' / e['post']
        if ordner.is_dir() and (heute - dt.date.fromisoformat(e['datum'])).days > BILDER_BEHALTEN_TAGE:
            # story.jpg bleibt: Bei leerem Vorrat wiederholt tools/zeitplan.py ältere Beiträge als Story.
            alt = [d for d in ordner.iterdir() if d.name != 'story.jpg']
            if alt:
                for datei in alt:
                    shutil.rmtree(datei) if datei.is_dir() else datei.unlink()
                geloescht.append(e['post'])
    print('Bilder gelöscht (lassen sich mit tools/render.py neu erzeugen): ' + (', '.join(geloescht) or 'keine'))


def main(argv=None):
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest='befehl', required=True)
    sub.add_parser('stand').set_defaults(lauf=befehl_stand)
    p = sub.add_parser('pruefen')
    p.add_argument('post')
    p.set_defaults(lauf=befehl_pruefen)
    p = sub.add_parser('einplanen')
    p.add_argument('post')
    p.add_argument('datum')
    p.add_argument('--thema', required=True, help='Name des Themas wie in themen.json')
    p.add_argument('--art', help='nur für ein Thema, das noch nicht in themen.json steht')
    p.add_argument('--region', choices=['DACH', 'Europa', 'Welt'], help='nur für ein neues Thema')
    p.set_defaults(lauf=befehl_einplanen)
    sub.add_parser('aufraeumen').set_defaults(lauf=befehl_aufraeumen)
    args = parser.parse_args(argv)
    args.lauf(args)


if __name__ == '__main__':
    main()
