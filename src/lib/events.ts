import type { FollowUpStatus, InteractionEvent, Outcome } from "./care-types";
import type { Analysis } from "./safety-engine";

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  aucun: "No follow-up needed",
  a_examiner: "To review",
  contact_tente: "Contact attempted",
  recontacte: "Patient reached",
  termine: "Follow-up completed",
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
    return "Emergency red flag detected prior to instruction lookup → immediate emergency orientation";
  if (analysis.injection) return "Prompt injection or bypass attempt → refused, zero data exposed";
  if (analysis.outcome === "escalade")
    return "Situation outside validated instructions → clinical review recommended";
  if (analysis.outcome === "non_couverte")
    return "No active validated instruction applicable → strictly no improvisation, human referral";
  return "No red flags · validated and active consultation instruction authorized";
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
