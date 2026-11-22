import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type {
  AuditLog,
  Consultation,
  FollowUpStatus,
  InteractionEvent,
  Instruction,
} from "./care-types";
import {
  consultations as seedConsultations,
  initialAudit,
  initialEvents,
  instructions as seedInstructions,
  DOCTOR,
} from "./seed-data";
import { FOLLOW_UP_LABELS } from "./events";

interface CareStore {
  consultations: Consultation[];
  instructions: Instruction[];
  events: InteractionEvent[];
  audit: AuditLog[];
  setInstructionActive: (id: string, active: boolean) => void;
  proposeEdit: (id: string, text: string) => void;
  approveConsultation: (id: string) => string;
  addEvent: (event: InteractionEvent) => void;
  addAudit: (actor: string, resource: string, action: string) => void;
  setFollowUp: (id: string, status: FollowUpStatus) => void;
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

export function CareStoreProvider({ children }: { children: ReactNode }) {
  const [consultations, setConsultations] = useState(seedConsultations);
  const [instructions, setInstructions] = useState(seedInstructions);
  const [events, setEvents] = useState(initialEvents);
  const [audit, setAudit] = useState(initialAudit);

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

  // Only an approved instruction can be switched back on; OFF blocks any future reuse.
  const setInstructionActive = useCallback(
    (id: string, active: boolean) => {
      setInstructions((prev) =>
        prev.map((i) => (i.id === id && (!active || i.approvedAt) ? { ...i, active } : i)),
      );
      addAudit(DOCTOR.name, id, active ? "Consigne réactivée" : "Consigne désactivée");
    },
    [addAudit],
  );

  // Edits create a draft; the assistant keeps using the last approved text until validation.
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
      addAudit(DOCTOR.name, id, "Fiche relue et validée — consignes activées");
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
      addAudit(DOCTOR.name, id, `Suivi : ${FOLLOW_UP_LABELS[status]}`);
    },
    [addAudit],
  );

  const value = useMemo(
    () => ({
      consultations,
      instructions,
      events,
      audit,
      setInstructionActive,
      proposeEdit,
      approveConsultation,
      addEvent,
      addAudit,
      setFollowUp,
    }),
    [
      consultations,
      instructions,
      events,
      audit,
      setInstructionActive,
      proposeEdit,
      approveConsultation,
      addEvent,
      addAudit,
      setFollowUp,
    ],
  );

  return <CareStoreContext.Provider value={value}>{children}</CareStoreContext.Provider>;
}

export function useCareStore() {
  const ctx = useContext(CareStoreContext);
  if (!ctx) throw new Error("useCareStore must be used inside CareStoreProvider");
  return ctx;
}
