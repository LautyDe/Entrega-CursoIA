import { addRun, type WorkingState } from "./types";

export function runRecipeAgent(state: WorkingState): WorkingState {
  const guides = Object.fromEntries(state.selectedRecipes.map((recipe) => [
    recipe.name,
    [
      `Preparar ${recipe.ingredients.slice(0, 3).join(", ")}.`,
      `Cocinar con ${recipe.appliances.length ? recipe.appliances.join(" y ") : "preparación en frío"} durante aproximadamente ${recipe.minutes} minutos.`,
      "Servir una porción y conservar el sobrante de forma segura.",
    ],
  ]));

  return addRun({ ...state, recipeGuides: guides }, {
    id: "recipes",
    name: "Agente de recetas",
    role: "Adapta instrucciones al nivel y equipamiento disponible.",
    observation: `${state.selectedRecipes.length} comidas seleccionadas y nivel ${state.input.profile.level}.`,
    decision: "Generar instrucciones breves para una porción y equipos habilitados.",
    output: `${Object.keys(guides).length} guías de cocina preparadas.`,
  });
}
