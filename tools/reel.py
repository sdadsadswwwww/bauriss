"""Baut zu einem Post ein Reel mit Musik (1080 x 1920) und das Bild für die Story.

Aufruf:  python tools/reel.py 016-beispiel            ein Post: Bilder rendern, messen, Story bauen, mit ffmpeg auch das Video
         python tools/reel.py 016-beispiel --neu      Bilder des kurzen Reels auch dann neu rendern, wenn sie aktuell sind
         python tools/reel.py 016-beispiel --befehl   zeigt den ffmpeg-Aufruf, ohne ihn auszuführen
         python tools/reel.py --fehlende              alle geplanten Posts ab heute, deren Video fehlt oder veraltet ist

Instagram nimmt über die Schnittstelle Musik nur zusammen mit einem Video an, nicht zu Bildern.

Kurzes Reel (Posts mit dem Feld "reel", seit 21.11.2026): vier bildfüllende Bilder (Frage, Zeichnung, Antwort,
Schluss), zusammen 16 Sekunden. Die Bilder rendert Chrome aus render/reel.html nach out/<post>/reel-*.jpg; sie
werden mit dem Post übertragen. Das Video schneidet ffmpeg daraus: jedes Bild mit langsamem Zoom, kurze Überblendung,
dazu die Musik. Es gibt zwei Fassungen: reels/<post>.mp4 mit neutralem Schluss (für Wiederholungen und als Ersatz)
und reels/<post>-morgen-<nr>.mp4 mit „Morgen: <nächstes Bauwerk>“, sobald laut plan.json am Folgetag ein Post steht.
tools/publish.py nimmt die Fassung mit „Morgen“ nur, wenn der Plan am Tag der Veröffentlichung noch dazu passt.

Blätterschau (Posts ohne das Feld "reel"): die Blätter out/<post>/NN.jpg nacheinander, jedes so lange, wie man zum
Lesen braucht, dazwischen eine kurze Überblendung.

Die Videos lädt der Workflow in die Ablage auf GitHub (Release "medien", nicht ins Repository, damit es klein bleibt).
Die Musik berechnet tools/musik.py passend zur Länge des Videos.

Das Video braucht ffmpeg (Umgebungsvariable FFMPEG oder im Suchpfad). Auf GitHub erledigt das der
Workflow "Reel rendern" nach jedem Übertragen eines Posts; ohne ffmpeg zeigt das Skript nur den Ablauf.
"""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import musik  # noqa: E402
import publish  # noqa: E402

ROOT = publish.ROOT
ABLAGE = ROOT / 'reels'                    # fertige Videos; der Workflow lädt sie in die Ablage auf GitHub hoch
BREITE, HOEHE, BLATT_HOEHE = 1080, 1920, 1350
RAND = (HOEHE - BLATT_HOEHE) // 2          # Streifen über und unter dem Blatt
BILDER_JE_SEKUNDE = 30
BLENDE = 0.5                               # Sekunden Überblendung zwischen zwei Blättern
# Farben und Raster wie in render/style.css (CAD-Look seit 20.11.2026): Grund #0a1320, feines Raster 21,6 px, grobes 108 px
GRUND, NETZ, NETZ_STARK = (10, 19, 32), (16, 27, 41), (22, 35, 50)
RASTER = 21.6


def texte(wert, schluessel=''):
    """Alle Texte eines Blatts, um die Lesezeit zu schätzen."""
    if isinstance(wert, str):
        return [] if schluessel in ('typ', 'fn', 'art', 'form', 'stand') else [re.sub(r'<[^>]+>', '', wert)]
    if isinstance(wert, dict):
        return [t for k, v in wert.items() for t in texte(v, k)]
    if isinstance(wert, list):
        return [t for v in wert for t in texte(v, schluessel)]
    return []


