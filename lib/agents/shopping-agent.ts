import { ingredientPrices } from "./catalog";
import { addRun, normalize, type WorkingState } from "./types";

export function runShoppingAgent(state: WorkingState): WorkingState {
  const required = [...new Set(state.selectedRecipes.flatMap((recipe) => recipe.ingredients.map(normalize)))];
  const missing = required.filter((ingredient) => !state.inventoryNames.includes(ingredient));
  const shopping = missing.map((name) => ({
    name: name.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()),
    amount: ingredientPrices[name]?.amount ?? "1 unidad",
    price: ingredientPrices[name]?.price ?? 1200,
    checked: false,
  }));
  const estimatedCost = shopping.reduce((sum, item) => sum + item.price, 0);

  const payment = normalize(state.input.profile.payment);
  const promotions = state.input.promotions ?? [];
  const bestPromotion = promotions
    .filter((promotion) => payment.includes(normalize(promotion.bank).split(" ")[0]))
    .sort((a, b) => Number.parseInt(b.discount) - Number.parseInt(a.discount))[0]
    ?? promotions.sort((a, b) => Number.parseInt(b.discount) - Number.parseInt(a.discount))[0];
  const discount = bestPromotion ? Number.parseInt(bestPromotion.discount) / 100 : 0;
  const cap = bestPromotion ? Number(bestPromotion.cap.replace(/\D/g, "")) : 0;
  const estimatedSaving = Math.min(estimatedCost * discount, cap || Number.POSITIVE_INFINITY);

  return addRun({
    ...state,
    shopping,
    estimatedCost,
    estimatedSaving: Number.isFinite(estimatedSaving) ? Math.round(estimatedSaving) : 0,
    bestPromotion,
  }, {
    id: "shopping",
    name: "Agente de compras y promociones",
    role: "Calcula faltantes y cruza medios de pago con descuentos.",
    observation: `${required.length} ingredientes requeridos y ${state.inventoryNames.length} disponibles.`,
    decision: bestPromotion
      ? `Recomendar ${bestPromotion.day} en ${bestPromotion.store} con ${bestPromotion.discount}.`
      : "No aplicar promociones no verificadas.",
    output: `${shopping.length} productos faltantes; compra estimada $${estimatedCost.toLocaleString("es-AR")}; ahorro $${Math.round(estimatedSaving || 0).toLocaleString("es-AR")}.`,
  });
}
