import { benefitSourceForProvider, canonicalPaymentProvider, compatiblePromotions } from "../argentina-payments";
import type { PaymentMethod } from "../payments";
import { extractPublicBenefitSnippets } from "../public-benefit-extraction";
import { crawlOfficialSite, rememberUsefulOfficialPages } from "../official-site-crawler";
import { addRun, type WorkingState } from "./types";

export type PublicBenefitDiscovery = {
  provider: string;
  sourceUrl?: string;
  sourceLabel?: string;
  status: "available" | "unavailable" | "unsupported";
  checkedAt: string;
  publicBenefits: string[];
  message: string;
  pagesChecked?: number;
  usefulPages?: string[];
};

const cache = new Map<string, { expiresAt: number; value: PublicBenefitDiscovery }>();

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
      const pages = await crawlOfficialSite(source.url);
      const extracted = pages.map((page) => ({ page, snippets: extractPublicBenefitSnippets(page.body) }));
      const publicBenefits = [...new Set(extracted.flatMap((item) => item.snippets))].slice(0, 20);
      const usefulPages = extracted.filter((item) => item.snippets.length).map((item) => item.page.url);
      rememberUsefulOfficialPages(source.url, usefulPages);
      const value: PublicBenefitDiscovery = {
        provider, sourceUrl: source.url, sourceLabel: source.label, status: "available",
        checkedAt: now.toISOString(), publicBenefits, pagesChecked: pages.length, usefulPages,
        message: publicBenefits.length
          ? `${publicBenefits.length} referencias públicas encontradas en ${pages.length} secciones oficiales.`
          : `${pages.length} secciones respondieron, pero no publicaron condiciones de supermercado legibles sin iniciar sesión.`,
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
