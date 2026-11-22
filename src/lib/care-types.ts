export type Intent =
  | "gorge"
  | "fievre"
  | "alimentation"
  | "oubli"
  | "toux"
  | "respiration"
  | "antibiotique"
  | "nez"
  | "digestif"
  | "oreille"
  | "eruption"
  | "autre";
export type Outcome = "transmise" | "non_couverte" | "escalade" | "urgence";
export type PatientLanguage = "Darja" | "Arabizi" | "Français" | "Mixte";

export interface LocalizedText {
  fr: string;
  darja: string;
  arabizi: string;
}

export interface Instruction {
  id: string;
  consultationId: string;
  intent: Intent;
  situation: string;
  applicability: string;
  permittedAction: string;
  reply: LocalizedText;
  escalation: string[];
  version: number;
  approvedBy: string;
  approvedAt: string;
  active: boolean;
  category?: "home_instruction" | "red_flag_alert";
  /** Edited text awaiting physician validation; never used by the assistant until approved. */
  pendingAction?: string;
}

export type ConsultationStatus = "brouillon" | "validée" | "révoquée";

export interface Consultation {
  id: string;
  patientCode: string;
  patientLabel: string;
  age: string;
  consultedAt: string;
  diagnosis: string;
  status: ConsultationStatus;
  secureCode?: string;
  /** Verified contact channel, masked for display. */
  verifiedContactMasked: string;
}

export type FollowUpStatus = "aucun" | "a_examiner" | "contact_tente" | "recontacte" | "termine";

export interface InteractionEvent {
  id: string;
  patientCode: string;
  consultationId: string;
  timestamp: string;
  language: PatientLanguage;
  message: string;
  summary: string;
  outcome: Outcome;
  instructionId?: string;
  instructionVersion?: number;
  /** Exact reply sent to the patient. */
  reply: string;
  /** Interpretation steps of the safety engine. */
  trace: string[];
  safetyRule: string;
  followUp: FollowUpStatus;
}

export interface AuditLog {
  id: string;
  actor: string;
  resource: string;
  action: string;
  timestamp: string;
}
