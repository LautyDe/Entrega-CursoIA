import { NextResponse } from "next/server";
import { agentRegistry, orchestrateMealPlan } from "../../../lib/agents/orchestrator";
import type { PlanRequest } from "../../../lib/agents/types";

export async function GET() {
  return NextResponse.json({
    mode: "local-agents",
    orchestrator: "Orquestador MealBoard",
    agents: agentRegistry,
  });
}

export async function POST(request: Request) {
  try {
    const context = await request.json() as PlanRequest;
    if (!context.profile || !Array.isArray(context.inventory)) {
      return NextResponse.json(
        { error: "Faltan el perfil o el inventario para iniciar el ciclo." },
        { status: 400 },
      );
    }

    return NextResponse.json(await orchestrateMealPlan(context));
  } catch {
    return NextResponse.json(
      { error: "El orquestador no pudo completar el ciclo." },
      { status: 500 },
    );
  }
}
