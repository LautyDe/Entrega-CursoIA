export type ParsedInventoryAmount = {
  value: number;
  unit: string;
};

const unitAliases: Record<string, string> = {
  g: "g", gr: "g", gramos: "g",
  kg: "kg", kilo: "kg", kilos: "kg",
  ml: "ml", cc: "ml",
  l: "litro", lt: "litro", litro: "litro", litros: "litro",
  unidad: "unidad", unidades: "unidad", un: "unidad",
  atado: "atado", atados: "atado",
  paquete: "paquete", paquetes: "paquete",
  planta: "planta", plantas: "planta",
};

export function parseInventoryAmount(amount: string): ParsedInventoryAmount | null {
  const match = amount.trim().toLocaleLowerCase("es-AR").match(/^(\d+(?:[.,]\d+)?)\s*([a-záéíóúñ]+)?/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  const rawUnit = match[2] ?? "unidad";
  return { value, unit: unitAliases[rawUnit] ?? rawUnit };
}

export function recommendedConsumption(total: ParsedInventoryAmount): number {
  if (total.unit === "g" || total.unit === "ml") return Math.min(total.value, 100);
  if (total.unit === "kg" || total.unit === "litro") return Math.min(total.value, 0.2);
  return Math.min(total.value, 1);
}

export function formatInventoryAmount(value: number, unit: string): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
  const plural: Record<string, string> = { unidad: "unidades", litro: "litros", atado: "atados", paquete: "paquetes", planta: "plantas" };
  return `${formatted} ${value === 1 ? unit : (plural[unit] ?? unit)}`;
}

export function subtractInventoryAmount(amount: string, used: number): string | null {
  const parsed = parseInventoryAmount(amount);
  if (!parsed || !Number.isFinite(used) || used < 0 || used > parsed.value) return null;
  const remaining = Math.max(0, parsed.value - used);
  return remaining === 0 ? "" : formatInventoryAmount(remaining, parsed.unit);
}

export function normalizeIngredientName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
}
