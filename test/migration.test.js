import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { scryptSync } from "node:crypto";
import { spawn } from "node:child_process";

test("existing accounts, tasks, sessions and Discord message IDs survive migration and restart", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "astro-migration-"));
  const db = new DatabaseSync(path.join(dir, "studio.db"));
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
 CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE settings(user_id INTEGER PRIMARY KEY,webhook TEXT NOT NULL DEFAULT '',tested_at TEXT);
 CREATE TABLE tasks(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,body TEXT NOT NULL,message_id TEXT,updated INTEGER NOT NULL);`);
  const salt = "legacy-test-salt",
    password = "legacy-test-password";
  db.prepare("INSERT INTO users VALUES(1,?,?)").run(
    "legacy@example.com",
    salt + ":" + scryptSync(password, salt, 64).toString("hex"),
  );
  const original = {
    id: "legacy-task",
    title: "Vorhandene Aufgabe",
    description: "Erhalten",
    status: "Fertig (Hochgeladen)",
    platform: "Instagram",
    format: "Reel",
    category: "Archiv",
    date: "",
    goal: "Vertrauen stärken",
    audience: "Team",
    hook: "Problem & Lösung",
    cta: "Folgen",
    script: "Alter Script-Text",
  };
  db.prepare("INSERT INTO tasks VALUES(?,?,?,?,?)").run(
    "legacy-task",
    1,
    JSON.stringify(original),
    "12345",
    1,
  );
  db.close();
  let child;
  async function start() {
    child = spawn(process.execPath, ["server.js"], {
      env: {
        ...process.env,
        PORT: "3198",
        DATA_DIR: dir,
        NODE_ENV: "production",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("Migration startup timeout")),
        10000,
      );
      child.stdout.on("data", (d) => {
        if (d.toString().includes("Astro-Media läuft")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.on("exit", (code) => {
        clearTimeout(timer);
        reject(Error("Server exited: " + code));
      });
    });
  }
  async function stop() {
    const process = child;
    await new Promise((resolve) => {
      process.once("exit", resolve);
      process.kill();
    });
    child = null;
  }
  try {
    await start();
    const login = await fetch("http://127.0.0.1:3198/api/auth/login", {
      method: "POST",
      headers: {
        Origin: "http://127.0.0.1:3198",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "legacy@example.com", password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const get = async (endpoint) => {
      const response = await fetch("http://127.0.0.1:3198/api" + endpoint, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200);
      return response.json();
    };
    let tasks = await get("/tasks");
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].script, original.script);
    const spaces = await get("/spaces");
    assert.equal(spaces.length, 1);
    assert.equal(spaces[0].slug, "mein-bereich-1");
    assert.equal(tasks[0].spaceId, spaces[0].id);
    await stop();
    await start();
    tasks = await get("/tasks");
    assert.equal(tasks[0].title, original.title);
    assert.equal((await get("/spaces")).length, 1);
    const check = new DatabaseSync(path.join(dir, "studio.db"));
    assert.equal(
      check
        .prepare("SELECT message_id FROM tasks WHERE id=?")
        .get("legacy-task").message_id,
      "12345",
    );
    check.close();
  } finally {
    if (child) await stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
