# Konten einrichten: Schaubild

Das ist der Teil, den nur du machen kannst. Stand 13.11.2026: Das Konto `das.schaubild` ist registriert. Es fehlen die Umstellung auf ein Creator-Konto und das Token.

## 1. Instagram

| Feld | Wert |
|---|---|
| Benutzername | `das.schaubild` |
| Name | `Schaubild · Deutschland in Grafiken` |
| Kategorie | Bildung |
| Profilbild | `out/profilbild.png` |

Bio:

```
Deutschland in Grafiken.
Eine Zahl, ein Schaubild, eine Quelle. Jeden Tag.
```

1. Registrierung abschließen: Passwort eingeben, absenden, Bestätigungscode aus dem Postfach eintragen.
2. Name, Bio und Profilbild eintragen.
3. Auf ein professionelles Konto umstellen: Einstellungen → Kontotyp und Tools → Zu professionellem Konto wechseln → „Creator", Kategorie „Bildung". Ohne diesen Schritt kann keine Schnittstelle posten.

## 2. GitHub

Schaubild liegt als Ordner `schaubild/` im öffentlichen Repository https://github.com/sdadsadswwwww/bauriss und hat dort einen eigenen Workflow („Schaubild veröffentlichen"). Ein eigenes Repository ist nicht nötig.

## 3. Zugang für die Schnittstelle

Wie bei Bauriss (dort `KONTO.md`, Abschnitt 2), mit diesen Unterschieden:

1. In der vorhandenen Meta-App unter „API setup with Unified login" `das.schaubild` als weiteren Instagram-Tester einladen.
2. Einladung auf instagram.com als `das.schaubild` annehmen: Einstellungen → Website-Berechtigungen → Apps und Websites → Tester-Einladungen.
3. Token für dieses Konto erzeugen und unter https://github.com/sdadsadswwwww/bauriss/settings/secrets/actions/new speichern. Name: `IG_ACCESS_TOKEN_SCHAUBILD`. Das Token gehört nicht in den Chat.
4. Die Konto-ID trage ich danach in `config.json` ein (`konto_id` ist noch leer).

## Danach

| Schritt | Wer |
|---|---|
| Prüfen, dass das Token `das.schaubild` freigibt (`tools/publish.py --zugang`) | ich |
| Post 001 durchsehen und in `plan.json` freigeben | du |
