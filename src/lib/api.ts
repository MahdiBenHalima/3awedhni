/**
 * 3awedhni عوضني — Backend API Client
 * Connects the frontend directly to the FastAPI backend (http://localhost:8000).
 * Handles Physician endpoints, Patient authentication, LangGraph Chat, and simulated Voice Calls.
 */

import type {
  AuditLog,
  Consultation,
  FollowUpStatus,
  Instruction,
  Intent,
  InteractionEvent,
  Outcome,
  PatientLanguage,
} from "./care-types";

export const API_BASE: string =
  (import.meta.env?.["VITE_API_BASE_URL"] as string) || "http://localhost:8000";

// --- Backend Contract Types ---

export interface BackendConsultation {
  id: string;
  patient_id: string;
  physician_id: string;
  diagnosis_text: string;
  status: string;
  consulted_at: string;
  created_at: string;
  patient?: {
    id: string;
    given_name: string;
    family_name: string;
    birth_date: string;
    verified_contact_reference: string;
  };
  instructions?: BackendInstruction[];
}

export interface BackendInstruction {
  id: string;
  consultation_id: string;
  situation: string;
  permitted_action: string;
  applicability_conditions: string[];
  escalation_conditions: string[];
  version: number;
  approved_by: string | null;
  approved_at: string | null;
  active: boolean;
  created_at: string;
}

export interface BackendInteractionEvent {
  id: string;
  conversation_id: string;
  consultation_id: string;
  patient_name: string;
  timestamp: string;
  intent: string;
  safety_flag: string;
  outcome: string;
  minimal_redacted_summary: string;
  instruction_id: string | null;
}

export interface BackendDashboardResponse {
  total_consultations: number;
  total_patients: number;
  active_instructions_count: number;
  recent_interactions: BackendInteractionEvent[];
  alerts: BackendInteractionEvent[];
  consultations: Array<{
    id: string;
    patient_name: string;
    physician_id: string;
    diagnosis: string;
    status: string;
    consulted_at: string;
    instructions_count: number;
    approved_count: number;
  }>;
}

