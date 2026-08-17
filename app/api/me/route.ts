import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureUserSchema, getD1 } from "../../../db";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  await ensureUserSchema();
  const now = Date.now();
  await getD1().prepare(`INSERT INTO users (id, email, display_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = excluded.updated_at`)
    .bind(user.id, user.email, user.displayName, now, now).run();
  return NextResponse.json({ authenticated: true, user: { displayName: user.displayName, email: user.email } });
}
