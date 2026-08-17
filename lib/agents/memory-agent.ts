import { addRun, normalize, type WorkingState } from "./types";

export function runMemoryAgent(state: WorkingState): WorkingState {
  const feedback = (state.input.priorFeedback ?? []).map(normalize);
  const signals: string[] = [];
  const tags: string[] = [];

  if (feedback.some((item) => item.includes("falto tiempo"))) {
    signals.push("priorizar recetas cortas");
    tags.push("rapido");
  }
  if (feedback.some((item) => item.includes("gaste menos"))) {
    signals.push("mantener foco en ahorro");
    tags.push("economico");
  }
  if (feedback.some((item) => item.includes("cumpli"))) {
    signals.push("mantener dificultad actual");
  }
  if (feedback.some((item) => item.includes("no me gusto"))) {
    signals.push("aumentar variedad");
  }
  if (signals.length === 0) signals.push("sin ajustes históricos todavía");

  return addRun({ ...state, memorySignals: signals, preferredTags: tags }, {
    id: "memory",
    name: "Agente de memoria",
    role: "Recupera aprendizaje persistente de semanas anteriores.",
    observation: `${feedback.length} evaluaciones previas disponibles.`,
    decision: signals.join("; "),
    output: tags.length ? `Etiquetas preferidas: ${tags.join(", ")}.` : "Se mantiene el perfil inicial.",
  });
}
