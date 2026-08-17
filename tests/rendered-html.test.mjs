import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders development preview metadata", async () => {
  const worker = await loadWorker();

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("coordinates eight agents and respects selected meal slots", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        city: "Ciudad de Buenos Aires",
        profile: {
          name: "Lucía",
          budget: 35000,
          level: "Principiante",
          likes: "Lentejas",
          dislikes: "Aceitunas",
          allergies: "Ninguna",
          appliances: "Horno, anafe, microondas y licuadora",
          paymentBank: "Banco Ciudad",
          paymentCardType: "Débito",
          nutrition: true,
        },
        inventory: [
          { name: "Huevos", amount: "6 unidades", expiry: "10 días" },
          { name: "Espinaca", amount: "1 atado", expiry: "2 días" },
        ],
        priorFeedback: ["Me faltó tiempo"],
        requestedMeals: ["breakfast", "lunch", "dinner"],
        promotions: [
          { day: "Miércoles", store: "Carrefour", bank: "Banco Ciudad", cardType: "Débito", discount: "20%", cap: "$8.000" },
        ],
      }),
    }),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  const plan = await response.json();
  assert.equal(plan.mode, "local-agents");
  assert.equal(plan.agentRun.length, 8);
  assert.equal(plan.week.length, 7);
  assert.ok(plan.week.every((day) => day.breakfast && day.lunch && day.dinner));
  assert.ok(plan.week.every((day) => day.snack === ""));
  assert.ok(plan.shopping.length > 0);
  assert.ok(plan.estimatedSaving > 0);
});

test("does not apply an incompatible payment promotion", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: {
          budget: 35000,
          level: "Principiante",
          dislikes: "Aceitunas",
          allergies: "Ninguna",
          appliances: "Horno, anafe, microondas y licuadora",
          paymentBank: "Banco Galicia",
          paymentCardType: "Débito",
        },
        inventory: [],
        requestedMeals: ["lunch", "dinner"],
        promotions: [
          { day: "Jueves", store: "Coto", bank: "Banco Galicia", cardType: "Crédito", discount: "30%", cap: "$8.000" },
        ],
      }),
    }),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  const plan = await response.json();
  assert.equal(plan.estimatedSaving, 0);
  assert.match(plan.agentRun[6].decision, /No hay promociones vigentes compatibles/);
});
