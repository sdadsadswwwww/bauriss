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
JE_LAUF = VORRAT_TAGE + 1      # Regel vom 14.11.2026: ein Lauf erstellt alles, was zum vollen Vorrat fehlt (keine Obergrenze)
VORRAT_WARNUNG = 3             # liegen weniger Tage bereit, steht eine Warnung im Bericht
HEUTE_BIS = '20:30'            # bis dahin erreicht ein Post für heute noch den letzten Lauf des Zeitplans
BILDER_BEHALTEN_TAGE = 30
SCHLUSSZEILE = 'Ein Bauwerk pro Tag'
BELEGE_AB = 10                 # ab dieser Nummer verlangt die Prüfung das Feld "belege"
TYPEN = {'titel', 'cover', 'cover-breit', 'bild-unten', 'bild-rechts', 'balken', 'punkte', 'outro'}
# Lesbare Vorlage (seit 21.11.2026, Posts mit "vorlage": "lesbar"). Gemessen wird am gerenderten Bild (out/<post>/mess.json).
MIN_SCHRIFT = 32               # kleinste Schrift im Blatt in px (11,6 px am Handy)
MIN_SCHRIFT_REEL = 44          # kleinste Schrift in den Bildern des kurzen Reels
MAX_LESETEXT = 35              # Wörter Lesetext je Blatt: kicker, headline, text, Kennzahlen, Balken, fuss
MAX_BLATT = 45                 # Lesetext und Beschriftung der Zeichnung zusammen
MAX_TITEL = 20                 # Wörter auf dem ganzen Titelblatt (ohne Schriftfeld)
MAX_TITEL_BESCHRIFTUNGEN = 4   # Beschriftungen in der Zeichnung des Titelblatts
MIN_LINIE = 1.9                # dünnste Linie in einer Zeichnung in px (Soll 2; Schraffuren schrumpfen mit der Zeichnung leicht mit)
MAX_REEL = {'1': 16, '2': 12, '3': 24}   # Wörter je Reel-Bild (Frage, Zeichnung, Antwort), Kopfzeile eingerechnet
TITEL_GRENZEN = (('unterzeile', 38), ('zahl', 4), ('headline', 20), ('aufhaenger', 50))
REEL_GRENZEN = {'frage': (('zeile', 45), ('frage', 24)), 'zeichnung': (('zahl', 4), ('aussage', 30)),
                'antwort': (('zahl', 4), ('einheit', 20), ('antwort', 30), ('zusatz', 60))}
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


