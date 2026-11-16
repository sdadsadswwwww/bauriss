"""Baut zu einem Post ein Reel mit Musik: die Blätter nacheinander als Video (1080 x 1920), dazu das Klangbett.

Aufruf:  python tools/reel.py 010-schloss-neuschwanstein   ein Post
         python tools/reel.py --fehlende                    alle geplanten Posts ab heute, denen das Video fehlt

Instagram nimmt über die Schnittstelle Musik nur zusammen mit einem Video an, nicht zu Bildern.
Deshalb entsteht aus den fertigen Blättern (out/<post>/NN.jpg) ein Video reels/<post>.mp4, das der
Workflow in die Ablage auf GitHub hochlädt (Release "medien", nicht im Repository, damit es klein bleibt):
jedes Blatt steht so lange, wie man zum Lesen braucht, dazwischen eine kurze Überblendung.
Die Musik berechnet tools/musik.py passend zur Länge des Videos.

Das Video braucht ffmpeg (Umgebungsvariable FFMPEG oder im Suchpfad). Auf GitHub erledigt das der
Workflow "Reel rendern" nach jedem Übertragen eines Posts; ohne ffmpeg zeigt das Skript nur den Ablauf.
"""
import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import musik  # noqa: E402
import publish  # noqa: E402

ROOT = publish.ROOT
ABLAGE = ROOT / 'reels'                    # fertige Videos; der Workflow lädt sie in die Ablage auf GitHub hoch
BREITE, HOEHE, BLATT_HOEHE = 1080, 1920, 1350
RAND = (HOEHE - BLATT_HOEHE) // 2          # blauer Streifen über und unter dem Blatt
BILDER_JE_SEKUNDE = 30
BLENDE = 0.5                               # Sekunden Überblendung zwischen zwei Blättern
GRUND, NETZ, NETZ_STARK = (18, 64, 111), (29, 73, 118), (40, 82, 125)   # Farben wie in render/style.css


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


def baue_bild(blatt, ziel):
    """Setzt ein Blatt (1080 x 1350) mittig auf den hohen Grund und führt das Zeichenraster in den Streifen fort."""
    bild = Image.new('RGB', (BREITE, HOEHE), GRUND)
    stift = ImageDraw.Draw(bild)
    for oben, unten in ((0, RAND), (RAND + BLATT_HOEHE, HOEHE)):
        for x in range(0, BREITE, 30):
            stift.line([(x, oben), (x, unten - 1)], fill=NETZ_STARK if x % 150 == 0 else NETZ, width=2 if x % 150 == 0 else 1)
        for y in range(oben, unten):
            if (y - RAND) % 30 == 0:
                stark = (y - RAND) % 150 == 0
                stift.line([(0, y), (BREITE - 1, y)], fill=NETZ_STARK if stark else NETZ, width=2 if stark else 1)
    with Image.open(blatt) as quelle:
        if quelle.size != (BREITE, BLATT_HOEHE):
            sys.exit(f'{blatt}: {quelle.size[0]} x {quelle.size[1]} statt {BREITE} x {BLATT_HOEHE}.')
        bild.paste(quelle.convert('RGB'), (0, RAND))
    bild.save(ziel)


def baue_story(post_name):
    """Story (Playbook): das Titelblatt verkleinert auf dem blauen Grund, darunter der Hinweis auf den neuen Beitrag.

    Oben und unten bleibt frei, wo Instagram in Stories Kopfzeile und Antwortfeld zeigt.
    """
    from PIL import ImageFont

    ordner = ROOT / 'out' / post_name
    bild = Image.new('RGB', (BREITE, HOEHE), GRUND)
    stift = ImageDraw.Draw(bild)
    for x in range(0, BREITE, 30):
        stift.line([(x, 0), (x, HOEHE - 1)], fill=NETZ_STARK if x % 150 == 0 else NETZ, width=2 if x % 150 == 0 else 1)
    for y in range(0, HOEHE, 30):
        stift.line([(0, y), (BREITE - 1, y)], fill=NETZ_STARK if y % 150 == 0 else NETZ, width=2 if y % 150 == 0 else 1)
    with Image.open(ordner / '01.jpg') as blatt:
        klein = blatt.convert('RGB').resize((936, 1170), Image.LANCZOS)
    links, oben = (BREITE - 936) // 2, 270
    bild.paste(klein, (links, oben))
    stift.rectangle([links, oben, links + 935, oben + 1169], outline=(237, 243, 251), width=2)
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


def rendere(post_name, ffmpeg):
    post = publish.lies(ROOT / 'posts' / f'{post_name}.json')
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
    parser.add_argument('--fehlende', action='store_true', help='alle geplanten Posts ab heute ohne out/<post>/reel.mp4')
    args = parser.parse_args()
    posts = list(args.posts)
    if args.fehlende:
        heute = publish.berlin_jetzt().date().isoformat()
        plan = publish.lies(publish.PLAN)
        config = publish.lies(ROOT / 'config.json')
        posts += [e['post'] for e in plan['posts']
                  if e['datum'] >= heute and e['post'] not in posts and not publish.finde_video(e['post'], config)[0]]
    if not posts:
        print('Kein Reel zu rendern.')
        return
    ffmpeg = finde('ffmpeg')
    for post in posts:
        rendere(post, ffmpeg)


if __name__ == '__main__':
    main()
