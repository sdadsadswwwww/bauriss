"""Rendert zu einem Post ein Reel (1080 x 1920, 30 Bilder je Sekunde) nach out/<post>/.

Aufruf:  python tools/reel.py 001-geburten            Vorschau und, wenn ffmpeg da ist, das Video
         python tools/reel.py --fehlende              alle Posts aus plan.json, denen das Video noch fehlt
         python tools/reel.py --nur-vorschau <post>   nur out/<post>/reel-vorschau.jpg (vier Standbilder)

Die Seite render/reel.html läuft nicht von selbst ab: Dieses Skript stellt über die Fernsteuerung
von Chrome für jedes Bild die Zeit ein und nimmt es auf. Das Video entsteht nur, wenn ffmpeg
gefunden wird (Umgebungsvariable FFMPEG oder im Suchpfad); auf GitHub erledigt das der Workflow
"Schaubild Reel rendern". Die Vorschau braucht kein ffmpeg.
Jedes Video bekommt Musik aus tools/musik.py (Stimmung über das Feld reel.stimmung im Post).
"""
import argparse
import base64
import io
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render import CONFIG, ROOT, finde_chrome, starte_server  # noqa: E402
import musik  # noqa: E402

BREITE, HOEHE, BILDER_JE_SEKUNDE = 1080, 1920, 30
VORSCHAU_ZEITEN = (0.0, 4.0, 7.8, 10.5)


class Fernsteuerung:
    """Kleinster WebSocket-Client für das DevTools-Protokoll von Chrome, nur mit der Standardbibliothek."""

    def __init__(self, adresse):
        rest = adresse[len('ws://'):]
        host_port, _, pfad = rest.partition('/')
        host, _, port = host_port.partition(':')
        self.sock = socket.create_connection((host, int(port)), timeout=120)
        schluessel = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f'GET /{pfad} HTTP/1.1\r\nHost: {host_port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
                           f'Sec-WebSocket-Key: {schluessel}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        self.puffer = b''
        kopf = b''
        while b'\r\n\r\n' not in kopf:
            kopf += self._lies_roh(1)
        if b' 101 ' not in kopf.split(b'\r\n', 1)[0]:
            sys.exit('Chrome hat die Verbindung zur Fernsteuerung abgelehnt.')
        self.nr = 0

    def _lies_roh(self, anzahl):
        teile = []
        while anzahl:
            stueck = self.sock.recv(min(anzahl, 1 << 20))
            if not stueck:
                sys.exit('Chrome hat die Verbindung geschlossen.')
            teile.append(stueck)
            anzahl -= len(stueck)
        return b''.join(teile)

    def _sende(self, text):
        daten = text.encode('utf-8')
        maske = os.urandom(4)
        kopf = bytes([0x81])
        if len(daten) < 126:
            kopf += bytes([0x80 | len(daten)])
        elif len(daten) < 65536:
            kopf += bytes([0x80 | 126]) + struct.pack('>H', len(daten))
        else:
            kopf += bytes([0x80 | 127]) + struct.pack('>Q', len(daten))
        self.sock.sendall(kopf + maske + bytes(b ^ maske[i % 4] for i, b in enumerate(daten)))

    def _empfange(self):
        nachricht = b''
        while True:
            b1, b2 = self._lies_roh(2)
            laenge = b2 & 0x7F
            if laenge == 126:
                laenge = struct.unpack('>H', self._lies_roh(2))[0]
            elif laenge == 127:
                laenge = struct.unpack('>Q', self._lies_roh(8))[0]
            daten = self._lies_roh(laenge)
            art = b1 & 0x0F
            if art == 8:
                sys.exit('Chrome hat die Fernsteuerung beendet.')
            if art in (9, 10):   # Ping und Pong: nichts zu tun
                continue
            nachricht += daten
            if b1 & 0x80:
                return nachricht.decode('utf-8')

    def befehl(self, methode, **parameter):
        self.nr += 1
        self._sende(json.dumps({'id': self.nr, 'method': methode, 'params': parameter}))
        while True:
            antwort = json.loads(self._empfange())
            if antwort.get('id') == self.nr:
                if 'error' in antwort:
                    sys.exit(f'{methode}: {antwort["error"].get("message")}')
                return antwort.get('result', {})

    def werte(self, ausdruck):
        ergebnis = self.befehl('Runtime.evaluate', expression=ausdruck, returnByValue=True)
        if 'exceptionDetails' in ergebnis:
            sys.exit(f'Fehler in der Seite: {ergebnis["exceptionDetails"].get("text")}')
        return ergebnis.get('result', {}).get('value')


