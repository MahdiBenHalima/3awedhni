import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AuditLog,
  Consultation,
  FollowUpStatus,
  InteractionEvent,
  Instruction,
  Outcome,
} from "./care-types";
import type { Analysis } from "./safety-engine";
import {
  consultations as seedConsultations,
  initialAudit,
  initialEvents,
  instructions as seedInstructions,
  DOCTOR,
  PRIMARY_CONSULTATION_ID,
  seedTranscript,
} from "./seed-data";
import { FOLLOW_UP_LABELS } from "./events";
import {
  checkBackendHealth,
  fetchConsultations,
  fetchConsultation,
  fetchDashboard,
  fetchAuditLogs,
  approveInstruction as apiApproveInstruction,
  revokeInstruction as apiRevokeInstruction,
} from "./api";

export type ConsultationStage = "audio" | "transcribing" | "review" | "validated";

export interface PatientChatMessage {
  id: number;
  from: "patient" | "bot";
  text: string;
  time: string;
  outcome?: Outcome;
  source?: string;
  isVoice?: boolean;
}

export interface CareStore {
  // Core data
  consultations: Consultation[];
  instructions: Instruction[];
  events: InteractionEvent[];
  audit: AuditLog[];
  isConnectedToBackend: boolean;

  // Actions
  addConsultation: (consultation: Consultation) => void;
  activeConsultationId: string;
  setActiveConsultationId: (id: string) => void;
  setInstructionActive: (id: string, active: boolean) => void;
  proposeEdit: (id: string, text: string) => void;
  approveConsultation: (id: string) => string;
  addEvent: (event: InteractionEvent) => void;
  addAudit: (actor: string, resource: string, action: string) => void;
  setFollowUp: (id: string, status: FollowUpStatus) => void;
  refreshFromBackend: () => Promise<void>;

  // Conserved Patient Assistant state across page navigation
  patientAuthed: boolean;
  patientCode: string;
  patientToken: string | null;
  patientMessages: PatientChatMessage[];
  patientLastAnalysis: Analysis | null;
  setPatientAuthed: (authed: boolean) => void;
  setPatientCode: (code: string) => void;
  setPatientToken: (token: string | null) => void;
  setPatientMessages: (
    updater: PatientChatMessage[] | ((prev: PatientChatMessage[]) => PatientChatMessage[]),
  ) => void;
  setPatientLastAnalysis: (analysis: Analysis | null) => void;
  resetPatientSession: () => void;

  // Conserved Consultation Workflow state across page navigation
  consultationStage: ConsultationStage;
  consultationCode: string | null;
  consultationAudioBlob: Blob | null;
  consultationAudioUrl: string | null;
  consultationTranscript: string;
  setConsultationInstructions: (consultationId: string, instructions: Instruction[]) => void;
  setConsultationStage: (stage: ConsultationStage) => void;
  setConsultationCode: (code: string | null) => void;
  setConsultationAudio: (blob: Blob | null, url: string | null) => void;
  setConsultationTranscript: (transcript: string) => void;
  resetConsultation: () => void;
}

const CareStoreContext = createContext<CareStore | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `3AW-${part(3)}-${part(2)}`;
}

