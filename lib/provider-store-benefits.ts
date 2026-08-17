import type { PaymentMethod } from "./payments";
import type { PublicBenefitReference } from "./public-benefit-extraction";

export type StructuredProviderStoreBenefit = PublicBenefitReference & {
  provider: string;
  sourceUrl: string;
  sourceLabel: string;
  structured: true;
};

type GaliciaCatalogItem = {
  promocion?: string;
  titulo?: string;
  subtitulo?: string;
  leyendaDiasAplicacion?: string;
  fechaHasta?: string;
  mediosDePago?: Array<{ tipoTarjeta?: string }>;
};

const galiciaCatalogUrl = "https://loyalty.bff.bancogalicia.com.ar/api/portal/catalogo/v1/promociones";
const galiciaPublicUrl = "https://beneficios.galicia.ar/";
const supermarketNames = [
  { store: "Carrefour", aliases: ["carrefour"] }, { store: "Coto", aliases: ["coto"] },
  { store: "Día", aliases: ["dia"] }, { store: "Jumbo", aliases: ["jumbo"] },
  { store: "Disco", aliases: ["disco"] }, { store: "Vea", aliases: ["vea"] },
  { store: "ChangoMás", aliases: ["changomas", "chango mas"] },
  { store: "La Anónima", aliases: ["la anonima"] },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function containsAlias(value: string, alias: string) {
  const paddedValue = ` ${value.replace(/[^a-z0-9]+/g, " ").trim()} `;
  const paddedAlias = ` ${alias.replace(/[^a-z0-9]+/g, " ").trim()} `;
  return paddedValue.includes(paddedAlias);
}

function catalogCardTypes(item: GaliciaCatalogItem) {
  return [...new Set(item.mediosDePago?.flatMap((method) => {
    const type = normalize(method.tipoTarjeta ?? "");
    if (type.includes("debito")) return ["Débito" as const];
    if (type.includes("credito")) return ["Crédito" as const];
    return [];
  }))];
}

export function parseGaliciaStoreBenefits(items: GaliciaCatalogItem[], methods: PaymentMethod[], today: string) {
  const selectedTypes = new Set(methods.filter((method) => method.bank === "Banco Galicia").map((method) => method.cardType));
  if (!selectedTypes.size) return [];
  return items.flatMap((item): StructuredProviderStoreBenefit[] => {
    const searchable = normalize(`${item.titulo ?? ""} ${item.subtitulo ?? ""}`);
    const matchedStore = supermarketNames.find(({ aliases }) => aliases.some((alias) => containsAlias(searchable, alias)));
    const discount = item.promocion?.match(/\b\d{1,2}\s*%/)?.[0].replace(/\s+/g, "");
    const validThrough = item.fechaHasta?.slice(0, 10);
    const cardTypes = catalogCardTypes(item);
    if (!matchedStore || !discount || !item.leyendaDiasAplicacion || (validThrough && validThrough < today)) return [];
    if (cardTypes.length && !cardTypes.some((type) => selectedTypes.has(type))) return [];
    return [{
      store: matchedStore.store, provider: "Banco Galicia", day: item.leyendaDiasAplicacion.trim(), discount,
      excerpt: `${item.titulo}: ${item.promocion}. ${item.leyendaDiasAplicacion}.`, cardTypes, validThrough,
      sourceUrl: galiciaPublicUrl, sourceLabel: "Catálogo público oficial de Beneficios Galicia", structured: true,
    }];
  });
}

let galiciaCache: { expiresAt: number; benefits: StructuredProviderStoreBenefit[] } | undefined;

export async function discoverStructuredProviderStoreBenefits(methods: PaymentMethod[], today = new Date().toISOString().slice(0, 10)) {
  if (!methods.some((method) => method.bank === "Banco Galicia")) return [];
  if (galiciaCache && galiciaCache.expiresAt > Date.now()) return galiciaCache.benefits;
  const items: GaliciaCatalogItem[] = [];
  for (let page = 1; page <= 4; page += 1) {
    const response = await fetch(`${galiciaCatalogUrl}?page=${page}&pageSize=500`, {
      headers: { Accept: "application/json", id_canal: "beneficios" }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Galicia catalog HTTP ${response.status}`);
    const result = await response.json() as { data?: { list?: GaliciaCatalogItem[]; totalSize?: number } };
    items.push(...(result.data?.list ?? []));
    if (items.length >= (result.data?.totalSize ?? 0)) break;
  }
  const benefits = parseGaliciaStoreBenefits(items, methods, today);
  galiciaCache = { expiresAt: Date.now() + 3 * 60 * 60 * 1000, benefits };
  return benefits;
}
