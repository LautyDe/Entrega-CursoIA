import assert from "node:assert/strict";
import test from "node:test";

import { extractPublicBenefitSnippets } from "../lib/public-benefit-extraction.ts";

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
