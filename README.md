# Astro-Media — Marketing & Content Planner

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
- Persönliche und freigegebene Aufgabenbereiche mit eigener URL `/{bereichsname}`. Kampagnen dienen weiterhin als Übermenüs innerhalb eines Bereichs. Zugriff wird pro registrierter E-Mail als „Nur ansehen“ oder „Ansehen & bearbeiten“ vergeben und kann widerrufen werden. Ein Link allein gewährt keinen Zugriff.
- Status-Board mit horizontalen Spalten, Suche, Kampagnen-/Statusfilter und Kalender. Karten öffnen einen kompakten Statusbereich; der vollständige Editor ist über „Inhalt & Script bearbeiten“ erreichbar. Statusänderungen verschieben die Karte automatisch zur passenden Spalte. „In Planung“ benötigt einen Termin. Der Abschlussstatus „Fertig (Hochgeladen)“ erscheint als „Abgeschlossen“ und benötigt einen gültigen HTTP(S)-Ergebnislink. Termine werden als lokale Uhrzeiten erfasst.
- GTA-RP-Script-Assistent: Server-Feature, neue Funktion/Update, Fraktionsvorstellung, Job/Wirtschaft, Event, Einsteiger-Guide, RP-Highlight und Community-Recruiting. Servername, Zielgruppe, Videoziel, Hook, Videolänge, Ton und CTA fließen in das editierbare Produktionsbriefing ein. Jeder Inhaltstyp erhält eigene Szenen-, Gameplay- und Faktenhinweise sowie einen Drehcheck zu IC/OOC, Aufnahmen und Rechten. Lokale Vorlagen, keine externe KI.
- Trello-artiges Board mit blauem Hintergrund, grauen Listen und kompakten weißen Karten. Statuswechsel per Dropdown oder Drag-and-drop; weiterhin tastaturbedienbar. Lokal bereitgestellte Schriftarten und responsive Darstellung.
- Aufgaben in drei übersichtlichen Bereichen: Idee, Planung und Script. Ein Titel reicht zum Speichern. Format-Schnellstart, Termin-Schnellauswahl sowie optionale Verantwortliche, Produktionsnotizen und Checkliste. Videolänge und Tonalität fließen in die Script-Vorlage ein; vorhandene Scripts werden erst nach einer zweiten Bestätigung ersetzt.

## Discord

Unter Einstellungen eine Discord-Kanal-Webhook-URL hinterlegen. Beim Verbinden wird sofort eine Testnachricht gesendet und die Nachrichtenbestätigung von Discord geprüft. Erst nach Erfolg wird die Verbindung gespeichert. Ein fehlgeschlagener Wechsel lässt die bisherige Verbindung und Nachrichten-IDs unverändert. Über „Testnachricht senden“ kann auch eine vorhandene Verbindung erneut geprüft werden. Der Zeitpunkt des letzten erfolgreichen Tests wird angezeigt (keine permanente Verfügbarkeitsgarantie). Erlaubt sind ausschließlich HTTPS-Webhooks auf `discord.com`. Die URL wird serverseitig in der Datenbank gespeichert und nicht zurückgeliefert; sie ist ein Geheimnis. Datenverzeichnis entsprechend schützen, niemals öffentlich ausliefern und nicht einchecken.

Beim Speichern einer Aufgabe wird ein modernes Embed mit Status-Emoji, Aufgabenbereich, Kampagne, Termin, Plattform, Referenz- und Ergebnislink erstellt. Unter Einstellungen kann jeder Account seine persönliche Farbe und einen Username (2–32 Zeichen) festlegen; der Embed-Farbstreifen zeigt die Farbe der zuletzt bearbeitenden Person und der Autor zeigt deren Username sowie den Bereich. Bestehende Konten erhalten zunächst einen Namen wie `Astro-1`, der im Profil geändert werden kann. Bei der Registrierung ist der Username in der Oberfläche erforderlich; ältere API-Clients erhalten einen automatisch vergebenen Namen. Usernames sind Anzeigenamen und müssen nicht eindeutig sein. Bestehende Discord-Nachrichten übernehmen Namensänderungen bei der nächsten Aufgabenänderung oder über „Alle synchronisieren“. Für gemeinsame Bereiche wird immer der Webhook des Bereichseigentümers verwendet. Der Webhook selbst wird nicht an Mitglieder offengelegt. Die Nachrichten-ID wird gespeichert; folgende Änderungen aktualisieren dieselbe Nachricht per PATCH. Gleichzeitige Aktualisierungen einer Aufgabe werden serialisiert. Fehlende Nachrichten werden neu erstellt. Erwähnungen sind deaktiviert. Discord-Fehler verhindern nicht die Speicherung der Aufgabe und werden in der Oberfläche gemeldet. „Alle synchronisieren“ übernimmt vorhandene Aufgaben oder wiederholt fehlgeschlagene Übertragungen.

