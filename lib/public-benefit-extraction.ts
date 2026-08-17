const supermarkets = ["Carrefour", "Coto", "ChangoMás", "Changomas", "Jumbo", "Disco", "Vea", "Día", "Dia", "La Anónima", "La Anonima", "Mami"];

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
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
