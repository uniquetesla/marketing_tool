import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRpScript, rpTypes, rpGoals, rpCtas } from "../src/rp-script.js";
const base = {
  title: "LSPD stellt sich vor",
  serverName: "Astro RP",
  platform: "TikTok",
  format: "Video",
  duration: "15 Sekunden",
  tone: "Nahbar & direkt",
  goal: rpGoals[0],
  cta: rpCtas[0],
  hook: "Problem & Lösung",
  audience: "Neue Spieler",
};
test("GTA RP formats produce different gameplay plans and honor briefing and duration", () => {
  const scripts = rpTypes.map((rpType) => buildRpScript({ ...base, rpType }));
  assert.equal(new Set(scripts).size, 8);
  for (const script of scripts) {
    assert.match(script, /Astro RP/);
    assert.match(script, /12–15/);
    assert.match(script, /IC und OOC/);
    assert.match(script, /Discord/);
    assert.ok(!script.includes("undefined"));
  }
  const faction = buildRpScript({ ...base, rpType: "Fraktion vorstellen" });
  assert.match(faction, /Einstiegsvoraussetzungen/);
  assert.match(faction, /internen Taktiken/);
  const update = buildRpScript({ ...base, rpType: "Neue Funktion / Update" });
  assert.match(update, /Patchnotes/);
  assert.match(update, /Vorschau/);
  const event = buildRpScript({
    ...base,
    rpType: "Event ankündigen",
    duration: "60–90 Sekunden",
  });
  assert.match(event, /Zeitzone/);
  assert.match(event, /75–90/);
});
