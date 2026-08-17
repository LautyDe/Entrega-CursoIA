import assert from "node:assert/strict";
import test from "node:test";

import {
  migrateLegacyPayment,
  promotionSaving,
  selectBestPromotion,
} from "../lib/payments.ts";
import { parseStoredState, serializeStoredState } from "../lib/persistence.ts";
import { benefitSourceForProvider, canonicalPaymentProvider, compatiblePromotions, paymentMethodsForPromotion, promotionMatchesStore, searchPaymentProviders, validatePaymentProvider } from "../lib/argentina-payments.ts";

const promotions = [
  { day: "Miércoles", store: "Carrefour", bank: "Banco Ciudad", cardType: "Débito", discount: "20%", cap: "$8.000" },
  { day: "Viernes", store: "Coto", bank: "Banco Ciudad", cardType: "Crédito", discount: "30%", cap: "$3.000" },
  { day: "Sábado", store: "Día", bank: "Banco Nación", cardType: "Débito", discount: "25%", cap: "$5.000" },
];

test("elige solamente promociones del banco y tipo de tarjeta exactos", () => {
  const promotion = selectBestPromotion(
    { bank: "Banco Ciudad", cardType: "Débito" },
    promotions,
  );

  assert.equal(promotion?.discount, "20%");
  assert.equal(promotion?.cardType, "Débito");
});

test("no usa promociones de otro banco o tipo de tarjeta", () => {
  assert.equal(selectBestPromotion(
    { bank: "Banco Galicia", cardType: "Débito" },
    promotions,
  ), undefined);
  assert.equal(selectBestPromotion(
    { bank: "Banco Nación", cardType: "Crédito" },
    promotions,
  ), undefined);
});

test("respeta el tope de reintegro", () => {
  assert.equal(promotionSaving(20_000, promotions[1]), 3_000);
  assert.equal(promotionSaving(10_000, promotions[0]), 2_000);
  assert.equal(promotionSaving(10_000), 0);
});

test("migra el medio de pago anterior separado por punto medio", () => {
  assert.deepEqual(
    migrateLegacyPayment(
      { payment: "Banco Ciudad · Crédito" },
      { bank: "Banco Nación", cardType: "Débito" },
    ),
    {
      paymentBank: "Banco Ciudad",
      paymentCardType: "Crédito",
      paymentMethods: [{ bank: "Banco Ciudad", cardType: "Crédito" }],
    },
  );
});

test("la persistencia conserva el medio de pago separado", () => {
  const state = {
    profile: { paymentBank: "Banco Nación", paymentCardType: "Débito" },
    memory: [{ id: 1, text: "Preferencia" }],
  };

  assert.deepEqual(parseStoredState(serializeStoredState(state)), state);
  assert.equal(parseStoredState("contenido inválido"), null);
  assert.equal(parseStoredState("[]"), null);
});

test("cruza varios medios y excluye promociones fuera de vigencia", () => {
  const methods = [
    { bank: "Banco Galicia", cardType: "Débito" },
    { bank: "Banco Hipotecario", cardType: "Débito" },
  ];

  assert.deepEqual(
    compatiblePromotions(methods, "2026-08-17").map((promotion) => promotion.id),
    ["hipotecario-mami-2026"],
  );
  assert.deepEqual(compatiblePromotions(methods, "2027-01-01"), []);
});

test("valida, corrige y marca entidades de pago desconocidas", () => {
  assert.deepEqual(validatePaymentProvider("banco nacion"), { status: "known", provider: "Banco Nación" });
  assert.deepEqual(validatePaymentProvider("Banco Nasión"), { status: "suggestion", provider: "Banco Nación" });
  assert.deepEqual(validatePaymentProvider(""), { status: "empty" });
  assert.deepEqual(validatePaymentProvider("Banco Inventado"), { status: "unknown", provider: "Banco Inventado" });
});

test("normaliza alias históricos y ofrece una fuente oficial", () => {
  assert.equal(canonicalPaymentProvider("Santander Río"), "Banco Santander");
  assert.deepEqual(validatePaymentProvider("Santander Rio"), { status: "known", provider: "Banco Santander" });
  assert.equal(benefitSourceForProvider("Santander Río")?.url, "https://www.santander.com.ar/personas/beneficios");
  assert.equal(benefitSourceForProvider("Mercado Pago")?.coverage, "provider");
  assert.equal(benefitSourceForProvider("Banco Inventado"), undefined);
});

test("busca bancos y billeteras por nombre actual, alias y acentos", () => {
  assert.equal(searchPaymentProviders("santander rio")[0].provider, "Banco Santander");
  assert.equal(searchPaymentProviders("BNA")[0].provider, "Banco Nación");
  assert.equal(searchPaymentProviders("mercadopago")[0].provider, "Mercado Pago");
  assert.equal(searchPaymentProviders("uala")[0].provider, "Ualá");
  assert.equal(searchPaymentProviders("entidad inexistente").length, 0);
});

test("muestra promociones de supermercado para Santander Río", () => {
  const bank = canonicalPaymentProvider("Santander Río");
  const promotions = compatiblePromotions([{ bank, cardType: "Crédito" }], "2026-08-17");

  assert.equal(bank, "Banco Santander");
  assert.deepEqual(promotions.map((promotion) => promotion.day), [
    "Lunes", "Miércoles", "Miércoles", "Viernes", "Sábado",
  ]);
  assert.ok(promotions.every((promotion) => promotion.notes.includes("Plan Sueldo")));
});

test("relaciona supermercados cercanos con promociones y medios compatibles", () => {
  const [promotion] = compatiblePromotions([
    { bank: "Banco Santander", cardType: "Débito" },
  ]).filter((item) => item.storeBrands.includes("Día"));

  assert.ok(promotionMatchesStore(promotion, "Supermercado DIA", "DIA"));
  assert.equal(promotionMatchesStore(promotion, "Coto Palermo", "Coto"), false);
  assert.deepEqual(paymentMethodsForPromotion(promotion, [
    { bank: "Banco Santander", cardType: "Débito" },
    { bank: "Banco Santander", cardType: "Prepaga" },
  ]), [{ bank: "Banco Santander", cardType: "Débito" }]);
});
