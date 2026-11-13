# Kassenbuch

Automatisierter Instagram-Kanal `@das.kassenbuch`: Wirtschaftsgeschichte in Zahlen, eine Buchung pro Werktag. Jeder Post ist ein Carousel, das vollständig aus Code gerendert wird. Schwesterprojekt von Bauriss, gleiche Pipeline.

## Ablauf

1. **Post schreiben:** eine JSON-Datei in `posts/` (Texte, Zahlen, Quellen).
2. **Rendern:** `python tools/render.py` erzeugt die Blätter als JPEG in `out/<post>/` und eine `uebersicht.jpg` zum Durchsehen.
3. **Einplanen:** Eintrag in `plan.json` mit Datum. Neue Einträge stehen auf `"freigabe": false`.
4. **Freigeben:** nach der Durchsicht `"freigabe": true` setzen und ins Repo übertragen.
5. **Veröffentlichen:** GitHub Actions ruft täglich `tools/publish.py` auf. Das Skript postet den für heute freigegebenen Post und trägt ihn in `veroeffentlicht.json` ein.

Ohne Freigabe wird nichts veröffentlicht. Ein Post, der in `veroeffentlicht.json` steht, wird nie ein zweites Mal gepostet.

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
| `tools/publish.py` | Veröffentlicht über die Instagram Graph API |
| `plan.json` | Zeitplan und Freigaben |
| `veroeffentlicht.json` | Protokoll, wird vom Workflow geschrieben |
| `config.json` | Konto, Konto-ID, API-Version |
| `.github/workflows/` | Zeitplan (`post.yml`) |

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
