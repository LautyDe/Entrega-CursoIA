import assert from "node:assert/strict";
import test from "node:test";

import { applyConfirmedConsumption, summarizeConfirmedPurchase } from "../lib/confirmed-actions.ts";

test("la confirmación de consumo muestra y aplica el cambio de inventario", () => {
  const before = [
    { id: 1, name: "Lentejas", amount: "500 g" },
    { id: 2, name: "Huevos", amount: "1 unidad" },
  ];

  const after = applyConfirmedConsumption(before, [
    { inventoryId: 1, quantity: 100 },
  ]);

  assert.equal(before[0].amount, "500 g");
  assert.equal(after[0].amount, "400 g");
  assert.equal(after[1].amount, "1 unidad");
});

test("la confirmación elimina un producto cuando se consume todo", () => {
  const after = applyConfirmedConsumption(
    [{ id: 1, name: "Huevos", amount: "1 unidad" }],
    [{ inventoryId: 1, quantity: 1 }],
  );
  assert.deepEqual(after, []);
});

test("la confirmación rechaza cantidades superiores al stock", () => {
  assert.throws(
    () => applyConfirmedConsumption(
      [{ id: 1, name: "Lentejas", amount: "400 g" }],
      [{ inventoryId: 1, quantity: 500 }],
    ),
    /inventario no alcanza/i,
  );
});

test("la compra confirmada mueve solo los seleccionados y calcula el ahorro", () => {
  const before = [
    { id: 1, name: "Tomates", checked: true, price: 1200 },
    { id: 2, name: "Lechuga", checked: true, price: 1400 },
    { id: 3, name: "Cebolla", checked: false, price: 1200 },
  ];
  const result = summarizeConfirmedPurchase(before, {
    day: "Lunes",
    store: "ChangoMás",
    bank: "Banco Santander",
    cardType: "Crédito",
    discount: "30%",
    cap: "$10.000",
  });

  assert.deepEqual(result.bought.map((item) => item.name), ["Tomates", "Lechuga"]);
  assert.deepEqual(result.pending.map((item) => item.name), ["Cebolla"]);
  assert.equal(result.spent, 2600);
  assert.equal(result.saved, 780);
});
