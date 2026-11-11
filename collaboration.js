import express from "express";
import { randomUUID } from "node:crypto";

export function collaboration(app, db, auth) {
  const add = (table, column, definition) => {
    if (
      !db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((c) => c.name === column)
    )
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  };
  add("users", "color", "TEXT NOT NULL DEFAULT '#9476ce'");
  add("users", "username", "TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE users SET username='Astro-' || id WHERE username=''");
  db.exec(`CREATE TABLE IF NOT EXISTS spaces(id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,owner_id INTEGER NOT NULL REFERENCES users(id));
  CREATE TABLE IF NOT EXISTS members(space_id TEXT NOT NULL REFERENCES spaces(id),user_id INTEGER NOT NULL REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('viewer','editor')),PRIMARY KEY(space_id,user_id));
  CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,space_id TEXT NOT NULL REFERENCES spaces(id),user_id INTEGER NOT NULL REFERENCES users(id),name TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,content BLOB NOT NULL,created TEXT NOT NULL);`);
  add("tasks", "space_id", "TEXT REFERENCES spaces(id)");
  add("tasks", "updated_by", "INTEGER REFERENCES users(id)");
  const fail = (status, message) => {
    const e = new Error(message);
    e.status = status;
    throw e;
  };
  function defaultSpace(user) {
    let space = db
      .prepare("SELECT * FROM spaces WHERE owner_id=? ORDER BY rowid LIMIT 1")
      .get(user);
    if (!space) {
      const id = randomUUID();
      db.prepare("INSERT INTO spaces VALUES(?,?,?,?)").run(
        id,
        "mein-bereich-" + user,
        "Mein Aufgabenbereich",
        user,
      );
      space = db.prepare("SELECT * FROM spaces WHERE id=?").get(id);
    }
    return space;
  }
  for (const user of db.prepare("SELECT id FROM users").all()) {
    const space = defaultSpace(user.id);
    db.prepare(
      "UPDATE tasks SET space_id=? WHERE user_id=? AND space_id IS NULL",
    ).run(space.id, user.id);
  }
  function access(spaceId, user, write = false) {
    const space = db
      .prepare(
        "SELECT s.*,CASE WHEN s.owner_id=? THEN 'owner' ELSE m.role END role FROM spaces s LEFT JOIN members m ON m.space_id=s.id AND m.user_id=? WHERE s.id=?",
      )
      .get(user, user, spaceId);
    if (!space?.role)
      fail(404, "Aufgabenbereich nicht gefunden oder nicht freigegeben.");
    if (write && space.role === "viewer")
      fail(403, "Dieser Aufgabenbereich ist nur zum Ansehen freigegeben.");
    return space;
  }
  function selected(req, write = false) {
    let space;
    if (req.query.space) {
      space = db
        .prepare("SELECT * FROM spaces WHERE slug=?")
        .get(req.query.space);
      if (!space) fail(404, "Aufgabenbereich nicht gefunden.");
    } else space = defaultSpace(req.user);
    return access(space.id, req.user, write);
  }
  app.get("/api/spaces", auth, (req, res) => {
    defaultSpace(req.user);
    res.json(
      db
        .prepare(
          "SELECT s.id,s.slug,s.name,CASE WHEN s.owner_id=? THEN 'owner' ELSE m.role END role FROM spaces s LEFT JOIN members m ON m.space_id=s.id AND m.user_id=? WHERE s.owner_id=? OR m.user_id=? ORDER BY s.rowid",
        )
        .all(req.user, req.user, req.user, req.user),
    );
  });
  app.post("/api/spaces", auth, (req, res) => {
    const name =
      typeof req.body?.name === "string" ? req.body.name.trim() : null;
    if (typeof name !== "string" || !name || name.length > 80)
      fail(400, "Bitte einen Bereichsnamen mit maximal 80 Zeichen eingeben.");
    let slug =
      name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 65) || "bereich";
    if (
      ["api", "assets", "settings", "login", "media"].includes(slug) ||
      db.prepare("SELECT id FROM spaces WHERE slug=?").get(slug)
    )
      slug += "-" + randomUUID().slice(0, 8);
    const id = randomUUID();
    db.prepare("INSERT INTO spaces VALUES(?,?,?,?)").run(
      id,
      slug,
      name,
      req.user,
    );
    res.status(201).json({ ...access(id, req.user), role: "owner" });
  });
  const bySlug = (req) => {
    const s = db
      .prepare("SELECT id FROM spaces WHERE slug=?")
      .get(req.params.slug);
    if (!s) fail(404, "Aufgabenbereich nicht gefunden.");
    return access(s.id, req.user);
  };
  app.get("/api/spaces/:slug", auth, (req, res) => res.json(bySlug(req)));
  app.get("/api/spaces/:slug/members", auth, (req, res) => {
    const s = bySlug(req);
    if (s.role !== "owner")
      fail(403, "Nur der Eigentümer verwaltet Freigaben.");
    res.json(
      db
        .prepare(
          "SELECT u.id,u.email,u.color,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.space_id=?",
        )
        .all(s.id),
    );
  });
  app.post("/api/spaces/:slug/members", auth, (req, res) => {
    const s = bySlug(req);
    if (s.role !== "owner")
      fail(403, "Nur der Eigentümer verwaltet Freigaben.");
    const { email, role } = req.body;
    if (typeof email !== "string" || !["viewer", "editor"].includes(role))
      fail(400, "E-Mail und Leserecht oder Bearbeitungsrecht erforderlich.");
    const user = db
      .prepare("SELECT id FROM users WHERE email=?")
      .get(email.trim().toLowerCase());
    if (!user)
      fail(400, "Diese Person muss sich zuerst bei Astro-Media registrieren.");
    if (user.id === req.user) fail(400, "Du bist bereits Eigentümer.");
    db.prepare(
      "INSERT INTO members VALUES(?,?,?) ON CONFLICT(space_id,user_id) DO UPDATE SET role=excluded.role",
    ).run(s.id, user.id, role);
    res.json({ ok: true, url: "/" + s.slug });
  });
  app.delete("/api/spaces/:slug/members/:id", auth, (req, res) => {
    const s = bySlug(req);
    if (s.role !== "owner")
      fail(403, "Nur der Eigentümer verwaltet Freigaben.");
    db.prepare("DELETE FROM members WHERE space_id=? AND user_id=?").run(
      s.id,
      req.params.id,
    );
    res.json({ ok: true });
  });
  app.put("/api/profile", auth, (req, res) => {
    if (!/^#[a-fA-F0-9]{6}$/.test(req.body.color || ""))
      fail(400, "Ungültige Farbe.");
    const username = req.body.username;
    if (
      username !== undefined &&
      (typeof username !== "string" ||
        username.trim().length < 2 ||
        username.trim().length > 32 ||
        /[\x00-\x1f]/.test(username))
    )
      fail(400, "Der Username muss 2–32 Zeichen lang sein.");
    db.prepare(
      "UPDATE users SET color=?,username=COALESCE(?,username) WHERE id=?",
    ).run(req.body.color, username?.trim() ?? null, req.user);
    res.json(
      db
        .prepare("SELECT email,color,username FROM users WHERE id=?")
        .get(req.user),
    );
  });
  app.get("/api/assets", auth, (req, res) => {
    const s = selected(req);
    res.json(
      db
        .prepare(
          "SELECT id,name,mime,bytes,created FROM assets WHERE space_id=? ORDER BY created DESC",
        )
        .all(s.id),
    );
  });
  app.post(
    "/api/assets",
    auth,
    express.raw({ type: "application/octet-stream", limit: "8mb" }),
    (req, res) => {
      const s = selected(req, true);
      const data = req.body;
      if (!Buffer.isBuffer(data) || !data.length)
        fail(400, "Bitte eine Bilddatei auswählen.");
      let mime;
      if (
        data
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        mime = "image/png";
      else if (data[0] === 255 && data[1] === 216 && data[2] === 255)
        mime = "image/jpeg";
      else if (
        data.subarray(0, 4).toString() === "RIFF" &&
        data.subarray(8, 12).toString() === "WEBP"
      )
        mime = "image/webp";
      else if (["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString()))
        mime = "image/gif";
      else fail(400, "Erlaubt sind PNG, JPEG, WebP und GIF (maximal 8 MB).");
      const used = db
        .prepare(
          "SELECT COALESCE(SUM(bytes),0) bytes,COUNT(*) count FROM assets WHERE space_id=?",
        )
        .get(s.id);
      if (used.bytes + data.length > 100 * 1024 * 1024 || used.count >= 500)
        fail(
          400,
          "Das Medienlimit dieses Bereichs ist erreicht (100 MB / 500 Bilder).",
        );
      let name;
      try {
        name = decodeURIComponent(req.get("X-File-Name") || "Bild");
      } catch {
        fail(400, "Ungültiger Dateiname.");
      }
      name = name.replace(/[\x00-\x1f]/g, "").slice(0, 200) || "Bild";
      const id = randomUUID(),
        created = new Date().toISOString();
      db.prepare("INSERT INTO assets VALUES(?,?,?,?,?,?,?,?)").run(
        id,
        s.id,
        req.user,
        name,
        mime,
        data.length,
        data,
        created,
      );
      res.status(201).json({ id, name, mime, bytes: data.length, created });
    },
  );
  app.get("/api/assets/:id", auth, (req, res) => {
    const asset = db
      .prepare("SELECT * FROM assets WHERE id=?")
      .get(req.params.id);
    if (!asset) fail(404, "Bild nicht gefunden.");
    access(asset.space_id, req.user);
    res
      .set({
        "Content-Type": asset.mime,
        "Content-Disposition":
          "inline; filename*=UTF-8''" + encodeURIComponent(asset.name),
        "X-Content-Type-Options": "nosniff",
      })
      .send(Buffer.from(asset.content));
  });
  app.delete("/api/assets/:id", auth, (req, res) => {
    const asset = db
      .prepare("SELECT space_id FROM assets WHERE id=?")
      .get(req.params.id);
    if (!asset) fail(404, "Bild nicht gefunden.");
    access(asset.space_id, req.user, true);
    db.exec("BEGIN");
    try {
      for (const row of db
        .prepare("SELECT id,body FROM tasks WHERE space_id=?")
        .all(asset.space_id)) {
        const task = JSON.parse(row.body);
        if (task.assetIds?.includes(req.params.id)) {
          task.assetIds = task.assetIds.filter((id) => id !== req.params.id);
          db.prepare("UPDATE tasks SET body=? WHERE id=?").run(
            JSON.stringify(task),
            row.id,
          );
        }
      }
      db.prepare("DELETE FROM assets WHERE id=?").run(req.params.id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    res.json({ ok: true });
  });
  return { access, selected, defaultSpace, fail };
}