def standzeiten(post):
    """Sekunden je Blatt: Titel und Schluss kurz, sonst nach Textmenge (etwa 30 Zeichen je Sekunde)."""
    zeiten = []
    for sl in post['slides']:
        if sl['typ'] in ('cover', 'cover-breit'):
            zeiten.append(4.5)
        elif sl['typ'] == 'outro':
            zeiten.append(4.0)
        else:
            zeichen = sum(len(t) for t in texte(sl))
            zeiten.append(round(min(8.5, max(5.0, 2.5 + zeichen / 30)), 1))
    return zeiten


def raster(stift, links, oben, rechts, unten, bezug_y=0):
    """Zeichenraster wie auf den Blättern; bezug_y ist die Höhe, an der das Raster des Blatts beginnt."""
    i = 0
    while i * RASTER < rechts:
        x = round(i * RASTER)
        if x >= links:
            stift.line([(x, oben), (x, unten - 1)], fill=NETZ_STARK if i % 5 == 0 else NETZ, width=1)
        i += 1
    i = -int((bezug_y - oben) / RASTER) - 1
    while bezug_y + i * RASTER < unten:
        y = round(bezug_y + i * RASTER)
        if oben <= y < unten:
            stift.line([(links, y), (rechts - 1, y)], fill=NETZ_STARK if i % 5 == 0 else NETZ, width=1)
        i += 1


def baue_bild(blatt, ziel):
    """Setzt ein Blatt (1080 x 1350) mittig auf den hohen Grund und führt das Zeichenraster in den Streifen fort."""
    bild = Image.new('RGB', (BREITE, HOEHE), GRUND)
    stift = ImageDraw.Draw(bild)
    for oben, unten in ((0, RAND), (RAND + BLATT_HOEHE, HOEHE)):
        raster(stift, 0, oben, BREITE, unten, bezug_y=RAND)
    with Image.open(blatt) as quelle:
        if quelle.size != (BREITE, BLATT_HOEHE):
            sys.exit(f'{blatt}: {quelle.size[0]} x {quelle.size[1]} statt {BREITE} x {BLATT_HOEHE}.')
        bild.paste(quelle.convert('RGB'), (0, RAND))
    bild.save(ziel)


def baue_story(post_name):
    """Story (Playbook): das Titelblatt verkleinert auf dem dunklen CAD-Grund, darunter der Hinweis auf den neuen Beitrag.

    Oben und unten bleibt frei, wo Instagram in Stories Kopfzeile und Antwortfeld zeigt.
    """
    from PIL import ImageFont

    ordner = ROOT / 'out' / post_name
    bild = Image.new('RGB', (BREITE, HOEHE), GRUND)
    stift = ImageDraw.Draw(bild)
    raster(stift, 0, 0, BREITE, HOEHE)
    with Image.open(ordner / '01.jpg') as blatt:
        klein = blatt.convert('RGB').resize((936, 1170), Image.LANCZOS)
    links, oben = (BREITE - 936) // 2, 270
    bild.paste(klein, (links, oben))
    stift.rectangle([links, oben, links + 935, oben + 1169], outline=(64, 92, 122), width=2)
    schrift = ImageFont.truetype(str(ROOT / 'render' / 'fonts' / 'barlow-condensed-700.woff2'), 58)
    text = 'NEUES BAUWERK · JETZT IM PROFIL'
    stift.text(((BREITE - stift.textlength(text, font=schrift)) / 2, oben + 1170 + 28), text, font=schrift, fill=(255, 201, 77))
    bild.save(ordner / 'story.jpg', 'JPEG', quality=90)
    print(f'{post_name}: Story -> out/{post_name}/story.jpg')


def finde(programm):
    kandidat = os.environ.get(programm.upper()) or shutil.which(programm)
    return kandidat if kandidat and Path(kandidat).exists() else None


