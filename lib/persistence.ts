export const MEALBOARD_STORAGE_KEY = "mealboard-state";

export function serializeStoredState(state: unknown) {
  return JSON.stringify(state);
}

export function parseStoredState(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}
