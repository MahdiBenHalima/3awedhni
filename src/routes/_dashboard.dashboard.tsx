import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileAudio,
  HelpCircle,
  MessagesSquare,
  PhoneForwarded,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { EventSheet } from "@/components/dashboard/EventSheet";
import { FollowUpBadge, OUTCOME_META, StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCareStore } from "@/lib/care-store";
import type { Instruction, Outcome } from "@/lib/care-types";
import { alertSigns, weeklyActivity } from "@/lib/demo-data";
import { followUpQueue } from "@/lib/events";
import { formatDateTime, formatTime } from "@/lib/format";
import { runSafetyChecks, type CheckResult } from "@/lib/safety-checks";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — 3awedhni عوضني" },
      {
        name: "description",
        content: "Demandes reçues pendant votre absence, suivis à examiner et consignes validées.",
      },
      { property: "og:title", content: "Tableau de bord — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Ce que vos patients ont demandé à l'assistant pendant votre absence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const OUTCOMES: Outcome[] = ["transmise", "non_couverte", "escalade", "urgence"];

const STAT_ICONS: Record<Outcome, typeof CheckCircle2> = {
  transmise: CheckCircle2,
  non_couverte: HelpCircle,
  escalade: PhoneForwarded,
  urgence: AlertTriangle,
};

const STAT_TONE: Record<Outcome, string> = {
  transmise: "bg-success-soft text-success",
  non_couverte: "bg-warning-soft text-warning",
  escalade: "bg-escalate-soft text-escalate",
  urgence: "bg-urgent-soft text-urgent",
};

const STAT_RING: Record<Outcome, string> = {
  transmise: "ring-success",
  non_couverte: "ring-warning",
  escalade: "ring-escalate",
  urgence: "ring-urgent",
};

const DEFINITIONS: Record<Outcome, string> = {
  transmise: "Consigne approuvée et applicable communiquée",
  non_couverte: "Aucune consigne applicable — pas d'improvisation",
  escalade: "Réévaluation ou avis humain recommandé",
  urgence: "Signe d'alerte — orientation urgente indiquée",
};

function DashboardPage() {
  const { events, instructions, setInstructionActive } = useCareStore();
  const [filter, setFilter] = useState<Outcome | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toDisable, setToDisable] = useState<Instruction | null>(null);
  const tableRef = useRef<HTMLElement>(null);

  const queue = followUpQueue(events);
  const urgent = queue.find((e) => e.outcome === "urgence");
  const checks = useMemo(() => runSafetyChecks(), []);

  const rows = events.filter((e) => {
    if (filter !== "all" && e.outcome !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [e.patientCode, e.summary, e.message].some((v) => v.toLowerCase().includes(q));
  });

  function applyFilter(o: Outcome | "all") {
    setFilter((prev) => (prev === o ? "all" : o));
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Bonjour, <span className="text-gradient-primary">Docteur</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Retrouvez les demandes reçues pendant votre absence et les suivis à examiner.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="soft">
            <Link to="/simulateur">
              <MessagesSquare /> Tester l'assistant
            </Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/consultations">
              <FileAudio /> Nouvelle consultation
            </Link>
          </Button>
        </div>
      </div>

      {urgent && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-urgent/25 bg-urgent-soft p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-urgent text-destructive-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-urgent">
              Urgence potentielle signalée — orientation urgente transmise au patient.
            </p>
            <p className="text-sm text-foreground">
              {urgent.patientCode} · {formatTime(urgent.timestamp)} · {urgent.summary}. Vérifiez les
              suites données lorsque vous êtes disponible.
            </p>
          </div>
          <Button variant="urgent" onClick={() => setSelected(urgent.id)}>
            Examiner l'événement <ArrowRight />
          </Button>
        </div>
      )}

      <div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {OUTCOMES.map((outcome) => {
            const Icon = STAT_ICONS[outcome];
            const count = events.filter((e) => e.outcome === outcome).length;
            const active = filter === outcome;
            return (
              <button
                key={outcome}
                type="button"
                aria-pressed={active}
                onClick={() => applyFilter(outcome)}
                className={`rounded-2xl bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card ${
                  active ? `ring-2 ${STAT_RING[outcome]}` : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_TONE[outcome]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-bold text-ink">{count}</span>
                </div>
                <div className="mt-3 font-semibold text-ink">{OUTCOME_META[outcome].label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{DEFINITIONS[outcome]}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ces catégories décrivent le résultat de l'interaction, pas une échelle de gravité. Cliquez
          pour filtrer.
        </p>
      </div>

      <section ref={tableRef} className="scroll-mt-20 rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Patients ayant contacté l'assistant</h2>
            <p className="text-sm text-muted-foreground">
              Qui, quand, pourquoi et quelle réponse a été donnée. Cliquez sur une ligne pour le
              détail.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/journal">
              Historique <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Identifiant, motif…"
              className="h-9 rounded-full bg-background pl-9"
            />
          </div>
          {(["all", ...OUTCOMES] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                filter === f
                  ? "border-primary bg-primary-soft font-semibold text-primary-deep"
                  : "bg-card hover:border-primary/50"
              }`}
            >
              {f === "all" ? "Tous" : OUTCOME_META[f].label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Heure</th>
                <th className="pb-3 font-semibold">Motif résumé</th>
                <th className="pb-3 font-semibold">Résultat</th>
                <th className="pb-3 font-semibold">Consigne / source</th>
                <th className="pb-3 font-semibold">Suivi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aucune interaction ne correspond.
                  </td>
                </tr>
              )}
              {rows.map((e) => (
                <tr
                  key={e.id}
                  tabIndex={0}
                  onClick={() => setSelected(e.id)}
                  onKeyDown={(k) => k.key === "Enter" && setSelected(e.id)}
                  className="cursor-pointer border-t align-top transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                >
                  <td className="py-3 pl-1 pr-3">
                    <div className="whitespace-nowrap font-semibold text-ink">{e.patientCode}</div>
                    <Badge variant="soft" className="mt-1 text-[0.65rem]">
                      {e.language}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{formatTime(e.timestamp)}</td>
                  <td className="max-w-[18rem] py-3 pr-3">
                    <div className="font-medium">{e.summary}</div>
                    <div className="truncate text-xs text-muted-foreground" dir="auto">
                      « {e.message} »
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge outcome={e.outcome} />
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {e.instructionId ? (
                      <span className="font-semibold text-primary-deep">
                        {e.instructionId} · v{e.instructionVersion}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Règle de sécurité</span>
                    )}
                  </td>
                  <td className="py-3">
                    <FollowUpBadge status={e.followUp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">Suivi des patients</h2>
          <p className="text-sm text-muted-foreground">
            Suivi différé, à traiter lorsque vous êtes disponible. Urgences déjà orientées en
            premier.
          </p>
          <ul className="mt-4 space-y-2.5">
            {queue.length === 0 && (
              <li className="rounded-2xl bg-success-soft p-4 text-sm text-success">
                Aucun suivi en attente.
              </li>
            )}
            {queue.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e.id)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{e.patientCode}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(e.timestamp)}
                      </span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{e.summary}</div>
                  </div>
                  <StatusBadge outcome={e.outcome} />
                  <FollowUpBadge status={e.followUp} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <SafetyControls checks={checks} />
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-semibold">Consignes actives — DEMO-001</h2>
        <p className="text-sm text-muted-foreground">
          OFF interdit toute réutilisation par l'assistant. Toute modification crée une nouvelle
          version à valider.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alertSigns.map((s) => (
            <Badge key={s} variant="urgent">
              {s}
            </Badge>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {instructions.map((ins) => (
            <div
              key={ins.id}
              className={`rounded-2xl border p-4 transition-opacity ${ins.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary-deep">
                    {ins.id} · v{ins.version}
                    <Badge variant={ins.active ? "success" : "outline"} className="text-[0.65rem]">
                      {ins.active ? "Active" : "Désactivée"}
                    </Badge>
                    {ins.pendingAction !== undefined && (
                      <Badge variant="warning" className="text-[0.65rem]">
                        Brouillon v{ins.version + 1} à valider
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-1 font-semibold">{ins.situation}</h3>
                </div>
                <Switch
                  checked={ins.active}
                  aria-label={`${ins.active ? "Désactiver" : "Réactiver"} ${ins.situation}`}
                  onCheckedChange={(v) => {
                    if (!v) {
                      setToDisable(ins);
                      return;
                    }
                    setInstructionActive(ins.id, true);
                    toast("Consigne réactivée", { description: ins.situation });
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-foreground">{ins.permittedAction}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Conditions :</span> {ins.applicability}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Validée par le médecin · {formatDateTime(ins.approvedAt)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Activité de la semaine</h2>
          <Badge variant="outline" className="rounded-full">
            Données de test
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Jeu d'essai fictif — ce ne sont pas des statistiques cliniques mesurées.
        </p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyActivity} barSize={22}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Bar dataKey="transmise" name="Transmise" stackId="a" fill="var(--success)" />
              <Bar dataKey="non_couverte" name="Non couverte" stackId="a" fill="var(--warning)" />
              <Bar dataKey="escalade" name="Escalade" stackId="a" fill="var(--escalate)" />
              <Bar
                dataKey="urgence"
                name="Urgence"
                stackId="a"
                fill="var(--urgent)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <EventSheet eventId={selected} onClose={() => setSelected(null)} />

      <AlertDialog open={toDisable !== null} onOpenChange={(o) => !o && setToDisable(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver cette consigne ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDisable?.situation} » ({toDisable?.id} · v{toDisable?.version}) ne sera plus
              utilisée par l'assistant. L'action est enregistrée dans le journal d'audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-urgent text-destructive-foreground hover:bg-urgent/90"
              onClick={() => {
                if (toDisable) {
                  setInstructionActive(toDisable.id, false);
                  toast("Consigne désactivée", { description: toDisable.situation });
                }
                setToDisable(null);
              }}
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SafetyControls({ checks }: { checks: CheckResult[] }) {
  const groups: { key: CheckResult["group"]; title: string }[] = [
    { key: "medical", title: "Sûreté médicale" },
    { key: "access", title: "Sécurité informatique" },
  ];
  return (
    <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Contrôles de sécurité</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Calculés à l'ouverture sur des scénarios fictifs. Les contrôles serveur ne sont pas encore
        mesurés.
      </p>
      <div className="mt-4 space-y-4">
        {groups.map((g) => {
          const list = checks.filter((c) => c.group === g.key);
          const measured = list.filter((c) => c.status !== "non_mesure");
          const ok = measured.filter((c) => c.status === "ok").length;
          return (
            <div key={g.key}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.title}
                </span>
                <span className="font-semibold text-primary-deep">
                  {ok}/{measured.length} réussis
                </span>
              </div>
              <ul className="space-y-1.5">
                {list.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-xs">
                    {c.status === "ok" && (
                      <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                    {c.status === "echec" && (
                      <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-urgent" />
                    )}
                    {c.status === "non_mesure" && (
                      <CircleDashed className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className={c.status === "non_mesure" ? "text-muted-foreground" : ""}>
                      {c.label}
                      {c.status === "non_mesure" && " — Non mesuré"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
