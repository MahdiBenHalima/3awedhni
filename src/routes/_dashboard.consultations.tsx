import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Mic,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCareStore } from "@/lib/care-store";
import type { ConsultationStatus } from "@/lib/care-types";
import { alertSigns, DEMO_CONSULTATION_ID, demoTranscript } from "@/lib/demo-data";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations et consignes — 3awedhni عوضني" },
      {
        name: "description",
        content:
          "Enregistrez un vocal, relisez la fiche extraite et validez les consignes du patient.",
      },
      { property: "og:title", content: "Consultations et consignes — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Du vocal du médecin à la fiche de consignes validée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultationsPage,
});

type Stage = "audio" | "transcribing" | "review" | "validated";

const STATUS_VARIANT: Record<ConsultationStatus, "success" | "warning" | "urgent"> = {
  validée: "success",
  brouillon: "warning",
  révoquée: "urgent",
};

const STEPS: { key: Stage; label: string }[] = [
  { key: "audio", label: "Vocal du médecin" },
  { key: "transcribing", label: "Transcription & extraction" },
  { key: "review", label: "Relecture" },
  { key: "validated", label: "Validation" },
];

const WAVE = [
  6, 14, 22, 10, 28, 18, 32, 12, 24, 16, 30, 8, 20, 26, 14, 34, 18, 10, 24, 28, 12, 22, 16, 30, 8,
  18, 26, 12, 20, 14, 28, 10, 22, 16, 32, 12, 24, 8, 18, 26,
];

