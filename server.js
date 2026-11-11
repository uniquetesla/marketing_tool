import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

mkdirSync(process.env.DATA_DIR || "data", { recursive: true, mode: 0o700 });
const db = new DatabaseSync(
  path.join(process.env.DATA_DIR || "data", "studio.db"),
);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(user_id INTEGER PRIMARY KEY REFERENCES users(id), webhook TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,message_id TEXT,updated INTEGER NOT NULL);`);
export const statuses = [
  "Idee",
  "Wird umgesetzt",
  "Abgelehnt",
  "In Bearbeitung",
  "In Planung",
  "Fertig (auf Upload warten)",
  "Fertig (Hochgeladen)",
];
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex"),
  );
}
export function validWebhook(value) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "discord.com" &&
      !u.port &&
      !u.search &&
      !u.hash &&
      /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(u.pathname)
    );
  } catch {
    return false;
  }
}
const app = express();
const production = process.env.NODE_ENV === "production";
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: production
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            upgradeInsecureRequests: null,
          },
        }
      : false,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    if (!origin || origin !== `${req.protocol}://${req.get("host")}`)
      return res.status(403).json({ error: "Ungültiger Anfrageursprung." });
  }
  next();
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
function cookie(res, token, age = 604800) {
  res.cookie("studio_session", token, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    maxAge: age * 1000,
    path: "/",
  });
}
function auth(req, res, next) {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("studio_session="))
    ?.slice(15);
  if (token) {
    const session = db
      .prepare("SELECT user_id FROM sessions WHERE token=? AND expires>?")
      .get(createHash("sha256").update(token).digest("hex"), Date.now());
    if (session) {
      req.user = session.user_id;
      return next();
    }
  }
  res.status(401).json({ error: "Bitte melde dich an." });
}
app.post("/api/auth/:action", authLimit, (req, res) => {
  const { email, password } = req.body;
  if (!["login", "register"].includes(req.params.action))
    return res.sendStatus(404);
  if (
    typeof email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 256
  )
    return res
      .status(400)
      .json({
        error:
          "Gültige E-Mail und Passwort mit mindestens 12 Zeichen erforderlich.",
      });
  const normalized = email.trim().toLowerCase();
  let user = db.prepare("SELECT * FROM users WHERE email=?").get(normalized);
  if (req.params.action === "register") {
    if (user)
      return res
        .status(400)
        .json({
          error: "Registrierung nicht möglich. Versuche die Anmeldung.",
        });
    const result = db
      .prepare("INSERT INTO users(email,password) VALUES(?,?)")
      .run(normalized, hashPassword(password));
    user = { id: Number(result.lastInsertRowid), email: normalized };
  } else if (!user || !verifyPassword(password, user.password))
    return res.status(401).json({ error: "E-Mail oder Passwort ist falsch." });
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    createHash("sha256").update(token).digest("hex"),
    user.id,
    Date.now() + 604800000,
  );
  cookie(res, token);
  res.json({ email: user.email });
});
app.get("/api/me", auth, (req, res) =>
  res.json(db.prepare("SELECT email FROM users WHERE id=?").get(req.user)),
);
app.post("/api/logout", auth, (req, res) => {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("studio_session="))
    ?.slice(15);
  db.prepare("DELETE FROM sessions WHERE token=?").run(
    createHash("sha256").update(token).digest("hex"),
  );
  cookie(res, "", 0);
  res.json({ ok: true });
});
app.get("/api/tasks", auth, (req, res) =>
  res.json(
    db
      .prepare("SELECT body FROM tasks WHERE user_id=? ORDER BY updated DESC")
      .all(req.user)
      .map((r) => JSON.parse(r.body)),
  ),
);
async function syncDiscord(user, id) {
  const row = db
    .prepare("SELECT * FROM tasks WHERE user_id=? AND id=?")
    .get(user, id);
  const webhook = db
    .prepare("SELECT webhook FROM settings WHERE user_id=?")
    .get(user)?.webhook;
  if (!webhook) return "Nicht verbunden";
  const task = JSON.parse(row.body);
  const colors = [
    0x8b80f9, 0x4d79f6, 0xe47a7a, 0xf1ae4c, 0x55b8c5, 0x8b80f9, 0x58b68d,
  ];
  const payload = {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: task.title.slice(0, 256),
        description: (task.description || "Neue Content-Idee").slice(0, 4096),
        color: colors[statuses.indexOf(task.status)],
        fields: [
          { name: "Status", value: task.status, inline: true },
          {
            name: "Kampagne",
            value: task.category || "Allgemein",
            inline: true,
          },
          {
            name: "Veröffentlichung",
            value: task.date ? task.date.replace("T", " · ") : "Noch offen",
            inline: true,
          },
          {
            name: "Plattform / Format",
            value: `${task.platform} · ${task.format}`,
            inline: true,
          },
          ...(task.script
            ? [{ name: "Videoscript", value: task.script.slice(0, 1024) }]
            : []),
        ],
        footer: { text: "STUDIO • Marketing Planner" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
  let url =
    webhook + (row.message_id ? "/messages/" + row.message_id : "?wait=true");
  let response = await fetch(url, {
    method: row.message_id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404 && row.message_id) {
    response = await fetch(webhook + "?wait=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  }
  if (!response.ok)
    throw new Error(
      "Discord nicht erreichbar (HTTP " +
        response.status +
        "). Aufgabe ist gespeichert.",
    );
  const message = await response.json();
  db.prepare("UPDATE tasks SET message_id=? WHERE id=? AND user_id=?").run(
    message.id,
    id,
    user,
  );
  return "Synchronisiert";
}
const queues = new Map();
function queuedSync(user, id) {
  const key = user + ":" + id;
  const promise = (queues.get(key) || Promise.resolve())
    .catch(() => {})
    .then(() => syncDiscord(user, id));
  queues.set(key, promise);
  promise
    .finally(() => {
      if (queues.get(key) === promise) queues.delete(key);
    })
    .catch(() => {});
  return promise;
}
app.put("/api/tasks/:id", auth, async (req, res) => {
  const t = req.body;
  if (
    !/^[a-zA-Z0-9-]{1,64}$/.test(req.params.id) ||
    typeof t.title !== "string" ||
    !t.title.trim() ||
    t.title.length > 200 ||
    !statuses.includes(t.status) ||
    [
      "description",
      "category",
      "platform",
      "format",
      "goal",
      "audience",
      "hook",
      "cta",
      "script",
      "date",
    ].some((k) => typeof t[k] !== "string" || t[k].length > 12000) ||
    (t.status === "In Planung" && !t.date) ||
    (t.date && Number.isNaN(Date.parse(t.date)))
  )
    return res
      .status(400)
      .json({
        error: "Bitte Titel, Status und einen gültigen Planungstermin prüfen.",
      });
  const old = db
    .prepare("SELECT user_id FROM tasks WHERE id=?")
    .get(req.params.id);
  if (old && old.user_id !== req.user) return res.sendStatus(404);
  const task = { ...t, id: req.params.id, title: t.title.trim() };
  db.prepare(
    "INSERT INTO tasks(id,user_id,body,updated) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated=excluded.updated",
  ).run(task.id, req.user, JSON.stringify(task), Date.now());
  try {
    res.json({ task, discord: await queuedSync(req.user, task.id) });
  } catch (e) {
    res.json({ task, discordError: e.message });
  }
});
app.delete("/api/tasks/:id", auth, async (req, res) => {
  const row = db
    .prepare("SELECT * FROM tasks WHERE id=? AND user_id=?")
    .get(req.params.id, req.user);
  if (!row) return res.sendStatus(404);
  const webhook = db
    .prepare("SELECT webhook FROM settings WHERE user_id=?")
    .get(req.user)?.webhook;
  let warning;
  try {
    await queues.get(req.user + ":" + req.params.id);
    const current = db
      .prepare("SELECT message_id FROM tasks WHERE id=?")
      .get(req.params.id);
    if (webhook && current?.message_id) {
      const r = await fetch(webhook + "/messages/" + current.message_id, {
        method: "DELETE",
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok && r.status !== 404)
        warning = "Discord-Nachricht konnte nicht gelöscht werden.";
    }
  } catch {
    warning = "Discord-Nachricht konnte nicht gelöscht werden.";
  }
  db.prepare("DELETE FROM tasks WHERE id=? AND user_id=?").run(
    req.params.id,
    req.user,
  );
  res.json({ ok: true, warning });
});
app.get("/api/settings", auth, (req, res) =>
  res.json({
    connected: !!db
      .prepare("SELECT webhook FROM settings WHERE user_id=?")
      .get(req.user)?.webhook,
  }),
);
app.put("/api/settings", auth, (req, res) => {
  const webhook = req.body.webhook;
  if (typeof webhook !== "string" || (webhook && !validWebhook(webhook)))
    return res
      .status(400)
      .json({
        error:
          "Bitte eine gültige https://discord.com/api/webhooks/… URL eingeben.",
      });
  db.prepare(
    "INSERT INTO settings(user_id,webhook) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET webhook=excluded.webhook",
  ).run(req.user, webhook);
  db.prepare("UPDATE tasks SET message_id=NULL WHERE user_id=?").run(req.user);
  res.json({ connected: !!webhook });
});
app.post("/api/discord/sync", auth, async (req, res) => {
  const rows = db.prepare("SELECT id FROM tasks WHERE user_id=?").all(req.user);
  let failed = 0;
  for (const row of rows) {
    try {
      await queuedSync(req.user, row.id);
    } catch {
      failed++;
    }
  }
  res.json({ total: rows.length, failed });
});
if (!production) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else app.use(express.static("dist"));
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(500)
    .json({ error: "Die Anfrage konnte nicht verarbeitet werden." });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log("Studio läuft auf Port " + port));
