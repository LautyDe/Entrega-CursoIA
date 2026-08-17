export type CardType = "Débito" | "Crédito";

export type PaymentMethod = {
  bank: string;
  cardType: CardType;
};

export type PaymentPromotion = {
  day: string;
  store: string;
  bank: string;
  cardType: CardType;
  discount: string;
  cap: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function selectBestPromotion<T extends PaymentPromotion>(
  payment: PaymentMethod,
  promotions: readonly T[],
): T | undefined {
  return promotions
    .filter((promotion) =>
      normalize(promotion.bank) === normalize(payment.bank)
      && normalize(promotion.cardType) === normalize(payment.cardType),
    )
    .sort((a, b) => Number.parseInt(b.discount) - Number.parseInt(a.discount))[0];
}

export function promotionSaving(cost: number, promotion?: PaymentPromotion) {
  if (!promotion) return 0;
  const discount = Number.parseInt(promotion.discount) / 100;
  const cap = Number(promotion.cap.replace(/\D/g, ""));
  return Math.round(Math.min(cost * discount, cap || Number.POSITIVE_INFINITY));
}

export function migrateLegacyPayment(
  profile: Record<string, unknown>,
  fallback: PaymentMethod,
): { paymentBank: string; paymentCardType: CardType } {
  const bank = typeof profile.paymentBank === "string" ? profile.paymentBank.trim() : "";
  const cardType = profile.paymentCardType === "Crédito" || profile.paymentCardType === "Débito"
    ? profile.paymentCardType
    : undefined;
  if (bank && cardType) return { paymentBank: bank, paymentCardType: cardType };

  const legacy = typeof profile.payment === "string" ? profile.payment : "";
  const legacyType: CardType | undefined = normalize(legacy).includes("credito")
    ? "Crédito"
    : normalize(legacy).includes("debito") ? "Débito" : undefined;
  const legacyBank = legacy.split(/[·|]/)[0]?.trim();

  return {
    paymentBank: bank || legacyBank || fallback.bank,
    paymentCardType: cardType || legacyType || fallback.cardType,
  };
}
