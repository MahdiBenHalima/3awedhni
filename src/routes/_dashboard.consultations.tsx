import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Upload,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCareStore, type ConsultationStage } from "@/lib/care-store";
import type { Consultation, ConsultationStatus, Instruction } from "@/lib/care-types";
import { alertSigns, PRIMARY_CONSULTATION_ID, seedTranscript } from "@/lib/seed-data";
import { formatDateTime } from "@/lib/format";
import { adaptInstruction, createConsultation, submitPrewrittenInstructions, transcribeAudio, uploadConsultationAudio } from "@/lib/api";
import { extractAllInstructionsFromTranscript } from "@/lib/clinical-extractor";

export const Route = createFileRoute("/_dashboard/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations & Instructions — 3awedhni عوضني" },
      {
        name: "description",
        content:
          "Record dictation, review extracted structured instructions, and approve patient guidance.",
      },
      { property: "og:title", content: "Consultations & Instructions — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "From individual physician dictation to validated patient instructions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationsPage,
});

const STATUS_VARIANT: Record<ConsultationStatus, "success" | "warning" | "urgent"> = {
  validée: "success",
  brouillon: "warning",
  révoquée: "urgent",
};

const STATUS_LABEL_EN: Record<ConsultationStatus, string> = {
  validée: "Approved",
  brouillon: "Draft",
  révoquée: "Revoked",
};

const STEPS: { key: ConsultationStage; label: string }[] = [
  { key: "audio", label: "Physician Dictation" },
  { key: "transcribing", label: "Transcription & Extraction" },
  { key: "review", label: "Review & Edit" },
  { key: "validated", label: "Validation & Code" },
];

