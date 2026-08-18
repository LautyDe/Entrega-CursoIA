import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("includes an installable mobile web app manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose.includes("maskable")));

  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
});

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

test("rejects user APIs without an authenticated identity", async () => {
  const worker = await loadWorker();
  for (const path of ["/api/me", "/api/user-state"]) {
    const response = await worker.fetch(new Request(`http://localhost${path}`), env, ctx);
    assert.equal(response.status, 401);
  }
});

test("exposes only authentication capability flags", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/auth-config"), {
    ...env,
    BETTER_AUTH_SECRET: "test-secret-with-more-than-thirty-two-characters",
    GOOGLE_CLIENT_ID: "public-client-id",
    GOOGLE_CLIENT_SECRET: "private-client-secret",
  }, ctx);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ready: true, email: true, emailDelivery: false, google: true });
});

test("coordinates nine agents and respects selected meal slots", async () => {
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
  assert.equal(plan.agentRun.length, 9);
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
  assert.match(plan.agentRun.find((run) => run.id === "shopping").decision, /No hay promociones vigentes compatibles/);
});
