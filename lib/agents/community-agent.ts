import { addRun, normalize, type WorkingState } from "./types";

export function runCommunityAgent(state: WorkingState): WorkingState {
  const level = normalize(state.input.profile.level);
  const desired = [...state.preferredTags];
  if (level.includes("princip")) desired.push("principiante");

  const source = state.input.preferredCommunityCalendar?.trim() || `Categoría ${state.input.planCategory ?? "Equilibrado"}`;
  const preferredTags = [...new Set([...state.preferredTags, ...desired])];

  return addRun({
    ...state,
    preferredTags,
    communitySource: source,
  }, {
    id: "community",
    name: "Agente de comunidad",
    role: "Prioriza calendarios sociales y señales de popularidad.",
    observation: `${desired.length} preferencias activas y una fuente comunitaria opcional.`,
    decision: `Usar “${source}” como orientación sin reemplazar las restricciones de seguridad.`,
    output: preferredTags.length ? `Etiquetas transferidas al plan: ${preferredTags.join(", ")}.` : "Sin sesgos comunitarios ficticios.",
  });
}
