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

## 2. Danach, gemeinsam

| Schritt | Wer |
|---|---|
| Projekt als öffentliches Repository zu GitHub übertragen | ich, nachdem du dich einmal bei GitHub angemeldet hast |
| Meta-Entwickler-App anlegen und Zugriffstoken erzeugen | du, ich führe dich Klick für Klick |
| Token als Secret `IG_ACCESS_TOKEN` in GitHub eintragen | du, das Token gehört nicht in den Chat |
| GitHub-Token für die automatische Verlängerung als Secret `GH_PAT` eintragen | du, einmalig |
| Probelauf ohne Veröffentlichung | ich |
| Ersten Wochenbatch freigeben | du |

## Hinweise

- Die drei Benutzernamen waren am 11.11.2026 ohne Anmeldung nicht als Profil auffindbar. Ob sie wirklich frei sind, zeigt erst das Registrierungsformular.
- `@bauriss` ohne Zusatz gehört bereits einer Privatperson.
- Das Repository muss öffentlich sein, weil Instagram die Bilder über ihre Adresse abholt. Tokens liegen getrennt davon in den GitHub-Secrets und sind nicht einsehbar.
