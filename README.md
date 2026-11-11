# Bauriss

Automatisierter Instagram-Kanal: ein Bauwerk pro Werktag, erklärt in Zeichnungen. Jeder Post ist ein Carousel, das vollständig aus Code gerendert wird.

## Ablauf

1. **Post schreiben:** eine JSON-Datei in `posts/` (Texte, Zahlen, Verweis auf die Zeichnungen).
2. **Rendern:** `python tools/render.py` erzeugt die Blätter als JPEG in `out/<post>/` und eine `uebersicht.jpg` zum Durchsehen.
3. **Einplanen:** Eintrag in `plan.json` mit Datum. Neue Einträge stehen auf `"freigabe": false`.
4. **Freigeben:** nach der Durchsicht `"freigabe": true` setzen und ins Repo übertragen.
5. **Veröffentlichen:** GitHub Actions ruft Mo–Fr um 18:30 Uhr `tools/publish.py` auf. Das Skript postet den für heute freigegebenen Post und trägt ihn in `veroeffentlicht.json` ein.

Ohne Freigabe wird nichts veröffentlicht. Ein Post, der in `veroeffentlicht.json` steht, wird nie ein zweites Mal gepostet.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `posts/` | Inhalte der Posts |
| `render/` | Vorlage: `slide.html`, `style.css`, Zeichnungen in `drawings.js` |
| `tools/render.py` | Rendert Posts über einen lokalen Chrome ohne Fenster |
| `tools/publish.py` | Veröffentlicht über die Instagram Graph API |
| `plan.json` | Zeitplan und Freigaben |
| `veroeffentlicht.json` | Protokoll, wird vom Workflow geschrieben |
| `config.json` | Konto, API-Version |
| `.github/workflows/` | Zeitplan (`post.yml`) und Token-Verlängerung (`token.yml`) |

## Einrichtung

Lokal: Python 3.12, `pip install -r requirements.txt`, dazu Chrome oder Edge.

Im Repo unter Settings → Secrets and variables → Actions:

| Secret | Wofür |
|---|---|
| `IG_ACCESS_TOKEN` | Langlebiges Instagram-Zugriffstoken mit `instagram_business_basic` und `instagram_business_content_publish` |
| `GH_PAT` | GitHub-Token mit Schreibrecht auf Secrets dieses Repos, nur für die Token-Verlängerung |

Das Repo muss öffentlich sein: Instagram holt die Bilder über ihre Adresse ab, sie müssen also ohne Anmeldung erreichbar sein. Die Secrets bleiben trotzdem privat.

## Prüfen ohne zu posten

```bash
python tools/publish.py --probelauf --post 001-koelner-dom
```

Im Repo: Actions → „Post veröffentlichen" → Run workflow, Haken bei „Nur prüfen" gesetzt lassen.