def pruefe_blatt_lesbar(wo, sl):
    """Lesbare Vorlage: Grenzen eines Blatts, soweit sie am Text abzulesen sind. Wörter und Schrift misst tools/render.py."""
    fehler = []
    typ, absaetze, figur = sl['typ'], sl.get('text', []), sl.get('figur') or {}
    for feld in ('ebene', 'ansicht', 'befehl', 'details'):
        if feld in figur:
            fehler.append(f'{wo}: "figur.{feld}" gibt es in der lesbaren Vorlage nicht (das Fenster zeigt keinen Text).')
    if 'eigenschaften' in sl:
        fehler.append(f'{wo}: "eigenschaften" gibt es in der lesbaren Vorlage nicht.')
    if typ in ('cover', 'cover-breit'):
        return fehler + [f'{wo}: in der lesbaren Vorlage heißt das Titelblatt "titel", nicht "{typ}".']
    if typ == 'titel':
        for feld, grenze in TITEL_GRENZEN:
            wert = str(sl.get(feld, ''))
            if not wert:
                fehler.append(f'{wo}: das Titelblatt braucht "{feld}".')
            elif sichtbar(wert) > grenze:
                fehler.append(f'{wo}: "{feld}" hat {sichtbar(wert)} Zeichen, erlaubt sind {grenze}.')
        if len(str(sl.get('vorsatz', ''))) > 6:
            fehler.append(f'{wo}: "vorsatz" höchstens 6 Zeichen (etwa "rund", "fast", "über").')
        if str(sl.get('aufhaenger', '')).count('<em>') != 1:
            fehler.append(f'{wo}: der Aufhänger hat genau eine Hervorhebung mit <em>.')
        if sl.get('kicker') or absaetze:
            fehler.append(f'{wo}: das Titelblatt hat weder "kicker" noch "text".')
        return fehler
    if typ == 'outro':
        return fehler
    if sichtbar(sl.get('headline', '')) > 40:
        fehler.append(f'{wo}: Überschrift hat {sichtbar(sl.get("headline", ""))} Zeichen, erlaubt sind 40.')
    if len(absaetze) > 1:
        fehler.append(f'{wo}: höchstens ein Absatz Text (jetzt {len(absaetze)}).')
    if sichtbar(sl.get('fuss', '')) > 60:
        fehler.append(f'{wo}: "fuss" höchstens 60 Zeichen.')
    for p in sl.get('punkte') or []:
        if len(str(p.get('wert', ''))) > 9 or len(p.get('name', '')) > 20 or len(p.get('zusatz', '')) > 26:
            fehler.append(f'{wo}: Kennzahl "{p.get("wert")}": "wert" höchstens 9, "name" höchstens 20, "zusatz" höchstens 26 Zeichen.')
    for b in sl.get('balken') or []:
        if len(b.get('zusatz', '')) > 40 or len(str(b.get('anzeige', ''))) > 12:
            fehler.append(f'{wo}: Balken "{b.get("name")}": "zusatz" höchstens 40, "anzeige" höchstens 12 Zeichen.')
    if figur.get('fn') == 'zeitleiste':
        marken = figur.get('marken') or []
        if absaetze:
            fehler.append(f'{wo}: ein Blatt mit Zeitleiste hat keinen Text.')
        if any(len(str(m.get('text', ''))) > 28 for m in marken):
            fehler.append(f'{wo}: Markentexte der Zeitleiste höchstens 28 Zeichen.')
        if any(len(str(ph.get('text', ''))) > 20 for ph in figur.get('phasen') or []):
            fehler.append(f'{wo}: Phasentexte der Zeitleiste höchstens 20 Zeichen.')
        spanne = figur.get('bis', 0) - figur.get('von', 0)
        jahre = sorted(m.get('jahr', 0) for m in marken)
        if spanne > 0 and any(b - a < 0.06 * spanne for a, b in zip(jahre, jahre[1:])):
            fehler.append(f'{wo}: zwei Marken der Zeitleiste liegen enger als 6 % der Spanne beieinander.')
    return fehler


def pruefe_reel_feld(post, skripte):
    """Lesbare Vorlage: das Feld "reel" mit den Angaben für die Bilder Frage, Zeichnung und Antwort."""
    reel = post.get('reel')
    if not isinstance(reel, dict):
        return ['Feld "reel" fehlt: die Angaben für das kurze Reel ("frage", "zeichnung", "antwort").']
    fehler = []
    for bild, felder in REEL_GRENZEN.items():
        teil = reel.get(bild)
        if not isinstance(teil, dict):
            fehler.append(f'"reel.{bild}" fehlt.')
            continue
        for feld, grenze in felder:
            wert = str(teil.get(feld, ''))
            if not wert:
                fehler.append(f'"reel.{bild}.{feld}" fehlt.')
            elif sichtbar(wert) > grenze:
                fehler.append(f'"reel.{bild}.{feld}" hat {sichtbar(wert)} Zeichen, erlaubt sind {grenze}.')
        if bild != 'antwort':
            fn = (teil.get('figur') or {}).get('fn', '')
            if not fn or not re.search(rf'\b{re.escape(fn)}\b', skripte):
                fehler.append(f'"reel.{bild}.figur": Zeichnung "{fn}" gibt es weder in drawings.js noch in der Themen-Datei.')
    if isinstance(reel.get('antwort'), dict) and len(str(reel['antwort'].get('vorsatz', ''))) > 6:
        fehler.append('"reel.antwort.vorsatz" höchstens 6 Zeichen.')
    if isinstance(reel.get('antwort'), dict) and str(reel['antwort'].get('antwort', '')).count('<em>') != 1:
        fehler.append('"reel.antwort.antwort" hat genau eine Hervorhebung mit <em>.')
    return fehler


