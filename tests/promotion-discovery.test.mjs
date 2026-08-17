import assert from "node:assert/strict";
import test from "node:test";

import { extractPublicBenefitReferences, extractPublicBenefitSnippets, extractStorePaymentReferences, publicBenefitMatchesStore } from "../lib/public-benefit-extraction.ts";
import { extractRelevantInternalLinks } from "../lib/official-site-crawler.ts";
import { parseGaliciaStoreBenefits } from "../lib/provider-store-benefits.ts";

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

test("reads promotion conditions embedded as official page data without executing scripts", () => {
  const html = `<script type="application/ld+json">{"promotion":"Todos los sábados 20% de descuento",${'"conditions":"'.padEnd(900, "x")} Banco Santander con tarjeta de crédito"}</script>`;
  const references = extractStorePaymentReferences(html, "Día", [
    { bank: "Banco Santander", cardType: "Crédito" },
  ]);

  assert.equal(references.length, 1);
  assert.equal(references[0].day, "Sábado");
  assert.equal(references[0].discount, "20%");
});

test("discards an expired promotion embedded in an official store page", () => {
  const html = `<script>Vigencia desde el 1 de mayo de 2026 hasta el 31 de mayo de 2026. Todos los sábados 20% de descuento. Banco Santander con tarjeta de crédito.</script>`;
  const references = extractStorePaymentReferences(html, "Día", [
    { bank: "Banco Santander", cardType: "Crédito" },
  ], "2026-08-17");

  assert.deepEqual(references, []);
});

test("does not treat a zero percentage as a supermarket offer", () => {
  const references = extractStorePaymentReferences(
    `<script>Todos los martes 0% de descuento con Mercado Pago.</script>`,
    "Día",
    [{ bank: "Mercado Pago", cardType: "Dinero en cuenta" }],
    "2026-08-17",
  );

  assert.deepEqual(references, []);
});

test("extracts a selected wallet from Coto's official promotions JSON", () => {
  const json = JSON.stringify({ result: { promocionesSucursalesFisicas: [{
    diasVigencia: "Viernes",
    dias: [{ descripcion: "Viernes" }],
    textoDescuento: "25% DE DESCUENTO",
    descripcion: "Utilizando todos los medios de pago dentro de la app",
    observacion: "No válido para venta online. Aplican exclusiones.",
    icono: "logo_mercadopago.png",
  }] } });
  const references = extractStorePaymentReferences(json, "Coto", [
    { bank: "Mercado Pago", cardType: "Dinero en cuenta" },
  ], "2026-08-17");

  assert.equal(references.length, 1);
  assert.equal(references[0].provider, "Mercado Pago");
  assert.equal(references[0].day, "Viernes");
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

test("converts Galicia's public catalog into compatible supermarket benefits", () => {
  const benefits = parseGaliciaStoreBenefits([{
    promocion: "20% de ahorro", titulo: "Jumbo", subtitulo: "Supermercados",
    leyendaDiasAplicacion: "Martes y Jueves", fechaHasta: "2026-08-31T00:00:00",
    mediosDePago: [{ tipoTarjeta: "Credito" }, { tipoTarjeta: "Debito" }],
  }], [
    { bank: "Banco Galicia", cardType: "Crédito" },
    { bank: "Banco Galicia", cardType: "Débito" },
  ], "2026-08-17");

  assert.equal(benefits.length, 1);
  assert.equal(benefits[0].store, "Jumbo");
  assert.equal(benefits[0].discount, "20%");
  assert.deepEqual(benefits[0].cardTypes, ["Crédito", "Débito"]);
  assert.equal(benefits[0].structured, true);
});

test("does not confuse short supermarket names with parts of other brands", () => {
  const benefits = parseGaliciaStoreBenefits([{
    promocion: "20% de ahorro", titulo: "Farmacia Nueva", subtitulo: "Salud",
    leyendaDiasAplicacion: "Todos los días", fechaHasta: "2026-08-31T00:00:00",
    mediosDePago: [{ tipoTarjeta: "Credito" }],
  }], [{ bank: "Banco Galicia", cardType: "Crédito" }], "2026-08-17");

  assert.deepEqual(benefits, []);
});
