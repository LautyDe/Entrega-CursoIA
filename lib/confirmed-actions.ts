import { parseInventoryAmount, subtractInventoryAmount } from "./inventory-consumption.ts";
import { promotionSaving, type PaymentPromotion } from "./payments.ts";

export type ConfirmedUsage = {
  inventoryId: number;
  quantity: number;
};

export function applyConfirmedConsumption<T extends { id: number; amount: string }>(
  inventory: readonly T[],
  rows: readonly ConfirmedUsage[],
): T[] {
  const usage = new Map<number, number>();
  for (const row of rows) {
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      throw new Error("La cantidad confirmada debe ser mayor que cero.");
    }
    usage.set(row.inventoryId, (usage.get(row.inventoryId) ?? 0) + row.quantity);
  }

  for (const [inventoryId, quantity] of usage) {
    const item = inventory.find((candidate) => candidate.id === inventoryId);
    const parsed = item ? parseInventoryAmount(item.amount) : null;
    if (!item || !parsed || quantity > parsed.value) {
      throw new Error("El inventario no alcanza para la cantidad confirmada.");
    }
  }

  return inventory.flatMap((item) => {
    const quantity = usage.get(item.id);
    if (!quantity) return [item];
    const amount = subtractInventoryAmount(item.amount, quantity);
    if (amount === null) throw new Error("No se pudo descontar la cantidad confirmada.");
    return amount ? [{ ...item, amount }] : [];
  });
}

export function summarizeConfirmedPurchase<T extends { checked: boolean; price: number }>(
  shopping: readonly T[],
  promotion?: PaymentPromotion,
) {
  const bought = shopping.filter((item) => item.checked);
  const pending = shopping.filter((item) => !item.checked);
  const spent = bought.reduce((sum, item) => sum + item.price, 0);
  return { bought, pending, spent, saved: promotionSaving(spent, promotion) };
}
