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
      d1.prepare(`CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        email_verified INTEGER DEFAULT 0 NOT NULL, image TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY NOT NULL, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, ip_address TEXT, user_agent TEXT,
        user_id TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY NOT NULL, account_id TEXT NOT NULL, provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, id_token TEXT,
        access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, password TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY NOT NULL, identifier TEXT NOT NULL, value TEXT NOT NULL,
        expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS community_calendars (
        id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, creator TEXT NOT NULL,
        title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
        week_json TEXT NOT NULL, created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
      )`),
      d1.prepare("CREATE INDEX IF NOT EXISTS community_calendars_created_idx ON community_calendars(created_at DESC)"),
      d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_idx ON account(provider_id, account_id)"),
      d1.prepare("CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)"),
      d1.prepare("CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id)"),
      d1.prepare("CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier)"),
    ]);
    await d1.prepare("PRAGMA optimize").run();
  })();
  return schemaReady;
}
