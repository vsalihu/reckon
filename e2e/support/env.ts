// Playwright runs as a plain Node process — it doesn't get Next.js's
// automatic .env.local loading, so pull it in manually here. Imported for
// its side effect at the top of playwright.config.ts and any spec that
// needs Supabase admin access directly.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return; // fine in CI where env vars are injected directly
  }

  for (const line of contents.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, value] = match;
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();
