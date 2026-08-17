import { runAnalysisAgent } from "./analysis-agent";
import { createInitialState } from "./capture-agent";
import { runCommunityAgent } from "./community-agent";
import { runEvaluationAgent } from "./evaluation-agent";
import { runMemoryAgent } from "./memory-agent";
import { runPlanningAgent } from "./planning-agent";
import { runRecipeAgent } from "./recipe-agent";
import { runShoppingAgent } from "./shopping-agent";
import type { AgentDefinition, PlanRequest, PlanResult } from "./types";

export const agentRegistry: AgentDefinition[] = [
  { id: "capture", name: "Agente de captura", role: "Normaliza y valida las entradas." },
  { id: "memory", name: "Agente de memoria", role: "Recupera aprendizaje de semanas anteriores." },
  { id: "analysis", name: "Agente analizador", role: "Aplica seguridad, restricciones y límites." },
  { id: "community", name: "Agente de comunidad", role: "Prioriza calendarios y señales sociales." },
  { id: "planning", name: "Agente planificador", role: "Organiza las comidas elegidas por el usuario." },
  { id: "recipes", name: "Agente de recetas", role: "Adapta instrucciones y equipamiento." },
  { id: "shopping", name: "Agente de compras", role: "Calcula faltantes, precios y descuentos." },
  { id: "evaluation", name: "Agente evaluador", role: "Audita el plan antes de la confirmación." },
];

export function orchestrateMealPlan(input: PlanRequest): PlanResult {
  let state = createInitialState(input);
  state = runMemoryAgent(state);
  state = runAnalysisAgent(state);
  state = runCommunityAgent(state);
  state = runPlanningAgent(state);
  state = runRecipeAgent(state);
  state = runShoppingAgent(state);
  state = runEvaluationAgent(state);

  const urgentMessage = state.urgentIngredients.length
    ? ` priorizando ${state.urgentIngredients.join(" y ")}`
    : "";
  const savingMessage = state.estimatedSaving
    ? ` El ahorro estimado es $${state.estimatedSaving.toLocaleString("es-AR")}.`
    : "";

  return {
    mode: "local-agents",
    summary: `Ocho agentes coordinaron un plan seguro dentro del contexto disponible,${urgentMessage || " sin alimentos urgentes"} e inspirado en “${state.communitySource}”.${savingMessage}`,
    agentTrace: state.trace.map((run) => `${run.name}: ${run.decision}`),
    agentRun: state.trace,
    week: state.week,
    shopping: state.shopping,
    recipeGuides: state.recipeGuides,
    estimatedCost: state.estimatedCost,
    estimatedSaving: state.estimatedSaving,
    communitySource: state.communitySource,
    warnings: state.warnings,
  };
}
