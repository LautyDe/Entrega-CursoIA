import type { CardType, PaymentMethod } from "./payments";

export const argentinaPaymentProviders = [
  "Banco Nación", "Banco Provincia", "Banco Ciudad", "Banco Galicia", "Banco Santander",
  "BBVA", "Banco Macro", "ICBC", "Banco Credicoop", "Banco Supervielle", "Banco Patagonia",
  "Banco Hipotecario", "Banco Comafi", "Banco Columbia", "Banco Santa Fe", "Banco Entre Ríos",
  "Banco San Juan", "Banco Santa Cruz", "Bancor", "Banco de Corrientes", "Banco Provincia del Neuquén",
  "Banco del Chubut", "Banco Bica", "Banco Piano", "Banco Meridian", "Banco Dino", "Mariva",
  "Montemar", "Banco Santiago", "Mercado Pago", "MODO", "Buepp", "YOY", "Naranja X", "Ualá",
  "Personal Pay", "Cuenta DNI",
] as const;

export const argentinaCardTypes: CardType[] = ["Débito", "Crédito", "Prepaga", "Dinero en cuenta"];

export type VerifiedPromotion = {
  id: string;
  title: string;
  banks: string[];
  cardTypes: CardType[];
  storeBrands: string[];
  day: string;
  discount: string;
  cap: string;
  method: string;
  validFrom: string;
  validThrough: string;
  verifiedAt: string;
  sourceUrl: string;
  notes: string;
};

export const verifiedPromotions: VerifiedPromotion[] = [
  {
    id: "bna-super-mayoristas-2026",
    title: "Supermercados y mayoristas con Banco Nación",
    banks: ["Banco Nación"],
    cardTypes: ["Crédito"],
    storeBrands: [],
    day: "Miércoles",
    discount: "30%",
    cap: "$12.000 por cliente por miércoles",
    method: "QR MODO desde BNA+ con Visa o Mastercard",
    validFrom: "2026-03-01",
    validThrough: "2026-08-31",
    verifiedAt: "2026-08-17",
    sourceUrl: "https://www.modo.com.ar/promos/30off-superymayoristasonline-bna-mar26",
    notes: "Solo comercios adheridos; revisar condiciones y exclusiones antes de pagar.",
  },
  {
    id: "hipotecario-mami-2026",
    title: "Mami Supermercados con Banco Hipotecario",
    banks: ["Banco Hipotecario"],
    cardTypes: ["Débito"],
    storeBrands: ["Mami", "Mami Supermercados"],
    day: "Martes",
    discount: "25%",
    cap: "$20.000 por usuario por mes",
    method: "Débito Visa por MODO",
    validFrom: "2026-02-01",
    validThrough: "2026-11-30",
    verifiedAt: "2026-08-17",
    sourceUrl: "https://www.modo.com.ar/promos-banco/25-hipotecario-mamisuper-feb26",
    notes: "Compra presencial; no acumulable y sujeto a condiciones del banco.",
  },
];

export function paymentKey(payment: PaymentMethod) {
  return `${payment.bank}::${payment.cardType}`;
}

export function compatiblePromotions(methods: PaymentMethod[], today = new Date().toISOString().slice(0, 10)) {
  return verifiedPromotions.filter((promotion) =>
    promotion.validFrom <= today
    && promotion.validThrough >= today
    && methods.some((method) => promotion.banks.includes(method.bank) && promotion.cardTypes.includes(method.cardType)),
  );
}
