import { recipeCatalog } from "./catalog";
import { addRun, normalize, type WorkingState } from "./types";

function terms(value: string) {
  const normalized = normalize(value);
  if (!normalized || normalized === "ninguna" || normalized === "ninguno") return [];
  return normalized.split(/[,;/]/).map((item) => item.trim()).filter(Boolean);
}

export function runAnalysisAgent(state: WorkingState): WorkingState {
  const avoidTerms = [
    ...terms(state.input.profile.allergies),
    ...terms(state.input.profile.dislikes),
    ...state.expiredIngredients,
  ];
  const availableAppliances = terms(state.input.profile.appliances);
  const beginner = normalize(state.input.profile.level).includes("princip");

  const candidates = recipeCatalog.filter((recipe) => {
    const recipeText = normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);
    const safe = !avoidTerms.some((term) => recipeText.includes(term));
    const equipmentOk = recipe.appliances.every((required) =>
      availableAppliances.some((owned) => owned.includes(required)),
    );
    const levelOk = !beginner || recipe.difficulty === "Fácil";
    return safe && equipmentOk && levelOk;
  });

  return addRun({
    ...state,
    avoidTerms,
    availableAppliances,
    candidateRecipes: candidates,
  }, {
    id: "analysis",
    name: "Agente analizador",
    role: "Aplica seguridad, restricciones y límites operativos.",
    observation: `${avoidTerms.length} términos a evitar y ${availableAppliances.length} equipos reconocidos.`,
    decision: "Excluir recetas inseguras, incompatibles o demasiado complejas.",
    output: `${candidates.length} de ${recipeCatalog.length} recetas superaron las validaciones.`,
  });
}