def pruefe_video(video, dauer):
    """Fragt ffprobe, ob das Video die Form hat, die Instagram verlangt. Ohne ffprobe keine Prüfung."""
    ffprobe = finde('ffprobe')
    if not ffprobe:
        return
    antwort = subprocess.run([ffprobe, '-v', 'error', '-show_entries', 'stream=codec_name,width,height:format=duration',
                              '-of', 'json', str(video)], capture_output=True, text=True, check=True)
    daten = json.loads(antwort.stdout)
    spuren = {s['codec_name']: s for s in daten['streams']}
    bild = spuren.get('h264')
    if not bild or (bild['width'], bild['height']) != (BREITE, HOEHE):
        sys.exit(f'{video.name}: keine H.264-Bildspur in {BREITE} x {HOEHE}.')
    if 'aac' not in spuren:
        sys.exit(f'{video.name}: keine Tonspur. Ein Reel ohne Musik wird nicht gespeichert.')
    laenge = float(daten['format']['duration'])
    if abs(laenge - dauer) > 0.5:
        sys.exit(f'{video.name}: {laenge:.1f} s statt {dauer:.1f} s.')


# ---------- Kurzes Reel aus vier eigenen Bildern (Posts mit dem Feld "reel") ----------

KURZ_ZEITEN = (3.8, 4.6, 5.0, 3.8)         # Sekunden je Bild: Frage, Zeichnung, Antwort, Schluss
KURZ_BLENDE = 0.4                          # Überblendung; zusammen 17,2 - 3 x 0,4 = 16,0 Sekunden
ZOOM = 0.04                                # jedes Bild fährt langsam um 4 % heran oder heraus
ZOOM_MITTE = (510, 886)                    # Mitte des sicheren Bereichs in render/reel.html; um sie wird gezoomt
REEL_BILDER = ('1', '2', '3', '4', '4m')   # 4 = Schluss neutral, 4m = Schluss mit „Morgen:“ und Platz für den Namen
MORGEN_FELD = (88, 1065, 932, 1330)        # dieser Platz im Bild 4m (links, oben, rechts, unten), siehe render/reel.html
MIN_SCHRIFT_REEL = 44
KENNUNG = 'bauriss-reel-1'                 # steht mit dem Fingerabdruck der Bilder im Video: daran erkennt --fehlende veraltete Videos


def bild_pfad(post_name, nr):
    return ROOT / 'out' / post_name / f'reel-{nr}.jpg'


def bilder_aktuell(post_name):
    """Liegen die Bilder des kurzen Reels vor, und stammen sie aus dem letzten Stand von Post und Zeichnung?"""
    import render
    messung = ROOT / 'out' / post_name / 'mess.json'
    if not messung.exists() or not all(bild_pfad(post_name, nr).exists() for nr in REEL_BILDER):
        return False
    return publish.lies(messung).get('reel', {}).get('stand') == render.stand(post_name)


def rendere_bilder(post_name):
    """Rendert die Bilder des kurzen Reels über Chrome nach out/<post>/reel-*.jpg und misst sie nach (mess.json, Teil "reel")."""
    import render
    chrome = render.finde_chrome()
    server = render.starte_server()
    basis = f'http://127.0.0.1:{server.server_address[1]}/render'
    profil = tempfile.mkdtemp(prefix='bauriss-reel-')
    seite = f'{basis}/reel.html?post={post_name}&konto={publish.lies(ROOT / "config.json")["konto"]}'
    try:
        for nr in REEL_BILDER:
            roh = Path(profil) / f'reel-{nr}.png'
            render.aufnahme(chrome, profil, f'{seite}&bild={nr}', roh, BREITE, HOEHE)
            with Image.open(roh) as bild:
                bild.convert('RGB').save(bild_pfad(post_name, nr), 'JPEG', quality=90, optimize=True)
        messung = render.lies_messung(chrome, profil, f'{seite}&bild=alle&mess=1', 5800, 2000)
    finally:
        server.shutdown()
        shutil.rmtree(profil, ignore_errors=True)
    render.schreibe_messung(post_name, 'reel', {'bilder': messung['bilder']})
    for b in messung['bilder']:
        klein = b['kleinste'] or {'px': 0}
        zeile = f'  Reel-Bild {b["bild"]:2}  {b["woerter"]:2d} Wörter  kleinste Schrift {klein["px"]:g} px'
        hinweise = (['ÜBERLAUF'] if b['ueberlauf'] else []) + (['TEXT IN DER ZEICHNUNG'] if b['in_zeichnung'] else [])
        hinweise += [f'AUSSEN: {t}' for t in b['aussen']] + [f'ZU KLEIN: {t}' for t in b['zu_klein']]
        print(zeile + ''.join(' | ' + h for h in hinweise))