Beim Löschen einer Aufgabe wird auch die Discord-Nachricht entfernt, soweit Discord erreichbar ist. Beim Trennen oder Wechseln des Webhooks bleiben bisherige Nachrichten erhalten; bei einer neuen Verbindung können neue Nachrichten entstehen. Die Cloud-Netzwerkregeln müssen `discord.com` erlauben. Der Server übernimmt `HTTP_PROXY`, `HTTPS_PROXY` und `NO_PROXY` nativ für ausgehende Anfragen; TLS-Prüfung bleibt aktiv. Diese Cloud-Umgebung verweigert aktuell den Zugriff auf `discord.com` (HTTP 403 vom Proxy). In den Umgebungseinstellungen `discord.com` zur bestehenden Domainfreigabe hinzufügen; danach die gespeicherte Verbindung erneut testen. Fehler für Netzwerk, Zeitüberschreitung, ungültige Webhooks, fehlende Berechtigung und Discord-Ratenbegrenzung werden direkt angezeigt. Ein echter Discord-End-to-End-Test benötigt einen eigenen Webhook und wurde ohne Zugangsdaten nicht durchgeführt. Es gibt keine dauerhafte Hintergrundwarteschlange: nach einem Fehler manuell erneut synchronisieren.

## Kampagnen löschen

Eine Kampagne über den Filter auswählen und den Papierkorb daneben anklicken. Nach Bestätigung wird die Kampagnenzuordnung bei allen betroffenen Aufgaben dieses Bereichs entfernt; Aufgaben, Scripts und Medien bleiben erhalten. Die Karten erscheinen wieder unter „Alle Inhalte“. Nur Eigentümer und Bearbeitende dürfen Kampagnen löschen. Discord-Nachrichten betroffener Aufgaben werden aktualisiert; bei Netzwerkfehlern kann über „Alle synchronisieren“ erneut übertragen werden.

## Referenzen und Medien

Im Aufgaben-Editor lässt sich ein HTTP(S)-Beispiellink hinterlegen. „Als Beispiel übernehmen“ erstellt bei leeren Feldern einen Titel und einen Beschreibungsvorschlag und verlinkt die Referenz. Fremde Seiten werden nicht serverseitig abgerufen, kopiert oder eingebettet.

Die Medienbibliothek speichert Fotos und Grafiken als BLOBs in SQLite samt Dateiname, geprüftem Bildtyp, Größe und Bereichszuordnung. Erlaubt sind PNG, JPEG, WebP und GIF bis 8 MB pro Datei. SVG und andere Dateitypen werden abgewiesen. Pro Bereich gelten 100 MB / 500 Bilder. Aufgaben können bis zu 20 Bilder aus ihrem eigenen Bereich verknüpfen. Beim Löschen eines Bildes werden dessen Aufgabenverknüpfungen entfernt. Bilder können nur von Bereichsmitgliedern gelesen und nur von Bearbeitenden hochgeladen/gelöscht werden.

## Daten und Betrieb

Die bestehende SQLite-Datei `data/studio.db` und der interne Sitzungs-Cookie behalten aus Kompatibilitätsgründen ihre historischen Namen. Beim ersten Start werden Farben, Bereiche, Freigaben und Medientabellen additiv angelegt; bestehende Aufgaben kommen in den persönlichen Bereich. Accounts, Passwörter, Sitzungen und Discord-Nachrichten-IDs bleiben erhalten. Bereits abgeschlossene Altaufgaben bleiben erhalten; beim nächsten Speichern als abgeschlossen wird der Ergebnislink verlangt. SQLite-Dateien liegen standardmäßig in `data/`; ein dauerhaftes, nur für den Server zugängliches Verzeichnis kann über `DATA_DIR` eingestellt werden. Aufgaben und Accounts überleben Neustarts. Regelmäßige SQLite-konsistente Backups einschließlich WAL berücksichtigen. Keine Geheimnisse in Git ablegen.

