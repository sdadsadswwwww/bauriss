"""Rendert die Blätter eines Posts als JPEG (1080 x 1350) nach out/<post>/.

Aufruf:  python tools/render.py                    alle Posts
         python tools/render.py 001-koelner-dom    einzelner Post

Instagram nimmt über die Schnittstelle nur JPEG an, deshalb die Umwandlung am Ende.
"""
import functools
import http.server
import json
import math
import os
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


def main():
    posts = sys.argv[1:] or sorted(p.stem for p in (ROOT / 'posts').glob('*.json'))
    chrome = finde_chrome()
    server = starte_server()
    basis = f'http://127.0.0.1:{server.server_address[1]}/render'
    profil = tempfile.mkdtemp(prefix='schaubild-render-')
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
        aufnahme(chrome, profil, f'{basis}/avatar.html', ROOT / 'out' / 'profilbild.png', 1080, 1080)
    finally:
        server.shutdown()
        shutil.rmtree(profil, ignore_errors=True)


if __name__ == '__main__':
    main()