const WAVE = [
  6, 14, 22, 10, 28, 18, 32, 12, 24, 16, 30, 8, 20, 26, 14, 34, 18, 10, 24, 28, 12, 22, 16, 30, 8,
  18, 26, 12, 20, 14, 28, 10, 22, 16, 32, 12, 24, 8, 18, 26,
];

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ConsultationsPage() {
  const {
    consultations,
    instructions,
    proposeEdit,
    approveConsultation,
    isConnectedToBackend,
    activeConsultationId,
    setActiveConsultationId,
    addConsultation,
    consultationStage,
    consultationCode,
    consultationAudioBlob,
    consultationAudioUrl,
    consultationTranscript,
    setConsultationStage,
    setConsultationCode,
    setConsultationAudio,
    setConsultationTranscript,
    setConsultationInstructions,
    resetConsultation,
  } = useCareStore();

  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // New Consultation Dialog state
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [newGivenName, setNewGivenName] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("2019-05-10");
  const [newPhone, setNewPhone] = useState("+216 98 123 456");
  const [newDiagnosis, setNewDiagnosis] = useState("Angine aiguë fébrile");
  const [isCreating, setIsCreating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const consultation =
    consultations.find((c) => c.id === activeConsultationId) ||
    consultations.find((c) => c.id === PRIMARY_CONSULTATION_ID) ||
    consultations[0]!;

  const consultationInstructions = instructions.filter(
    (i) => i.consultationId === consultation.id,
  );
  const stepIndex = STEPS.findIndex((s) => s.key === consultationStage);

  // Audio recording handlers
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setConsultationAudio(audioBlob, audioUrl);
        stream.getTracks().forEach((track) => track.stop());
        toast.success("Voice recording captured successfully");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied or not available", {
        description: "Please check your browser microphone permissions.",
      });
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConsultationAudio(file, url);
    toast.success(`Audio file "${file.name}" uploaded`);
  }

  function toggleAudioPlayback() {
    if (!audioPlayerRef.current && consultationAudioUrl) {
      audioPlayerRef.current = new Audio(consultationAudioUrl);
      audioPlayerRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioPlayerRef.current?.pause();
      setPlaying(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.play().catch(() => {});
        setPlaying(true);
      } else {
        // Fallback simulated playback
        setPlaying(true);
        setTimeout(() => setPlaying(false), 3000);
      }
    }
  }

  // Create new patient and consultation handler
  async function handleCreateConsultation(e: React.FormEvent) {
    e.preventDefault();
    if (!newGivenName.trim() || !newDiagnosis.trim()) {
      toast.error("Please provide both patient name and diagnosis.");
      return;
    }
    setIsCreating(true);

    try {
      if (isConnectedToBackend) {
        const created = await createConsultation({
          physician_id: "DR-DEMO-001",
          diagnosis_text: newDiagnosis.trim(),
          patient_info: {
            given_name: newGivenName.trim(),
            family_name: newFamilyName.trim(),
            birth_date: newBirthDate.trim(),
            verified_contact_reference: newPhone.trim(),
          },
        });
        addConsultation(created);
        setActiveConsultationId(created.id);
        resetConsultation();
        setIsNewPatientOpen(false);
        setNewGivenName("");
        setNewFamilyName("");
        toast.success(`New consultation created for ${created.patientLabel}`);
        return;
      }
    } catch (err) {
      console.warn("Backend consultation creation failed, using local store:", err);
    } finally {
      setIsCreating(false);
    }

    // Local Standalone Fallback
    const birthYear = parseInt(newBirthDate.split("-")[0] || "2019", 10);
    const ageYears = new Date().getFullYear() - birthYear;
    const newId = `CONS-${Math.floor(Math.random() * 900 + 100)}`;
    const localConsultation: Consultation = {
      id: newId,
      patientCode: `PT-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientLabel: `${newGivenName} ${newFamilyName}`.trim(),
      age: ageYears > 0 ? `${ageYears} ans` : "18 mois",
      consultedAt: new Date().toISOString(),
      diagnosis: newDiagnosis.trim(),
      status: "brouillon",
      secureCode: `3AW-${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
      verifiedContactMasked:
        newPhone.length >= 8
          ? `${newPhone.slice(0, 4)} •• ••• •${newPhone.slice(-2)}`
          : "+216 •• ••• •82",
    };
    addConsultation(localConsultation);
    setActiveConsultationId(localConsultation.id);
    resetConsultation();
    setIsNewPatientOpen(false);
    setNewGivenName("");
    setNewFamilyName("");
    toast.success(`New consultation created for ${localConsultation.patientLabel}`);
  }

  const isTranscribingRef = useRef(false);

  // Handle stage transition for transcribing
  useEffect(() => {
    if (consultationStage !== "transcribing") {
      isTranscribingRef.current = false;
      return;
    }
    if (isTranscribingRef.current) return;
    isTranscribingRef.current = true;

    async function runTranscription() {
      try {
        if (consultationAudioBlob) {
          toast.info("Uploading audio dictation to server…");
          await uploadConsultationAudio(consultation.id, consultationAudioBlob);
        }

        // Do not send transcript_override if an audio file was uploaded, so Whisper transcribes it!
        const overrideText = consultationAudioBlob ? undefined : seedTranscript;
        toast.info("Local Whisper transcribing audio… Please wait a few moments.");
        const data = await transcribeAudio(consultation.id, overrideText);

        if (data) {
          if (data.draft_instructions && data.draft_instructions.length > 0) {
            const adapted = data.draft_instructions.map(adaptInstruction);
            setConsultationInstructions(consultation.id, adapted);
            toast.success("AI Structured Extraction Complete", {
              description: `${adapted.length} instruction(s) extracted from audio dictation.`,
            });
          }
          if (data.transcript) {
            setConsultationTranscript(data.transcript);
          }
          setTimeout(() => {
            isTranscribingRef.current = false;
            setConsultationStage("review");
          }, 800);
          return;
        }
      } catch (err) {
        console.warn("Backend transcription failed, using fallback clinical extractor:", err);
        toast.error("Transcription note", {
          description: err instanceof Error ? err.message : "Failed to transcribe audio from backend",
        });

        // Fallback: If backend is unreachable, perform client-side extraction
        const fallbackTranscript =
          consultationAudioBlob && "name" in consultationAudioBlob
            ? `Vocal du médecin enregistré pour ${consultation.patientLabel} (${consultation.diagnosis}). Surveillance clinique post-consultation, poursuite du traitement prescrit, repos et hydratation. Consulter immédiatement en cas de fièvre >= 40°C, détresse respiratoire ou impossibilité d'avaler la salive.`
            : seedTranscript;

        setConsultationTranscript(fallbackTranscript);

        const fallbackInstructions = extractAllInstructionsFromTranscript(
          fallbackTranscript,
          consultation.id,
          consultation.diagnosis
        );

        setConsultationInstructions(consultation.id, fallbackInstructions);
        toast.info("Structured instructions extracted", {
          description: `${fallbackInstructions.length} instruction(s) extracted and ready for physician review.`,
        });
        setTimeout(() => {
          isTranscribingRef.current = false;
          setConsultationStage("review");
        }, 800);
      }
    }

    runTranscription();
  }, [
    consultationStage,
    consultation.id,
    consultation.patientLabel,
    consultation.diagnosis,
    consultationAudioBlob,
    setConsultationStage,
    setConsultationTranscript,
    setConsultationInstructions,
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">Post-Consultation</span>
          <h1 className="mt-2 text-3xl font-bold">Consultations & Instructions</h1>
          <p className="mt-1 text-muted-foreground">
            No transcription is published to the patient without your explicit review and validation.
          </p>
        </div>
        <Button variant="hero" onClick={() => setIsNewPatientOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Patient / New Consultation
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary-soft"
            onClick={() => setIsNewPatientOpen(true)}
          >
            <UserPlus className="h-4 w-4" /> + New Patient
          </Button>

          {consultations.map((c) => (
            <div
              key={c.id}
              tabIndex={0}
              role="button"
              onClick={() => {
                setActiveConsultationId(c.id);
                resetConsultation();
              }}
              className={`cursor-pointer rounded-2xl border bg-card p-4 shadow-soft transition-all hover:border-primary/50 ${
                c.id === consultation.id ? "ring-2 ring-primary/40 border-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{c.patientCode}</span>
                <Badge variant={STATUS_VARIANT[c.status]} className="capitalize">
                  {STATUS_LABEL_EN[c.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{c.patientLabel}</p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.diagnosis}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.age} · {formatDateTime(c.consultedAt)}
              </p>
              {(c.secureCode || (c.id === consultation.id && consultationCode)) &&
                c.status === "validée" && (
                  <p className="mt-2 font-mono text-xs text-primary-deep">
                    Patient code: {c.secureCode || consultationCode}
                  </p>
                )}
            </div>
          ))}
        </aside>

        <section className="space-y-6">
          {/* Stepper */}
          <ol className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-2 shadow-soft md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li
                key={s.key}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                  i === stepIndex
                    ? "bg-primary-soft font-semibold text-primary-deep"
                    : i < stepIndex
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i < stepIndex
                      ? "bg-success text-primary-foreground"
                      : i === stepIndex
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s.label}
              </li>
            ))}
          </ol>

          {/* Patient header */}
          <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-hero p-5 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-soft">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {consultation.patientLabel} · {consultation.age}
              </h2>
              <p className="text-sm text-muted-foreground">
                Record ID: {consultation.id} · {consultation.diagnosis} ·{" "}
                {formatDateTime(consultation.consultedAt)}
              </p>
            </div>
            {consultationStage !== "audio" && (
              <Button variant="ghost" size="sm" onClick={resetConsultation}>
                <RotateCcw className="h-4 w-4 mr-1" /> Start Over
              </Button>
            )}
          </div>

          {consultationStage === "audio" && (
            <div className="rounded-3xl bg-card p-6 shadow-card space-y-5">
              <div>
                <h3 className="text-lg font-semibold">Physician Individual Voice Dictation</h3>
                <p className="text-sm text-muted-foreground">
                  State patient identity, established diagnosis, 3 to 6 anticipated situations, and
                  explicit red flags.
                </p>
              </div>

              {/* Active Recording UI */}
              {isRecording ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-urgent/60 bg-urgent-soft/40 p-6">
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded-full bg-urgent animate-pulse" />
                    <span className="font-semibold text-urgent">Recording in progress…</span>
                    <span className="font-mono text-lg font-bold text-ink">
                      {formatDuration(recordDuration)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Speak clearly into your PC microphone. Mention medication, dosage, and alert signs.
                  </p>
                  <Button variant="urgent" size="lg" onClick={stopRecording}>
                    <Square className="h-4 w-4 mr-1" /> Stop Recording
                  </Button>
                </div>
              ) : (
                /* Waveform / Player UI */
                <div className="flex items-center gap-4 rounded-2xl bg-primary-soft p-4">
                  <Button
                    size="icon"
                    variant="hero"
                    className="h-12 w-12 shrink-0"
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={toggleAudioPlayback}
                  >
                    {playing ? <Pause /> : <Play />}
                  </Button>
                  <div className="flex h-12 flex-1 items-center gap-[3px] overflow-hidden">
                    {WAVE.map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 shrink-0 rounded-full bg-primary ${
                          playing ? "animate-wave" : ""
                        }`}
                        style={{ height: h + 6, animationDelay: `${(i % 8) * 0.09}s` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-sm text-primary-deep">
                    {consultationAudioBlob
                      ? formatDuration(recordDuration || 45)
                      : "01:42"}
                  </span>
                </div>
              )}

              {/* Action Buttons: Mic, Upload File, Transcribe */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isRecording && (
                  <Button variant="outline" onClick={startRecording}>
                    <Mic className="text-primary" /> Record with PC Microphone
                  </Button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload /> Upload Audio File
                </Button>

                <Button
                  variant="hero"
                  className="ml-auto"
                  onClick={() => {
                    setPlaying(false);
                    setConsultationStage("transcribing");
                  }}
                >
                  <Sparkles /> Transcribe & Extract Instructions
                </Button>
              </div>
            </div>
          )}

          {consultationStage === "transcribing" && (
            <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center shadow-card">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-semibold">
                Transcribing audio and extracting structured instructions…
              </h3>
              <p className="text-sm text-muted-foreground">
                Local Whisper speech-to-text followed by structured instruction extraction.
              </p>
            </div>
          )}

          {(consultationStage === "review" || consultationStage === "validated") && (
            <>
              <div className="rounded-3xl bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Transcription</h3>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-muted p-4 text-sm leading-relaxed">
                  {consultationTranscript}
                </p>
                <p className="mt-2 text-xs text-warning">
                  Pay special attention to ages, temperatures, dosages, negations, and units.
                </p>
              </div>

              <div className="rounded-3xl bg-card p-6 shadow-card">
                <h3 className="text-lg font-semibold">Extracted Structured Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  Modify authorized actions if needed before final approval.
                </p>
                <div className="mt-5 space-y-4">
                  {consultationInstructions.map((ins, i) => {
                    const isAlertCard =
                      ins.category === "red_flag_alert" ||
                      ins.situation.includes("🚨") ||
                      ins.situation.toLowerCase().includes("alerte") ||
                      ins.situation.toLowerCase().includes("urgences");

                    return (
                      <div
                        key={ins.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isAlertCard
                            ? "border-urgent/60 bg-urgent-soft/40 dark:bg-urgent-soft/10 ring-1 ring-urgent/30"
                            : "border-border bg-card shadow-soft"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isAlertCard ? (
                              <Badge variant="urgent" className="gap-1 font-semibold">
                                <ShieldAlert className="h-3.5 w-3.5" /> Red Flag · Urgence
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-semibold text-primary">
                                Situation {i + 1}
                              </Badge>
                            )}
                            <h4 className="font-semibold text-foreground">
                              {ins.situation}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-primary-deep">
                            {ins.id} · v{ins.version}
                            {ins.pendingAction !== undefined && (
                              <Badge variant="warning" className="ml-2">
                                Draft v{ins.version + 1} to approve
                              </Badge>
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isAlertCard ? "Critères de gravité imposant l'urgence :" : "Conditions d'application :"} {ins.applicability}
                        </p>
                        <label
                          className={`mt-3 block text-xs font-semibold ${
                            isAlertCard ? "text-urgent font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {isAlertCard ? "Conduite à tenir d'urgence immédiate (validée)" : "Authorized Action"}
                        </label>
                        <Textarea
                          value={ins.pendingAction ?? ins.permittedAction}
                          disabled={consultationStage === "validated"}
                          onChange={(e) => proposeEdit(ins.id, e.target.value)}
                          className={`mt-1 min-h-[70px] rounded-xl ${
                            isAlertCard
                              ? "border-urgent/40 bg-card focus-visible:ring-urgent font-medium"
                              : ""
                          }`}
                        />
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {ins.escalation.map((e) => (
                            <Badge key={e} variant={isAlertCard ? "urgent" : "escalate"}>
                              {e}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {!consultationInstructions.some(
                    (ins) =>
                      ins.category === "red_flag_alert" ||
                      ins.situation.includes("🚨") ||
                      ins.situation.toLowerCase().includes("alerte")
                  ) && (
                    <div className="rounded-2xl border border-urgent/25 bg-urgent-soft p-4">
                      <div className="flex items-center gap-2 font-semibold text-urgent">
                        <ShieldAlert className="h-4 w-4" /> Red Flags → Immediate Emergency Referral
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {alertSigns.map((s) => (
                          <Badge key={s} variant="urgent" className="bg-card">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {consultationStage === "review" ? (
                  <Button
                    variant="hero"
                    size="lg"
                    className="mt-6"
                    onClick={async () => {
                      const c = approveConsultation(consultation.id);
                      setConsultationCode(c);
                      setConsultationStage("validated");
                      toast.success("Instructions Approved", {
                        description: `Instructions are now active for ${consultation.patientLabel}.`,
                      });
                      try {
                        await submitPrewrittenInstructions(
                          consultation.id,
                          consultationInstructions.map((ins) => ({
                            situation: ins.situation,
                            permitted_action: ins.pendingAction ?? ins.permittedAction,
                            applicability_conditions: ins.applicability
                              ? ins.applicability.split(",").map((s) => s.trim()).filter(Boolean)
                              : [],
                            escalation_conditions: ins.escalation || [],
                          })),
                        );
                      } catch (err) {
                        console.warn("Could not sync instructions to backend:", err);
                      }
                    }}
                  >
                    <CheckCircle2 /> I have reviewed — approve and activate instructions
                  </Button>
                ) : (
                  <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-success-soft p-4">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div className="flex-1">
                      <p className="font-semibold text-success">
                        Instructions Approved and Active
                      </p>
                      <p className="text-sm text-foreground">
                        Secure code to give to the patient (strictly scoped to this consultation):
                      </p>
                    </div>
                    <span className="rounded-xl bg-card px-4 py-2 font-mono text-lg font-bold tracking-widest text-primary-deep shadow-soft">
                      {consultationCode ?? consultation.secureCode}
                    </span>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Copy code"
                      onClick={() => {
                        void navigator.clipboard?.writeText(
                          consultationCode ?? consultation.secureCode ?? "",
                        );
                        toast("Code copied to clipboard");
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* New Patient / Consultation Dialog */}
      <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              New Patient Consultation
            </DialogTitle>
            <DialogDescription>
              Create a new patient record to record dictation and extract personalized care instructions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateConsultation} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="givenName">First Name *</Label>
                <Input
                  id="givenName"
                  required
                  placeholder="e.g. Youssef"
                  value={newGivenName}
                  onChange={(e) => setNewGivenName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="familyName">Last Name *</Label>
                <Input
                  id="familyName"
                  required
                  placeholder="e.g. Ben Salem"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Date of Birth</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  placeholder="+216 98 123 456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">Diagnosis / Reason *</Label>
              <Input
                id="diagnosis"
                required
                placeholder="e.g. Angine aiguë fébrile avec dysphagie"
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsNewPatientOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="animate-spin mr-1 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-1 h-4 w-4" />
                )}
                Create Consultation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
