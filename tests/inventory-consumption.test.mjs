import assert from "node:assert/strict";
import test from "node:test";

import { parseInventoryAmount, recommendedConsumption, subtractInventoryAmount } from "../lib/inventory-consumption.ts";

test("interpreta cantidades habituales del inventario", () => {
  assert.deepEqual(parseInventoryAmount("700 g"), { value: 700, unit: "g" });
  assert.deepEqual(parseInventoryAmount("1 litro"), { value: 1, unit: "litro" });
  assert.deepEqual(parseInventoryAmount("6 unidades"), { value: 6, unit: "unidad" });
});

test("propone una cantidad prudente para confirmar", () => {
  assert.equal(recommendedConsumption({ value: 700, unit: "g" }), 100);
  assert.equal(recommendedConsumption({ value: 1, unit: "litro" }), 0.2);
  assert.equal(recommendedConsumption({ value: 6, unit: "unidad" }), 1);
});

test("descuenta sin permitir consumos superiores al inventario", () => {
  assert.equal(subtractInventoryAmount("700 g", 150), "550 g");
  assert.equal(subtractInventoryAmount("1 litro", 0.2), "0,8 litros");
  assert.equal(subtractInventoryAmount("1 unidad", 1), "");
  assert.equal(subtractInventoryAmount("2 unidades", 3), null);
});
