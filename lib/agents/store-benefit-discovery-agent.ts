import type { PaymentMethod } from "../payments";
import { extractStorePaymentReferences, type PublicBenefitReference } from "../public-benefit-extraction";
import { crawlOfficialSite, rememberUsefulOfficialPages } from "../official-site-crawler";
import { discoverStructuredProviderStoreBenefits } from "../provider-store-benefits";

export type StoreBenefitReference = PublicBenefitReference & {
  provider: string;
  sourceUrl: string;
  sourceLabel: string;
  structured?: true;
};

export type StoreBenefitDiscovery = {
  store: string;
  sourceUrl: string;
  sourceLabel: string;
  status: "available" | "unavailable";
  checkedAt: string;
  references: StoreBenefitReference[];
  message: string;
  pagesChecked?: number;
  usefulPages?: string[];
};

type StoreSource = { store: string; aliases: string[]; url: string; label: string; sectionUrls?: string[] };

export const officialStoreBenefitSources: StoreSource[] = [
  { store: "Carrefour", aliases: ["carrefour", "carrefour market", "carrefour express", "carrefour maxi"], url: "https://www.carrefour.com.ar/", label: "Promociones oficiales Carrefour" },
  {
    store: "Coto", aliases: ["coto"], url: "https://www.coto.com.ar/hoy/index.asp", label: "Descuentos oficiales Coto",
    sectionUrls: [
      "https://www.coto.com.ar/legales/",
      "https://www.coto.com.ar/terminos-descuentos",
      "https://www.coto.com.ar/rest/model/atg/actors/cProfileActor/getPromocionesMulticanal?enviroment=ag",
    ],
  },
  { store: "Día", aliases: ["día", "dia", "supermercados dia"], url: "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones", label: "Promociones oficiales Día" },
  { store: "Jumbo", aliases: ["jumbo"], url: "https://www.jumbo.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Jumbo" },
  { store: "Disco", aliases: ["disco", "disco express"], url: "https://www.disco.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Disco" },
  { store: "Vea", aliases: ["vea", "super vea"], url: "https://www.vea.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Vea" },
  { store: "ChangoMás", aliases: ["changomás", "changomas", "chango más", "mas online"], url: "https://www.masonline.com.ar/promociones", label: "Promociones oficiales ChangoMás" },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function sourcesForNearbyStores(stores: Array<{ name: string; brand: string }>) {
  return officialStoreBenefitSources.filter((source) => stores.some((store) => {
    const searchable = normalize(`${store.name} ${store.brand}`);
    return source.aliases.some((alias) => searchable.includes(normalize(alias)));
  }));
}

export async function discoverStoreBenefits(stores: Array<{ name: string; brand: string }>, methods: PaymentMethod[]): Promise<StoreBenefitDiscovery[]> {
  const supplementaryBenefits = await discoverStructuredProviderStoreBenefits(methods).catch(() => []);
  return Promise.all(sourcesForNearbyStores(stores).map(async (source) => {
    const checkedAt = new Date().toISOString();
    try {
      const crawledGroups = await Promise.all([
        crawlOfficialSite(source.url),
        ...(source.sectionUrls ?? []).map((url) => crawlOfficialSite(url, 2, 1).catch(() => [])),
      ]);
      const pages = crawledGroups.flat().filter((page, index, all) => all.findIndex((item) => item.url === page.url) === index);
      const extracted = pages.map((page) => ({
        page,
        references: extractStorePaymentReferences(page.body, source.store, methods).map((reference) => ({
          ...reference, sourceUrl: page.url, sourceLabel: source.label,
        })),
      }));
      const storeReferences = extracted.flatMap((item) => item.references);
      const providerReferences = supplementaryBenefits.filter((benefit) => benefit.store === source.store);
      const references = [...storeReferences, ...providerReferences].filter((reference, index, all) =>
        all.findIndex((item) => item.provider === reference.provider && item.day === reference.day && item.discount === reference.discount) === index,
      );
      const usefulPages = extracted.filter((item) => item.references.length).map((item) => item.page.url);
      rememberUsefulOfficialPages(source.url, usefulPages);
      return {
        store: source.store, sourceUrl: source.url, sourceLabel: source.label, status: "available" as const,
        checkedAt, references, pagesChecked: pages.length, usefulPages,
        message: references.length
          ? `${references.length} coincidencias con tus medios encontradas en ${pages.length} secciones oficiales.`
          : `${pages.length} secciones respondieron, pero no publicaron coincidencias legibles con tus medios.`,
      };
    } catch {
      const providerReferences = supplementaryBenefits.filter((benefit) => benefit.store === source.store);
      return {
        store: source.store, sourceUrl: source.url, sourceLabel: source.label,
        status: providerReferences.length ? "available" as const : "unavailable" as const,
        checkedAt, references: providerReferences,
        message: providerReferences.length
          ? `El supermercado no respondió, pero se encontraron ${providerReferences.length} coincidencias en el catálogo público de la entidad.`
          : "La página oficial del supermercado no respondió a tiempo.",
      };
    }
  }));
}
