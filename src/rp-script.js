export const rpTypes = [
  "Server-Feature",
  "Neue Funktion / Update",
  "Fraktion vorstellen",
  "Job & Wirtschaft",
  "Event ankündigen",
  "Einsteiger-Guide",
  "RP-Story / Highlight",
  "Community & Recruiting",
];
export const rpGoals = [
  "Neue Spieler gewinnen",
  "Bestehende Spieler informieren",
  "Fraktionsmitglieder gewinnen",
  "Event-Teilnahme steigern",
  "Community aktivieren",
];
export const rpCtas = [
  "Unserem Discord beitreten",
  "Jetzt auf dem Server einreisen",
  "Für die Fraktion bewerben",
  "Für das Event anmelden",
  "Feedback im Discord geben",
  "Mit deiner RP-Crew teilen",
];
const concepts = {
  "Server-Feature": {
    hook: "Was wäre, wenn dein nächster RP-Abend mit [Feature] beginnt?",
    scene:
      "Zeige das Feature in einer echten Ingame-Situation: Einstieg → Aktion → sichtbares Ergebnis.",
    value:
      "Erkläre, welche RP-Möglichkeiten entstehen und wer das Feature nutzen kann. Zeige den tatsächlichen Ablauf statt nur ein Menü.",
    proof:
      "Nimm echte Spielszenen auf. Nenne Voraussetzungen, Kosten und Einschränkungen nur, wenn sie bestätigt sind.",
  },
  "Neue Funktion / Update": {
    hook: "Neu in unserer Stadt: [Funktion]. Das ändert sich für deinen Charakter.",
    scene:
      "Zeige denselben Ablauf vor und nach dem Update. Blende den tatsächlichen Release-Termin ein.",
    value:
      "Erkläre die wichtigste Änderung, wie Spieler sie finden und was sie konkret tun müssen. Trenne bereits verfügbare Inhalte von geplanten.",
    proof:
      "Nutze den aktuellen Build und bestätigte Patchnotes. Markiere Testserver-Aufnahmen klar als Vorschau.",
  },
  "Fraktion vorstellen": {
    hook: "Hinter jedem Funkruf steckt eine Geschichte. Das ist [Fraktionsname].",
    scene:
      "Eröffne mit einer typischen Szene der Fraktion: Einsatz, Treffpunkt oder Alltag. Dann Team und Aufgaben zeigen.",
    value:
      "Stelle Rolle im RP, typische Spielsituationen, Einstiegsvoraussetzungen und Ansprechpartner vor. Zeige, welchen Charakter jemand hier spielen kann.",
    proof:
      "Zeige freigegebene Szenen und Outfits. Keine internen Taktiken, geheimen Standorte oder IC-Informationen als OOC-Wissen verraten.",
  },
  "Job & Wirtschaft": {
    hook: "Dein erster Arbeitstag in [Jobname]: Mehr als nur Geld verdienen.",
    scene:
      "Begleite einen Charakter vom Jobstart bis zur ersten Interaktion mit anderen Spielern.",
    value:
      "Zeige Einstieg, Ausrüstung, Zusammenarbeit und entstehende RP-Situationen. Nenne keine erfundenen Verdienstzahlen oder Exploits.",
    proof:
      "Nutze reale Job-Abläufe und bestätigte Voraussetzungen; vermeide Anleitungen zum Ausnutzen von Spielsystemen.",
  },
  "Event ankündigen": {
    hook: "Am [Datum] wird es in unserer Stadt nicht ruhig: [Eventname].",
    scene:
      "Zeige einen kurzen Teaser von Location und Atmosphäre, ohne Überraschungen zu spoilern.",
    value:
      "Nenne Datum, Uhrzeit mit Zeitzone, Treffpunkt, Teilnahmebedingungen und Anmeldeweg. Sage ausdrücklich, ob das Event IC oder OOC ist.",
    proof:
      "Prüfe Termin und Organisation. Preise oder Belohnungen nur erwähnen, wenn sie bestätigt sind.",
  },
  "Einsteiger-Guide": {
    hook: "Neu in der Stadt? Diese drei Schritte helfen dir bei deiner ersten Einreise.",
    scene:
      "Zeige die ersten Schritte aus Sicht eines neuen Charakters: Verbindung, Einreise und erste RP-Begegnung.",
    value:
      "Erkläre Discord, Regelwerk, gegebenenfalls Whitelist und erste Anlaufstellen in klarer Reihenfolge. Gib einen konkreten Tipp für gutes Einsteiger-RP.",
    proof:
      "Zeige den aktuellen Einreiseprozess. Keine vereinfachten Versprechen wie garantierte Freischaltung oder sofortige Zulassung.",
  },
  "RP-Story / Highlight": {
    hook: "Ein Anruf. Eine Entscheidung. Und plötzlich war alles anders.",
    scene:
      "Baue eine freigegebene Szene in Anfang → Wendepunkt → Cliffhanger auf. Dialog vor Effekten.",
    value:
      "Erzähle aus Sicht des Charakters. Gib genug Kontext, damit auch neue Zuschauer mitkommen. Verrate nicht das gesamte Ende.",
    proof:
      "Verwende nur freigegebene Aufnahmen. Namen, Stimmen und sensible RP-Details bei Bedarf anonymisieren; IC und OOC sauber trennen.",
  },
  "Community & Recruiting": {
    hook: "Du suchst keine weitere Lobby. Du suchst deine nächste RP-Geschichte.",
    scene:
      "Zeige verschiedene echte Spielsituationen: ziviler Alltag, Fraktionen und gemeinsames RP.",
    value:
      "Beschreibe Server-Konzept, Zielgruppe, Spielstil und bestätigte Besonderheiten. Erkläre, welche Spieler und Charakterideen zur Community passen.",
    proof:
      "Belege Aussagen mit echten Szenen. Keine erfundenen Spielerzahlen, Verfügbarkeits- oder Qualitätsversprechen.",
  },
};
export function buildRpScript(t) {
  const c = concepts[t.rpType] || concepts["Server-Feature"];
  const times =
    t.duration === "15 Sekunden"
      ? ["0–2", "2–4", "4–10", "10–12", "12–15"]
      : t.duration === "60–90 Sekunden"
        ? ["0–5", "5–15", "15–55", "55–75", "75–90"]
        : ["0–3", "3–8", "8–25", "25–35", "35–45"];
  const hooks = {
    "Problem & Lösung":
      "[Zeige ein konkretes Problem im RP und löse es mit dem vorgestellten Inhalt.]",
    "Überraschender Fakt":
      "[Eröffne mit einer belegbaren Besonderheit statt einem unbestätigten Superlativ.]",
    "Vorher & Nachher":
      "[Schneide alte und neue Spielsituation direkt gegeneinander.]",
    "3 schnelle Tipps":
      "[Drei kurze Ingame-Beispiele, jeweils mit klarer Texteinblendung.]",
  };
  const topic = t.title || "[Konkretes Thema ergänzen]";
  const opening = c.hook.replace(
    /\[(Feature|Funktion|Fraktionsname|Jobname|Eventname)\]/g,
    topic,
  );
  return `GTA-RP · PRODUKTIONSBRIEFING\nServer: ${t.serverName || "[Servername]"}\nThema: ${t.title || "[Titel]"}\nContent: ${t.rpType || "Server-Feature"} · ${t.platform} · ${t.format} · ${t.duration}\nZiel: ${t.goal} · Tonalität: ${t.tone}\nZielgruppe: ${t.audience || "Neue und aktive GTA-RP-Spieler"}\n\nHOOK · ${times[0]} SEKUNDEN\n${opening}\n${hooks[t.hook] || ""}\n\nSZENE & KONTEXT · ${times[1]} SEKUNDEN\n${c.scene}\n${t.description || "[Ergänze die konkrete Besonderheit deines Servers.]"}\n\nHAUPTTEIL · ${times[2]} SEKUNDEN\n${c.value}\n${t.duration === "15 Sekunden" ? "[Konzentriere dich auf eine Kernbotschaft und einen kurzen Gameplay-Beleg.]" : "[Plane 2–3 kurze Gameplay-Einstellungen. Ergänze Sprechertext, Kamera und Texteinblendungen.]"}\n\nGAMEPLAY-BELEG · ${times[3]} SEKUNDEN\n${c.proof}\n\nCALL TO ACTION · ${times[4]} SEKUNDEN\n${t.cta || "Unserem Discord beitreten"}.\n[Discord-/Einreise-Link als Texteinblendung. Serverlogo als Schlussbild.]\n\nDREH-CHECK\n• HUD, Chat, Spielernamen und Kennzeichen auf sensible Daten prüfen.\n• IC und OOC trennen; keine Metagaming-Informationen veröffentlichen.\n• Einverständnis für Stimmen und Szenen klären; Musikrechte und Serverregeln beachten.\n• Untertitel, vertikalen Bildausschnitt und verständlichen Originalton prüfen.`;
}