// Helpers for safe sessionStorage persistence
function loadSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export function CareStoreProvider({ children }: { children: ReactNode }) {
  const [consultations, setConsultations] = useState<Consultation[]>(seedConsultations);
  const [instructions, setInstructions] = useState<Instruction[]>(seedInstructions);
  const [events, setEvents] = useState<InteractionEvent[]>(initialEvents);
  const [audit, setAudit] = useState<AuditLog[]>(initialAudit);
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [activeConsultationId, setActiveConsultationIdState] = useState<string>(() =>
    loadSession("3aw_activeConsultationId", PRIMARY_CONSULTATION_ID),
  );

  const setActiveConsultationId = useCallback((id: string) => {
    setActiveConsultationIdState(id);
    saveSession("3aw_activeConsultationId", id);
  }, []);

  // Conserved Patient state
  const [patientAuthed, setPatientAuthedState] = useState<boolean>(() =>
    loadSession("3aw_patientAuthed", false),
  );
  const [patientCode, setPatientCodeState] = useState<string>(() =>
    loadSession("3aw_patientCode", ""),
  );
  const [patientToken, setPatientTokenState] = useState<string | null>(() =>
    loadSession("3aw_patientToken", null),
  );
  const [patientMessages, setPatientMessagesState] = useState<PatientChatMessage[]>(() =>
    loadSession("3aw_patientMessages", []),
  );
  const [patientLastAnalysis, setPatientLastAnalysis] = useState<Analysis | null>(null);

  const resetPatientSession = useCallback(() => {
    setPatientAuthedState(false);
    setPatientCodeState("");
    setPatientTokenState(null);
    setPatientMessagesState([]);
    setPatientLastAnalysis(null);
    saveSession("3aw_patientAuthed", false);
    saveSession("3aw_patientCode", "");
    saveSession("3aw_patientToken", null);
    saveSession("3aw_patientMessages", []);
  }, []);

  // Conserved Consultation state
  const [consultationStage, setConsultationStageState] = useState<ConsultationStage>(() =>
    loadSession("3aw_consultationStage", "audio"),
  );
  const [consultationCode, setConsultationCodeState] = useState<string | null>(() =>
    loadSession("3aw_consultationCode", null),
  );
  const [consultationAudioBlob, setConsultationAudioBlob] = useState<Blob | null>(null);
  const [consultationAudioUrl, setConsultationAudioUrl] = useState<string | null>(null);
  const [consultationTranscript, setConsultationTranscriptState] = useState<string>(() =>
    loadSession("3aw_consultationTranscript", seedTranscript),
  );

  const setPatientAuthed = useCallback((authed: boolean) => {
    setPatientAuthedState(authed);
    saveSession("3aw_patientAuthed", authed);
  }, []);

  const setPatientCode = useCallback((code: string) => {
    setPatientCodeState(code);
    saveSession("3aw_patientCode", code);
  }, []);

  const setPatientToken = useCallback((token: string | null) => {
    setPatientTokenState(token);
    saveSession("3aw_patientToken", token);
  }, []);

  const setPatientMessages = useCallback(
    (updater: PatientChatMessage[] | ((prev: PatientChatMessage[]) => PatientChatMessage[])) => {
      setPatientMessagesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveSession("3aw_patientMessages", next);
        return next;
      });
    },
    [],
  );

  const setConsultationStage = useCallback((stage: ConsultationStage) => {
    setConsultationStageState(stage);
    saveSession("3aw_consultationStage", stage);
  }, []);

  const setConsultationCode = useCallback((code: string | null) => {
    setConsultationCodeState(code);
    saveSession("3aw_consultationCode", code);
  }, []);

  const setConsultationAudio = useCallback((blob: Blob | null, url: string | null) => {
    setConsultationAudioBlob(blob);
    setConsultationAudioUrl(url);
  }, []);

  const setConsultationTranscript = useCallback((text: string) => {
    setConsultationTranscriptState(text);
    saveSession("3aw_consultationTranscript", text);
  }, []);

  const resetConsultation = useCallback(() => {
    setConsultationStageState("audio");
    setConsultationCodeState(null);
    setConsultationAudioBlob(null);
    setConsultationAudioUrl(null);
    setConsultationTranscriptState(seedTranscript);
    saveSession("3aw_consultationStage", "audio");
    saveSession("3aw_consultationCode", null);
    saveSession("3aw_consultationTranscript", seedTranscript);
  }, []);

  const setConsultationInstructions = useCallback(
    (consultationId: string, newInstructions: Instruction[]) => {
      setInstructions((prev) => [
        ...prev.filter((i) => i.consultationId !== consultationId),
        ...newInstructions,
      ]);
    },
    [],
  );

  const addAudit = useCallback((actor: string, resource: string, action: string) => {
    setAudit((prev) => [
      {
        id: `AUD-${Math.floor(Math.random() * 9000 + 1000)}`,
        actor,
        resource,
        action,
        timestamp: nowIso(),
      },
      ...prev,
    ]);
  }, []);

  const addConsultation = useCallback(
    (newConsultation: Consultation) => {
      setConsultations((prev) => [newConsultation, ...prev.filter((c) => c.id !== newConsultation.id)]);
      setActiveConsultationIdState(newConsultation.id);
      saveSession("3aw_activeConsultationId", newConsultation.id);
      addAudit(DOCTOR.name, newConsultation.id, `Created new consultation for ${newConsultation.patientLabel}`);
    },
    [addAudit],
  );

  const refreshFromBackend = useCallback(async () => {
    try {
      const isAlive = await checkBackendHealth();
      if (!isAlive) {
        setIsConnectedToBackend(false);
        return;
      }
      setIsConnectedToBackend(true);

      const [backendConsultations, dashboardData, auditLogs] = await Promise.all([
        fetchConsultations().catch(() => null),
        fetchDashboard().catch(() => null),
        fetchAuditLogs().catch(() => null),
      ]);

      if (backendConsultations && backendConsultations.length > 0) {
        setConsultations(backendConsultations);
        const primary =
          backendConsultations.find((c) => c.id === PRIMARY_CONSULTATION_ID) ||
          backendConsultations[0];
        if (primary) {
          const full = await fetchConsultation(primary.id).catch(() => null);
          if (full?.instructions && full.instructions.length > 0) {
            setInstructions(full.instructions);
          }
        }
      }
      if (dashboardData?.events && dashboardData.events.length > 0) {
        setEvents(dashboardData.events);
      }
      if (auditLogs && auditLogs.length > 0) {
        setAudit(auditLogs);
      }
    } catch (err) {
      console.warn("Backend sync failed, using current store state:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((isAlive) => {
      if (mounted && isAlive) {
        setIsConnectedToBackend(true);
        refreshFromBackend();
      }
    });
    return () => {
      mounted = false;
    };
  }, [refreshFromBackend]);

  const setInstructionActive = useCallback(
    (id: string, active: boolean) => {
      setInstructions((prev) =>
        prev.map((i) => (i.id === id && (!active || i.approvedAt) ? { ...i, active } : i)),
      );
      addAudit(DOCTOR.name, id, active ? "Instruction reactivated" : "Instruction deactivated");

      if (active) {
        const target = instructions.find((i) => i.id === id);
        if (target) {
          apiApproveInstruction(id, {
            physician_id: DOCTOR.id,
            situation: target.situation,
            permitted_action: target.permittedAction,
            applicability_conditions: [target.applicability],
            escalation_conditions: target.escalation,
          }).catch(() => {});
        }
      } else {
        apiRevokeInstruction(id, DOCTOR.id).catch(() => {});
      }
    },
    [addAudit, instructions],
  );

  const proposeEdit = useCallback((id: string, text: string) => {
    setInstructions((prev) =>
      prev.map((i) =>
        i.id === id
          ? text === i.permittedAction
            ? (({ pendingAction: _p, ...rest }) => rest)(i)
            : { ...i, pendingAction: text }
          : i,
      ),
    );
  }, []);

  const approveConsultation = useCallback(
    (id: string) => {
      const code = randomCode();
      const approvedAt = nowIso();
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "validée", secureCode: code } : c)),
      );
      setInstructions((prev) =>
        prev.map((i) => {
          if (i.consultationId !== id) return i;
          if (i.pendingAction === undefined) return { ...i, approvedAt, approvedBy: DOCTOR.name };
          const { pendingAction, ...rest } = i;
          return {
            ...rest,
            permittedAction: pendingAction,
            reply: {
              fr: `Consigne validée par votre médecin : ${pendingAction}`,
              darja: `تعليمات الطبيب (بالفرنسية) : ${pendingAction}`,
              arabizi: `Ta3limet tbib (bel francais) : ${pendingAction}`,
            },
            version: i.version + 1,
            approvedAt,
            approvedBy: DOCTOR.name,
          };
        }),
      );
      addAudit(DOCTOR.name, id, "Consultation record approved — instructions activated");
      return code;
    },
    [addAudit],
  );

  const addEvent = useCallback((event: InteractionEvent) => {
    setEvents((prev) => [event, ...prev]);
  }, []);

  const setFollowUp = useCallback(
    (id: string, status: FollowUpStatus) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, followUp: status } : e)));
      addAudit(DOCTOR.name, id, `Follow-up: ${FOLLOW_UP_LABELS[status]}`);
    },
    [addAudit],
  );

  const value = useMemo(
    () => ({
      consultations,
      instructions,
      events,
      audit,
      isConnectedToBackend,
      addConsultation,
      activeConsultationId,
      setActiveConsultationId,
      setInstructionActive,
      proposeEdit,
      approveConsultation,
      addEvent,
      addAudit,
      setFollowUp,
      refreshFromBackend,
      // Conserved states
      patientAuthed,
      patientCode,
      patientToken,
      patientMessages,
      patientLastAnalysis,
      setPatientAuthed,
      setPatientCode,
      setPatientToken,
      setPatientMessages,
      setPatientLastAnalysis,
      resetPatientSession,
      consultationStage,
      consultationCode,
      consultationAudioBlob,
      consultationAudioUrl,
      consultationTranscript,
      setConsultationInstructions,
      setConsultationStage,
      setConsultationCode,
      setConsultationAudio,
      setConsultationTranscript,
      resetConsultation,
    }),
    [
      consultations,
      instructions,
      events,
      audit,
      isConnectedToBackend,
      addConsultation,
      activeConsultationId,
      setActiveConsultationId,
      setInstructionActive,
      proposeEdit,
      approveConsultation,
      addEvent,
      addAudit,
      setFollowUp,
      refreshFromBackend,
      patientAuthed,
      patientCode,
      patientToken,
      patientMessages,
      patientLastAnalysis,
      setPatientAuthed,
      setPatientCode,
      setPatientToken,
      setPatientMessages,
      resetPatientSession,
      consultationStage,
      consultationCode,
      consultationAudioBlob,
      consultationAudioUrl,
      consultationTranscript,
      setConsultationInstructions,
      setConsultationStage,
      setConsultationCode,
      setConsultationAudio,
      setConsultationTranscript,
      resetConsultation,
    ],
  );

  return <CareStoreContext.Provider value={value}>{children}</CareStoreContext.Provider>;
}

export function useCareStore() {
  const ctx = useContext(CareStoreContext);
  if (!ctx) throw new Error("useCareStore must be used inside CareStoreProvider");
  return ctx;
}