def pruefe_messung(name, post):
    """Lesbare Vorlage: wertet out/<post>/mess.json aus. tools/render.py misst die Blätter nach, tools/reel.py die Reel-Bilder."""
    from PIL import Image
    import render

    datei = ROOT / 'out' / name / 'mess.json'
    if not datei.exists():
        return [f'out/{name}/mess.json fehlt. Erst tools/render.py {name} und tools/reel.py {name} ausführen.']
    messung, stand, fehler = lies(datei), render.stand(name), []

    blaetter = messung.get('blaetter') or {}
    if blaetter.get('stand') != stand or len(blaetter.get('liste') or []) != len(post['slides']):
        fehler.append(f'Die Blätter in out/{name}/ stammen nicht aus dem letzten Stand von Post und Zeichnung. tools/render.py {name} ausführen.')
    else:
        for b in blaetter['liste']:
            wo, w, klein = f'Blatt {b["nr"]}', b['woerter'], b.get('kleinste') or {'px': 0, 'text': ''}
            if klein['px'] < MIN_SCHRIFT:
                grund = ' Die Zeichnung ist zu hoch für ihren Platz und schrumpft samt Schrift.' if (b.get('massstab') or 1) < 0.99 else ''
                fehler.append(f'{wo}: kleinste Schrift {klein["px"]:g} px („{klein["text"]}“), erlaubt sind mindestens {MIN_SCHRIFT} px.{grund}')
            if b['typ'] == 'titel':
                if w['lesetext'] + w['zeichnung'] > MAX_TITEL:
                    fehler.append(f'{wo}: {w["lesetext"] + w["zeichnung"]} Wörter auf dem Titelblatt, erlaubt sind {MAX_TITEL}.')
                if b['beschriftungen'] > MAX_TITEL_BESCHRIFTUNGEN:
                    fehler.append(f'{wo}: {b["beschriftungen"]} Beschriftungen in der Zeichnung, erlaubt sind {MAX_TITEL_BESCHRIFTUNGEN}.')
            else:
                if w['lesetext'] > MAX_LESETEXT:
                    fehler.append(f'{wo}: {w["lesetext"]} Wörter Lesetext, erlaubt sind {MAX_LESETEXT}.')
                if w['lesetext'] + w['zeichnung'] > MAX_BLATT:
                    fehler.append(f'{wo}: {w["lesetext"] + w["zeichnung"]} Wörter mit der Beschriftung der Zeichnung, erlaubt sind {MAX_BLATT}.')
            if b.get('linie') and b['linie']['px'] < MIN_LINIE:
                fehler.append(f'{wo}: dünnste Linie {b["linie"]["px"]:g} px (Klasse "{b["linie"]["klasse"]}"), erlaubt sind mindestens 2 px.')
            if b['ueberlauf']:
                fehler.append(f'{wo}: der Inhalt läuft {b["ueberlauf"]} px über das Blatt hinaus.')
            fehler += [f'{wo}: „{t}“ steht außerhalb von Rahmen oder Fenster.' for t in b['aussen']]
            fehler += [f'{wo}: die Beschriftungen „{x}“ und „{y}“ überdecken sich.' for x, y in b['ueberlappt']]
            if b['schild_voll']:
                fehler.append(f'{wo}: der Titel passt nicht ins Schriftfeld.')

    reel = messung.get('reel') or {}
    if reel.get('stand') != stand or len(reel.get('bilder') or []) != 5:
        fehler.append(f'Die Reel-Bilder in out/{name}/ fehlen oder stammen nicht aus dem letzten Stand. tools/reel.py {name} ausführen.')
    else:
        for b in reel['bilder']:
            wo, klein = f'Reel-Bild {b["bild"]}', b.get('kleinste') or {'px': 0, 'text': ''}
            bild = ROOT / 'out' / name / f'reel-{b["bild"]}.jpg'
            if not bild.exists():
                fehler.append(f'Bild fehlt: out/{name}/{bild.name}. tools/reel.py {name} --neu ausführen.')
                continue
            with Image.open(bild) as im:
                if im.format != 'JPEG' or im.size != (1080, 1920):
                    fehler.append(f'out/{name}/{bild.name}: {im.format} {im.size[0]} x {im.size[1]} statt JPEG 1080 x 1920.')
            if klein['px'] < MIN_SCHRIFT_REEL:
                fehler.append(f'{wo}: kleinste Schrift {klein["px"]:g} px („{klein["text"]}“), erlaubt sind mindestens {MIN_SCHRIFT_REEL} px.')
            if b['woerter'] > MAX_REEL.get(b['bild'], 99):
                fehler.append(f'{wo}: {b["woerter"]} Wörter, erlaubt sind {MAX_REEL[b["bild"]]}.')
            if b['ueberlauf'] or b['in_zeichnung']:
                fehler.append(f'{wo}: der Text passt nicht in den sicheren Bereich oder läuft in die Zeichnung. Texte kürzen.')
            fehler += [f'{wo}: „{t}“ steht in einem Bereich, den Instagram mit Bedienelementen überdeckt.' for t in b['aussen']]
    return fehler


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
    lesbar = post.get('vorlage') == 'lesbar'
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
        if lesbar:
            fehler += pruefe_blatt_lesbar(wo, sl)
        elif typ == 'titel':
            fehler.append(f'{wo}: den Typ "titel" gibt es nur in der lesbaren Vorlage ("vorlage": "lesbar").')
        elif typ in ('cover', 'cover-breit'):
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
        for p in ([] if lesbar else sl.get('punkte') or []):
            if len(str(p.get('wert', ''))) > 9 or len(p.get('name', '')) > 30 or len(p.get('zusatz', '')) > 62:
                fehler.append(f'{wo}: Kennzahl "{p.get("wert")}": "wert" höchstens 9, "name" höchstens 30, "zusatz" höchstens 62 Zeichen.')
        for b in ([] if lesbar else sl.get('balken') or []):
            if len(b.get('zusatz', '')) > 70 or len(str(b.get('anzeige', ''))) > 11:
                fehler.append(f'{wo}: Balken "{b.get("name")}": "zusatz" höchstens 70, "anzeige" höchstens 11 Zeichen.')

        if sl.get('figur'):
            fn = sl['figur'].get('fn', '')
            if not re.search(rf'\b{re.escape(fn)}\b', skripte):
                fehler.append(f'{wo}: Zeichnung "{fn}" gibt es weder in drawings.js noch in der Themen-Datei.')
        elif sl['typ'] in ('titel', 'cover', 'cover-breit', 'bild-unten', 'bild-rechts'):
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
    if lesbar:
        if erstes.get('typ') != 'titel' or sum(1 for sl in slides if sl.get('typ') == 'titel') != 1:
            fehler.append('Lesbare Vorlage: Blatt 1, und nur Blatt 1, hat den Typ "titel".')
        fehler += pruefe_reel_feld(post, skripte)
    elif erstes.get('typ') not in ('cover', 'cover-breit'):
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
        # Ein Blatt ohne Inhalt (Fehler im Skript einer Zeichnung) zeigt nur den dunklen Grund.
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
    if post.get('vorlage') == 'lesbar':
        fehler += pruefe_messung(name, post)
    return fehler


def pruefe(name):
    datei = ROOT / 'posts' / f'{name}.json'
    if not datei.exists():
        return [f'posts/{name}.json gibt es nicht.']
    try:
        post = lies(datei)
    except ValueError as fehler:
        return [f'posts/{name}.json ist kein gültiges JSON: {fehler}']
    if post.get('vorlage') != 'lesbar':
        # Die alte Vorlage gilt nur noch für Posts, die schon geplant oder erschienen sind.
        bekannt = {e['post'] for e in lies(publish.PLAN)['posts']} | {e['post'] for e in lies(publish.PROTOKOLL)}
        if name not in bekannt:
            return ['Neue Posts entstehen in der lesbaren Vorlage: "vorlage": "lesbar", Titelblatt vom Typ "titel", '
                    'Feld "reel" (AUTOMATIK.md, Abschnitt „Aufbau eines Posts“).']
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