def umbrich(stift, text, schrift, breite):
    """Bricht einen Namen an Leerzeichen und nach Bindestrichen um. Liefert None, wenn ein Wort nicht in die Breite passt."""
    teile = []                                   # (Stück, Abstand davor); ein Bindestrich bleibt am Stück davor
    for wort in text.split():
        for i, stueck in enumerate(re.findall('[^-]+-?|-', wort)):
            teile.append((stueck, ' ' if i == 0 and teile else ''))
    zeilen, zeile = [], ''
    for stueck, davor in teile:
        if stift.textlength(stueck, font=schrift) > breite:
            return None
        if zeile and stift.textlength(zeile + davor + stueck, font=schrift) > breite:
            zeilen.append(zeile)
            zeile = stueck
        else:
            zeile += (davor if zeile else '') + stueck
    return zeilen + ([zeile] if zeile else [])


def schlussbild(post_name, morgen_titel=''):
    """Das Schlussbild als PIL-Bild: neutral oder mit „Morgen: <Name>“. Den Namen setzt dieses Skript ein,
    weil er erst feststeht, wenn der nächste Post im Plan steht (Schrift und Farbe wie in render/reel.html)."""
    from PIL import ImageFont

    if not morgen_titel:
        with Image.open(bild_pfad(post_name, '4')) as quelle:
            return quelle.convert('RGB')
    with Image.open(bild_pfad(post_name, '4m')) as quelle:
        bild = quelle.convert('RGB')
    stift = ImageDraw.Draw(bild)
    links, oben, rechts, unten = MORGEN_FELD
    datei = str(ROOT / 'render' / 'fonts' / 'barlow-condensed-700.woff2')
    for groesse in range(150, MIN_SCHRIFT_REEL + 14, -4):
        schrift = ImageFont.truetype(datei, groesse)
        zeilen = umbrich(stift, morgen_titel.upper(), schrift, rechts - links)
        if zeilen and len(zeilen) <= 2 and len(zeilen) * round(groesse * 0.96) <= unten - oben:
            break
    else:
        sys.exit(f'{post_name}: Der Name „{morgen_titel}“ passt nicht ins Schlussbild.')
    for nr, zeile in enumerate(zeilen):
        stift.text((links, oben + nr * round(groesse * 0.96)), zeile, font=schrift, fill=(234, 241, 248))
    return bild


def baue_uebersicht(post_name, morgen_titel=''):
    """Storyboard zum Ansehen: die vier Bilder nebeneinander, verkleinert (out/<post>/reel-uebersicht.jpg)."""
    b, h, rand = 405, 720, 15
    blatt = Image.new('RGB', (4 * b + 5 * rand, h + 2 * rand), (42, 42, 42))
    for nr in range(4):
        if nr < 3:
            with Image.open(bild_pfad(post_name, str(nr + 1))) as quelle:
                teil = quelle.convert('RGB')
        else:
            teil = schlussbild(post_name, morgen_titel)
        blatt.paste(teil.resize((b, h), Image.LANCZOS), (rand + nr * (b + rand), rand))
    blatt.save(ROOT / 'out' / post_name / 'reel-uebersicht.jpg', 'JPEG', quality=85, optimize=True)


def fingerabdruck(post_name, morgen_titel=''):
    """Ändert sich, sobald sich ein Bild oder der Name hinter „Morgen:“ ändert."""
    h = hashlib.sha256(KENNUNG.encode('utf-8'))
    for nr in ('1', '2', '3', '4m' if morgen_titel else '4'):
        h.update(bild_pfad(post_name, nr).read_bytes())
    h.update(morgen_titel.encode('utf-8'))
    return h.hexdigest()[:12]


