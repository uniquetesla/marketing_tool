# Studio — Marketing Planner

Vollständige deutschsprachige Webanwendung mit React, Express und SQLite. Benötigt Node.js 24.22 oder neuer (wegen `node:sqlite` und nativer Proxy-Unterstützung).

## Lokal starten

```sh
npm ci
npm run dev
```

Der Server läuft auf Port 3000 (`PORT` überschreibt diesen). Im Anmeldebildschirm zunächst einen eigenen Account erstellen. Es werden keine Demo-Zugangsdaten oder fremden Inhalte angelegt.

```sh
npm run build
npm test
npm start
```

`npm start` ist für HTTPS-Produktion vorgesehen und setzt Secure-Cookies. Hinter einem vertrauenswürdigen Reverse Proxy mit genau einem Hop `TRUST_PROXY=1` setzen und `Host` sowie `X-Forwarded-Proto` korrekt weitergeben. Ohne HTTPS bleiben Secure-Cookies im Browser unbenutzbar; lokal `npm run dev` verwenden. Vor öffentlicher Bereitstellung HTTPS, persistentes Datenvolume und Backups einrichten. Keine Veröffentlichung ist Bestandteil des lokalen Starts.

## Funktionen

- Registrierung und Login, scrypt-Passworthashes, zufällige serverseitige Sitzungen mit sieben Tagen Laufzeit, HttpOnly-/SameSite-Cookies, Abmeldung mit Sitzungswiderruf, Anfrageursprungsprüfung und Rate Limits.
- Pro Konto getrennte Aufgaben und Discord-Konfiguration. Kampagnen werden über das Feld „Kampagne / Übermenü“ frei angelegt und in der Navigation gruppiert.
- Kachelboard mit Suche, Statusfilter und Kalender. Alle sieben gewünschten Status sind vorhanden. „In Planung“ benötigt einen Termin; Termine werden als lokale Uhrzeiten erfasst und in Discord entsprechend angezeigt.
- Geführter Videoscript-Assistent mit Ziel, Zielgruppe, Hook und CTA. Erzeugt eine editierbare Marketing-Vorlage mit Hook, Problem, Mehrwert, Beweis und CTA. Keine externe KI und keine erfundenen Leistungsnachweise.
- Glas-UI mit transparenten Flächen, Hintergrundunschärfe und lokal bereitgestellten Schriftarten. Responsive Oberfläche und Tastaturbedienung im Aufgabendialog.
- Aufgaben in drei übersichtlichen Bereichen: Idee, Planung und Script. Ein Titel reicht zum Speichern. Format-Schnellstart, Termin-Schnellauswahl sowie optionale Verantwortliche, Produktionsnotizen und Checkliste. Videolänge und Tonalität fließen in die Script-Vorlage ein; vorhandene Scripts werden erst nach einer zweiten Bestätigung ersetzt.

## Discord

Unter Einstellungen eine Discord-Kanal-Webhook-URL hinterlegen. Beim Verbinden wird sofort eine Testnachricht gesendet und die Nachrichtenbestätigung von Discord geprüft. Erst nach Erfolg wird die Verbindung gespeichert. Ein fehlgeschlagener Wechsel lässt die bisherige Verbindung und Nachrichten-IDs unverändert. Über „Testnachricht senden“ kann auch eine vorhandene Verbindung erneut geprüft werden. Der Zeitpunkt des letzten erfolgreichen Tests wird angezeigt (keine permanente Verfügbarkeitsgarantie). Erlaubt sind ausschließlich HTTPS-Webhooks auf `discord.com`. Die URL wird serverseitig in der Datenbank gespeichert und nicht zurückgeliefert; sie ist ein Geheimnis. Datenverzeichnis entsprechend schützen, niemals öffentlich ausliefern und nicht einchecken.

Beim Speichern einer Aufgabe wird ein farbiges Embed erstellt. Die Nachrichten-ID wird gespeichert; folgende Änderungen aktualisieren dieselbe Nachricht per PATCH. Gleichzeitige Aktualisierungen einer Aufgabe werden serialisiert. Fehlende Nachrichten werden neu erstellt. Erwähnungen sind deaktiviert. Discord-Fehler verhindern nicht die Speicherung der Aufgabe und werden in der Oberfläche gemeldet. „Alle synchronisieren“ übernimmt vorhandene Aufgaben oder wiederholt fehlgeschlagene Übertragungen.

Beim Löschen einer Aufgabe wird auch die Discord-Nachricht entfernt, soweit Discord erreichbar ist. Beim Trennen oder Wechseln des Webhooks bleiben bisherige Nachrichten erhalten; bei einer neuen Verbindung können neue Nachrichten entstehen. Die Cloud-Netzwerkregeln müssen `discord.com` erlauben. Der Server übernimmt `HTTP_PROXY`, `HTTPS_PROXY` und `NO_PROXY` nativ für ausgehende Anfragen; TLS-Prüfung bleibt aktiv. Diese Cloud-Umgebung verweigert aktuell den Zugriff auf `discord.com` (HTTP 403 vom Proxy). In den Umgebungseinstellungen `discord.com` zur bestehenden Domainfreigabe hinzufügen; danach die gespeicherte Verbindung erneut testen. Fehler für Netzwerk, Zeitüberschreitung, ungültige Webhooks, fehlende Berechtigung und Discord-Ratenbegrenzung werden direkt angezeigt. Ein echter Discord-End-to-End-Test benötigt einen eigenen Webhook und wurde ohne Zugangsdaten nicht durchgeführt. Es gibt keine dauerhafte Hintergrundwarteschlange: nach einem Fehler manuell erneut synchronisieren.

## Daten und Betrieb

SQLite-Dateien liegen standardmäßig in `data/`; ein dauerhaftes, nur für den Server zugängliches Verzeichnis kann über `DATA_DIR` eingestellt werden. Aufgaben und Accounts überleben Neustarts. Regelmäßige SQLite-konsistente Backups einschließlich WAL berücksichtigen. Keine Geheimnisse in Git ablegen.

Registrierung ist offen; jede Person erhält einen eigenen privaten Workspace. Gemeinsame Teamkonten, Einladungen, E-Mail-Verifizierung, Passwort-Reset und Zwei-Faktor-Anmeldung sind derzeit nicht implementiert. Discord ist eine ausgehende Synchronisierung, keine Rücksynchronisierung.

## Validierung

`npm test` prüft Registrierung und Login, falsche Passwörter, Cookie-Eigenschaften, Account-Isolation, fremde Schreibursprünge, Terminvalidierung, Webhook-Hostvalidierung, Aufgabenänderung und -löschung, Sitzungswiderruf sowie Produktionsauslieferung und Sicherheitsheader. Zusätzlich werden automatische Testnachrichten, Verbindungsfehler und der Erhalt einer bisherigen Verbindung nach fehlgeschlagenem Webhook-Wechsel geprüft. Tests verwenden eine temporäre Datenbank und einen ausdrücklich eingebundenen Discord-Testtransport. Browserprüfung: Titel-Schnellerfassung, Formatvorlagen, Planung, Produktionsnotizen und Checkliste nach Neuladen, Script-Timing und Tonalität, Schutz vor Überschreiben sowie Discord-Test-Erfolg/-Fehler und mobile Aufgabenerfassung.

Für Cloud-Aufgaben den vorhandenen Checkout `/workspace/marketing_tool` verwenden; kein zusätzliches Git-Worktree erforderlich. Nach Snapshot-Wiederherstellung den Server neu mit `npm run dev` starten; Prozesse werden nicht mitgesichert.
