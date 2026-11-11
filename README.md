# Studio — Marketing Planner

Vollständige deutschsprachige Webanwendung mit React, Express und SQLite. Benötigt Node.js 24 (wegen `node:sqlite`).

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
- Responsive Oberfläche und Tastaturbedienung im Aufgabendialog.

## Discord

Unter Einstellungen eine Discord-Kanal-Webhook-URL hinterlegen. Erlaubt sind ausschließlich HTTPS-Webhooks auf `discord.com`. Die URL wird serverseitig in der Datenbank gespeichert und nicht zurückgeliefert; sie ist ein Geheimnis. Datenverzeichnis entsprechend schützen, niemals öffentlich ausliefern und nicht einchecken.

Beim Speichern einer Aufgabe wird ein farbiges Embed erstellt. Die Nachrichten-ID wird gespeichert; folgende Änderungen aktualisieren dieselbe Nachricht per PATCH. Gleichzeitige Aktualisierungen einer Aufgabe werden serialisiert. Fehlende Nachrichten werden neu erstellt. Erwähnungen sind deaktiviert. Discord-Fehler verhindern nicht die Speicherung der Aufgabe und werden in der Oberfläche gemeldet. „Alle synchronisieren“ übernimmt vorhandene Aufgaben oder wiederholt fehlgeschlagene Übertragungen.

Beim Löschen einer Aufgabe wird auch die Discord-Nachricht entfernt, soweit Discord erreichbar ist. Beim Trennen oder Wechseln des Webhooks bleiben bisherige Nachrichten erhalten; bei einer neuen Verbindung können neue Nachrichten entstehen. Die Cloud-Netzwerkregeln müssen `discord.com` erlauben. Ein echter Discord-End-to-End-Test benötigt einen eigenen Webhook und wurde ohne Zugangsdaten nicht durchgeführt. Es gibt keine dauerhafte Hintergrundwarteschlange: nach einem Fehler manuell erneut synchronisieren.

## Daten und Betrieb

SQLite-Dateien liegen standardmäßig in `data/`; ein dauerhaftes, nur für den Server zugängliches Verzeichnis kann über `DATA_DIR` eingestellt werden. Aufgaben und Accounts überleben Neustarts. Regelmäßige SQLite-konsistente Backups einschließlich WAL berücksichtigen. Keine Geheimnisse in Git ablegen.

Registrierung ist offen; jede Person erhält einen eigenen privaten Workspace. Gemeinsame Teamkonten, Einladungen, E-Mail-Verifizierung, Passwort-Reset und Zwei-Faktor-Anmeldung sind derzeit nicht implementiert. Discord ist eine ausgehende Synchronisierung, keine Rücksynchronisierung.

## Validierung

`npm test` prüft Registrierung und Login, falsche Passwörter, Cookie-Eigenschaften, Account-Isolation, fremde Schreibursprünge, Terminvalidierung, Webhook-Hostvalidierung, Aufgabenänderung und -löschung, Sitzungswiderruf sowie Produktionsauslieferung und Sicherheitsheader. Tests verwenden eine temporäre Datenbank.

Für Cloud-Aufgaben den vorhandenen Checkout `/workspace/marketing_tool` verwenden; kein zusätzliches Git-Worktree erforderlich. Nach Snapshot-Wiederherstellung den Server neu mit `npm run dev` starten; Prozesse werden nicht mitgesichert.
