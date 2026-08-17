import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureUserSchema, getD1 } from "../../../db";

const maximumStateBytes = 2_000_000;

async function requireUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  await ensureUserSchema();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const row = await getD1().prepare("SELECT state_json AS stateJson, updated_at AS updatedAt FROM user_states WHERE user_id = ?")
    .bind(user.id).first<{ stateJson: string; updatedAt: number }>();
  if (!row) return NextResponse.json({ state: null });
  try {
    return NextResponse.json({ state: JSON.parse(row.stateJson), updatedAt: row.updatedAt });
  } catch {
    return NextResponse.json({ state: null });
  }
}

export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const body = await request.json() as { state?: unknown };
  if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  const stateJson = JSON.stringify(body.state);
  if (new TextEncoder().encode(stateJson).byteLength > maximumStateBytes) {
    return NextResponse.json({ error: "El estado supera el límite permitido" }, { status: 413 });
  }
  const now = Date.now();
  await getD1().batch([
    getD1().prepare(`INSERT INTO users (id, email, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, updated_at = excluded.updated_at`)
      .bind(user.id, user.email, user.displayName, now, now),
    getD1().prepare(`INSERT INTO user_states (user_id, state_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`)
      .bind(user.id, stateJson, now),
  ]);
  return NextResponse.json({ saved: true, updatedAt: now });
}