def lies_kennung(quelle):
    """Liest den Fingerabdruck aus einem Video: aus einer Datei oder aus dem Anfang einer Adresse. None, wenn keiner da ist."""
    try:
        if isinstance(quelle, Path):
            daten = quelle.read_bytes()
        else:
            # Der Vermerk steht im Kopf des Videos (-movflags +faststart), also genügt der Anfang
            anfrage = urllib.request.Request(quelle, headers={'Range': 'bytes=0-399999'})
            with urllib.request.urlopen(anfrage, timeout=60) as antwort:
                daten = antwort.read(400_000)
    except (urllib.error.URLError, OSError):
        return None
    treffer = re.search(KENNUNG.encode('utf-8') + b' ([0-9a-f]{12})', daten)
    return treffer.group(1).decode('ascii') if treffer else None


def kurz_dauer():
    return round(sum(KURZ_ZEITEN) - KURZ_BLENDE * (len(KURZ_ZEITEN) - 1), 2)


def kurz_befehl(ffmpeg, bilder, ton, video, kennung):
    """Der ffmpeg-Aufruf für das kurze Reel: vier Standbilder mit langsamem Zoom, überblendet, dazu die Musik.

    Jedes Bild wird erst auf die doppelte Größe gebracht, damit der Zoom nicht ruckelt, und fährt dann um ZOOM
    heran (Bilder 1 und 3) oder heraus (Bilder 2 und 4). Gezoomt wird um die Mitte des sicheren Bereichs, damit
    kein Text in die Bedienbereiche von Instagram wandert; die Reserve dafür steckt im sicheren Bereich von reel.html.
    """
    befehl = [ffmpeg, '-y', '-loglevel', 'error']
    for bild in bilder:
        befehl += ['-i', str(bild)]
    befehl += ['-i', str(ton)]
    cx, cy = ZOOM_MITTE[0] * 2, ZOOM_MITTE[1] * 2
    kette = []
    for nr, zeit in enumerate(KURZ_ZEITEN):
        n = round(zeit * BILDER_JE_SEKUNDE)
        zoom = f'1+{ZOOM}*on/{n - 1}' if nr % 2 == 0 else f'{1 + ZOOM}-{ZOOM}*on/{n - 1}'
        kette.append(f'[{nr}:v]scale={BREITE * 2}:{HOEHE * 2}:flags=lanczos,format=yuv420p,'
                     f"zoompan=z='{zoom}':x='{cx}*(1-1/zoom)':y='{cy}*(1-1/zoom)':d={n}:s={BREITE}x{HOEHE}:fps={BILDER_JE_SEKUNDE},"
                     f'setsar=1[b{nr}]')
    vorher, beginn = '[b0]', 0.0
    for nr in range(1, len(KURZ_ZEITEN)):
        beginn += KURZ_ZEITEN[nr - 1] - KURZ_BLENDE
        kette.append(f'{vorher}[b{nr}]xfade=transition=fade:duration={KURZ_BLENDE}:offset={beginn:.2f}[v{nr}]')
        vorher = f'[v{nr}]'
    kette.append(f'{vorher}format=yuv420p[bild]')
    befehl += ['-filter_complex', ';'.join(kette), '-map', '[bild]', '-map', f'{len(bilder)}:a',
               '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-r', str(BILDER_JE_SEKUNDE), '-g', '60',
               '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-t', f'{kurz_dauer():.2f}',
               '-metadata', f'comment={KENNUNG} {kennung}', '-movflags', '+faststart', str(video)]
    return befehl


def fassungen(post_name, plan):
    """Die Videos, die es zu einem Post mit kurzem Reel gibt: [(Name der Datei ohne .mp4, Name hinter „Morgen:“ oder '')]."""
    liste = [(post_name, '')]
    folgt = publish.naechster_post(plan, post_name)
    if folgt and (ROOT / 'posts' / f'{folgt}.json').exists():
        liste.append((publish.video_name(post_name, folgt), publish.lies(ROOT / 'posts' / f'{folgt}.json')['titel']))
    return liste


