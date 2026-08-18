import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "../db";
import * as schema from "../db/schema";
import { sendMealBoardEmail } from "./email";

declare global {
  var __MEALBOARD_AUTH_CONFIG__: {
    secret?: string; googleClientId?: string; googleClientSecret?: string;
    resendApiKey?: string; emailFrom?: string;
  } | undefined;
}

export function authCapabilities() {
  const config = globalThis.__MEALBOARD_AUTH_CONFIG__;
  return {
    ready: Boolean(config?.secret),
    email: Boolean(config?.secret),
    emailDelivery: Boolean(config?.secret && config?.resendApiKey && config?.emailFrom),
    google: Boolean(config?.secret && config?.googleClientId && config?.googleClientSecret),
  };
}

export function createAuth(requestUrl: string) {
  const config = globalThis.__MEALBOARD_AUTH_CONFIG__;
  if (!config?.secret) throw new Error("BETTER_AUTH_SECRET is not configured");
  const baseURL = new URL(requestUrl).origin;
  const emailEnabled = Boolean(config.resendApiKey && config.emailFrom);
  const googleEnabled = Boolean(config.googleClientId && config.googleClientSecret);

  return betterAuth({
    appName: "MealBoard",
    baseURL,
    secret: config.secret,
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: emailEnabled,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendMealBoardEmail({ to: user.email, subject: "Restablecé tu contraseña de MealBoard", url, action: "Crear una contraseña nueva" });
      },
    },
    emailVerification: emailEnabled ? {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMealBoardEmail({ to: user.email, subject: "Confirmá tu cuenta de MealBoard", url, action: "Confirmar mi email" });
      },
    } : undefined,
    socialProviders: googleEnabled ? {
      google: {
        clientId: config.googleClientId!,
        clientSecret: config.googleClientSecret!,
        requireEmailVerification: true,
      },
    } : undefined,
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
  });
}

export async function getMealBoardUser(request: Request) {
  if (!authCapabilities().ready) return null;
  const session = await createAuth(request.url).api.getSession({ headers: request.headers });
  return session?.user ?? null;
}
