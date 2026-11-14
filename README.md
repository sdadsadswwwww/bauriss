# Kassenbuch

Automatisierter Instagram-Kanal `@das.kassenbuch`: Wirtschaftsgeschichte in Zahlen, eine Buchung pro Tag. Jeder Post erscheint zweimal: mittags als Reel mit Musik, abends als Carousel. Beides wird vollständig aus Code gerendert. Schwesterprojekt von Bauriss, gleiche Pipeline.

## Ablauf

1. **Post schreiben:** eine JSON-Datei in `posts/` (Texte, Zahlen, Quellen).
2. **Rendern:** `python tools/render.py` erzeugt die Blätter als JPEG in `out/<post>/` und eine `uebersicht.jpg` zum Durchsehen.
3. **Einplanen:** Eintrag in `plan.json` mit Datum. Neue Einträge stehen auf `"freigabe": false`.
4. **Freigeben:** nach der Durchsicht `"freigabe": true` setzen und ins Repo übertragen.
5. **Veröffentlichen:** GitHub Actions ruft täglich `tools/publish.py` auf. Das Skript postet den für heute freigegebenen Post und trägt ihn in `veroeffentlicht.json` ein.

Ohne Freigabe wird nichts veröffentlicht. Ein Post, der in `veroeffentlicht.json` steht, wird nie ein zweites Mal gepostet.

## Reel mit Musik

Zu jedem Post gibt es ein Reel von 11 Sekunden (1080 x 1920): Eine Frage steht oben, die Zahl des Titelblatts zählt hoch, die Journalzeilen schreiben sich ein, am Ende fällt der Stempel. Es erscheint um 12:30 Uhr am Tag des Posts, das Carousel um 18:15 Uhr.

- **Feld im Post:** `"reel": { "frage": "Was kostet es, <i>Kaiser</i> zu werden?", "stimmung": "neutral" }`. Ohne `frage` steht der Titel des Posts oben.
- **Musik:** `tools/musik.py` berechnet sie aus Sinustönen, passend zum Ablauf des Reels. Keine fremden Aufnahmen, keine Lizenzen. Tonart und Muster hängen von der Nummer des Posts ab. `stimmung`: `neutral` (löst nach Dur auf, Glockenakkord beim Stempel) oder `ernst` (Moll, ruhiger, ohne Glocken) für Krieg, Not, Krisen und heikle Themen.
- **Vorschau lokal:** `python tools/reel.py --nur-vorschau <post>` schreibt `out/<post>/reel-vorschau.jpg` (vier Standbilder).
- **Video:** Der Workflow „Reel rendern" (`reel.yml`) rendert bei jedem neuen Post `out/<post>/reel.mp4` mit ffmpeg und legt es ins Repository. Lokal entsteht das Video nur, wenn ffmpeg installiert ist.
- **Veröffentlichen:** `tools/publish.py --reel`; `--reel-test` lässt Instagram das Video nur verarbeiten. Fehlt das Video, erscheint an dem Tag nur das Carousel.

Über die Schnittstelle erlaubt Instagram Musik nur in Videos. Deshalb hat das Carousel selbst keinen Ton.

## Blatt-Typen

| `typ` | Inhalt |
|---|---|
| `cover` | große Zahl, Einheit, Überschrift, optional Journalzeilen und Stempel |
| `text` | Überschrift und Absätze |
| `journal` | Tabelle Datum / Posten / Betrag; mit `wert` je Zeile zusätzlich eine Kurve (logarithmisch) |
| `balken` | Prozentbalken |
| `punkte` | drei Kennzahlen untereinander |
| `konto` | T-Konto mit Soll- und Haben-Seite, optional Stempel |
| `gleichung` | Betrag oben, Ergebnis unten, `gestrichen` wird rot durchgestrichen |
| `outro` | Siegel, Handle, Quellen |

In Überschriften setzt `<i>…</i>` ein Wort rot und kursiv, im Text hebt `<em>…</em>` hervor.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `posts/` | Inhalte der Posts |
| `render/` | Vorlage: `slide.html`, `style.css`, `render.js` (Blätter, Guillochen, Stempel, Kurve) |
| `tools/render.py` | Rendert Posts über einen lokalen Chrome ohne Fenster |
| `tools/publish.py` | Veröffentlicht Carousel und Reel über die Instagram Graph API |
| `render/reel.html`, `tools/reel.py` | Vorlage und Renderer des Reels |
| `tools/musik.py` | Erzeugt die Musik zum Reel |
| `plan.json` | Zeitplan und Freigaben |
| `veroeffentlicht.json` | Protokoll, wird vom Workflow geschrieben |
| `config.json` | Konto, Konto-ID, API-Version |
| `.github/workflows/` | Zeitplan und Veröffentlichung (`post.yml`), Video rendern (`reel.yml`) |

## Einrichtung

Lokal: Python 3.12, `pip install -r requirements.txt`, dazu Chrome oder Edge.

Im Repo unter Settings → Secrets and variables → Actions:

| Secret | Wofür |
|---|---|
| `IG_ACCESS_TOKEN` | Zugriffstoken aus Metas App-Dashboard (Instagram API mit Unified Login) mit `instagram_basic` und `instagram_content_publish` |

Das Repo muss öffentlich sein: Instagram holt die Bilder über ihre Adresse ab. Die Secrets bleiben trotzdem privat.

## Prüfen ohne zu posten

```bash
python tools/publish.py --probelauf --post 001-hyperinflation-1923
```

Schriften: Barlow, IBM Plex Mono, Playfair Display (alle SIL OFL 1.1), liegen in `render/fonts/`.