export interface BackendAuditLog {
  id: string;
  actor_id: string;
  resource_id: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface PatientChatResponse {
  conversation_id: string;
  consultation_id: string;
  response: string;
  language_detected?: "darja_arabizi" | "french";
  intent: string;
  safety_flag: "NONE" | "EMERGENCY_RED_FLAG" | "INJECTION_ATTEMPT";
  outcome: "INSTRUCTION_DELIVERED" | "ESCALATED_EMERGENCY" | "OUT_OF_SCOPE_CAUTION" | "BLOCKED";
  instruction_id: string | null;
  timestamp: string;
}

export interface PatientCallResponse {
  conversation_id: string;
  consultation_id: string;
  transcript: string;
  reply_text: string;
  language_detected: string;
  safety_flag: string;
  outcome: string;
  instruction_id: string | null;
  audio_base64: string;
  audio_mime_type: string;
  timestamp: string;
}

// --- Data Adapters ---

export function mapBackendOutcome(backendOutcome: string): Outcome {
  switch (backendOutcome) {
    case "INSTRUCTION_DELIVERED":
      return "transmise";
    case "ESCALATED_EMERGENCY":
      return "urgence";
    case "OUT_OF_SCOPE_CAUTION":
      return "non_couverte";
    case "BLOCKED":
      return "non_couverte";
    default:
      return "non_couverte";
  }
}

export function mapBackendLanguage(lang?: string): PatientLanguage {
  if (!lang) return "Français";
  if (lang.toLowerCase().includes("darja")) return "Darja";
  if (lang.toLowerCase().includes("arabizi")) return "Arabizi";
  return "Français";
}

export function adaptConsultation(c: BackendConsultation): Consultation {
  const patientCode = `PT-${(c.patient?.id || c.patient_id || "4821").slice(-4).toUpperCase()}`;
  const given = c.patient?.given_name || "";
  const family = c.patient?.family_name || "";
  const label = given || family ? `Patient ${given} ${family}`.trim() : `Patient ${patientCode}`;
  
  let age = "6 ans";
  if (c.patient?.birth_date) {
    const parts = c.patient.birth_date.split("-");
    const birthYear = parts[0] ? parseInt(parts[0], 10) : NaN;
    if (!isNaN(birthYear)) {
      const currYear = new Date().getFullYear();
      const diff = currYear - birthYear;
      age = diff > 0 ? `${diff} ans` : "18 mois";
    }
  }

  const rawPhone = c.patient?.verified_contact_reference || "+21698111222";
  const maskedPhone =
    rawPhone.length >= 8
      ? `${rawPhone.slice(0, 4)} •• ••• •${rawPhone.slice(-2)}`
      : "+216 •• ••• •82";

  return {
    id: c.id,
    patientCode,
    patientLabel: label,
    age,
    consultedAt: c.consulted_at || new Date().toISOString(),
    diagnosis: c.diagnosis_text,
    status:
      c.status === "approved" || c.status === "active"
        ? "validée"
        : c.status === "revoked"
        ? "révoquée"
        : "brouillon",
    secureCode: c.id === "CONS-001" ? "3AW-7K2-Q9" : `3AW-${c.id.slice(0, 3)}-${c.id.slice(-2)}`,
    verifiedContactMasked: maskedPhone,
  };
}

export function adaptInstruction(i: BackendInstruction): Instruction {
  const sit = i.situation.toLowerCase();
  let intent: Intent = "autre";
  if (sit.includes("fièvre") || sit.includes("fievre") || sit.includes("température") || sit.includes("skhana")) {
    intent = "fievre";
  } else if (sit.includes("gorge") || sit.includes("angine") || sit.includes("déglutition") || sit.includes("avaler") || sit.includes("7al9")) {
    intent = "gorge";
  } else if (sit.includes("aliment") || sit.includes("manger") || sit.includes("appétit") || sit.includes("makla")) {
    intent = "alimentation";
  } else if (sit.includes("oubli") || sit.includes("doubler") || sit.includes("retard")) {
    intent = "oubli";
  } else if (sit.includes("toux") || sit.includes("bronch") || sit.includes("sirop") || sit.includes("ko7a")) {
    intent = "toux";
  } else if (sit.includes("respirat") || sit.includes("souffle") || sit.includes("nefes") || sit.includes("dyspnée")) {
    intent = "respiration";
  } else if (sit.includes("antibiotique") || sit.includes("amoxicilline") || sit.includes("posologie") || sit.includes("ordonnance")) {
    intent = "antibiotique";
  } else if (sit.includes("nez") || sit.includes("rhume") || sit.includes("sérum") || sit.includes("lavage")) {
    intent = "nez";
  } else if (sit.includes("vomissement") || sit.includes("diarrhée") || sit.includes("digestif") || sit.includes("sro") || sit.includes("hydratation")) {
    intent = "digestif";
  } else if (sit.includes("oreille") || sit.includes("otite") || sit.includes("oudhen")) {
    intent = "oreille";
  } else if (sit.includes("bouton") || sit.includes("éruption") || sit.includes("rougeur") || sit.includes("allergie")) {
    intent = "eruption";
  }

  const isAlert =
    i.situation.includes("🚨") ||
    i.situation.toLowerCase().includes("alerte") ||
    i.situation.toLowerCase().includes("urgences") ||
    (i as any).category === "red_flag_alert";

  return {
    id: i.id,
    consultationId: i.consultation_id,
    intent,
    situation: i.situation,
    applicability: (i.applicability_conditions || []).join(", ") || (isAlert ? "Présence d'un signe de gravité ou détresse vitale" : "Selon diagnostic"),
    permittedAction: i.permitted_action,
    category: isAlert ? "red_flag_alert" : "home_instruction",
    reply: {
      fr: isAlert
        ? `⚠️ Alerte médicale urgente : ${i.permitted_action}`
        : `D'après les consignes de votre médecin : ${i.permitted_action}`,
      darja: isAlert
        ? `⚠️ علامة خطر : التوجه فورا إلى الاستعجالي أو الاتصال بالرقم 190.`
        : `حسب تعليمات الطبيب المباشر: ${i.permitted_action}`,
      arabizi: isAlert
        ? `⚠️ 3lamet khatar: emchi toul lel urgence wala kallem 190.`
        : `7asb ta3limet tbibek: ${i.permitted_action}`,
    },
    escalation: i.escalation_conditions || [],
    version: i.version || 1,
    approvedBy: i.approved_by || "Médecin",
    approvedAt: i.approved_at || (i.active ? new Date().toISOString() : ""),
    active: Boolean(i.active),
  };
}

export function adaptEvent(e: BackendInteractionEvent): InteractionEvent {
  const outcome = mapBackendOutcome(e.outcome);
  const followUp: FollowUpStatus = outcome === "urgence" ? "a_examiner" : "aucun";

  return {
    id: e.id,
    patientCode: e.patient_name || "PT-4821",
    consultationId: e.consultation_id,
    timestamp: e.timestamp,
    language: "Darja",
    message: e.minimal_redacted_summary,
    summary: e.minimal_redacted_summary,
    outcome,
    ...(e.instruction_id ? { instructionId: e.instruction_id } : {}),
    instructionVersion: 1,
    reply: `Réponse du serveur: ${e.minimal_redacted_summary}`,
    trace: ["Vérification déterministe de sécurité", `Alerte: ${e.safety_flag}`, `Décision: ${e.outcome}`],
    safetyRule: e.safety_flag === "EMERGENCY_RED_FLAG" ? "Règle de sécurité vitale" : "Consigne médicale validée",
    followUp,
  };
}

// --- API Methods ---

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchConsultations(): Promise<Consultation[]> {
  const res = await fetch(`${API_BASE}/physician/consultations`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch consultations: ${res.statusText}`);
  const data: BackendConsultation[] = await res.json();
  return data.map(adaptConsultation);
}

export async function fetchConsultation(id: string): Promise<{ consultation: Consultation; instructions: Instruction[] }> {
  const res = await fetch(`${API_BASE}/physician/consultations/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(`Consultation ${id} not found`);
  const data: BackendConsultation = await res.json();
  return {
    consultation: adaptConsultation(data),
    instructions: (data.instructions || []).map(adaptInstruction),
  };
}

export async function createConsultation(payload: {
  physician_id?: string;
  diagnosis_text: string;
  patient_info: {
    given_name: string;
    family_name: string;
    birth_date: string;
    verified_contact_reference: string;
  };
}): Promise<Consultation> {
  const res = await fetch(`${API_BASE}/physician/consultations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      physician_id: payload.physician_id || "DR-DEMO-001",
      diagnosis_text: payload.diagnosis_text,
      patient_info: payload.patient_info,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data: BackendConsultation = await res.json();
  return adaptConsultation(data);
}

export async function fetchDashboard(): Promise<{
  events: InteractionEvent[];
  consultations: Consultation[];
  totalConsultations: number;
  activeInstructionsCount: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/physician/dashboard`, { method: "GET" });
    if (!res.ok) return null;
    const data: BackendDashboardResponse = await res.json();

    const events: InteractionEvent[] = [
      ...data.alerts.map(adaptEvent),
      ...data.recent_interactions.map(adaptEvent),
    ];

    // Remove duplicates by id
    const uniqueEvents = Array.from(new Map(events.map((e) => [e.id, e])).values());

    return {
      events: uniqueEvents,
      consultations: (data.consultations || []).map((c) => ({
        id: c.id,
        patientCode: `PT-${c.id.slice(-4).toUpperCase()}`,
        patientLabel: c.patient_name || `Patient ${c.id}`,
        age: "6 ans",
        consultedAt: c.consulted_at || new Date().toISOString(),
        diagnosis: c.diagnosis,
        status: (c.status === "approved" || c.status === "active" ? "validée" : "brouillon") as any,
        secureCode: `3AW-${c.id.slice(0, 3)}-${c.id.slice(-2)}`,
        verifiedContactMasked: "+216 •• ••• •82",
      })),
      totalConsultations: data.total_consultations,
      activeInstructionsCount: data.active_instructions_count,
    };
  } catch {
    return null;
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await fetch(`${API_BASE}/physician/audit-logs`, { method: "GET" });
    if (!res.ok) return [];
    const data: BackendAuditLog[] = await res.json();
    return data.map((l) => ({
      id: l.id,
      actor: l.actor_id === "DR-DEMO-001" ? "Médecin" : l.actor_id,
      resource: l.resource_id,
      action: l.action,
      timestamp: l.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function approveInstruction(instructionId: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/physician/instructions/${instructionId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function revokeInstruction(instructionId: string, physicianId = "DR-DEMO-001"): Promise<any> {
  const form = new URLSearchParams();
  form.append("physician_id", physicianId);
  const res = await fetch(`${API_BASE}/physician/instructions/${instructionId}/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadConsultationAudio(consultationId: string, audio: Blob | File): Promise<any> {
  const formData = new FormData();
  let filename = "dictation.wav";
  if (audio instanceof File && audio.name) {
    filename = audio.name;
  } else if (audio.type) {
    if (audio.type.includes("webm")) filename = "dictation.webm";
    else if (audio.type.includes("mp4") || audio.type.includes("m4a")) filename = "dictation.m4a";
    else if (audio.type.includes("ogg")) filename = "dictation.ogg";
  }
  const file = audio instanceof File ? audio : new File([audio], filename, { type: audio.type || "audio/wav" });
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/physician/consultations/${consultationId}/audio`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function transcribeAudio(consultationId: string, textOverride?: string): Promise<any> {
  const payload = textOverride ? { transcript_override: textOverride } : {};
  const res = await fetch(`${API_BASE}/physician/consultations/${consultationId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitPrewrittenInstructions(
  consultationId: string,
  instructions: any[],
  physicianId = "DR-DEMO-001",
): Promise<any> {
  const res = await fetch(`${API_BASE}/physician/consultations/${consultationId}/instructions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions, physician_id: physicianId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Patient Authentication & Communication ---

export async function patientAuthStart(
  givenName: string,
  familyName: string,
  birthDate: string,
  consultationId?: string,
): Promise<{ status: string; consultation_id: string; mock_otp_for_testing: string }> {
  const res = await fetch(`${API_BASE}/auth/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      given_name: givenName,
      family_name: familyName,
      birth_date: birthDate,
      consultation_id: consultationId,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patientAuthByCode(
  consultationCode: string,
): Promise<{ access_token: string; patient_id: string; consultation_id: string }> {
  const res = await fetch(`${API_BASE}/auth/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consultation_code: consultationCode }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patientAuthVerify(
  consultationId: string,
  otpCode: string,
): Promise<{ access_token: string; patient_id: string }> {
  let res = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consultation_id: consultationId, otp_code: otpCode }),
  });
  if (!res.ok) {
    // If not verified yet, trigger /auth/start to generate mock OTP for this consultation
    try {
      const cRes = await fetch(`${API_BASE}/physician/consultations/${consultationId}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        const pName = (cData.patient_name || "Patient Demo").split(" ");
        await fetch(`${API_BASE}/auth/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            given_name: pName[0] || "Patient",
            family_name: pName.slice(1).join(" ") || "Demo",
            birth_date: "2019-01-01",
            consultation_id: consultationId,
          }),
        });
        // Retry verify with OTP
        res = await fetch(`${API_BASE}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultation_id: consultationId, otp_code: otpCode }),
        });
      }
    } catch {}
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patientChat(
  token: string,
  message: string,
  conversationId?: string,
): Promise<PatientChatResponse> {
  const res = await fetch(`${API_BASE}/patient/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patientCall(
  token: string,
  audioFile: Blob | File,
  conversationId?: string,
): Promise<PatientCallResponse> {
  const formData = new FormData();
  formData.append("file", audioFile, "patient_call.wav");
  if (conversationId) {
    formData.append("conversation_id", conversationId);
  }
  const res = await fetch(`${API_BASE}/patient/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
