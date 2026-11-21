import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AuditLog, Consultation, InteractionEvent, Instruction } from "./care-types";
import {
  consultations as seedConsultations,
  initialAudit,
  initialEvents,
  instructions as seedInstructions,
  DOCTOR,
} from "./demo-data";

interface CareStore {
  consultations: Consultation[];
  instructions: Instruction[];
  events: InteractionEvent[];
  audit: AuditLog[];
  setInstructionActive: (id: string, active: boolean) => void;
  updateInstruction: (id: string, patch: Partial<Instruction>) => void;
  approveConsultation: (id: string) => string;
  addEvent: (event: InteractionEvent) => void;
  addAudit: (actor: string, resource: string, action: string) => void;
  markCalledBack: (id: string) => void;
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

  const setInstructionActive = useCallback(
    (id: string, active: boolean) => {
      setInstructions((prev) => prev.map((i) => (i.id === id ? { ...i, active } : i)));
      addAudit(DOCTOR.name, id, active ? "Consigne réactivée" : "Consigne désactivée");
    },
    [addAudit],
  );

  const updateInstruction = useCallback((id: string, patch: Partial<Instruction>) => {
    setInstructions((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const approveConsultation = useCallback(
    (id: string) => {
      const code = randomCode();
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "validée", secureCode: code } : c)),
      );
      setInstructions((prev) =>
        prev.map((i) =>
          i.consultationId === id ? { ...i, approvedAt: nowIso(), approvedBy: DOCTOR.name } : i,
        ),
      );
      addAudit(DOCTOR.name, id, "Fiche relue et validée — consignes activées");
      return code;
    },
    [addAudit],
  );

  const addEvent = useCallback((event: InteractionEvent) => {
    setEvents((prev) => [event, ...prev]);
  }, []);

  const markCalledBack = useCallback(
    (id: string) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, needsCallback: false } : e)));
      addAudit(DOCTOR.name, id, "Rappel du patient effectué");
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
      updateInstruction,
      approveConsultation,
      addEvent,
      addAudit,
      markCalledBack,
    }),
    [
      consultations,
      instructions,
      events,
      audit,
      setInstructionActive,
      updateInstruction,
      approveConsultation,
      addEvent,
      addAudit,
      markCalledBack,
    ],
  );

  return <CareStoreContext.Provider value={value}>{children}</CareStoreContext.Provider>;
}

export function useCareStore() {
  const ctx = useContext(CareStoreContext);
  if (!ctx) throw new Error("useCareStore must be used inside CareStoreProvider");
  return ctx;
}
