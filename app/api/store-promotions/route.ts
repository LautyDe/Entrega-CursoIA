import { NextResponse } from "next/server";
import { canonicalPaymentProvider } from "../../../lib/argentina-payments";
import { discoverStoreBenefits } from "../../../lib/agents/store-benefit-discovery-agent";
import type { PaymentMethod } from "../../../lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      paymentMethods?: PaymentMethod[];
      stores?: Array<{ name?: string; brand?: string }>;
    };
    const methods = (body.paymentMethods ?? []).flatMap((method) => {
      const bank = canonicalPaymentProvider(method.bank);
      return bank ? [{ ...method, bank }] : [];
    });
    const stores = (body.stores ?? []).slice(0, 30).flatMap((store) => {
      const name = store.name?.trim();
      if (!name) return [];
      return [{ name: name.slice(0, 100), brand: (store.brand ?? name).slice(0, 100) }];
    });
    if (!methods.length || !stores.length) return NextResponse.json({ error: "Faltan medios reconocidos o supermercados." }, { status: 400 });
    return NextResponse.json({ discoveries: await discoverStoreBenefits(stores, methods) });
  } catch {
    return NextResponse.json({ error: "No se pudieron consultar las promociones de supermercados." }, { status: 500 });
  }
}
