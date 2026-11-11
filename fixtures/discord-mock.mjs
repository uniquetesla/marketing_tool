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
