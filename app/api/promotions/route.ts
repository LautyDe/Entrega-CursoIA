import { NextResponse } from "next/server";
import { canonicalPaymentProvider, compatiblePromotions } from "../../../lib/argentina-payments";
import { discoverPublicBenefits } from "../../../lib/agents/promotion-discovery-agent";
import type { PaymentMethod } from "../../../lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { paymentMethods?: PaymentMethod[] };
    const methods = (body.paymentMethods ?? []).flatMap((method) => {
      const bank = canonicalPaymentProvider(method.bank);
      return bank ? [{ ...method, bank }] : [];
    });
    if (!methods.length) return NextResponse.json({ error: "Seleccioná al menos un medio reconocido." }, { status: 400 });
    const [discoveries] = await Promise.all([discoverPublicBenefits(methods)]);
    return NextResponse.json({ discoveries, promotions: compatiblePromotions(methods) });
  } catch {
    return NextResponse.json({ error: "No se pudieron consultar los beneficios públicos." }, { status: 500 });
  }
}
