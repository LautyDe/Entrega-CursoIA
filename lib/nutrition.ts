import { recipeCatalog } from "./agents/catalog.ts";

export type NutritionEstimate = { calories: number; protein: number; carbs: number; fat: number; fiber: number };

const ingredientNutrition: Record<string, NutritionEstimate> = {
  avena: { calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 }, leche: { calories: 90, protein: 6, carbs: 9, fat: 3, fiber: 0 }, banana: { calories: 90, protein: 1, carbs: 23, fat: 0, fiber: 3 },
  "pan integral": { calories: 140, protein: 6, carbs: 25, fat: 2, fiber: 4 }, queso: { calories: 110, protein: 7, carbs: 1, fat: 9, fiber: 0 }, yogur: { calories: 100, protein: 6, carbs: 12, fat: 3, fiber: 0 }, granola: { calories: 130, protein: 3, carbs: 21, fat: 4, fiber: 3 },
  huevos: { calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 }, espinaca: { calories: 25, protein: 3, carbs: 4, fat: 0, fiber: 2 }, "harina integral": { calories: 120, protein: 4, carbs: 24, fat: 1, fiber: 4 },
  cebolla: { calories: 35, protein: 1, carbs: 8, fat: 0, fiber: 1 }, zanahoria: { calories: 35, protein: 1, carbs: 8, fat: 0, fiber: 3 }, zapallo: { calories: 55, protein: 2, carbs: 13, fat: 0, fiber: 3 },
  lentejas: { calories: 180, protein: 13, carbs: 31, fat: 1, fiber: 12 }, tomates: { calories: 30, protein: 1, carbs: 7, fat: 0, fiber: 2 }, papas: { calories: 150, protein: 4, carbs: 34, fat: 0, fiber: 4 },
  arroz: { calories: 180, protein: 4, carbs: 39, fat: 1, fiber: 1 }, pollo: { calories: 210, protein: 35, carbs: 0, fat: 7, fiber: 0 }, "pasta seca": { calories: 210, protein: 7, carbs: 42, fat: 1, fiber: 3 },
  tortillas: { calories: 150, protein: 4, carbs: 27, fat: 4, fiber: 2 }, lechuga: { calories: 15, protein: 1, carbs: 3, fat: 0, fiber: 1 }, zapallito: { calories: 25, protein: 2, carbs: 5, fat: 0, fiber: 2 },
  pescado: { calories: 190, protein: 32, carbs: 0, fat: 7, fiber: 0 }, limon: { calories: 10, protein: 0, carbs: 3, fat: 0, fiber: 1 }, quinoa: { calories: 180, protein: 7, carbs: 32, fat: 3, fiber: 4 },
};

export const emptyNutrition = (): NutritionEstimate => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

export function addNutrition(left: NutritionEstimate, right: NutritionEstimate): NutritionEstimate {
  return { calories: left.calories + right.calories, protein: left.protein + right.protein, carbs: left.carbs + right.carbs, fat: left.fat + right.fat, fiber: left.fiber + right.fiber };
}

export function nutritionForMeal(mealName: string): NutritionEstimate | null {
  const recipe = recipeCatalog.find((item) => item.name === mealName);
  if (!recipe) return null;
  return recipe.ingredients.reduce((total, ingredient) => addNutrition(total, ingredientNutrition[ingredient] ?? emptyNutrition()), emptyNutrition());
}
