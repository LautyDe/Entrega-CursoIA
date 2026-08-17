import { addRun, normalize, type PlanRequest, type WorkingState } from "./types";

function expiryInDays(value: string) {
  const normalized = normalize(value);
  if (normalized.includes("vencid")) return -1;
  const match = normalized.match(/\d+/);
  if (!match) return 999;
  if (normalized.includes("mes")) return Number(match[0]) * 30;
  return Number(match[0]);
}

export function createInitialState(input: PlanRequest): WorkingState {
  const inventoryNames = input.inventory.map((item) => normalize(item.name));
  const urgentIngredients = input.inventory
    .filter((item) => expiryInDays(item.expiry) >= 0 && expiryInDays(item.expiry) <= 2)
    .map((item) => normalize(item.name));
  const expiredIngredients = input.inventory
    .filter((item) => expiryInDays(item.expiry) < 0)
    .map((item) => normalize(item.name));

  const state: WorkingState = {
    input,
    inventoryNames,
    urgentIngredients,
    expiredIngredients,
    avoidTerms: [],
    availableAppliances: [],
    memorySignals: [],
    preferredTags: [],
    communitySource: "",
    candidateRecipes: [],
    selectedRecipes: [],
    week: [],
    recipeGuides: {},
    shopping: [],
    estimatedCost: 0,
    estimatedSaving: 0,
    warnings: [],
    trace: [],
  };

  return addRun(state, {
    id: "capture",
    name: "Agente de captura",
    role: "Normaliza y valida las entradas del usuario.",
    observation: `${input.inventory.length} productos, presupuesto $${input.profile.budget} y ${(input.requestedMeals ?? []).length} tipos de comida.`,
    decision: "Unificar nombres y separar productos urgentes o vencidos.",
    output: `${inventoryNames.length} productos válidos; ${urgentIngredients.length} próximos a vencer; ${expiredIngredients.length} vencidos.`,
  });
}