def rendere_kurz(post_name, ffmpeg, plan, neu=False, nur=None, zeige=False):
    """Kurzes Reel: Bilder (über Chrome, wenn sie fehlen oder veraltet sind), Story, Storyboard und mit ffmpeg die Videos.

    nur: Namen der Videos, die gebaut werden sollen (None = alle Fassungen)."""
    if neu or not bilder_aktuell(post_name):
        rendere_bilder(post_name)
    baue_story(post_name)
    liste = fassungen(post_name, plan)
    morgen = liste[-1][1]
    baue_uebersicht(post_name, morgen)
    dauer = kurz_dauer()
    print(f'{post_name}: kurzes Reel, 4 Bilder, {dauer:.1f} s (' + ', '.join(f'{z:g}' for z in KURZ_ZEITEN) + '), '
          + (f'Schluss mit „Morgen: {morgen}“' if morgen else 'Schluss ohne „Morgen“ (am Folgetag steht noch kein Post im Plan)'))
    if not ffmpeg and not zeige:
        print(f'{post_name}: kein ffmpeg gefunden, das Video rendert der Workflow "Reel rendern" auf GitHub.')
        return

    arbeit = Path(tempfile.mkdtemp(prefix='bauriss-reel-'))
    try:
        ton = arbeit / 'musik.wav'
        for datei, titel in liste:
            if nur is not None and datei not in nur:
                continue
            bilder = []
            for nr in range(4):
                bild = arbeit / f'{datei}-{nr + 1}.png'
                if nr < 3:
                    with Image.open(bild_pfad(post_name, str(nr + 1))) as quelle:
                        quelle.convert('RGB').save(bild)
                else:
                    schlussbild(post_name, titel).save(bild)
                bilder.append(bild)
            kennung = fingerabdruck(post_name, titel)
            ABLAGE.mkdir(exist_ok=True)
            video = ABLAGE / f'{datei}.mp4'
            befehl = kurz_befehl(ffmpeg or 'ffmpeg', bilder, ton, video, kennung)
            if zeige or not ffmpeg:
                print(' '.join(f'"{teil}"' if any(z in teil for z in ' ;[]\'=') else teil for teil in befehl))
                continue
            if not ton.exists():
                musik.schreibe(ton, dauer)
            subprocess.run(befehl, check=True)
            pruefe_video(video, dauer)
            if lies_kennung(video) != kennung:
                sys.exit(f'{video.name}: Der Vermerk „{KENNUNG}“ fehlt im Video. Ohne ihn würde das Video bei jedem Lauf neu gebaut.')
            print(f'{post_name}: {video.stat().st_size / 1e6:.1f} MB -> reels/{video.name}')
    finally:
        shutil.rmtree(arbeit, ignore_errors=True)


def faellige(plan, config, heute):
    """Für --fehlende: {Post: None (Blätterschau fehlt) oder Menge der Videos des kurzen Reels, die fehlen oder veraltet sind}."""
    faellig = {}
    for eintrag in plan['posts']:
        name = eintrag['post']
        if eintrag['datum'] < heute:
            continue
        if 'reel' not in publish.lies(ROOT / 'posts' / f'{name}.json'):
            if not publish.finde_video(name, config)[0]:
                faellig[name] = None
            continue
        if not all(bild_pfad(name, nr).exists() for nr in REEL_BILDER):
            faellig[name] = None        # Bilder fehlen im Repository: alles neu bauen (braucht Chrome)
            continue
        offen = {datei for datei, titel in fassungen(name, plan)
                 if lies_kennung(publish.ablage_adresse(config, datei)) != fingerabdruck(name, titel)}
        if offen:
            faellig[name] = offen
    return faellig


