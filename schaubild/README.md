# Schaubild

Automatisierter Instagram-Kanal: Deutschland in Grafiken. Jeder Post ist ein Carousel aus Diagrammen, das vollständig aus Code gerendert wird. Aufbau und Ablauf entsprechen dem Schwesterprojekt Bauriss.

## Ablauf

1. **Post schreiben:** eine JSON-Datei in `posts/` (Texte, Zahlenreihen, Quellen).
2. **Rendern:** `python tools/render.py` erzeugt die Blätter als JPEG in `out/<post>/` und eine `uebersicht.jpg` zum Durchsehen.
3. **Einplanen:** Eintrag in `plan.json` mit Datum. Neue Einträge stehen auf `"freigabe": false`.
4. **Freigeben:** nach der Durchsicht `"freigabe": true` setzen und ins Repo übertragen.
5. **Veröffentlichen:** GitHub Actions ruft täglich um 18:30 Uhr `tools/publish.py` auf. Das Skript postet den für heute freigegebenen Post und trägt ihn in `veroeffentlicht.json` ein.

6. **Reel:** Zu jedem Post rendert der Workflow „Schaubild Reel rendern" ein Video (`out/<post>/reel.mp4`, Vorlage `render/reel.html`, Skript `tools/reel.py`). Es erscheint am Tag des Posts um 12:30 Uhr über `tools/publish.py --reel`.

Ohne Freigabe wird nichts veröffentlicht. Ein Post, der in `veroeffentlicht.json` steht, wird nie ein zweites Mal gepostet.

## Blatt-Typen

| `typ` | Inhalt |
|---|---|
| `cover` | große Zahl, Überschrift, optional Diagramm |
| `diagramm` | Überschrift, Text, Diagramm (`figur`), Fußzeile |
| `balken` | waagerechte Balken, Länge nach dem größten Wert |
| `punkte` | drei Kennzahlen untereinander |
| `outro` | Marke, Konto, Quellen |

Diagramme (`figur.fn`) liegen in `render/charts.js`: `linie` (eine oder mehrere Reihen über Jahre, mit Marken) und `saeulen`.

## Regeln für Zahlen

- Jede Zahl stammt aus einer amtlichen oder gleichwertigen Quelle, die unter `quellen` steht, mit Stand oder Abrufdatum.
- Aussagen wie „höchster Wert seit …" werden gegen die ganze Reihe geprüft, nicht geschätzt.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `posts/` | Inhalte der Posts |
| `render/` | Vorlage: `slide.html`, `style.css`, Diagramme in `charts.js` |
| `tools/render.py` | Rendert Posts über einen lokalen Chrome ohne Fenster |
| `tools/publish.py` | Veröffentlicht über die Instagram Graph API |
| `plan.json` | Zeitplan und Freigaben |
| `veroeffentlicht.json` | Protokoll, wird vom Workflow geschrieben |
| `config.json` | Konto, Konto-ID, API-Version |
| `../.github/workflows/schaubild.yml` | Zeitplan; das Token liegt im Secret `IG_ACCESS_TOKEN_SCHAUBILD` |

## Einrichtung

Lokal: Python 3.12, `pip install -r requirements.txt`, dazu Chrome oder Edge. Die Schritte für Konto, Repository und Token stehen in `KONTO.md`.

## Prüfen ohne zu posten

```bash
python tools/publish.py --probelauf --post 001-geburten
```
