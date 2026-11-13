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

Ein öffentliches GitHub-Repository `kassenbuch` im selben Konto wie Bauriss. Instagram holt die Bilder über ihre Adresse ab, deshalb öffentlich.

## 3. Zugang für die Schnittstelle

Wie bei Bauriss über Metas App-Dashboard („API setup with Unified login"). Die vorhandene Meta-App kann ein zweites Instagram-Konto bedienen:

1. Im App-Dashboard unter Instagram → „API setup with Unified login" → „Zugriffsschlüssel generieren" → „Konto hinzufügen": `das.kassenbuch` als Instagram-Tester einladen.
2. Auf instagram.com als `das.kassenbuch`: Einstellungen → Website-Berechtigungen → Apps und Websites → Tester-Einladungen → annehmen.
3. Im App-Dashboard neben dem Konto „Token generieren", Token kopieren. Es wird nur einmal angezeigt und gehört nicht in den Chat.
4. Im Repository `kassenbuch` unter Settings → Secrets and variables → Actions als `IG_ACCESS_TOKEN` speichern.
5. Danach `python tools/publish.py --zugang` im Workflow laufen lassen; die Konto-ID kommt anschließend in `config.json`.

Einzelne Beschriftungen bei Meta können abweichen; die Schritte folgen dem Ablauf, der am 11.11.2026 für Bauriss funktioniert hat.
