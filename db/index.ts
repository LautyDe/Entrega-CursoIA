import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

declare global {
  // The Worker sets this binding for each request before Vinext dispatches it.
  var __MEALBOARD_DB__: D1Database | undefined;
}

export function getDb() {
  if (!globalThis.__MEALBOARD_DB__) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(globalThis.__MEALBOARD_DB__, { schema });
}

export function getD1() {
  if (!globalThis.__MEALBOARD_DB__) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return globalThis.__MEALBOARD_DB__;
}

let schemaReady: Promise<void> | undefined;

export function ensureUserSchema() {
  schemaReady ??= (async () => {
    const d1 = getD1();
    await d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS user_states (
        user_id TEXT PRIMARY KEY NOT NULL,
        state_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
      )`),
    ]);
    await d1.prepare("PRAGMA optimize").run();
  })();
  return schemaReady;
}
