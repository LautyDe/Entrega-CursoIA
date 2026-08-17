export type CrawledOfficialPage = { url: string; body: string; depth: number };

const relevantTerms = /promoc|benefic|descuent|medio(?:s)?[-_\s]?de[-_\s]?pago|banco|tarjeta|billetera|legal/i;
const rejectedTerms = /login|ingresar|registro|cuenta|carrito|checkout|producto|categoria|contacto|mailto:|tel:/i;
const pageCache = new Map<string, { expiresAt: number; body: string }>();
const learnedPages = new Map<string, Map<string, number>>();

function hostKey(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isAllowedUrl(candidate: URL, seed: URL) {
  return candidate.protocol === "https:"
    && !candidate.username
    && !candidate.password
    && hostKey(candidate.hostname) === hostKey(seed.hostname)
    && !rejectedTerms.test(`${candidate.pathname}${candidate.search}`);
}

export function extractRelevantInternalLinks(html: string, pageUrl: string, seedUrl = pageUrl) {
  const page = new URL(pageUrl);
  const seed = new URL(seedUrl);
  const links: Array<{ url: string; score: number }> = [];
  const pattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const hint = `${match[1]} ${label}`;
    if (!relevantTerms.test(hint) || rejectedTerms.test(hint)) continue;
    try {
      const candidate = new URL(match[1], page);
      candidate.hash = "";
      if (!isAllowedUrl(candidate, seed)) continue;
      const score = (relevantTerms.test(label) ? 3 : 0)
        + (/promoc|benefic|descuent/i.test(hint) ? 3 : 0)
        + (/banco|medio(?:s)?[-_\s]?de[-_\s]?pago/i.test(hint) ? 2 : 0)
        + (/legal/i.test(hint) ? 1 : 0);
      if (!links.some((item) => item.url === candidate.href)) links.push({ url: candidate.href, score });
    } catch {
      // Ignore malformed links published by the source page.
    }
  }
  const assetPattern = /(?:src\s*=\s*|["'])(["']?)([^"'\s<>]*(?:promoc|benefic|descuent|medio[-_]?de[-_]?pago|legal|data\.json)[^"'\s<>]*)\1/gi;
  for (const match of html.matchAll(assetPattern)) {
    try {
      const candidate = new URL(match[2], page);
      candidate.hash = "";
      if (!isAllowedUrl(candidate, seed) || links.some((item) => item.url === candidate.href)) continue;
      links.push({ url: candidate.href, score: /\.json(?:\?|$)/i.test(candidate.href) ? 5 : 4 });
    } catch {
      // Ignore malformed internal assets.
    }
  }
  return links.sort((left, right) => right.score - left.score).slice(0, 20);
}

async function fetchPage(url: string, seed: URL, timeoutMs: number) {
  const cached = pageCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.body;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(100, timeoutMs));
  try {
    const response = await fetch(url, { headers: { Accept: "text/html,application/json,text/plain" }, redirect: "follow", signal: controller.signal });
    if (!response.ok || !isAllowedUrl(new URL(response.url), seed)) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!/text|html|json|javascript/i.test(contentType)) throw new Error("Unsupported content type");
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 4_000_000) throw new Error("Response too large");
    const body = (await response.text()).slice(0, 4_000_000);
    pageCache.set(url, { expiresAt: Date.now() + 3 * 60 * 60 * 1000, body });
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function crawlOfficialSite(seedUrl: string, maxPages = 6, maxDepth = 2): Promise<CrawledOfficialPage[]> {
  const seed = new URL(seedUrl);
  if (seed.protocol !== "https:" || seed.username || seed.password) throw new Error("Invalid official source");
  const pages: CrawledOfficialPage[] = [];
  const deadline = Date.now() + 12_000;
  const visited = new Set<string>();
  const learned = [...(learnedPages.get(seed.href)?.entries() ?? [])]
    .sort((left, right) => right[1] - left[1])
    .map(([url]) => ({ url, depth: 1, score: 20 }));
  let queue = [{ url: seed.href, depth: 0, score: 100 }, ...learned];

  while (queue.length && pages.length < maxPages && Date.now() < deadline) {
    queue.sort((left, right) => right.score - left.score);
    const current = queue.shift()!;
    if (visited.has(current.url) || current.depth > maxDepth) continue;
    visited.add(current.url);
    try {
      const body = await fetchPage(current.url, seed, Math.min(4500, deadline - Date.now()));
      pages.push({ url: current.url, body, depth: current.depth });
      if (current.depth < maxDepth) {
        const next = extractRelevantInternalLinks(body, current.url, seed.href)
          .filter((link) => !visited.has(link.url))
          .map((link) => ({ ...link, depth: current.depth + 1 }));
        queue = [...queue, ...next].sort((left, right) => right.score - left.score).slice(0, maxPages * 4);
      }
    } catch {
      // One inaccessible section must not discard the other official pages.
    }
  }
  if (!pages.length) throw new Error("Official source unavailable");
  return pages;
}

export function rememberUsefulOfficialPages(seedUrl: string, urls: string[]) {
  const memory = learnedPages.get(seedUrl) ?? new Map<string, number>();
  urls.forEach((url) => memory.set(url, Math.min(10, (memory.get(url) ?? 0) + 1)));
  learnedPages.set(seedUrl, memory);
}
