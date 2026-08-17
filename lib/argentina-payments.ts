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

const providerAliases: Record<string, string[]> = {
  "Banco Santander": ["Santander", "Santander Río", "Banco Santander Río", "Santander Rio", "Banco Santander Rio"],
  "Banco Nación": ["BNA", "Banco de la Nación Argentina", "Nación"],
  "Banco Provincia": ["Bapro", "Provincia"],
  "Banco Ciudad": ["Ciudad"],
  "Banco Galicia": ["Galicia"],
  BBVA: ["Banco BBVA", "Francés", "Banco Francés"],
  "Banco Macro": ["Macro"],
  ICBC: ["Banco ICBC"],
  "Banco Hipotecario": ["Hipotecario"],
  "Mercado Pago": ["Mercadopago", "MP"],
  MODO: ["Modo"],
  "Cuenta DNI": ["CuentaDNI"],
};

export type ProviderBenefitSource = {
  provider: string;
  url: string;
  label: string;
  reviewedAt: string;
  coverage: "provider" | "aggregator";
  notice?: string;
};

const directBenefitSources: Record<string, Omit<ProviderBenefitSource, "provider">> = {
  "Banco Santander": { url: "https://www.santander.com.ar/personas/beneficios", label: "Beneficios oficiales Santander", reviewedAt: "2026-08-17", coverage: "provider", notice: "Santander publica beneficios en Coto, ChangoMás, Disco, Jumbo y Vea. Las condiciones pueden depender de Sorpresa, tarjeta, NFC o perfil del cliente." },
  "Mercado Pago": { url: "https://www.mercadopago.com.ar/c/promocionesqr", label: "Promociones oficiales Mercado Pago", reviewedAt: "2026-08-17", coverage: "provider", notice: "Mercado Pago publica campañas QR y también ofertas personalizadas dentro de su app; MealBoard no puede asumir que estén habilitadas para todas las cuentas." },
  "Banco Nación": { url: "https://www.bna.com.ar/Personas/DescuentosYPromociones", label: "Beneficios oficiales Banco Nación", reviewedAt: "2026-08-17", coverage: "provider" },
  "Banco Hipotecario": { url: "https://www.hipotecario.com.ar/personas/beneficios/", label: "Beneficios oficiales Banco Hipotecario", reviewedAt: "2026-08-17", coverage: "provider" },
  "Banco Galicia": { url: "https://www.galicia.ar/personas/beneficios", label: "Beneficios oficiales Galicia", reviewedAt: "2026-08-17", coverage: "provider" },
  "Banco Ciudad": { url: "https://www.bancociudad.com.ar/institucional/micrositio/Beneficios", label: "Beneficios oficiales Banco Ciudad", reviewedAt: "2026-08-17", coverage: "provider" },
  "Banco Provincia": { url: "https://www.bancoprovincia.com.ar/beneficios", label: "Beneficios oficiales Banco Provincia", reviewedAt: "2026-08-17", coverage: "provider" },
  "Cuenta DNI": { url: "https://www.bancoprovincia.com.ar/cuentadni/contenidos/cdniBeneficios", label: "Beneficios oficiales Cuenta DNI", reviewedAt: "2026-08-17", coverage: "provider" },
};

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

function normalizeProvider(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function canonicalPaymentProvider(value: string) {
  const normalized = normalizeProvider(value);
  return argentinaPaymentProviders.find((provider) => normalizeProvider(provider) === normalized)
    ?? Object.entries(providerAliases).find(([, aliases]) => aliases.some((alias) => normalizeProvider(alias) === normalized))?.[0];
}

export function benefitSourceForProvider(value: string): ProviderBenefitSource | undefined {
  const provider = canonicalPaymentProvider(value);
  if (!provider) return undefined;
  const direct = directBenefitSources[provider];
  return direct
    ? { provider, ...direct }
    : { provider, url: "https://www.modo.com.ar/promos", label: `Buscar beneficios de ${provider} en MODO`, reviewedAt: "2026-08-17", coverage: "aggregator" };
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[right.length];
}

export function validatePaymentProvider(value: string) {
  const normalized = normalizeProvider(value);
  if (!normalized) return { status: "empty" as const };
  const exact = canonicalPaymentProvider(value);
  if (exact) return { status: "known" as const, provider: exact };

  const suggestion = argentinaPaymentProviders
    .map((provider) => ({ provider, distance: editDistance(normalized, normalizeProvider(provider)) }))
    .sort((a, b) => a.distance - b.distance)[0];
  const threshold = normalized.length <= 6 ? 2 : 3;
  return suggestion && suggestion.distance <= threshold
    ? { status: "suggestion" as const, provider: suggestion.provider }
    : { status: "unknown" as const, provider: value.trim() };
}

export function compatiblePromotions(methods: PaymentMethod[], today = new Date().toISOString().slice(0, 10)) {
  return verifiedPromotions.filter((promotion) =>
    promotion.validFrom <= today
    && promotion.validThrough >= today
    && methods.some((method) => promotion.banks.includes(method.bank) && promotion.cardTypes.includes(method.cardType)),
  );
}