def starte_chrome(chrome, profil):
    prozess = subprocess.Popen(
        [chrome, '--headless=new', *(['--no-sandbox'] if os.environ.get('CI') else []), '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
         '--force-device-scale-factor=1', f'--user-data-dir={profil}', '--remote-debugging-port=0',
         f'--window-size={BREITE},{HOEHE}', 'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    hinweis = Path(profil) / 'DevToolsActivePort'
    for _ in range(150):
        if hinweis.exists() and hinweis.read_text().strip():
            break
        time.sleep(0.2)
    else:
        prozess.kill()
        sys.exit('Chrome hat die Fernsteuerung nicht geöffnet.')
    port = hinweis.read_text().split()[0]
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json', timeout=30) as antwort:
        seiten = [s for s in json.loads(antwort.read()) if s.get('type') == 'page']
    return prozess, Fernsteuerung(seiten[0]['webSocketDebuggerUrl'])


def finde_ffmpeg():
    kandidat = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    return kandidat if kandidat and Path(kandidat).exists() else None


def rendere(seite, basis, post, ffmpeg, nur_vorschau):
    ziel = ROOT / 'out' / post
    ziel.mkdir(parents=True, exist_ok=True)
    seite.befehl('Page.navigate', url=f'{basis}/reel.html?post={post}&konto={CONFIG["konto"]}')
    for _ in range(150):
        if seite.werte('window.bereit === true'):
            break
        time.sleep(0.2)
    else:
        sys.exit(f'{post}: Die Reel-Seite wurde nicht fertig (Fehler im Post?).')
    dauer = float(seite.werte('window.dauer'))

    def bild(t):
        seite.werte(f'window.zeige({t:.4f})')
        daten = seite.befehl('Page.captureScreenshot', format='png')['data']
        return base64.b64decode(daten)

    vorschau = Image.new('RGB', (len(VORSCHAU_ZEITEN) * 560 - 20, 960), (40, 40, 40))
    for i, t in enumerate(VORSCHAU_ZEITEN):
        einzel = Image.open(io.BytesIO(bild(t))).convert('RGB')
        if einzel.size != (BREITE, HOEHE):
            sys.exit(f'{post}: Aufnahme ist {einzel.size[0]} x {einzel.size[1]} statt {BREITE} x {HOEHE}.')
        vorschau.paste(einzel.resize((540, 960), Image.LANCZOS), (i * 560, 0))
    vorschau.save(ziel / 'reel-vorschau.jpg', 'JPEG', quality=88)
    print(f'{post}: Vorschau -> out/{post}/reel-vorschau.jpg')
    # Story (Playbook): das Schlussbild des Reels mit dem Hinweis auf den neuen Beitrag, erscheint nach dem Carousel
    seite.werte('document.getElementById("sheet").classList.add("story"); window.zeige(window.dauer)')
    Image.open(io.BytesIO(base64.b64decode(seite.befehl('Page.captureScreenshot', format='png')['data']))).convert('RGB')         .save(ziel / 'story.jpg', 'JPEG', quality=90)
    seite.werte('document.getElementById("sheet").classList.remove("story"); window.zeige(0)')
    print(f'{post}: Story -> out/{post}/story.jpg')
    if nur_vorschau:
        return
    if not ffmpeg:
        print(f'{post}: kein ffmpeg gefunden, das Video rendert der Workflow auf GitHub.')
        return

    video = ziel / 'reel.mp4'
    # Die Musik wird für jeden Post berechnet (tools/musik.py) und folgt dem Ablauf des Reels.
    ton = Path(tempfile.gettempdir()) / f'schaubild-musik-{post}.wav'
    musik.fuer_post(post, ton, dauer=dauer)
    kodierer = subprocess.Popen(
        [ffmpeg, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(BILDER_JE_SEKUNDE), '-c:v', 'png', '-i', '-',
         '-i', str(ton), '-ar', '48000', '-shortest',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(BILDER_JE_SEKUNDE),
         '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(video)],
        stdin=subprocess.PIPE)
    anzahl = round(dauer * BILDER_JE_SEKUNDE)
    for n in range(anzahl):
        kodierer.stdin.write(bild(n / BILDER_JE_SEKUNDE))
    kodierer.stdin.close()
    if kodierer.wait() != 0:
        sys.exit(f'{post}: ffmpeg ist mit einem Fehler beendet.')
    ton.unlink(missing_ok=True)
    print(f'{post}: {anzahl} Bilder mit Musik, {video.stat().st_size / 1e6:.1f} MB -> out/{post}/reel.mp4')


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('posts', nargs='*')
    parser.add_argument('--fehlende', action='store_true', help='alle geplanten Posts ohne out/<post>/reel.mp4')
    parser.add_argument('--nur-vorschau', action='store_true', help='nur die Standbilder, kein Video')
    args = parser.parse_args()
    posts = list(args.posts)
    if args.fehlende:
        plan = json.loads((ROOT / 'plan.json').read_text(encoding='utf-8'))
        erledigt = {e['post'] for e in json.loads((ROOT / 'veroeffentlicht.json').read_text(encoding='utf-8')) if e.get('art') == 'reel'}
        posts += [e['post'] for e in plan['posts']
                  if e['post'] not in erledigt and e['post'] not in posts and not (ROOT / 'out' / e['post'] / 'reel.mp4').exists()]
    if not posts:
        print('Kein Reel zu rendern.')
        return

    ffmpeg = finde_ffmpeg()
    server = starte_server()
    basis = f'http://127.0.0.1:{server.server_address[1]}/render'
    profil = tempfile.mkdtemp(prefix='schaubild-reel-')
    prozess, seite = starte_chrome(finde_chrome(), profil)
    try:
        seite.befehl('Emulation.setDeviceMetricsOverride', width=BREITE, height=HOEHE, deviceScaleFactor=1, mobile=False)
        for post in posts:
            rendere(seite, basis, post, ffmpeg, args.nur_vorschau)
    finally:
        prozess.kill()
        server.shutdown()
        time.sleep(0.5)
        shutil.rmtree(profil, ignore_errors=True)


if __name__ == '__main__':
    main()
