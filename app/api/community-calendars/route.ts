import { NextResponse } from "next/server";
import { ensureUserSchema, getD1 } from "../../../db";
import { getMealBoardUser } from "../../../lib/auth";
import { recipeCatalog } from "../../../lib/agents/catalog";
import { normalize } from "../../../lib/agents/types";

const categories = new Set(["Equilibrado", "Fit / proteico", "Vegano", "Vegetariano", "Sin gluten", "Delicioso", "Económico", "Rápido", "Una sola olla"]);

export async function GET() {
  await ensureUserSchema();
  const result = await getD1().prepare(`SELECT id, creator, title, category, description, week_json AS weekJson, created_at AS createdAt
    FROM community_calendars ORDER BY created_at DESC LIMIT 100`).all<{ id: string; creator: string; title: string; category: string; description: string; weekJson: string; createdAt: number }>();
  return NextResponse.json({ calendars: result.results.map((row) => ({ ...row, week: JSON.parse(row.weekJson) })) });
}

export async function POST(request: Request) {
  const user = await getMealBoardUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  await ensureUserSchema();
  const body = await request.json() as { title?: string; category?: string; description?: string; week?: unknown[] };
  const title = body.title?.trim();
  const category = body.category?.trim();
  if (!title || title.length > 80 || !category || !categories.has(category) || !Array.isArray(body.week) || body.week.length !== 7) {
    return NextResponse.json({ error: "Calendario inválido" }, { status: 400 });
  }
  const stateRow = await getD1().prepare("SELECT state_json AS stateJson FROM user_states WHERE user_id = ?").bind(user.id).first<{ stateJson: string }>();
  const state = stateRow ? JSON.parse(stateRow.stateJson) as { profile?: { allergies?: string; dislikes?: string } } : {};
  const avoid = normalize(`${state.profile?.allergies ?? ""},${state.profile?.dislikes ?? ""}`).split(/[,;/]/).map((term) => term.trim()).filter((term) => term && term !== "ninguna" && term !== "ninguno");
  const mealNames = body.week.flatMap((day) => {
    if (!day || typeof day !== "object") return [];
    const value = day as Record<string, unknown>;
    return [value.breakfast, value.lunch, value.snack, value.dinner].filter((meal): meal is string => typeof meal === "string" && Boolean(meal));
  });
  if (!mealNames.length) return NextResponse.json({ error: "El calendario no contiene comidas para compartir" }, { status: 400 });
  const unsafe = mealNames.some((name) => {
    const recipe = recipeCatalog.find((item) => item.name === name);
    const text = normalize(`${name} ${recipe?.ingredients.join(" ") ?? ""}`);
    return avoid.some((term) => text.includes(term));
  });
  if (unsafe) return NextResponse.json({ error: "El calendario contradice alergias o rechazos del perfil" }, { status: 409 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await getD1().prepare(`INSERT INTO community_calendars (id, user_id, creator, title, category, description, week_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, user.id, user.name, title, category, (body.description ?? "").slice(0, 240), JSON.stringify(body.week), now).run();
  return NextResponse.json({ id, createdAt: now }, { status: 201 });
}
