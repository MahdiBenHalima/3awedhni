import type { FollowUpStatus, InteractionEvent, Outcome } from "./care-types";
import type { Analysis } from "./safety-engine";

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  aucun: "Aucun suivi requis",
  a_examiner: "À examiner",
  contact_tente: "Contact tenté",
  recontacte: "Patient recontacté",
  termine: "Suivi terminé",
};

/** Deferred follow-up: plain transmitted instructions never create a mandatory callback. */
export function initialFollowUp(outcome: Outcome): FollowUpStatus {
  return outcome === "transmise" ? "aucun" : "a_examiner";
}

const PRIORITY: Record<Outcome, number> = {
  urgence: 0,
  escalade: 1,
  non_couverte: 2,
  transmise: 3,
};

/** Open follow-ups: urgent (already oriented) first, then escalations, then uncovered requests. */
export function followUpQueue(events: InteractionEvent[]): InteractionEvent[] {
  return events
    .filter((e) => e.followUp !== "aucun" && e.followUp !== "termine")
    .sort(
      (a, b) =>
        PRIORITY[a.outcome] - PRIORITY[b.outcome] ||
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export function safetyRuleFor(analysis: Analysis): string {
  if (analysis.outcome === "urgence")
    return "Signe d'alerte détecté avant toute recherche de consigne → orientation urgente immédiate";
  if (analysis.injection) return "Tentative de contournement → refus, aucune donnée exposée";
  if (analysis.outcome === "escalade")
    return "Situation hors consigne validée → avis médical recommandé";
  if (analysis.outcome === "non_couverte")
    return "Aucune consigne validée et active applicable → pas d'improvisation, orientation humaine";
  return "Aucun signe d'alerte · consigne validée et active de la consultation autorisée";
}

export function buildEvent(
  analysis: Analysis,
  meta: {
    id: string;
    patientCode: string;
    consultationId: string;
    timestamp: string;
    message: string;
    followUp?: FollowUpStatus;
  },
): InteractionEvent {
  return {
    id: meta.id,
    patientCode: meta.patientCode,
    consultationId: meta.consultationId,
    timestamp: meta.timestamp,
    language: analysis.language,
    message: meta.message,
    summary: analysis.summary,
    outcome: analysis.outcome,
    ...(analysis.instruction
      ? { instructionId: analysis.instruction.id, instructionVersion: analysis.instruction.version }
      : {}),
    reply: analysis.reply,
    trace: analysis.trace,
    safetyRule: safetyRuleFor(analysis),
    followUp: meta.followUp ?? initialFollowUp(analysis.outcome),
  };
}
