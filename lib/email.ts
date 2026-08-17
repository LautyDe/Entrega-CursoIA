function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export async function sendMealBoardEmail({ to, subject, url, action }: { to: string; subject: string; url: string; action: string }) {
  const config = globalThis.__MEALBOARD_AUTH_CONFIG__;
  if (!config?.resendApiKey || !config.emailFrom) throw new Error("Resend is not configured");
  const safeUrl = escapeHtml(url);
  const promise = fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "MealBoard/1.0",
    },
    body: JSON.stringify({
      from: config.emailFrom, to: [to], subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#282524"><h1 style="color:#7e1f36">MealBoard</h1><p>${escapeHtml(subject)}</p><p><a href="${safeUrl}" style="background:#7e1f36;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">${escapeHtml(action)}</a></p><p style="color:#766e68;font-size:13px">Si no solicitaste esta acción, ignorá este correo.</p></div>`,
    }),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
  });
  const waitUntil = globalThis.__MEALBOARD_WAIT_UNTIL__;
  if (waitUntil) waitUntil(promise);
  else await promise;
}

declare global {
  var __MEALBOARD_WAIT_UNTIL__: ((promise: Promise<unknown>) => void) | undefined;
}
