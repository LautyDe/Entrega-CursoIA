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
  const category = state.input.planCategory ?? "Equilibrado";
  const animalIngredients = ["pollo", "pescado", "huevos", "queso", "leche", "yogur"];
  const meatIngredients = ["pollo", "pescado"];
  const glutenIngredients = ["pan integral", "pasta seca", "tortillas", "harina integral", "avena"];

  const candidates = recipeCatalog.filter((recipe) => {
    const recipeText = normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);
    const safe = !avoidTerms.some((term) => recipeText.includes(term));
    const equipmentOk = recipe.appliances.every((required) =>
      availableAppliances.some((owned) => owned.includes(required)),
    );
    const levelOk = !beginner || recipe.difficulty === "Fácil";
    const ingredients = recipe.ingredients.map(normalize);
    const categoryOk = category === "Vegano" ? !ingredients.some((item) => animalIngredients.includes(item))
      : category === "Vegetariano" ? !ingredients.some((item) => meatIngredients.includes(item))
        : category === "Sin gluten" ? !ingredients.some((item) => glutenIngredients.includes(item))
          : true;
    return safe && equipmentOk && levelOk && categoryOk;
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
