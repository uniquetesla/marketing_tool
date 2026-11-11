import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const dir = mkdtempSync(path.join(tmpdir(), "studio-test-"));
const origin = "http://127.0.0.1:3199";
let child;
before(async () => {
  child = spawn(
    process.execPath,
    ["--import", "./fixtures/discord-mock.mjs", "server.js"],
    {
      env: {
        ...process.env,
        PORT: "3199",
        DATA_DIR: dir,
        DISCORD_TEST_LOG: path.join(dir, "discord.log"),
        NODE_ENV: "production",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Startup timeout")), 10000);
    child.stdout.on("data", (data) => {
      if (data.toString().includes("Studio läuft")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on("error", reject);
  });
});
after(() => {
  child?.kill();
  rmSync(dir, { recursive: true, force: true });
});
async function call(url, method = "GET", body, cookie, customOrigin = origin) {
  const r = await fetch(origin + "/api" + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: customOrigin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: r.status,
    body: await r.json().catch(() => null),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
    headers: r.headers,
  };
}
test("authenticated planning lifecycle and account isolation", async () => {
  assert.equal((await call("/tasks")).status, 401);
  const registration = await call("/auth/register", "POST", {
    email: "owner@example.com",
    password: "strong-test-password-2026",
  });
  assert.equal(registration.status, 200);
  assert.match(registration.headers.get("set-cookie"), /HttpOnly/);
  assert.match(registration.headers.get("set-cookie"), /Secure/);
  assert.match(registration.headers.get("set-cookie"), /SameSite=Strict/);
  const cookie = registration.cookie;
  assert.equal(
    (await call("/me", "GET", undefined, cookie)).body.email,
    "owner@example.com",
  );
  assert.equal(
    (
      await call("/auth/login", "POST", {
        email: "owner@example.com",
        password: "wrong-password-long",
      })
    ).status,
    401,
  );
  const task = {
    id: "test-task",
    title: "Launch-Reel",
    description: "Produkt erklären",
    category: "Launch",
    platform: "Instagram",
    format: "Reel",
    status: "In Planung",
    date: "2026-12-10T10:00",
    goal: "Vertrauen stärken",
    audience: "Gründer",
    hook: "Problem & Lösung",
    cta: "Beitrag speichern",
    script: "Mein Script",
  };
  assert.equal(
    (
      await call(
        "/tasks/test-task",
        "PUT",
        task,
        cookie,
        "https://evil.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await call("/tasks/test-task", "PUT", { ...task, date: "" }, cookie))
      .status,
    400,
  );
  assert.equal(
    (await call("/tasks/test-task", "PUT", task, cookie)).status,
    200,
  );
  assert.equal(
    (await call("/tasks", "GET", undefined, cookie)).body[0].script,
    "Mein Script",
  );
  const second = await call("/auth/register", "POST", {
    email: "other@example.com",
    password: "another-strong-password",
  });
  assert.deepEqual(
    (await call("/tasks", "GET", undefined, second.cookie)).body,
    [],
  );
  assert.equal(
    (await call("/tasks/test-task", "PUT", task, second.cookie)).status,
    404,
  );
  assert.equal(
    (await call("/tasks/test-task", "DELETE", undefined, second.cookie)).status,
    404,
  );
  assert.equal(
    (
      await call(
        "/settings",
        "PUT",
        { webhook: "https://evil.example/api/webhooks/123/token" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/settings",
        "PUT",
        { webhook: "https://discord.com.evil.example/api/webhooks/123/token" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/tasks/test-task",
        "PUT",
        { ...task, status: "Fertig (Hochgeladen)" },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/tasks/test-task", "DELETE", undefined, cookie)).status,
    200,
  );
  assert.deepEqual((await call("/tasks", "GET", undefined, cookie)).body, []);
  assert.equal((await call("/logout", "POST", {}, cookie)).status, 200);
  assert.equal((await call("/me", "GET", undefined, cookie)).status, 401);
  const login = await call("/auth/login", "POST", {
    email: "owner@example.com",
    password: "strong-test-password-2026",
  });
  assert.equal(login.status, 200);
});
test("production application and headers", async () => {
  const r = await fetch(origin);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Studio/);
  assert.ok(r.headers.get("content-security-policy"));
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});

test("Discord creates one message and edits the stored message on changes", async () => {
  const session = await call("/auth/register", "POST", {
    email: "discord@example.com",
    password: "discord-test-password-2026",
  });
  const cookie = session.cookie;
  assert.equal(
    (
      await call(
        "/settings",
        "PUT",
        { webhook: "https://discord.com/api/webhooks/123456/test_token" },
        cookie,
      )
    ).status,
    200,
  );
  assert.deepEqual((await call("/settings", "GET", undefined, cookie)).body, {
    connected: true,
  });
  const task = {
    id: "discord-task",
    title: "Discord test",
    description: "Planung",
    category: "Launch",
    platform: "Instagram",
    format: "Reel",
    status: "Idee",
    date: "",
    goal: "Reichweite",
    audience: "Team",
    hook: "Problem & Lösung",
    cta: "Folgen",
    script: "Mein Script",
  };
  assert.equal(
    (await call("/tasks/discord-task", "PUT", task, cookie)).body.discord,
    "Synchronisiert",
  );
  assert.equal(
    (
      await call(
        "/tasks/discord-task",
        "PUT",
        { ...task, status: "In Bearbeitung" },
        cookie,
      )
    ).body.discord,
    "Synchronisiert",
  );
  const events = readFileSync(path.join(dir, "discord.log"), "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(events[0].method, "POST");
  assert.ok(events[0].url.endsWith("?wait=true"));
  assert.equal(events[1].method, "PATCH");
  assert.ok(events[1].url.endsWith("/messages/987654321"));
  assert.equal(events[1].body.embeds[0].fields[0].value, "In Bearbeitung");
  assert.deepEqual(events[1].body.allowed_mentions, { parse: [] });
  assert.ok(
    events[1].body.embeds[0].fields.some((f) => f.name === "Videoscript"),
  );
  assert.equal(
    (await call("/tasks/discord-task", "DELETE", undefined, cookie)).status,
    200,
  );
  const last = JSON.parse(
    readFileSync(path.join(dir, "discord.log"), "utf8")
      .trim()
      .split("\n")
      .at(-1),
  );
  assert.equal(last.method, "DELETE");
});
