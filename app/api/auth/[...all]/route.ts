import { createAuth } from "../../../../lib/auth";
import { ensureUserSchema } from "../../../../db";

async function handle(request: Request) {
  try {
    await ensureUserSchema();
    return createAuth(request.url).handler(request);
  } catch (error) {
    console.error("Authentication unavailable", error);
    return Response.json({ error: "La autenticación todavía no está configurada." }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
