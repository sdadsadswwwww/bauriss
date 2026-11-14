# Bauriss

Automatisierter Instagram-Kanal: ein Bauwerk pro Tag, erklärt in Zeichnungen. Jeder Post ist ein Carousel, das vollständig aus Code gerendert wird.

## Ablauf

Seit dem 13.11.2026 läuft der Kanal automatisch: Ein täglicher Lauf erstellt den Post für den Folgetag und plant ihn freigegeben ein. Die vollständige Arbeitsanweisung dafür steht in [AUTOMATIK.md](AUTOMATIK.md).

1. **Post schreiben:** eine JSON-Datei in `posts/` (Texte, Zahlen, Verweis auf die Zeichnungen), dazu die Zeichnungen in `render/zeichnungen/`.
2. **Rendern:** `python tools/render.py <post>` erzeugt die Blätter als JPEG in `out/<post>/` und eine `uebersicht.jpg` zum Durchsehen.
3. **Einplanen:** `python tools/automatik.py einplanen <post> <datum> --thema "<Name>"` prüft den Post und trägt ihn in `plan.json` ein.
4. **Veröffentlichen:** GitHub Actions ruft täglich (Mo–So) `tools/publish.py` auf, gegen 18:25 Uhr und zur Reserve gegen 19:10 und 22:15 Uhr. Das Skript postet den für heute freigegebenen Post und trägt ihn in `veroeffentlicht.json` ein.

Ein Eintrag mit `"freigabe": false` wird nicht veröffentlicht; so lässt sich ein einzelner Post zurückhalten. Ein Post, der in `veroeffentlicht.json` steht, wird nie ein zweites Mal gepostet.

## Musik

Instagram nimmt über die Schnittstelle Musik nur zusammen mit einem Video an. Deshalb baut der Workflow „Reel rendern" zu jedem Post ein Reel: die Blätter nacheinander im Hochformat, dazu ein Klangbett, das `tools/musik.py` vollständig aus Code berechnet (keine fremden Aufnahmen, keine Rechte Dritter). Die Videos liegen nicht im Repository, sondern als Dateien im Release „medien" (`<post>.mp4`); so wächst das Repository nicht. Einige Tage nach dem Erscheinen löscht der Workflow sie dort wieder.

Was erscheint, steht in `plan.json` unter `"reel"`:

| Wert | Wirkung |
|---|---|
| `"aus"` | nur das Carousel, ohne Musik |
| `"zusaetzlich"` | mittags das Reel mit Musik (`"reel_uhrzeit"`), abends das Carousel |
| `"statt"` | abends nur das Reel mit Musik; fehlt das Video, ersatzweise das Carousel |

Prüfen, ob Instagram ein Reel annimmt, ohne es zu veröffentlichen: Actions → „Post veröffentlichen" → Run workflow, Haken bei „Reel von Instagram verarbeiten lassen".

## Aufbau

| Pfad | Inhalt |
|---|---|
| `posts/` | Inhalte der Posts |
| `render/` | Vorlage: `slide.html`, `style.css`, Zeichnungen in `drawings.js` |
| `tools/render.py` | Rendert Posts über einen lokalen Chrome ohne Fenster |
| `tools/publish.py` | Veröffentlicht über die Instagram Graph API |
| `tools/automatik.py` | Stand, Prüfung, Einplanen und Aufräumen für den täglichen Lauf |
| `tools/wiki.py` | Holt Wikipedia-Artikel für die Recherche |
| `tools/reel.py` | Baut aus den Blättern eines Posts das Reel (braucht ffmpeg, läuft auf GitHub) |
| `tools/musik.py` | Berechnet die Musik zum Reel |
| `AUTOMATIK.md` | Arbeitsanweisung für den täglichen Lauf |
| `themen.json` | Themenliste: erschienene und offene Bauwerke |
| `plan.json` | Zeitplan und Freigaben |
| `veroeffentlicht.json` | Protokoll, wird vom Workflow geschrieben |
| `config.json` | Konto, API-Version |
| `.github/workflows/` | Zeitplan (`post.yml`), Reel rendern (`reel.yml`) |

## Einrichtung

Lokal: Python 3.12, `pip install -r requirements.txt`, dazu Chrome oder Edge.

Im Repo unter Settings → Secrets and variables → Actions:

| Secret | Wofür |
|---|---|
| `IG_ACCESS_TOKEN` | Systemnutzer-Zugriffstoken aus Metas App-Dashboard (Instagram API mit Unified Login) mit `instagram_basic` und `instagram_content_publish` |

Das Repo muss öffentlich sein: Instagram holt die Bilder über ihre Adresse ab, sie müssen also ohne Anmeldung erreichbar sein. Die Secrets bleiben trotzdem privat.

## Prüfen ohne zu posten

```bash
python tools/publish.py --probelauf --post 005-koelner-dom
```

Im Repo: Actions → „Post veröffentlichen" → Run workflow, Haken bei „Nur prüfen" gesetzt lassen.
