# Konto einrichten: Kassenbuch

Stand 13.11.2026: Das Instagram-Konto `das.kassenbuch` ist registriert. Name und Bio sind eingetragen, das Konto ist ein Creator-Konto (Kategorie Bildung). Offen: Profilbild, Zwei-Faktor-Anmeldung und eigenes Passwort, Repository, Token. Der Name lässt sich laut Meta nur zweimal in 14 Tagen ändern; eine Änderung ist verbraucht.

## 1. Profil

| Feld | Wert |
|---|---|
| Name | `Kassenbuch · Wirtschaftsgeschichte` |
| Kategorie | Bildung |
| Profilbild | `out/profilbild.png` |

Bio:

```
Was hat es gekostet? Wer hat bezahlt? Wer hat verdient?
Wirtschaftsgeschichte in Zahlen – eine Buchung pro Werktag.
```

1. Name, Bio und Profilbild eintragen (Profil bearbeiten).
2. Auf ein professionelles Konto umstellen: Einstellungen → Kontotyp und Tools → Zu professionellem Konto wechseln → „Creator", Kategorie „Bildung". Ohne diesen Schritt kann keine Schnittstelle posten.
3. Empfohlen: Zwei-Faktor-Anmeldung einschalten und ein eigenes, starkes Passwort setzen.

## 2. Repository

Erledigt: https://github.com/sdadsadswwwww/kassenbuch (öffentlich).

## 3. Zugang für die Schnittstelle

Stand 14.11.2026:

- Eigene Meta-App „Kassenbuch" (App-ID 29434390536198421) im Entwicklerkonto, verknüpft mit dem Business-Portfolio „Kassenbuch". Die Verifizierung des Portfolios ist übersprungen; für das eigene Konto ist sie nicht nötig.
- Login-Konfiguration „Instagram API (Unified Login)" aus Metas Vorlage erstellt (Systemnutzer-Token ohne Ablauf). Die Vorlage enthält neben `instagram_basic` und `instagram_content_publish` auch Werbe-, Nachrichten- und Kommentarrechte, die die Pipeline nicht nutzt.
- Weiterleitungs-URL: die Adresse des Repositorys (Pflichtfeld, wird nie aufgerufen).
- `das.kassenbuch` ist als Instagram-Tester eingeladen, die Einladung ist angenommen. Konto-ID: 17841479858387731 (steht in `config.json`).

Offen, nur durch dich:

1. Im App-Dashboard unter Anwendungsfälle → Instagram API → „API setup with Unified login" → Abschnitt 2 neben `das.kassenbuch` auf „Token generieren". Anmeldung abschließen, Token kopieren. Es wird nur einmal angezeigt und gehört nicht in den Chat.
2. Unter https://github.com/sdadsadswwwww/kassenbuch/settings/secrets/actions/new als `IG_ACCESS_TOKEN` speichern.
3. Danach den Workflow „Post veröffentlichen" mit Haken bei „Nur das Zugriffstoken prüfen" laufen lassen.

## Nachtrag 14.11.2026

- Token erzeugt und als Secret `IG_ACCESS_TOKEN` im Repository gespeichert.
- Zugangstest über den Workflow bestanden: ein zugewiesenes Instagram-Konto, Veröffentlichungslimit für die Konto-ID abrufbar. Gepostet wurde dabei nichts.
- Erster echter Post: Montag, 16.11.2026, 18:15 Uhr.

## Betrieb ab 14.11.2026

- Beitrag 001 am 14.11. veröffentlicht. Ab jetzt täglich ein Beitrag um 18:15 Uhr, auch am Wochenende.
- Vorrat: 002 bis 005 für den 15. bis 18.11.
- Neue Beiträge entstehen automatisch: Eine geplante Aufgabe in der Claude-App (täglich gegen 10:13 Uhr) erstellt den Beitrag für den Folgetag, rendert ihn und trägt ihn mit `"freigabe": true` in `plan.json` ein. Eine Freigabe durch den Nutzer findet nicht mehr statt (so gewünscht am 14.11.).
- Die Aufgabe läuft nur, wenn die App geöffnet ist. Sonst wird sie beim nächsten Start nachgeholt.
