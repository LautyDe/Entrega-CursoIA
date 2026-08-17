import { addRun, normalize, type WorkingState } from "./types";

export function runEvaluationAgent(state: WorkingState): WorkingState {
  const warnings: string[] = [];
  if (state.estimatedCost > state.input.profile.budget) {
    warnings.push(`La compra estimada supera el presupuesto por $${(state.estimatedCost - state.input.profile.budget).toLocaleString("es-AR")}.`);
  }
  if (state.expiredIngredients.length) {
    warnings.push(`${state.expiredIngredients.length} productos vencidos fueron excluidos.`);
  }

  const unsafe = state.selectedRecipes.filter((recipe) => {
    const text = normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);
    return state.avoidTerms.some((term) => text.includes(term));
  });
  if (unsafe.length) warnings.push("Se detectó una incompatibilidad y el plan requiere revisión.");

  return addRun({ ...state, warnings }, {
    id: "evaluation",
    name: "Agente evaluador",
    role: "Audita seguridad, presupuesto y completitud antes de confirmar.",
    observation: `Plan de ${state.week.length} días, ${state.shopping.length} compras y ${state.avoidTerms.length} restricciones.`,
    decision: unsafe.length ? "Bloquear el plan para revisión." : "Aprobar la propuesta y pedir confirmación humana.",
    output: warnings.length ? `${warnings.length} advertencias informadas.` : "Sin violaciones; plan listo para confirmar.",
  });
}
