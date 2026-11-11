// Test-only transport. Loaded explicitly in the integration-test child process.
import { appendFileSync } from "node:fs";
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url, options = {}) {
  if (String(url).startsWith("https://discord.com/api/webhooks/")) {
    appendFileSync(
      process.env.DISCORD_TEST_LOG,
      JSON.stringify({
        url: String(url),
        method: options.method,
        body: options.body ? JSON.parse(options.body) : null,
      }) + "\n",
    );
    if (String(url).includes("/invalid_token"))
      return new Response("{}", { status: 404 });
    if (String(url).includes("/denied_token"))
      return new Response("{}", { status: 403 });
    if (String(url).includes("/offline_token"))
      throw new TypeError("fetch failed");
    if (String(url).includes("/missing_message/messages/"))
      return new Response("{}", { status: 404 });
    return new Response(
      options.method === "DELETE" ? null : JSON.stringify({ id: "987654321" }),
      {
        status: options.method === "DELETE" ? 204 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return originalFetch(url, options);
};
