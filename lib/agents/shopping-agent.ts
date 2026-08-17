import { ingredientPrices } from "./catalog";
import { promotionSaving, selectBestPromotion } from "../payments";
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

  const promotions = state.input.promotions ?? [];
  const bestPromotion = selectBestPromotion({
    bank: state.input.profile.paymentBank,
    cardType: state.input.profile.paymentCardType,
  }, promotions);
  const estimatedSaving = promotionSaving(estimatedCost, bestPromotion);

  return addRun({
    ...state,
    shopping,
    estimatedCost,
    estimatedSaving,
    bestPromotion,
  }, {
    id: "shopping",
    name: "Agente de compras y promociones",
    role: "Calcula faltantes y cruza medios de pago con descuentos.",
    observation: `${required.length} ingredientes requeridos y ${state.inventoryNames.length} disponibles.`,
    decision: bestPromotion
      ? `Recomendar ${bestPromotion.day} en ${bestPromotion.store} con ${bestPromotion.discount}, ${bestPromotion.cardType.toLowerCase()} de ${bestPromotion.bank}.`
      : `No hay promociones compatibles con ${state.input.profile.paymentCardType.toLowerCase()} de ${state.input.profile.paymentBank}.`,
    output: `${shopping.length} productos faltantes; compra estimada $${estimatedCost.toLocaleString("es-AR")}; ahorro $${Math.round(estimatedSaving || 0).toLocaleString("es-AR")}.`,
  });
}
