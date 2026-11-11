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
      if (data.toString().includes("Astro-Media läuft")) {
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
        {
          ...task,
          status: "Fertig (Hochgeladen)",
          completionUrl: "https://example.com/video",
        },
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
  assert.match(await r.text(), /Astro-Media/);
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
  const settings = (await call("/settings", "GET", undefined, cookie)).body;
  assert.equal(settings.connected, true);
  assert.ok(settings.testedAt);
  assert.equal(settings.webhook, undefined);
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
  assert.equal(events[0].body.embeds[0].title, "🚀 Astro-Media ist verbunden");
  assert.equal(events[0].method, "POST");
  assert.equal(events[1].method, "POST");
  assert.ok(events[0].url.endsWith("?wait=true"));
  assert.equal(events[2].method, "PATCH");
  assert.ok(events[2].url.endsWith("/messages/987654321"));
  assert.equal(events[2].body.embeds[0].fields[0].value, "In Bearbeitung");
  assert.deepEqual(events[2].body.allowed_mentions, { parse: [] });
  assert.ok(
    events[2].body.embeds[0].fields.some((f) => f.name === "📝 Videoscript"),
  );
  const failedReplacement = await call(
    "/settings",
    "PUT",
    { webhook: "https://discord.com/api/webhooks/123456/invalid_token" },
    cookie,
  );
  assert.equal(failedReplacement.status, 502);
  assert.match(failedReplacement.body.error, /nicht mehr/);
  assert.equal(
    (await call("/settings", "GET", undefined, cookie)).body.connected,
    true,
  );
  const repeatTest = await call("/discord/test", "POST", {}, cookie);
  assert.equal(repeatTest.status, 200);
  assert.ok(repeatTest.body.testedAt);
  assert.equal(
    (
      await call(
        "/tasks/discord-task",
        "PUT",
        {
          ...task,
          status: "In Planung",
          date: "2026-12-20T10:00",
          owner: "Anna",
          notes: "Drehort Berlin",
          duration: "15 Sekunden",
          tone: "Nahbar & direkt",
          checklist: ["Script finalisiert"],
        },
        cookie,
      )
    ).body.discord,
    "Synchronisiert",
  );
  const afterFailedReplacement = readFileSync(
    path.join(dir, "discord.log"),
    "utf8",
  )
    .trim()
    .split("\n")
    .map(JSON.parse)
    .at(-1);
  assert.equal(afterFailedReplacement.method, "PATCH");
  assert.ok(afterFailedReplacement.url.includes("/test_token/messages/"));
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

test("Discord failures never claim a connection or discard existing tasks", async () => {
  const login = await call("/auth/register", "POST", {
    email: "failure@example.com",
    password: "test-failure-password",
  });
  const cookie = login.cookie;
  const failed = await call(
    "/settings",
    "PUT",
    { webhook: "https://discord.com/api/webhooks/123456/denied_token" },
    cookie,
  );
  assert.equal(failed.status, 502);
  assert.match(failed.body.error, /Netzwerkfreigabe/);
  assert.equal(
    (await call("/settings", "GET", undefined, cookie)).body.connected,
    false,
  );
  assert.equal((await call("/discord/test", "POST", {}, cookie)).status, 400);
  assert.equal((await call("/discord/sync", "POST", {}, cookie)).status, 400);
});

test("shared spaces enforce roles, media access, revocation and completion links", async () => {
  const owner = await call("/auth/register", "POST", {
    email: "space-owner@example.com",
    password: "owner-space-password-2026",
  });
  const member = await call("/auth/register", "POST", {
    email: "space-member@example.com",
    password: "member-space-password-2026",
  });
  const outsider = await call("/auth/register", "POST", {
    email: "outsider@example.com",
    password: "outside-space-password-2026",
  });
  const created = await call(
    "/spaces",
    "POST",
    { name: "Sommer Kampagne" },
    owner.cookie,
  );
  assert.equal(created.status, 201);
  const space = created.body;
  assert.equal(space.slug, "sommer-kampagne");
  assert.equal(
    (await call("/spaces/" + space.slug, "GET", undefined, outsider.cookie))
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        "/spaces/" + space.slug + "/members",
        "POST",
        { email: "space-member@example.com", role: "viewer" },
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/spaces/" + space.slug, "GET", undefined, member.cookie)).body
      .role,
    "viewer",
  );
  const task = {
    id: "shared-task",
    spaceId: space.id,
    title: "Gemeinsames Video",
    description: "Referenz",
    category: "Launch",
    platform: "TikTok",
    format: "Video",
    status: "Idee",
    date: "",
    goal: "Reichweite aufbauen",
    audience: "Team",
    hook: "Problem & Lösung",
    cta: "Folgen",
    script: "Plan",
    exampleUrl: "https://example.com/inspiration",
    assetIds: [],
  };
  assert.equal(
    (await call("/tasks/shared-task", "PUT", task, owner.cookie)).status,
    200,
  );
  assert.equal(
    (await call("/tasks?space=" + space.slug, "GET", undefined, member.cookie))
      .body.length,
    1,
  );
  assert.equal(
    (await call("/tasks/shared-task", "PUT", task, member.cookie)).status,
    403,
  );
  assert.equal(
    (await call("/tasks/shared-task", "DELETE", undefined, member.cookie))
      .status,
    403,
  );
  assert.equal(
    (
      await call(
        "/spaces/" + space.slug + "/members",
        "POST",
        { email: "outsider@example.com", role: "editor" },
        member.cookie,
      )
    ).status,
    403,
  );
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6WsAAAAASUVORK5CYII=",
    "base64",
  );
  const upload = async (cookie, data = png) => {
    const response = await fetch(origin + "/api/assets?space=" + space.slug, {
      method: "POST",
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
        "X-File-Name": "beispiel.png",
      },
      body: data,
    });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await upload(member.cookie)).status, 403);
  const image = await upload(owner.cookie);
  assert.equal(image.status, 201);
  assert.equal(image.body.mime, "image/png");
  assert.equal(
    (await call("/assets?space=" + space.slug, "GET", undefined, member.cookie))
      .body.length,
    1,
  );
  assert.equal(
    (
      await fetch(origin + "/api/assets/" + image.body.id, {
        headers: { Cookie: outsider.cookie },
      })
    ).status,
    404,
  );
  const read = await fetch(origin + "/api/assets/" + image.body.id, {
    headers: { Cookie: member.cookie },
  });
  assert.equal(read.status, 200);
  assert.equal(read.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await read.arrayBuffer()), png);
  assert.equal(
    (await upload(owner.cookie, Buffer.from('<svg onload="alert(1)"></svg>')))
      .status,
    400,
  );
  assert.equal(
    (
      await call(
        "/spaces/" + space.slug + "/members",
        "POST",
        { email: "space-member@example.com", role: "editor" },
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/tasks/shared-task",
        "PUT",
        { ...task, assetIds: [image.body.id], status: "Fertig (Hochgeladen)" },
        member.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/tasks/shared-task",
        "PUT",
        { ...task, completionUrl: "javascript:alert(1)" },
        member.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/tasks/shared-task",
        "PUT",
        {
          ...task,
          assetIds: [image.body.id],
          status: "Fertig (Hochgeladen)",
          completionUrl: "https://example.com/result",
        },
        member.cookie,
      )
    ).status,
    200,
  );
  const ownSpace = (
    await call("/spaces", "GET", undefined, member.cookie)
  ).body.find((s) => s.role === "owner");
  assert.equal(
    (
      await call(
        "/tasks/new-foreign-asset",
        "PUT",
        {
          ...task,
          id: "new-foreign-asset",
          spaceId: ownSpace.id,
          assetIds: [image.body.id],
        },
        member.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("/assets/" + image.body.id, "DELETE", undefined, member.cookie))
      .status,
    200,
  );
  assert.deepEqual(
    (await call("/tasks?space=" + space.slug, "GET", undefined, owner.cookie))
      .body[0].assetIds,
    [],
  );
  const membership = (
    await call(
      "/spaces/" + space.slug + "/members",
      "GET",
      undefined,
      owner.cookie,
    )
  ).body[0];
  assert.equal(
    (
      await call(
        "/spaces/" + space.slug + "/members/" + membership.id,
        "DELETE",
        undefined,
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/spaces/" + space.slug, "GET", undefined, member.cookie))
      .status,
    404,
  );
  assert.equal(
    (await call("/tasks/shared-task", "PUT", task, member.cookie)).status,
    404,
  );
  const deep = await fetch(origin + "/" + space.slug);
  assert.equal(deep.status, 200);
  assert.match(await deep.text(), /Astro-Media/);
});

test("Discord shared changes use editor color and owners webhook", async () => {
  const owner = await call("/auth/register", "POST", {
    email: "color-owner@example.com",
    password: "owner-color-password-2026",
  });
  const editor = await call("/auth/register", "POST", {
    email: "color-editor@example.com",
    password: "editor-color-password-2026",
  });
  const space = (
    await call("/spaces", "POST", { name: "Farben" }, owner.cookie)
  ).body;
  assert.equal(
    (await call("/profile", "PUT", { color: "#12ab34" }, editor.cookie)).status,
    200,
  );
  assert.equal(
    (await call("/profile", "PUT", { color: "red" }, editor.cookie)).status,
    400,
  );
  assert.equal(
    (
      await call(
        "/spaces/" + space.slug + "/members",
        "POST",
        { email: "color-editor@example.com", role: "editor" },
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/settings",
        "PUT",
        { webhook: "https://discord.com/api/webhooks/123456/color_owner" },
        owner.cookie,
      )
    ).status,
    200,
  );
  const task = {
    id: "color-task",
    spaceId: space.id,
    title: "Color test",
    description: "Gemeinsam",
    category: "Team",
    platform: "Instagram",
    format: "Reel",
    status: "Idee",
    date: "",
    goal: "Reichweite",
    audience: "Team",
    hook: "Problem & Lösung",
    cta: "Folgen",
    script: "",
  };
  assert.equal(
    (await call("/tasks/color-task", "PUT", task, editor.cookie)).body.discord,
    "Synchronisiert",
  );
  const event = JSON.parse(
    readFileSync(path.join(dir, "discord.log"), "utf8")
      .trim()
      .split("\n")
      .at(-1),
  );
  assert.ok(event.url.includes("/color_owner?wait=true"));
  assert.equal(event.body.embeds[0].color, 0x12ab34);
  assert.match(event.body.embeds[0].author.name, /color-editor@example.com/);
  assert.match(event.body.embeds[0].title, /💡/);
  assert.equal(
    (
      await call(
        "/tasks/color-task",
        "PUT",
        { ...task, status: "In Bearbeitung" },
        owner.cookie,
      )
    ).body.discord,
    "Synchronisiert",
  );
  const updated = JSON.parse(
    readFileSync(path.join(dir, "discord.log"), "utf8")
      .trim()
      .split("\n")
      .at(-1),
  );
  assert.equal(updated.method, "PATCH");
  assert.ok(updated.url.includes("/color_owner/messages/"));
  assert.match(updated.body.embeds[0].author.name, /color-owner@example.com/);
});
