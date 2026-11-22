import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCheck,
  Cpu,
  Lock,
  Mic,
  PhoneCall,
  Send,
  ShieldCheck,
  Stethoscope,
  Volume2,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCareStore } from "@/lib/care-store";
import type { Outcome } from "@/lib/care-types";
import { PRIMARY_CONSULTATION_ID } from "@/lib/seed-data";
import { buildEvent } from "@/lib/events";
import { analyzeMessage, type Analysis } from "@/lib/safety-engine";
import {
  checkBackendHealth,
  patientAuthByCode,
  patientAuthVerify,
  patientChat,
  patientCall,
  mapBackendOutcome,
  mapBackendLanguage,
} from "@/lib/api";

export const Route = createFileRoute("/_dashboard/assistant-patient")({
  head: () => ({
    meta: [
      { title: "Patient Assistant — 3awedhni عوضني" },
      {
        name: "description",
        content:
          "Secure patient messaging in Darja, Arabizi, or French, backed by validated doctor instructions.",
      },
      { property: "og:title", content: "Patient Assistant — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Questions in Darja or Arabizi: faithful instructions or urgent referral.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPatientPage,
});

const DEFAULT_PATIENT_CODE = "3AW-7K2-Q9";

const INITIAL_BILINGUAL_GREETING =
  "Hello! I am your 3awedhni Care Assistant. I am here to help you follow the instructions approved by your doctor. How can I help you today?\n\n──────────────\nAhla! Ena l'assistant 3awedhni. Nnajjem n3awnek bel consignes elli 7adherhom tbibek. Chnowa t7eb tes'el?";

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getEnglishResponseForChat(
  outcome: string,
  matchingInst?: { situation: string; permittedAction: string; escalation: string[] } | null,
  instructionId?: string | null,
): string {
  if (outcome === "ESCALATED_EMERGENCY" || outcome === "urgence") {
    return "🚨 Immediate Medical Emergency: Red flag detected. Please seek emergency medical care immediately without delay. Go to the nearest pediatric emergency department or call emergency services (SAMU 190).";
  }
  if (outcome === "BLOCKED") {
    return "Request not permitted under clinical safety rules. The assistant cannot override medical guidelines.";
  }
  if (outcome === "INSTRUCTION_DELIVERED" || outcome === "transmise") {
    if (matchingInst) {
      const escNotice =
        matchingInst.escalation.length > 0
          ? `\n\n⚠️ Note: Seek emergency care immediately if alert signs appear: ${matchingInst.escalation.join(", ")}.`
          : "";
      return `According to your doctor's instructions for (${matchingInst.situation}):\n📌 ${matchingInst.permittedAction}${escNotice}`;
    }
    return `According to your doctor's validated instructions.${instructionId ? ` [${instructionId}]` : ""}`;
  }
  if (outcome === "escalade") {
    return "⚠️ This situation requires clinical evaluation by a physician. Please contact your doctor or consult a healthcare professional.";
  }
  return "⚠️ This question is not covered by the specific instructions recorded by your doctor for this consultation.\n📌 For your safety, the assistant cannot provide unverified medical advice. Please contact your doctor's office or consult a healthcare professional.";
}

function formatBilingualAgentMessage(english: string, translation: string): string {
  const cleanEng = english.trim();
  const cleanTrans = translation.trim();
  if (!cleanTrans || cleanTrans === cleanEng) return cleanEng;
  return `${cleanEng}\n\n──────────────\n${cleanTrans}`;
}

function AssistantPatientPage() {
  const {
    consultations,
    instructions,
    addEvent,
    addAudit,
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
  } = useCareStore();

  const [backendOnline, setBackendOnline] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find currently connected consultation based on patientCode or active consultation
  const currentConsultation =
    consultations.find(
      (c) =>
        (patientCode && c.secureCode?.toUpperCase() === patientCode.trim().toUpperCase()) ||
        (patientCode && c.id.toUpperCase() === patientCode.trim().toUpperCase()) ||
        (patientCode === "3AW-7K2-Q9" && c.id === PRIMARY_CONSULTATION_ID)
    ) ||
    consultations.find((c) => c.id === PRIMARY_CONSULTATION_ID) ||
    consultations[0];

  useEffect(() => {
    checkBackendHealth().then((alive) => setBackendOnline(alive));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [patientMessages]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);

    const inputCode = patientCode.trim().toUpperCase();
    if (!inputCode) {
      setAuthError("Please enter your consultation code.");
      return;
    }

    // Match consultation from store
    const matched = consultations.find(
      (c) =>
        c.secureCode?.toUpperCase() === inputCode ||
        c.id.toUpperCase() === inputCode ||
        (c.id === PRIMARY_CONSULTATION_ID && (inputCode === "3AW-7K2-Q9" || inputCode === "CONS-001"))
    );

    const targetConsultationId = matched ? matched.id : inputCode;
    const patientLabel = matched ? matched.patientLabel : "Patient";
    const patientCodeTag = matched ? matched.patientCode : "PT-0001";
    const diagnosis = matched ? matched.diagnosis : "Consultation médicale";

    const personalizedGreeting = `Hello! I am your 3awedhni Care Assistant for ${patientLabel}. I am here to help you follow the post-consultation instructions approved by your doctor (${diagnosis}). How can I help you today?

──────────────
3aslema! Ena l'assistant 3awedhni mte3 el maridh ${patientLabel}. Nnajjem n3awnek bel consignes mte3 tbibek (${diagnosis}). Chnowa t7eb tes'el?`;

    // 1. Try real backend authentication if online
    if (backendOnline) {
      try {
        let verifyRes: any = null;
        try {
          verifyRes = await patientAuthByCode(inputCode);
        } catch {
          verifyRes = await patientAuthVerify(targetConsultationId, "123456");
        }
        if (verifyRes?.access_token) {
          setPatientToken(verifyRes.access_token);
          setPatientAuthed(true);
          addAudit(
            `Patient Representative (${patientCodeTag})`,
            targetConsultationId,
            `Consultation code verification successful (${inputCode})`,
          );
          setPatientMessages([
            {
              id: 1,
              from: "bot",
              text: personalizedGreeting,
              time: now(),
            },
          ]);
          return;
        }
      } catch (err) {
        console.warn("Backend auth failed, evaluating local match:", err);
      }
    }

    // 2. Standalone / local validation: if matched or has code format
    if (!matched && !inputCode.startsWith("3AW-") && inputCode !== DEFAULT_PATIENT_CODE) {
      setAuthError("Consultation code not found. Please enter a valid code provided by your doctor.");
      addAudit("Unknown", targetConsultationId, "Patient authentication failed");
      return;
    }

    setPatientAuthed(true);
    setAuthError(null);
    addAudit(
      `Patient Representative (${patientCodeTag})`,
      targetConsultationId,
      `Consultation code authentication successful (${inputCode}) [Local Mode]`,
    );

    setPatientMessages([
      {
        id: 1,
        from: "bot",
        text: personalizedGreeting,
        time: now(),
      },
    ]);
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setInput("");

    const targetId = currentConsultation?.id || PRIMARY_CONSULTATION_ID;
    const pCodeTag = currentConsultation?.patientCode || "PT-4821";

    // Add patient message immediately
    const patientMsgId = Date.now();
    setPatientMessages((prev) => [
      ...prev,
      { id: patientMsgId, from: "patient", text: clean, time: now() },
    ]);

    // 1. If backend token is active, call FastAPI /patient/chat
    if (patientToken && backendOnline) {
      try {
        const chatRes = await patientChat(patientToken, clean);
        const mappedOutcome = mapBackendOutcome(chatRes.outcome);
        const mappedLang = mapBackendLanguage(chatRes.language_detected);
        const matchingInst = instructions.find((i) => i.id === chatRes.instruction_id);

        const englishText = getEnglishResponseForChat(
          chatRes.outcome,
          matchingInst,
          chatRes.instruction_id,
        );
        const bilingualMessage = formatBilingualAgentMessage(englishText, chatRes.response);

        setPatientMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "bot",
            text: bilingualMessage,
            time: now(),
            outcome: mappedOutcome,
            ...(matchingInst
              ? { source: `${matchingInst.id} · v${matchingInst.version}` }
              : chatRes.instruction_id
              ? { source: chatRes.instruction_id }
              : {}),
          },
        ]);

        const analysisMock: Analysis = {
          outcome: mappedOutcome,
          language: mappedLang,
          temperature: null,
          feverMentioned: false,
          feverNegated: false,
          redFlags: chatRes.safety_flag === "EMERGENCY_RED_FLAG" ? ["Emergency alert"] : [],
          injection: chatRes.safety_flag === "INJECTION_ATTEMPT",
          intent: null,
          summary: clean,
          trace: [
            "Deterministic Safety Engine Evaluation (Server)",
            `Safety Flag: ${chatRes.safety_flag}`,
            `Intent: ${chatRes.intent}`,
            `LangGraph Outcome: ${chatRes.outcome}`,
          ],
          reply: bilingualMessage,
          instruction: matchingInst ?? null,
        };
        setPatientLastAnalysis(analysisMock);

        addEvent(
          buildEvent(analysisMock, {
            id: `EVT-${Math.floor(Math.random() * 9000 + 1000)}`,
            patientCode: pCodeTag,
            consultationId: targetId,
            timestamp: new Date().toISOString(),
            message: clean,
          }),
        );

        addAudit(
          "3awedhni Assistant",
          targetId,
          chatRes.outcome === "ESCALATED_EMERGENCY"
            ? "Urgent emergency orientation issued (Server)"
            : matchingInst
            ? `Instruction ${matchingInst.id} cited`
            : "Referral to medical practitioner",
        );
        return;
      } catch (err) {
        console.warn("Backend chat failed, falling back to local safety engine", err);
      }
    }

    // 2. Fallback to local safety engine scoped to this patient's instructions
    const scopedInstructions = instructions.filter((i) => i.consultationId === targetId);
    const analysis = analyzeMessage(
      clean,
      scopedInstructions.length > 0 ? scopedInstructions : instructions,
      targetId
    );
    const englishFallbackText = getEnglishResponseForChat(
      analysis.outcome,
      analysis.instruction,
      analysis.instruction?.id,
    );
    const bilingualFallbackMessage = formatBilingualAgentMessage(
      englishFallbackText,
      analysis.reply,
    );

    setPatientLastAnalysis(analysis);
    setPatientMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        from: "bot",
        text: bilingualFallbackMessage,
        time: now(),
        outcome: analysis.outcome,
        ...(analysis.instruction
          ? { source: `${analysis.instruction.id} · v${analysis.instruction.version}` }
          : {}),
      },
    ]);
    addEvent(
      buildEvent(analysis, {
        id: `EVT-${Math.floor(Math.random() * 9000 + 1000)}`,
        patientCode: pCodeTag,
        consultationId: targetId,
        timestamp: new Date().toISOString(),
        message: clean,
      }),
    );
    addAudit(
      "3awedhni Assistant",
      targetId,
      analysis.outcome === "urgence"
        ? "Urgent emergency orientation issued"
        : analysis.instruction
        ? `Instruction ${analysis.instruction.id} cited`
        : "Referral to medical practitioner",
    );
  }

  // Simulated Voice Call via POST /patient/call (Whisper STT + Edge-TTS)
  async function triggerSimulatedVoiceCall() {
    if (!patientToken || !backendOnline) {
      send("Weldi mazal yechki men 7al9ou, chna3mel?");
      return;
    }

    setIsCalling(true);
    try {
      // Mock wave buffer for telephony call simulation
      const mockWav = new Blob(
        [
          new Uint8Array([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x66, 0x6d,
            0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x44, 0xac, 0x00,
            0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
            0x00, 0x00, 0x00, 0x00,
          ]),
        ],
        { type: "audio/wav" },
      );

      const callRes = await patientCall(patientToken, mockWav);

      const englishCallReply =
        callRes.outcome === "ESCALATED_EMERGENCY"
          ? "🚨 Medical Emergency: Please go to the nearest emergency department or call SAMU 190 immediately."
          : `According to your doctor: ${
              callRes.instruction_id
                ? "Follow the approved prescription guidelines."
                : "Please follow the validated medical instructions."
            }`;
      const bilingualCallReply = formatBilingualAgentMessage(englishCallReply, callRes.reply_text);

      setPatientMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          from: "patient",
          text: `📞 [Voice Call]: ${callRes.transcript}`,
          time: now(),
          isVoice: true,
        },
        {
          id: Date.now() + 1,
          from: "bot",
          text: `🔊 ${bilingualCallReply}`,
          time: now(),
          outcome: mapBackendOutcome(callRes.outcome),
          isVoice: true,
        },
      ]);

      if (callRes.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${callRes.audio_base64}`);
        audio.play().catch(() => {});
      }
    } catch (e) {
      console.warn("Simulated call error", e);
    } finally {
      setIsCalling(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Patient Journey</span>
          <h1 className="mt-2 text-3xl font-bold">Patient Assistant</h1>
          <p className="mt-1 text-muted-foreground">
            Secure patient messaging. Every exchange appears on your dashboard in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patientAuthed && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetPatientSession}
              className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Lock className="h-3.5 w-3.5" />
              New Discussion / Switch Code
            </Button>
          )}
          {backendOnline ? (
            <Badge variant="success" className="gap-1.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Backend Connected (FastAPI + Qdrant)
            </Badge>
          ) : (
            <Badge variant="soft" className="text-xs">
              Local Standalone Mode
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* Phone UI */}
        <div className="mx-auto w-full max-w-[26rem] self-start overflow-hidden rounded-[2.2rem] border-8 border-ink bg-chat shadow-card">
          <div className="flex items-center justify-between bg-primary-deep px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <ArrowLeft className="h-4 w-4 opacity-80" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card/20">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">3awedhni عوضني</div>
                <div className="text-[0.7rem] opacity-80">
                  {patientAuthed && currentConsultation
                    ? `online · ${currentConsultation.patientLabel} (${currentConsultation.patientCode})`
                    : "verification required"}
                </div>
              </div>
            </div>
            {patientAuthed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPatientSession}
                className="h-7 text-[0.7rem] px-2 text-primary-foreground hover:bg-card/20"
                title="Enter another consultation code"
              >
                Switch Code
              </Button>
            )}
          </div>

          {!patientAuthed ? (
            <form onSubmit={login} className="space-y-4 p-5" style={{ minHeight: 520 }}>
              <div className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <Lock className="h-4 w-4 text-primary" /> Secure Record Access
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only your consultation code is required to access your personalized doctor instructions and start a discussion.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="pcode">
                  Consultation Code
                </label>
                <Input
                  id="pcode"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  placeholder="e.g. 3AW-7K2-Q9 or 3AW-XXX-XX"
                  className="h-11 rounded-xl bg-card font-mono"
                  autoFocus
                />
              </div>
              {authError && <p className="text-xs text-urgent">{authError}</p>}
              <Button type="submit" variant="hero" className="w-full">
                <ShieldCheck /> Verify & Start Discussion
              </Button>

              {/* Dynamic Consultation Codes Selector for Quick Testing */}
              {consultations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-[0.7rem] font-medium text-muted-foreground mb-1.5">
                    Select an active consultation code to test:
                  </p>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {consultations.map((c) => {
                      const code = c.secureCode || `3AW-${c.id.slice(0, 3).toUpperCase()}-${c.id.slice(-2).toUpperCase()}`;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setPatientCode(code);
                            setAuthError(null);
                          }}
                          className={`text-left text-xs p-2 rounded-lg border transition-all ${
                            patientCode === code
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "bg-card hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-ink">{code}</span>
                            <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-muted/80">{c.patientCode}</span>
                          </div>
                          <div className="text-[0.7rem] truncate mt-0.5">
                            {c.patientLabel} · {c.diagnosis}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="h-[460px] space-y-2.5 overflow-y-auto p-4">
                {patientMessages.map((m) => (
                  <div
                    key={m.id}
                    dir="auto"
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.from === "patient"
                        ? "ml-auto rounded-tr-sm bg-chat-out"
                        : "rounded-tl-sm bg-card"
                    } ${m.outcome === "urgence" ? "border border-urgent/40 bg-urgent-soft" : ""}`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                    <div
                      className="mt-1 flex items-center justify-end gap-1.5 text-[0.65rem] text-muted-foreground"
                      dir="ltr"
                    >
                      {m.source && (
                        <span className="mr-auto font-semibold text-primary-deep">
                          Source: {m.source}
                        </span>
                      )}
                      {m.isVoice && (
                        <span className="mr-auto flex items-center gap-0.5 font-semibold text-primary">
                          <Volume2 className="h-3 w-3" /> Voice
                        </span>
                      )}
                      {m.time}
                      {m.from === "patient" && <CheckCheck className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 bg-muted p-3"
              >
                <Input
                  value={input}
                  dir="auto"
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ekteb msaj… / اكتب ميساج…"
                  className="h-10 rounded-full bg-card"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="soft"
                  title="Simulate Voice Call (Whisper + Edge-TTS)"
                  aria-label="Voice Call"
                  disabled={isCalling}
                  onClick={triggerSimulatedVoiceCall}
                  className="h-10 w-10 shrink-0"
                >
                  {isCalling ? <PhoneCall className="animate-spin" /> : <Mic />}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  variant="hero"
                  aria-label="Send"
                  className="h-10 w-10 shrink-0"
                >
                  <Send />
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Safety Engine & Pipeline Panel */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Safety Engine {backendOnline && "& LangGraph Pipeline"}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Deterministic red flag verification happens before any LLM instruction search. Zero
              hallucination, full auditability.
            </p>

            {!patientLastAnalysis ? (
              <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <ShieldCheck className="mx-auto h-8 w-8 text-primary/50 mb-2" />
                Red flags are deterministically analyzed on every message. The execution trace,
                temperature checks, and citation details will appear here.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge outcome={patientLastAnalysis.outcome} />
                  {patientLastAnalysis.temperature !== null && (
                    <Badge variant="outline">{patientLastAnalysis.temperature} °C</Badge>
                  )}
                  {patientLastAnalysis.feverNegated && (
                    <Badge variant="success">Negation Respected</Badge>
                  )}
                </div>
                <ol className="space-y-2">
                  {patientLastAnalysis.trace.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.65rem] font-bold text-primary-deep">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {patientLastAnalysis.instruction && (
                  <div className="rounded-2xl bg-success-soft p-4 text-sm">
                    <div className="font-semibold text-success">Cited Validated Instruction</div>
                    <p className="mt-1 text-foreground">
                      {patientLastAnalysis.instruction.permittedAction}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
