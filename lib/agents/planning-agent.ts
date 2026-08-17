import { addRun, normalize, type MealSlot, type RecipeDefinition, type WorkingState } from "./types";

const days = [
  ["lun", "Lunes", "Lun", 27],
  ["mar", "Martes", "Mar", 28],
  ["mie", "Miércoles", "Mié", 29],
  ["jue", "Jueves", "Jue", 30],
  ["vie", "Viernes", "Vie", 31],
  ["sab", "Sábado", "Sáb", 1],
  ["dom", "Domingo", "Dom", 2],
] as const;

function score(recipe: RecipeDefinition, state: WorkingState) {
  const urgentMatches = recipe.ingredients
    .map(normalize)
    .filter((ingredient) => state.urgentIngredients.includes(ingredient)).length;
  const preferredMatches = recipe.tags.filter((tag) => state.preferredTags.includes(tag)).length;
  const likedTerms = normalize(state.input.profile.likes ?? "")
    .split(/[,;/]/)
    .map((term) => term.trim())
    .filter(Boolean);
  const recipeText = normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);
  const likedBonus = likedTerms.filter((term) => recipeText.includes(term)).length * 3;
  const quickBonus = state.memorySignals.includes("priorizar recetas cortas") && recipe.minutes <= 25 ? 4 : 0;
  const budgetBonus = recipe.estimatedCost <= state.input.profile.budget / 14 ? 2 : 0;
  return urgentMatches * 8 + preferredMatches * 3 + likedBonus + quickBonus + budgetBonus - recipe.estimatedCost / 2000;
}

export function runPlanningAgent(state: WorkingState): WorkingState {
  const ranked = [...state.candidateRecipes].sort((a, b) => score(b, state) - score(a, state));
  const fallback = ranked.length ? ranked : state.candidateRecipes;
  const requested = (state.input.requestedMeals ?? ["lunch", "dinner"])
    .filter((slot): slot is MealSlot => ["breakfast", "lunch", "snack", "dinner"].includes(slot));
  const slots: MealSlot[] = requested.length ? requested : ["lunch", "dinner"];
  const selected: RecipeDefinition[] = [];

  const week = days.map(([id, day, shortDay, date], index) => {
    const result = {
      id, day, shortDay, date,
      breakfast: "", breakfastMeta: "",
      lunch: "", lunchMeta: "",
      snack: "", snackMeta: "",
      dinner: "", dinnerMeta: "",
    };
    slots.forEach((slot, slotIndex) => {
      const compatible = fallback.filter((recipe) => recipe.mealTypes.includes(slot));
      const pool = compatible.length ? compatible : fallback;
      const recipe = pool[(index * slots.length + slotIndex) % pool.length];
      if (!recipe) return;
      selected.push(recipe);
      result[slot] = recipe.name;
      result[`${slot}Meta` as `${MealSlot}Meta`] = `${recipe.minutes} min · ${recipe.difficulty}`;
    });
    return result;
  });

  const plannedCost = selected.reduce((sum, recipe) => sum + recipe.estimatedCost, 0);
  return addRun({ ...state, selectedRecipes: selected, week }, {
    id: "planning",
    name: "Agente planificador",
    role: "Arma la semana y prioriza recursos limitados.",
    observation: `${ranked.length} recetas candidatas para ${slots.length * 7} espacios.`,
    decision: "Puntuar vencimientos, memoria, afinidad comunitaria, tiempo y costo.",
    output: `${slots.length * 7} comidas organizadas; costo culinario estimado ${plannedCost.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}.`,
  });
}