def rendere(post_name, ffmpeg, plan=None, neu=False, nur=None, zeige=False):
    post = publish.lies(ROOT / 'posts' / f'{post_name}.json')
    if 'reel' in post:
        rendere_kurz(post_name, ffmpeg, plan or publish.lies(publish.PLAN), neu, nur, zeige)
        return
    ordner = ROOT / 'out' / post_name
    blaetter = [ordner / f'{nr:02d}.jpg' for nr in range(1, len(post['slides']) + 1)]
    for blatt in blaetter:
        if not blatt.exists():
            sys.exit(f'Bild fehlt: {blatt.relative_to(ROOT)}. Erst tools/render.py {post_name} ausführen.')
    zeiten = standzeiten(post)
    dauer = round(sum(zeiten) - BLENDE * (len(zeiten) - 1), 2)
    print(f'{post_name}: {len(zeiten)} Blätter, {dauer:.1f} s (' + ', '.join(f'{z:g}' for z in zeiten) + ')')
    baue_story(post_name)
    if not ffmpeg:
        print(f'{post_name}: kein ffmpeg gefunden, das Video rendert der Workflow "Reel rendern" auf GitHub.')
        return

    arbeit = Path(tempfile.mkdtemp(prefix='bauriss-reel-'))
    try:
        befehl = [ffmpeg, '-y', '-loglevel', 'error']
        for nr, (blatt, zeit) in enumerate(zip(blaetter, zeiten)):
            bild = arbeit / f'{nr:02d}.png'
            baue_bild(blatt, bild)
            befehl += ['-loop', '1', '-framerate', str(BILDER_JE_SEKUNDE), '-t', f'{zeit:.2f}', '-i', str(bild)]
        ton = arbeit / 'musik.wav'
        musik.schreibe(ton, dauer)
        befehl += ['-i', str(ton)]

        # Kette von Überblendungen: Blatt n beginnt, wenn die Blätter davor abgelaufen sind, abzüglich der Blenden
        kette, vorher, beginn = [], '[0:v]', 0.0
        for nr in range(1, len(zeiten)):
            beginn += zeiten[nr - 1] - BLENDE
            kette.append(f'{vorher}[{nr}:v]xfade=transition=fade:duration={BLENDE}:offset={beginn:.2f}[v{nr}]')
            vorher = f'[v{nr}]'
        kette.append(f'{vorher}format=yuv420p[bild]')
        ABLAGE.mkdir(exist_ok=True)
        video = ABLAGE / f'{post_name}.mp4'
        befehl += ['-filter_complex', ';'.join(kette), '-map', '[bild]', '-map', f'{len(zeiten)}:a',
                   # Stehende Bilder: wenige Schlüsselbilder halten die Datei klein (rund 2 MB statt 7 MB je Video)
                   '-c:v', 'libx264', '-preset', 'slow', '-tune', 'stillimage', '-crf', '23', '-r', str(BILDER_JE_SEKUNDE), '-g', '300',
                   '-c:a', 'aac', '-b:a', '112k', '-ar', '48000', '-t', f'{dauer:.2f}', '-movflags', '+faststart', str(video)]
        subprocess.run(befehl, check=True)
        pruefe_video(video, dauer)
        print(f'{post_name}: {video.stat().st_size / 1e6:.1f} MB -> reels/{post_name}.mp4')
    finally:
        shutil.rmtree(arbeit, ignore_errors=True)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('posts', nargs='*')
    parser.add_argument('--fehlende', action='store_true', help='alle geplanten Posts ab heute, deren Video fehlt oder veraltet ist')
    parser.add_argument('--neu', action='store_true', help='Bilder des kurzen Reels neu rendern, auch wenn sie aktuell sind')
    parser.add_argument('--befehl', action='store_true', help='den ffmpeg-Aufruf des kurzen Reels zeigen, ohne ihn auszuführen')
    args = parser.parse_args()
    plan = publish.lies(publish.PLAN)
    auftraege = {post: None for post in args.posts}
    if args.fehlende:
        heute = publish.berlin_jetzt().date().isoformat()
        for post, nur in faellige(plan, publish.lies(ROOT / 'config.json'), heute).items():
            auftraege.setdefault(post, nur)
    if not auftraege:
        print('Kein Reel zu rendern.')
        return
    ffmpeg = finde('ffmpeg')
    for post, nur in auftraege.items():
        rendere(post, ffmpeg, plan, args.neu, nur, args.befehl)


if __name__ == '__main__':
    main()
