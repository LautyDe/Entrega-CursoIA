const supermarkets = ["Carrefour", "Coto", "ChangoMás", "Changomas", "Jumbo", "Disco", "Vea", "Día", "Dia", "La Anónima", "La Anonima", "Mami"];
const days = ["Lunes", "Martes", "Miércoles", "Miercoles", "Jueves", "Viernes", "Sábado", "Sabado", "Domingo"];

export type PublicBenefitReference = {
  store: string;
  day: string;
  discount: string;
  excerpt: string;
  cardTypes: Array<"Débito" | "Crédito" | "Prepaga" | "Dinero en cuenta">;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

type PublicPaymentMethod = { bank: string; cardType: "Débito" | "Crédito" | "Prepaga" | "Dinero en cuenta" };

const providerSearchTerms: Record<string, string[]> = {
  "Banco Santander": ["santander", "santander río", "santander rio"],
  "Banco Nación": ["banco nación", "banco nacion", "bna"],
  "Banco Provincia": ["banco provincia", "bapro", "cuenta dni"],
  "Banco Ciudad": ["banco ciudad"],
  "Banco Galicia": ["galicia"],
  BBVA: ["bbva", "francés", "frances"],
  "Banco Macro": ["banco macro", "macro"],
  ICBC: ["icbc"],
  "Banco Credicoop": ["credicoop"],
  "Banco Supervielle": ["supervielle"],
  "Banco Patagonia": ["patagonia"],
  "Banco Hipotecario": ["hipotecario"],
  "Banco Comafi": ["comafi"],
  "Mercado Pago": ["mercado pago"],
  MODO: ["modo"],
  "Naranja X": ["naranja x", "tarjeta naranja"],
  Ualá: ["ualá", "uala"],
  "Personal Pay": ["personal pay"],
  "Cuenta DNI": ["cuenta dni"],
};

export function extractStorePaymentReferences(html: string, store: string, methods: PublicPaymentMethod[]) {
  const text = visibleText(html);
  const normalizedText = normalize(text);
  const references: Array<PublicBenefitReference & { provider: string }> = [];
  methods.forEach((method) => {
    const terms = providerSearchTerms[method.bank] ?? [method.bank];
    terms.forEach((term) => {
      let offset = 0;
      while ((offset = normalizedText.indexOf(normalize(term), offset)) >= 0) {
        const excerpt = text.slice(Math.max(0, offset - 260), Math.min(text.length, offset + term.length + 320));
        const normalizedExcerpt = normalize(excerpt);
        const day = days.find((candidate) => normalizedExcerpt.includes(normalize(candidate)));
        const discount = excerpt.match(/\b\d{1,2}\s*%/)?.[0].replace(/\s+/g, "");
        if (day && discount) {
          const cardTypes: PublicBenefitReference["cardTypes"] = [];
          if (normalizedExcerpt.includes("debito")) cardTypes.push("Débito");
          if (normalizedExcerpt.includes("credito")) cardTypes.push("Crédito");
          if (normalizedExcerpt.includes("prepaga")) cardTypes.push("Prepaga");
          if (normalizedExcerpt.includes("dinero en cuenta") || normalizedExcerpt.includes("saldo en cuenta")) cardTypes.push("Dinero en cuenta");
          if (!cardTypes.length || cardTypes.includes(method.cardType)) {
            const reference = { store, provider: method.bank, day: day.replace("Miercoles", "Miércoles").replace("Sabado", "Sábado"), discount, excerpt, cardTypes };
            if (!references.some((item) => item.provider === reference.provider && item.day === reference.day && item.discount === reference.discount)) references.push(reference);
          }
        }
        offset += term.length;
      }
    });
  });
  return references.slice(0, 20);
}

export function extractPublicBenefitSnippets(html: string) {
  const text = visibleText(html);
  const snippets: string[] = [];
  supermarkets.forEach((store) => {
    let offset = 0;
    while ((offset = text.toLowerCase().indexOf(store.toLowerCase(), offset)) >= 0) {
      const start = Math.max(0, offset - 140);
      const end = Math.min(text.length, offset + store.length + 240);
      const snippet = text.slice(start, end).trim();
      if (/\d{1,2}\s*%/.test(snippet) && !snippets.includes(snippet)) snippets.push(snippet);
      offset += store.length;
    }
  });
  return snippets.slice(0, 8);
}

export function extractPublicBenefitReferences(snippets: string[]): PublicBenefitReference[] {
  const references: PublicBenefitReference[] = [];
  snippets.forEach((snippet) => {
    const normalizedSnippet = normalize(snippet);
    supermarkets.forEach((store) => {
      const storeOffset = normalizedSnippet.indexOf(normalize(store));
      if (storeOffset < 0) return;
      const excerpt = snippet.slice(Math.max(0, storeOffset - 140), Math.min(snippet.length, storeOffset + store.length + 200));
      const normalizedExcerpt = normalize(excerpt);
      const day = days.find((candidate) => normalizedExcerpt.includes(normalize(candidate)));
      const discount = excerpt.match(/\b\d{1,2}\s*%/)?.[0].replace(/\s+/g, "");
      if (!day || !discount) return;
      const cardTypes: PublicBenefitReference["cardTypes"] = [];
      if (normalizedExcerpt.includes("debito")) cardTypes.push("Débito");
      if (normalizedExcerpt.includes("credito")) cardTypes.push("Crédito");
      if (normalizedExcerpt.includes("prepaga")) cardTypes.push("Prepaga");
      if (normalizedExcerpt.includes("dinero en cuenta") || normalizedExcerpt.includes("saldo en cuenta")) cardTypes.push("Dinero en cuenta");
      const canonicalStore = normalize(store) === "changomas" ? "ChangoMás"
        : normalize(store) === "dia" ? "Día"
          : normalize(store) === "la anonima" ? "La Anónima" : store;
      const reference = { store: canonicalStore, day: day.replace("Miercoles", "Miércoles").replace("Sabado", "Sábado"), discount, excerpt, cardTypes };
      if (!references.some((item) => item.store === reference.store && item.day === reference.day && item.discount === reference.discount)) references.push(reference);
    });
  });
  return references.slice(0, 20);
}

export function publicBenefitMatchesStore(reference: PublicBenefitReference, storeName: string, storeBrand = storeName) {
  return normalize(`${storeName} ${storeBrand}`).includes(normalize(reference.store));
}
