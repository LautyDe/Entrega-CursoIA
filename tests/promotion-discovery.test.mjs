import assert from "node:assert/strict";
import test from "node:test";

import { extractPublicBenefitReferences, extractPublicBenefitSnippets, extractStorePaymentReferences, publicBenefitMatchesStore } from "../lib/public-benefit-extraction.ts";
import { extractRelevantInternalLinks } from "../lib/official-site-crawler.ts";

test("extracts supermarket discounts from public HTML without scripts", () => {
  const snippets = extractPublicBenefitSnippets(`
    <html><body>
      <script>Carrefour tiene 99% de descuento falso</script>
      <article><h2>Supermercados</h2><p>Los miércoles obtené 20% de ahorro en Carrefour pagando con débito.</p></article>
      <p>Una publicación general de la entidad sin porcentaje para Coto.</p>
    </body></html>
  `);

  assert.equal(snippets.length, 1);
  assert.match(snippets[0], /20% de ahorro en Carrefour/);
  assert.doesNotMatch(snippets[0], /99%/);
});

test("limits the extracted public references", () => {
  const html = Array.from({ length: 20 }, (_, index) =>
    `<p>Beneficio ${index}: 15% de descuento en Carrefour los martes.</p>`,
  ).join("");

  assert.ok(extractPublicBenefitSnippets(html).length <= 8);
});

test("structures only public references with store, day and discount", () => {
  const references = extractPublicBenefitReferences([
    "Los miércoles obtené 20% de ahorro en Carrefour pagando con tarjeta de débito.",
    "Conocé todos los beneficios disponibles en Coto.",
  ]);

  assert.deepEqual(references, [{
    store: "Carrefour",
    day: "Miércoles",
    discount: "20%",
    cardTypes: ["Débito"],
    excerpt: "Los miércoles obtené 20% de ahorro en Carrefour pagando con tarjeta de débito.",
  }]);
  assert.equal(publicBenefitMatchesStore(references[0], "Carrefour Market Palermo", "Carrefour Market"), true);
  assert.equal(publicBenefitMatchesStore(references[0], "Coto Palermo", "Coto"), false);
});

test("filters an official supermarket page by the selected payment method", () => {
  const html = `<section>Todos los martes 25% de ahorro pagando con MODO desde Supervielle con tarjetas de débito y crédito.</section>
    <section>Todos los jueves 30% con tarjeta de crédito Banco Galicia.</section>`;
  const references = extractStorePaymentReferences(html, "Coto", [
    { bank: "Banco Supervielle", cardType: "Débito" },
  ]);

  assert.equal(references.length, 1);
  assert.equal(references[0].store, "Coto");
  assert.equal(references[0].provider, "Banco Supervielle");
  assert.equal(references[0].day, "Martes");
  assert.equal(references[0].discount, "25%");
});

test("follows only relevant sections inside the same official site", () => {
  const links = extractRelevantInternalLinks(`
    <a href="/beneficios/promociones-bancarias">Promociones bancarias</a>
    <a href="/legales">Ver legales</a>
    <a href="/productos/arroz">Arroz</a>
    <a href="https://example.net/descuentos">Descuento externo</a>
    <a href="/login?next=promociones">Ingresar a mi cuenta</a>
  `, "https://supermercado.example.com/inicio");

  assert.deepEqual(links.map((link) => new URL(link.url).pathname), [
    "/beneficios/promociones-bancarias",
    "/legales",
  ]);
});
