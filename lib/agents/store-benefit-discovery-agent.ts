import type { PaymentMethod } from "../payments";
import { extractStorePaymentReferences, type PublicBenefitReference } from "../public-benefit-extraction";

export type StoreBenefitReference = PublicBenefitReference & {
  provider: string;
  sourceUrl: string;
  sourceLabel: string;
};

export type StoreBenefitDiscovery = {
  store: string;
  sourceUrl: string;
  sourceLabel: string;
  status: "available" | "unavailable";
  checkedAt: string;
  references: StoreBenefitReference[];
  message: string;
};

type StoreSource = { store: string; aliases: string[]; url: string; label: string };

export const officialStoreBenefitSources: StoreSource[] = [
  { store: "Carrefour", aliases: ["carrefour", "carrefour market", "carrefour express", "carrefour maxi"], url: "https://www.carrefour.com.ar/", label: "Promociones oficiales Carrefour" },
  { store: "Coto", aliases: ["coto"], url: "https://www.coto.com.ar/hoy/index.asp", label: "Descuentos oficiales Coto" },
  { store: "Día", aliases: ["día", "dia", "supermercados dia"], url: "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones", label: "Promociones oficiales Día" },
  { store: "Jumbo", aliases: ["jumbo"], url: "https://www.jumbo.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Jumbo" },
  { store: "Disco", aliases: ["disco", "disco express"], url: "https://www.disco.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Disco" },
  { store: "Vea", aliases: ["vea", "super vea"], url: "https://www.vea.com.ar/descuentos-del-dia?type=por-banco", label: "Descuentos bancarios Vea" },
  { store: "ChangoMás", aliases: ["changomás", "changomas", "chango más", "mas online"], url: "https://www.masonline.com.ar/promociones", label: "Promociones oficiales ChangoMás" },
];

const cache = new Map<string, { expiresAt: number; html: string }>();

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function sourcesForNearbyStores(stores: Array<{ name: string; brand: string }>) {
  return officialStoreBenefitSources.filter((source) => stores.some((store) => {
    const searchable = normalize(`${store.name} ${store.brand}`);
    return source.aliases.some((alias) => searchable.includes(normalize(alias)));
  }));
}

async function fetchSource(source: StoreSource) {
  const cached = cache.get(source.url);
  if (cached && cached.expiresAt > Date.now()) return cached.html;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(source.url, { headers: { Accept: "text/html" }, redirect: "follow", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    cache.set(source.url, { expiresAt: Date.now() + 3 * 60 * 60 * 1000, html });
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverStoreBenefits(stores: Array<{ name: string; brand: string }>, methods: PaymentMethod[]): Promise<StoreBenefitDiscovery[]> {
  return Promise.all(sourcesForNearbyStores(stores).map(async (source) => {
    const checkedAt = new Date().toISOString();
    try {
      const html = await fetchSource(source);
      const references = extractStorePaymentReferences(html, source.store, methods).map((reference) => ({
        ...reference, sourceUrl: source.url, sourceLabel: source.label,
      }));
      return {
        store: source.store, sourceUrl: source.url, sourceLabel: source.label, status: "available" as const,
        checkedAt, references,
        message: references.length
          ? `${references.length} coincidencias públicas con tus medios encontradas.`
          : "La página respondió, pero no publicó coincidencias legibles con tus medios.",
      };
    } catch {
      return {
        store: source.store, sourceUrl: source.url, sourceLabel: source.label, status: "unavailable" as const,
        checkedAt, references: [], message: "La página oficial del supermercado no respondió a tiempo.",
      };
    }
  }));
}
