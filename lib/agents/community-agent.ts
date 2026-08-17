import { addRun, normalize, type WorkingState } from "./types";

const communityCalendars = [
  { title: "Semana rica por menos", tags: ["economico"], score: 4.9 },
  { title: "Todo listo en 20 minutos", tags: ["rapido"], score: 4.8 },
  { title: "Una sola olla, cero estrés", tags: ["una-olla", "principiante"], score: 4.7 },
];

export function runCommunityAgent(state: WorkingState): WorkingState {
  const level = normalize(state.input.profile.level);
  const desired = [...state.preferredTags];
  if (level.includes("princip")) desired.push("principiante");

  const ranked = communityCalendars
    .map((calendar) => ({
      ...calendar,
      match: calendar.score + calendar.tags.filter((tag) => desired.includes(tag)).length * 2,
    }))
    .sort((a, b) => b.match - a.match);
  const selected = communityCalendars.find((calendar) =>
    normalize(calendar.title) === normalize(state.input.preferredCommunityCalendar ?? ""),
  ) ?? ranked[0];
  const preferredTags = [...new Set([...state.preferredTags, ...selected.tags])];

  return addRun({
    ...state,
    preferredTags,
    communitySource: selected.title,
  }, {
    id: "community",
    name: "Agente de comunidad",
    role: "Prioriza calendarios sociales y señales de popularidad.",
    observation: `${communityCalendars.length} calendarios precargados y ${desired.length} preferencias activas.`,
    decision: `Tomar “${selected.title}” como inspiración por afinidad y puntuación.`,
    output: `Etiquetas transferidas al plan: ${selected.tags.join(", ")}.`,
  });
}
