export type Intent = "gorge" | "fievre" | "alimentation" | "oubli";
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
}

export interface InteractionEvent {
  id: string;
  patientCode: string;
  timestamp: string;
  language: PatientLanguage;
  message: string;
  summary: string;
  outcome: Outcome;
  instructionId?: string;
  instructionVersion?: number;
  needsCallback: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  resource: string;
  action: string;
  timestamp: string;
}