function ConsultationsPage() {
  const { consultations, instructions, proposeEdit, approveConsultation } = useCareStore();
  const [stage, setStage] = useState<Stage>("audio");
  const [playing, setPlaying] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const demo = consultations.find((c) => c.id === DEMO_CONSULTATION_ID)!;
  const demoInstructions = instructions.filter((i) => i.consultationId === DEMO_CONSULTATION_ID);
  const stepIndex = STEPS.findIndex((s) => s.key === stage);

  useEffect(() => {
    if (stage !== "transcribing") return;
    const t = setTimeout(() => setStage("review"), 1800);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <span className="eyebrow">Après la consultation</span>
        <h1 className="mt-2 text-3xl font-bold">Consultations & consignes</h1>
        <p className="mt-1 text-muted-foreground">
          Aucune transcription n'est publiée au patient sans votre relecture et votre validation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          {consultations.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border bg-card p-4 shadow-soft ${c.id === DEMO_CONSULTATION_ID ? "ring-2 ring-primary/40" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{c.patientCode}</span>
                <Badge variant={STATUS_VARIANT[c.status]} className="capitalize">
                  {c.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm">{c.diagnosis}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.age} · {formatDateTime(c.consultedAt)}
              </p>
              {c.secureCode && c.status === "validée" && (
                <p className="mt-2 font-mono text-xs text-primary-deep">
                  Code patient : {c.secureCode}
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
                {demo.patientLabel} · {demo.age}
              </h2>
              <p className="text-sm text-muted-foreground">
                Identifiant interne aléatoire · {demo.diagnosis} ·{" "}
                {formatDateTime(demo.consultedAt)}
              </p>
            </div>
            {stage !== "audio" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStage("audio");
                  setCode(null);
                }}
              >
                Rejouer la démo
              </Button>
            )}
          </div>

          {stage === "audio" && (
            <div className="rounded-3xl bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold">Vocal individuel du médecin</h3>
              <p className="text-sm text-muted-foreground">
                Identité, diagnostic posé, 3 à 6 situations anticipées et signes d'alerte.
              </p>
              <div className="mt-5 flex items-center gap-4 rounded-2xl bg-primary-soft p-4">
                <Button
                  size="icon"
                  variant="hero"
                  className="h-12 w-12 shrink-0"
                  aria-label={playing ? "Pause" : "Écouter"}
                  onClick={() => setPlaying((p) => !p)}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                <div className="flex h-12 flex-1 items-center gap-[3px] overflow-hidden">
                  {WAVE.map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 shrink-0 rounded-full bg-primary ${playing ? "animate-wave" : ""}`}
                      style={{ height: h + 6, animationDelay: `${(i % 8) * 0.09}s` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm text-primary-deep">01:42</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="soft"
                  onClick={() =>
                    toast("Enregistrement simulé", {
                      description: "Audio préparé à l'avance pour la démo.",
                    })
                  }
                >
                  <Mic /> Enregistrer un nouveau vocal
                </Button>
                <Button
                  variant="hero"
                  onClick={() => {
                    setPlaying(false);
                    setStage("transcribing");
                  }}
                >
                  <Sparkles /> Transcrire et extraire la fiche
                </Button>
              </div>
            </div>
          )}

          {stage === "transcribing" && (
            <div className="flex flex-col items-center rounded-3xl bg-card p-12 text-center shadow-card">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Transcription et extraction en cours…</h3>
              <p className="text-sm text-muted-foreground">
                Transcription locale puis extraction structurée des consignes.
              </p>
            </div>
          )}

          {(stage === "review" || stage === "validated") && (
            <>
              <div className="rounded-3xl bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Transcription</h3>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-muted p-4 text-sm leading-relaxed">
                  {demoTranscript}
                </p>
                <p className="mt-2 text-xs text-warning">
                  Vérifiez particulièrement âges, températures, doses, négations et unités.
                </p>
              </div>

              <div className="rounded-3xl bg-card p-6 shadow-card">
                <h3 className="text-lg font-semibold">Fiche structurée extraite</h3>
                <p className="text-sm text-muted-foreground">
                  Modifiez l'action autorisée si nécessaire avant de valider.
                </p>
                <div className="mt-5 space-y-4">
                  {demoInstructions.map((ins, i) => (
                    <div key={ins.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold">
                          Situation {i + 1} · {ins.situation}
                        </h4>
                        <span className="text-xs font-semibold text-primary-deep">
                          {ins.id} · v{ins.version}
                          {ins.pendingAction !== undefined && (
                            <Badge variant="warning" className="ml-2">
                              Brouillon v{ins.version + 1} à valider
                            </Badge>
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Conditions : {ins.applicability}
                      </p>
                      <label className="mt-3 block text-xs font-semibold text-muted-foreground">
                        Action autorisée
                      </label>
                      <Textarea
                        value={ins.pendingAction ?? ins.permittedAction}
                        disabled={stage === "validated"}
                        onChange={(e) => proposeEdit(ins.id, e.target.value)}
                        className="mt-1 min-h-[70px] rounded-xl"
                      />
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ins.escalation.map((e) => (
                          <Badge key={e} variant="escalate">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-urgent/25 bg-urgent-soft p-4">
                    <div className="flex items-center gap-2 font-semibold text-urgent">
                      <ShieldAlert className="h-4 w-4" /> Signes d'alerte → urgences
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {alertSigns.map((s) => (
                        <Badge key={s} variant="urgent" className="bg-card">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {stage === "review" ? (
                  <Button
                    variant="hero"
                    size="lg"
                    className="mt-6"
                    onClick={() => {
                      const c = approveConsultation(DEMO_CONSULTATION_ID);
                      setCode(c);
                      setStage("validated");
                      toast.success("Fiche validée", {
                        description: "Les consignes sont actives pour DEMO-001.",
                      });
                    }}
                  >
                    <CheckCircle2 /> J'ai relu — valider et activer
                  </Button>
                ) : (
                  <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-success-soft p-4">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div className="flex-1">
                      <p className="font-semibold text-success">Consignes validées et activées</p>
                      <p className="text-sm text-foreground">
                        Code sécurisé à remettre au patient (usage limité) :
                      </p>
                    </div>
                    <span className="rounded-xl bg-card px-4 py-2 font-mono text-lg font-bold tracking-widest text-primary-deep shadow-soft">
                      {code ?? demo.secureCode}
                    </span>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Copier le code"
                      onClick={() => {
                        void navigator.clipboard?.writeText(code ?? demo.secureCode ?? "");
                        toast("Code copié");
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
    </div>
  );
}
