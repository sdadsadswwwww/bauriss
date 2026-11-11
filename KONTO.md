# Konten anlegen: Bauriss

Das ist der Teil, den nur du machen kannst. Abschnitt 1 dauert etwa 15 Minuten und geht sofort. Abschnitt 2 machen wir gemeinsam, wenn Abschnitt 1 erledigt ist.

## 1. Jetzt: drei Konten

### Instagram

| Feld | Wert |
|---|---|
| Benutzername | `der.bauriss` |
| Ausweichnamen, falls vergeben | `bauriss.de`, `bauriss.blatt` |
| Name | `Bauriss · Bauwerke erklärt` |
| Kategorie | Bildung |
| Profilbild | `out/profilbild.png` |

Bio:

```
Wie wurde das gebaut? Was hat es gekostet? Wer hat bezahlt?
Ein Bauwerk pro Werktag, erklärt in Zeichnungen.
```

1. Konto registrieren (App oder instagram.com). Nimm eine E-Mail-Adresse, auf die du dauerhaft Zugriff hast, und schalte die Zwei-Faktor-Anmeldung ein.
2. Benutzername, Name, Bio und Profilbild eintragen.
3. Auf ein professionelles Konto umstellen: Einstellungen → Kontotyp und Tools → Zu professionellem Konto wechseln → „Creator", Kategorie „Bildung". Ohne diesen Schritt kann keine Schnittstelle posten.

Wenn du einen der Ausweichnamen nimmst, sag es mir: Der Name steht auf dem letzten Blatt jedes Posts und in `config.json`.

### GitHub

Konto auf github.com anlegen, falls du noch keines hast. Dort läuft der Zeitplan.

### Facebook

Ein persönliches Facebook-Konto, falls du noch keines hast. Eine Facebook-Seite brauchst du nicht. Das Konto ist nur der Schlüssel zu Metas Entwicklerbereich, in dem das Zugriffstoken für Instagram entsteht.

## 2. Zugang für die Schnittstelle

Stand 11.11.2026: Abschnitt 1 ist erledigt, das Projekt liegt unter https://github.com/sdadsadswwwww/bauriss, die Meta-App „Bauriss" ist angelegt und das Produkt „Instagram" hinzugefügt.

Es fehlt ein Schlüssel: das Zugriffstoken. Du trägst es selbst bei GitHub ein; es gehört nicht in den Chat.

Meta bietet bei neuen Apps nur noch die „API-Einrichtung mit Unified Login" an. Die Schritte unten folgen Metas Anleitung vom 27.10.2026; einzelne Beschriftungen können abweichen.

1. Im App-Dashboard links „Instagram" aufklappen und „API setup with Unified login" öffnen.
2. **Business-Portfolio:** Die Seite verlangt zuerst ein Business-Portfolio. Im Feld „Business-Portfolio" ein vorhandenes wählen oder ein neues anlegen (Name `Bauriss`). Falls sich dort keines anlegen lässt: https://business.facebook.com öffnen, Portfolio erstellen, zurück zur App und es auswählen.
3. **Konfiguration:** Unter „Configure your app" auf „Neue Konfiguration erstellen". In der Vorschau prüfen, dass die Berechtigung `instagram_content_publish` dabei ist. Wenn nach der Gültigkeit des Tokens gefragt wird: „läuft nie ab". Dann „Use this configuration".
4. **Redirect URL:** `https://github.com/sdadsadswwwww/bauriss` eintragen und speichern. Das Feld ist Pflicht, die Adresse wird für uns nie aufgerufen.
5. **Tester einladen:** Unter „Zugriffsschlüssel generieren" auf „Konto hinzufügen" und `der.bauriss` als Instagram-Tester einladen.
6. **Einladung annehmen:** Auf instagram.com (im Browser, nicht in der App) als `der.bauriss`: Einstellungen → Website-Berechtigungen → Apps und Websites → Tester-Einladungen → annehmen.
7. **Token erzeugen:** Zurück im App-Dashboard neben dem Konto auf „Token generieren", Anmeldung abschließen, Token kopieren. Es wird nur einmal angezeigt.
8. **Bei GitHub eintragen:** https://github.com/sdadsadswwwww/bauriss/settings/secrets/actions/new öffnen. Name: `IG_ACCESS_TOKEN`, Wert: das Token. „Add secret".

Eine App-Prüfung durch Meta ist nicht nötig, solange die App nur dein eigenes Konto bedient.

Ein zweites Token für die automatische Verlängerung (`GH_PAT`) ist vorerst nicht nötig. Falls Meta nur ein Token mit Ablaufdatum ausgibt, baue ich die Verlängerung für diese Token-Art nach.

### Danach

| Schritt | Wer |
|---|---|
| Prüfen, dass das Token das Konto `der.bauriss` freigibt | ich |
| Ersten Wochenbatch freigeben | du |

## Hinweise

- Die drei Benutzernamen waren am 11.11.2026 ohne Anmeldung nicht als Profil auffindbar. Ob sie wirklich frei sind, zeigt erst das Registrierungsformular.
- `@bauriss` ohne Zusatz gehört bereits einer Privatperson.
- Das Repository muss öffentlich sein, weil Instagram die Bilder über ihre Adresse abholt. Tokens liegen getrennt davon in den GitHub-Secrets und sind nicht einsehbar.
