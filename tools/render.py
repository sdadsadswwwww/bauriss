"""Rendert die Blätter eines Posts als JPEG (1080 x 1350) nach out/<post>/.

Aufruf:  python tools/render.py                    alle Posts
         python tools/render.py 001-koelner-dom    einzelner Post

Instagram nimmt über die Schnittstelle nur JPEG an, deshalb die Umwandlung am Ende.

Posts der lesbaren Vorlage ("vorlage": "lesbar") werden nach dem Rendern nachgemessen: kleinste Schrift, Wörter,
Linienbreiten, Text außerhalb des Rahmens. Das Ergebnis steht in out/<post>/mess.json und auf dem Bildschirm;
tools/automatik.py pruefen wertet es aus.
"""
import functools
import hashlib
import html
import http.server
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))


def finde_chrome():
    kandidaten = [
        os.environ.get('CHROME'),
        shutil.which('google-chrome'),
        shutil.which('chromium'),
        shutil.which('chromium-browser'),
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]
    for k in kandidaten:
        if k and Path(k).exists():
            return k
    sys.exit('Kein Chrome oder Edge gefunden. Pfad über die Umgebungsvariable CHROME angeben.')


class LeiserHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def starte_server():
    # Die Seiten laden ihre Daten per fetch(); das geht nicht von file://, also kurz lokal ausliefern.
    handler = functools.partial(LeiserHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def aufnahme(chrome, profil, url, ziel, breite, hoehe):
    png = Path(profil) / 'aufnahme.png'
    png.unlink(missing_ok=True)
    subprocess.run(
        [
            chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
            '--force-device-scale-factor=1', f'--user-data-dir={profil}', f'--window-size={breite},{hoehe}',
            '--virtual-time-budget=10000', f'--screenshot={png}', url,
        ],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180,
    )
    bild = Image.open(png).convert('RGB')
    if bild.size != (breite, hoehe):
        sys.exit(f'{ziel.name}: Aufnahme ist {bild.size[0]} x {bild.size[1]} statt {breite} x {hoehe}.')
    ziel.parent.mkdir(parents=True, exist_ok=True)
    if ziel.suffix == '.jpg':
        # subsampling=0 hält die feinen Linien der Zeichnungen scharf
        bild.save(ziel, 'JPEG', quality=92, subsampling=0, optimize=True)
    else:
        bild.save(ziel)


def lies_messung(chrome, profil, url, breite=1080, hoehe=1350):
    """Öffnet eine Mess-Seite (render/mess.html, render/reel.html?mess=1) und liefert ihr Ergebnis aus <pre id="out">."""
    antwort = subprocess.run(
        [
            chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
            '--force-device-scale-factor=1', f'--user-data-dir={profil}', f'--window-size={breite},{hoehe}',
            '--virtual-time-budget=10000', '--dump-dom', url,
        ],
        check=True, capture_output=True, timeout=180,
    )
    treffer = re.search(r'<pre id="out">(.*?)</pre>', antwort.stdout.decode('utf-8', 'replace'), re.S)
    if not treffer or not treffer.group(1).strip():
        sys.exit(f'Die Messung liefert kein Ergebnis ({url}). Meist ein Fehler in der Zeichnungsdatei.')
    daten = json.loads(html.unescape(treffer.group(1)))
    if 'fehler' in daten:
        sys.exit(f'Die Messung meldet einen Fehler: {daten["fehler"]}')
    return daten


def stand(post_name):
    """Fingerabdruck von Post und Zeichnungsdatei. Daran erkennt die Prüfung Bilder, die nicht zum letzten Stand passen."""
    datei = ROOT / 'posts' / f'{post_name}.json'
    teile = [datei.read_text(encoding='utf-8')]
    zeichnungen = json.loads(teile[0]).get('zeichnungen')
    if zeichnungen and (ROOT / 'render' / 'zeichnungen' / f'{zeichnungen}.js').exists():
        teile.append((ROOT / 'render' / 'zeichnungen' / f'{zeichnungen}.js').read_text(encoding='utf-8'))
    # Zeilenenden angleichen, damit der Fingerabdruck unter Windows und Linux gleich ist
    return hashlib.sha256('\n'.join(t.replace('\r\n', '\n') for t in teile).encode('utf-8')).hexdigest()[:16]


def schreibe_messung(post_name, teil, inhalt):
    """Legt einen Teil der Messung ("blaetter" oder "reel") in out/<post>/mess.json ab; der andere Teil bleibt stehen."""
    ziel = ROOT / 'out' / post_name / 'mess.json'
    daten = json.loads(ziel.read_text(encoding='utf-8')) if ziel.exists() else {}
    daten[teil] = {'stand': stand(post_name), **inhalt}
    ziel.write_text(json.dumps(daten, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')


def messe_blaetter(chrome, profil, basis, post, konto):
    """Misst alle Blätter eines Posts der lesbaren Vorlage nach und schreibt out/<post>/mess.json."""
    roh = lies_messung(chrome, profil, f'{basis}/mess.html?post={post}&konto={konto}')
    blaetter = []
    for b in roh['slides']:
        blaetter.append({
            'nr': b['nr'], 'typ': b['typ'], 'woerter': b['woerter'], 'kleinste': b['kleinste'], 'linie': b['linie'],
            'massstab': b['zeichnung']['massstab'] if b['zeichnung'] else None,
            'beschriftungen': b['zeichnung']['beschriftungen'] if b['zeichnung'] else 0,
            'ueberlauf': b['ueberlauf'], 'aussen': b['aussen'], 'ueberlappt': b['ueberlappt'], 'schild_voll': b['schildVoll'],
            'zu_klein': [f'{t["t"][:30]} ({t["px"]:g} px)' for t in b['texte'] if t['px'] < 32][:8],
        })
    schreibe_messung(post, 'blaetter', {'liste': blaetter})
    for b in blaetter:
        w, k = b['woerter'], b['kleinste'] or {'px': 0, 'text': ''}
        zeile = f'  Blatt {b["nr"]:02d} {b["typ"]:10}  Lesetext {w["lesetext"]:2d} Wörter, Zeichnung {w["zeichnung"]:2d}  kleinste Schrift {k["px"]:g} px'
        if b['massstab']:
            zeile += f'  Maßstab {b["massstab"]:g}'
        if b['linie']:
            zeile += f'  dünnste Linie {b["linie"]["px"]:g} px'
        hinweise = (['ÜBERLAUF'] if b['ueberlauf'] else []) + [f'AUSSEN: {t}' for t in b['aussen']]
        hinweise += [f'ÜBERLAPPT: {x} / {y}' for x, y in b['ueberlappt']] + [f'ZU KLEIN: {t}' for t in b['zu_klein']]
        print(zeile + ''.join('\n      ' + h for h in hinweise))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    posts = sys.argv[1:] or sorted(p.stem for p in (ROOT / 'posts').glob('*.json'))
    chrome = finde_chrome()
    server = starte_server()
    basis = f'http://127.0.0.1:{server.server_address[1]}/render'
    profil = tempfile.mkdtemp(prefix='bauriss-render-')
    konto = CONFIG['konto']
    try:
        for post in posts:
            daten = json.loads((ROOT / 'posts' / f'{post}.json').read_text(encoding='utf-8'))
            anzahl = len(daten['slides'])
            ziel = ROOT / 'out' / post
            for nr in range(1, anzahl + 1):
                aufnahme(chrome, profil, f'{basis}/slide.html?post={post}&konto={konto}&slide={nr}',
                         ziel / f'{nr:02d}.jpg', 1080, 1350)
            zeilen = math.ceil(anzahl / 4)
            aufnahme(chrome, profil, f'{basis}/sheet.html?post={post}&n={anzahl}',
                     ziel / 'uebersicht.jpg', 2260, 60 + zeilen * 675 + (zeilen - 1) * 20)
            print(f'{post}: {anzahl} Blätter -> {ziel.relative_to(ROOT)}')
            if daten.get('vorlage') == 'lesbar':
                messe_blaetter(chrome, profil, basis, post, konto)
        aufnahme(chrome, profil, f'{basis}/avatar.html', ROOT / 'out' / 'profilbild.png', 1080, 1080)
    finally:
        server.shutdown()
        shutil.rmtree(profil, ignore_errors=True)


if __name__ == '__main__':
    main()
