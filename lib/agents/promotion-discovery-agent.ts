import { benefitSourceForProvider, canonicalPaymentProvider, compatiblePromotions } from "../argentina-payments";
import type { PaymentMethod } from "../payments";
import { extractPublicBenefitSnippets } from "../public-benefit-extraction";
import { addRun, type WorkingState } from "./types";

export type PublicBenefitDiscovery = {
  provider: string;
  sourceUrl?: string;
  sourceLabel?: string;
  status: "available" | "unavailable" | "unsupported";
  checkedAt: string;
  publicBenefits: string[];
  message: string;
};

const cache = new Map<string, { expiresAt: number; value: PublicBenefitDiscovery }>();
async function fetchOfficialSource(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "MealBoard/1.0 public-benefits" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverPublicBenefits(methods: PaymentMethod[]): Promise<PublicBenefitDiscovery[]> {
  const providers = [...new Set(methods.map((method) => canonicalPaymentProvider(method.bank) ?? method.bank))];
  return Promise.all(providers.map(async (provider) => {
    const source = benefitSourceForProvider(provider);
    const now = new Date();
    if (!source) return {
      provider, status: "unsupported" as const, checkedAt: now.toISOString(), publicBenefits: [],
      message: "Entidad personalizada sin una fuente pública permitida.",
    };
    const cached = cache.get(provider);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
      const html = await fetchOfficialSource(source.url);
      const publicBenefits = extractPublicBenefitSnippets(html);
      const value: PublicBenefitDiscovery = {
        provider, sourceUrl: source.url, sourceLabel: source.label, status: "available",
        checkedAt: now.toISOString(), publicBenefits,
        message: publicBenefits.length
          ? `${publicBenefits.length} referencias públicas de supermercados encontradas.`
          : "La fuente respondió, pero no publicó condiciones de supermercado legibles sin iniciar sesión.",
      };
      cache.set(provider, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value });
      return value;
    } catch {
      return {
        provider, sourceUrl: source.url, sourceLabel: source.label, status: "unavailable" as const,
        checkedAt: now.toISOString(), publicBenefits: [],
        message: "La fuente oficial no respondió a tiempo. Se conservan los beneficios curados disponibles.",
      };
    }
  }));
}

export async function runPromotionDiscoveryAgent(state: WorkingState): Promise<WorkingState> {
  const methods = state.input.profile.paymentMethods?.length
    ? state.input.profile.paymentMethods
    : [{ bank: state.input.profile.paymentBank, cardType: state.input.profile.paymentCardType }];
  const discoveries = state.input.refreshPublicBenefits ? await discoverPublicBenefits(methods) : [];
  const verifiedCount = compatiblePromotions(methods).length;
  return addRun({ ...state, promotionDiscoveries: discoveries }, {
    id: "promotion-discovery",
    name: "Agente de beneficios públicos",
    role: "Consulta únicamente fuentes oficiales de los medios seleccionados.",
    observation: state.input.refreshPublicBenefits
      ? `${methods.length} medios seleccionados y ${discoveries.length} fuentes consultadas o recuperadas de caché.`
      : `${methods.length} medios seleccionados; la consulta web no fue solicitada en esta ejecución.`,
    decision: "Aceptar como calculables solo promociones estructuradas; mostrar el resto con fuente y estado.",
    output: `${verifiedCount} promociones verificadas y ${discoveries.reduce((sum, item) => sum + item.publicBenefits.length, 0)} referencias públicas encontradas.`,
  });
}
