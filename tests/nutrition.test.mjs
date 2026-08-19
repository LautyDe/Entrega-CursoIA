import assert from "node:assert/strict";
import test from "node:test";
import { addNutrition, emptyNutrition, nutritionForMeal } from "../lib/nutrition.ts";

test("estimates basic nutrition for catalog meals", () => {
  const estimate = nutritionForMeal("Arroz con pollo");
  assert.ok(estimate.calories > 0);
  assert.ok(estimate.protein >= 35);
  assert.ok(estimate.carbs > 0);
});

test("adds planned and consumed nutrition totals", () => {
  const first = nutritionForMeal("Avena con banana");
  const second = nutritionForMeal("Ensalada de lentejas");
  const total = addNutrition(addNutrition(emptyNutrition(), first), second);
  assert.equal(total.calories, first.calories + second.calories);
  assert.equal(nutritionForMeal("Comida desconocida"), null);
});
