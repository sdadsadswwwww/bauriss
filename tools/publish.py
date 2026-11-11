"""Veröffentlicht den heute fälligen, freigegebenen Post als Carousel auf Instagram.

Aufruf:  python tools/publish.py               regulärer Lauf aus dem Zeitplan
         python tools/publish.py --probelauf   prüft alles, ruft die Schnittstelle aber nicht auf
         python tools/publish.py --zugang      prüft nur, ob das Token das Konto freigibt

Umgebung:
  IG_ACCESS_TOKEN   Systemnutzer-Zugriffstoken aus Metas App-Dashboard (GitHub-Secret)
  IMAGE_BASE_URL    öffentliche Adresse, unter der out/ erreichbar ist

Ein Post geht nur raus, wenn er in plan.json für heute eingetragen ist, "freigabe": true trägt
und noch nicht in veroeffentlicht.json steht.
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN = ROOT / 'plan.json'
PROTOKOLL = ROOT / 'veroeffentlicht.json'
HOST = 'https://graph.facebook.com'  # Instagram API mit Unified Login
WARTEN_SEKUNDEN = 5
WARTEN_VERSUCHE = 60


def lies(pfad):
    return json.loads(Path(pfad).read_text(encoding='utf-8'))


def letzter_sonntag(jahr, monat):
    tag = dt.date(jahr, monat, 31)
    return tag - dt.timedelta(days=(tag.weekday() + 1) % 7)


def berlin_jetzt():
    # Sommerzeit nach EU-Regel: letzter Sonntag im März bis letzter Sonntag im Oktober, Umstellung um 01:00 UTC
    utc = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    beginn = dt.datetime.combine(letzter_sonntag(utc.year, 3), dt.time(1))
    ende = dt.datetime.combine(letzter_sonntag(utc.year, 10), dt.time(1))
    return utc + dt.timedelta(hours=2 if beginn <= utc < ende else 1)


def anfrage(methode, url, token=None, daten=None):
    kopf = {'Authorization': f'Bearer {token}'} if token else {}
    rumpf = urllib.parse.urlencode(daten).encode() if daten else None
    req = urllib.request.Request(url, data=rumpf, method=methode, headers=kopf)
    try:
        with urllib.request.urlopen(req, timeout=60) as antwort:
            return json.loads(antwort.read().decode('utf-8'))
    except urllib.error.HTTPError as fehler:
        text = fehler.read().decode('utf-8', 'replace')
        try:
            text = json.loads(text)['error']['message']
        except (ValueError, KeyError, TypeError):
            pass
        sys.exit(f'Instagram meldet einen Fehler ({fehler.code}): {text}')


def baue_caption(post):
    teile = list(post['caption'])
    teile.append('Quellen: ' + ' · '.join(post['quellen']))
    teile.append(' '.join('#' + h for h in post['hashtags']))
    return '\n\n'.join(teile)


def pruefe_post(name, post, caption):
    """Prüft alles, was sich ohne Schnittstelle prüfen lässt. Gibt die Bilddateien zurück."""
    bilder = [ROOT / 'out' / name / f'{nr:02d}.jpg' for nr in range(1, len(post['slides']) + 1)]
    for bild in bilder:
        if not bild.exists():
            sys.exit(f'Bild fehlt: {bild.relative_to(ROOT)}. Erst tools/render.py ausführen.')
        if bild.read_bytes()[:2] != b'\xff\xd8':
            sys.exit(f'{bild.relative_to(ROOT)} ist kein JPEG.')
    if not 2 <= len(bilder) <= 20:
        sys.exit(f'Ein Carousel braucht 2 bis 20 Bilder, {name} hat {len(bilder)}.')
    if len(caption) > 2200:
        sys.exit(f'Text zu lang: {len(caption)} Zeichen, erlaubt sind 2200.')
    if len(post['hashtags']) > 30:
        sys.exit(f'Zu viele Hashtags: {len(post["hashtags"])}, erlaubt sind 30.')
    return bilder


def pruefe_bildadressen(adressen):
    for adresse in adressen:
        try:
            with urllib.request.urlopen(urllib.request.Request(adresse, method='HEAD'), timeout=30) as antwort:
                typ = antwort.headers.get('Content-Type', '')
        except (urllib.error.URLError, OSError) as fehler:
            sys.exit(f'Bild nicht öffentlich erreichbar: {adresse} ({fehler})')
        if not typ.startswith('image/jpeg'):
            sys.exit(f'Bild wird nicht als JPEG ausgeliefert: {adresse} ({typ or "ohne Typ"})')


def warte_bis_fertig(basis, container, token):
    for _ in range(WARTEN_VERSUCHE):
        status = anfrage('GET', f'{basis}/{container}?fields=status_code', token).get('status_code')
        if status == 'FINISHED':
            return
        if status in ('ERROR', 'EXPIRED'):
            sys.exit(f'Container {container} hat den Status {status}.')
        time.sleep(WARTEN_SEKUNDEN)
    sys.exit(f'Container {container} wurde nicht rechtzeitig fertig.')


def frage_still(url, token):
    """Wie anfrage('GET', ...), bricht bei einem Fehler aber nicht ab, sondern liefert {'fehler': ...}."""
    try:
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req, timeout=60) as antwort:
            return json.loads(antwort.read().decode('utf-8'))
    except urllib.error.HTTPError as fehler:
        try:
            return {'fehler': json.loads(fehler.read().decode('utf-8'))['error']['message']}
        except (ValueError, KeyError, TypeError):
            return {'fehler': f'HTTP {fehler.code}'}


def beschreibe_token(basis, token):
    """Gibt aus, was das Token ist und darf. Keine Namen von Personen: die Protokolle sind öffentlich."""
    def versuche(pfad):
        return frage_still(f'{basis}/{pfad}', token)

    info = versuche('debug_token?input_token=' + urllib.parse.quote(token)).get('data') or {}
    if info:
        ablauf = info.get('expires_at')
        print(f'Token-Art: {info.get("type")}, gültig: {info.get("is_valid")}, '
              f'Ablauf: {"nie" if ablauf == 0 else dt.datetime.fromtimestamp(ablauf, dt.timezone.utc).date() if ablauf else "unbekannt"}')
        print('Berechtigungen: ' + (', '.join(info.get('scopes', [])) or 'keine'))
        for g in info.get('granular_scopes', []):
            print(f'  {g.get("scope")}: {len(g.get("target_ids", []))} Ziel(e)')
    else:
        print('Token-Auskunft nicht verfügbar.')
    ich = versuche('me?fields=id,client_business_id')
    print('Kunden-Portfolio am Token: ' + ('ja' if ich.get('client_business_id') else 'nein') + (f' ({ich["fehler"]})' if 'fehler' in ich else ''))
    for kante in ('me/assigned_instagram_accounts?fields=username', 'me/instagram_accounts?fields=username', 'me/accounts?fields=instagram_business_account{username}'):
        antwort = versuche(kante)
        name = kante.split('?')[0]
        if 'fehler' in antwort:
            print(f'{name}: {antwort["fehler"]}')
        else:
            print(f'{name}: {len(antwort.get("data", []))} Eintrag/Einträge')


def finde_konto(basis, token, config):
    konto = config['konto']
    # Mit Unified Login steht /me für den Systemnutzer; die freigegebenen Instagram-Konten hängen darunter.
    konten = anfrage('GET', f'{basis}/me/assigned_instagram_accounts?fields=id,username', token).get('data', [])
    konto_id = next((k['id'] for k in konten if k.get('username') == konto), None)
    if not konto_id and config.get('konto_id'):
        # Die Liste kann leer bleiben, obwohl die App Zugriff hat. Dann das Konto direkt über seine ID ansprechen.
        direkt = frage_still(f'{basis}/{config["konto_id"]}?fields=username', token)
        if direkt.get('username') == konto:
            konto_id = config['konto_id']
        else:
            print(f'Direkter Zugriff auf Konto-ID {config["konto_id"]}: {direkt.get("fehler") or "anderes Konto"}')
    if not konto_id:
        namen = ', '.join('@' + k.get('username', '?') for k in konten) or 'keines'
        sys.exit(f'Das Token gibt @{konto} nicht frei (freigegeben: {namen}).')
    return konto_id


def waehle_eintrag(plan, erledigt, heute, wunsch):
    if wunsch:
        treffer = [e for e in plan['posts'] if e['post'] == wunsch]
        if not treffer:
            sys.exit(f'{wunsch} steht nicht in plan.json.')
    else:
        treffer = [e for e in plan['posts'] if e['datum'] == heute]
    ueberfaellig = [e['post'] for e in plan['posts'] if e['datum'] < heute and e['post'] not in erledigt]
    if ueberfaellig:
        print('Überfällig und nicht veröffentlicht: ' + ', '.join(ueberfaellig))
    offen = [e for e in treffer if e['post'] not in erledigt]
    if not treffer:
        print(f'Für {heute} ist kein Post geplant.')
    elif not offen:
        print('Der fällige Post ist bereits veröffentlicht.')
    return offen[0] if offen else None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--probelauf', action='store_true', help='nur prüfen, nichts veröffentlichen')
    parser.add_argument('--post', help='diesen Post statt des heute fälligen nehmen')
    parser.add_argument('--zugang', action='store_true', help='nur prüfen, ob das Token das Konto freigibt')
    args = parser.parse_args(argv)

    config = lies(ROOT / 'config.json')
    if args.zugang:
        token = os.environ.get('IG_ACCESS_TOKEN')
        if not token:
            sys.exit('IG_ACCESS_TOKEN ist nicht gesetzt.')
        basis = f'{HOST}/{config["api_version"]}'
        beschreibe_token(basis, token)
        finde_konto(basis, token, config)
        print(f'Zugang in Ordnung: Das Token gibt @{config["konto"]} frei.')
        return
    plan = lies(PLAN)
    protokoll = lies(PROTOKOLL)
    jetzt = berlin_jetzt()
    heute = jetzt.date().isoformat()

    eintrag = waehle_eintrag(plan, {e['post'] for e in protokoll}, heute, args.post)
    if not eintrag:
        return
    name = eintrag['post']
    post = lies(ROOT / 'posts' / f'{name}.json')
    caption = baue_caption(post)
    bilder = pruefe_post(name, post, caption)
    print(f'Fällig: {name} mit {len(bilder)} Bildern, Text {len(caption)} Zeichen.')

    if not eintrag.get('freigabe'):
        print('Nicht freigegeben ("freigabe": false in plan.json). Nichts veröffentlicht.')
        return
    if not args.probelauf and jetzt.strftime('%H:%M') < plan['uhrzeit']:
        print(f'Es ist {jetzt:%H:%M} Uhr, geplant ist {plan["uhrzeit"]} Uhr. Der nächste Lauf übernimmt.')
        return

    bild_basis = os.environ.get('IMAGE_BASE_URL', '').rstrip('/')
    adressen = [f'{bild_basis}/out/{name}/{bild.name}' for bild in bilder]
    if args.probelauf:
        if bild_basis:
            pruefe_bildadressen(adressen)
            print('Alle Bilder sind öffentlich erreichbar.')
        print('Probelauf: alles in Ordnung, nichts veröffentlicht.')
        return

    token = os.environ.get('IG_ACCESS_TOKEN')
    if not token or not bild_basis:
        sys.exit('IG_ACCESS_TOKEN und IMAGE_BASE_URL müssen gesetzt sein.')
    pruefe_bildadressen(adressen)

    basis = f'{HOST}/{config["api_version"]}'
    konto_id = finde_konto(basis, token, config)

    # Schutz vor Doppelposts, falls ein früherer Lauf nach dem Veröffentlichen abgebrochen ist
    letzte = anfrage('GET', f'{basis}/{konto_id}/media?fields=caption,permalink&limit=10', token).get('data', [])
    schon_da = next((m for m in letzte if m.get('caption') == caption), None)
    if schon_da:
        print('Ein Beitrag mit identischem Text ist bereits online. Nur das Protokoll wird ergänzt.')
        medium, link = schon_da['id'], schon_da.get('permalink')
    else:
        kinder = []
        for adresse in adressen:
            kind = anfrage('POST', f'{basis}/{konto_id}/media', token, {'image_url': adresse, 'is_carousel_item': 'true'})['id']
            warte_bis_fertig(basis, kind, token)
            kinder.append(kind)
        carousel = anfrage('POST', f'{basis}/{konto_id}/media', token,
                           {'media_type': 'CAROUSEL', 'children': ','.join(kinder), 'caption': caption})['id']
        warte_bis_fertig(basis, carousel, token)
        medium = anfrage('POST', f'{basis}/{konto_id}/media_publish', token, {'creation_id': carousel})['id']
        link = anfrage('GET', f'{basis}/{medium}?fields=permalink', token).get('permalink')
        print(f'Veröffentlicht: {link}')

    protokoll.append({'post': name, 'datum': heute, 'zeit': jetzt.strftime('%H:%M'), 'media_id': medium, 'permalink': link})
    PROTOKOLL.write_text(json.dumps(protokoll, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