Registrierung ist offen; jede Person erhält einen eigenen privaten Aufgabenbereich. Eigentümer können bereits registrierte Personen per E-Mail freigeben. Bearbeitende dürfen Aufgaben und Medien im freigegebenen Bereich erstellen, bearbeiten und löschen; nur Eigentümer verwalten Freigaben. E-Mail-Einladungsversand, E-Mail-Verifizierung, Passwort-Reset und Zwei-Faktor-Anmeldung sind derzeit nicht implementiert. Discord ist eine ausgehende Synchronisierung, keine Rücksynchronisierung.

## Geteilte Aufgabenbereiche

1. Unter „Aufgabenbereiche“ einen Namen angeben. Astro-Media erzeugt eine stabile URL, z. B. `/sommer-content`. Bei Namenskonflikten erhält die URL einen kurzen eindeutigen Zusatz.
2. Im Freigabebereich die E-Mail eines registrierten Accounts und das gewünschte Recht speichern.
3. Den angezeigten Bereichslink kopieren und selbst an die Person schicken. Beim Öffnen ist eine Anmeldung erforderlich; neue Freigaben werden nach Neuladen sichtbar.
4. Rechte mit derselben E-Mail aktualisieren oder über den Papierkorb widerrufen. Der nächste API-Aufruf prüft die aktuellen Rechte erneut. Die Aufgabenliste wird alle 15 Sekunden aktualisiert.

## Validierung

`npm test` enthält neun automatisierte Tests und prüft Registrierung und Login, falsche Passwörter, Cookie-Eigenschaften, Account-Isolation, fremde Schreibursprünge, Terminvalidierung, Webhook-Hostvalidierung, Aufgabenänderung und -löschung, Sitzungswiderruf sowie Produktionsauslieferung und Sicherheitsheader. Zusätzlich werden automatische Testnachrichten, Verbindungsfehler und der Erhalt einer bisherigen Verbindung nach fehlgeschlagenem Webhook-Wechsel geprüft. Zusätzlich werden Lese-/Bearbeitungsrechte, fremde Bereichs- und Medienzugriffe, Freigabewiderruf, Ergebnislink-Pflicht, Bildprüfung und -anhänge, persönliche Discord-Farben und die Migration alter Daten samt Neustart geprüft. Tests verwenden eine temporäre Datenbank und einen ausdrücklich eingebundenen Discord-Testtransport. Browserprüfung: Titel-Schnellerfassung, Formatvorlagen, Planung, Produktionsnotizen und Checkliste nach Neuladen, Script-Timing und Tonalität, Schutz vor Überschreiben sowie Discord-Test-Erfolg/-Fehler und mobile Aufgabenerfassung.

Für Cloud-Aufgaben den vorhandenen Checkout `/workspace/marketing_tool` verwenden; kein zusätzliches Git-Worktree erforderlich. Nach Snapshot-Wiederherstellung den Server neu mit `npm run dev` starten; Prozesse werden nicht mitgesichert.

Browserprüfung mit zwei Accounts: eigener Bereichslink, Lese- und Bearbeitungsfreigabe, Referenz aus Link, Statuswechsel ohne Vollbildeditor, automatische Spaltenzuordnung, Termin-/Ergebnislink-Pflicht, Bild-Upload und persistente Verknüpfung sowie Profilfarbe und mobile Darstellung.

Zusätzlich geprüft: Username bei Registrierung und Profiländerung, Anzeige statt E-Mail in Discord, Kampagnenlöschung mit Rechteprüfung und Erhalt von Aufgaben sowie acht unterschiedliche GTA-RP-Vorlagen mit passender Szenenstruktur und Videotiming. Browserprüfung bestätigt echtes Drag-and-drop, Kampagnenlöschung ohne Aufgabenverlust, Fraktions-Script, Username-Persistenz und mobile Darstellung.
