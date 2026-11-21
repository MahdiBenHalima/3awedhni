import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileAudio,
  HelpCircle,
  MessagesSquare,
  Phone,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { OUTCOME_META, StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useCareStore } from "@/lib/care-store";
import type { Outcome } from "@/lib/care-types";
import { alertSigns, benchmark, DOCTOR, weeklyActivity } from "@/lib/demo-data";
import { formatDateTime, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — 3awedhni عوضني" },
      {
        name: "description",
        content: "Suivi des échanges patients, alertes et consignes validées.",
      },
      { property: "og:title", content: "Tableau de bord — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Interactions, escalades et urgences potentielles en un coup d'œil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

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

function DashboardPage() {
  const { events, instructions, setInstructionActive, markCalledBack } = useCareStore();
  const urgent = events.find((e) => e.outcome === "urgence" && e.needsCallback);
  const callbacks = events.filter((e) => e.needsCallback);
  const counts = (["transmise", "non_couverte", "escalade", "urgence"] as Outcome[]).map((o) => ({
    outcome: o,
    count: events.filter((e) => e.outcome === o).length,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Samedi 21 novembre 2026</span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Bonjour, <span className="text-gradient-primary">{DOCTOR.name}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Voici ce que vos patients ont demandé depuis vos consultations.
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
              Urgence potentielle · {urgent.patientCode} · {formatTime(urgent.timestamp)}
            </p>
            <p className="text-sm text-foreground">
              « {urgent.message} » — orienté immédiatement vers les urgences. {urgent.summary}.
            </p>
          </div>
          <Button
            variant="urgent"
            onClick={() => {
              markCalledBack(urgent.id);
              toast.success(`Rappel de ${urgent.patientCode} enregistré`);
            }}
          >
            <Phone /> Marquer comme rappelé
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {counts.map(({ outcome, count }) => {
          const Icon = STAT_ICONS[outcome];
          return (
            <div key={outcome} className="rounded-2xl bg-card p-5 shadow-soft">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_TONE[outcome]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-ink">{count}</div>
              <div className="text-sm text-muted-foreground">{OUTCOME_META[outcome].label}</div>
            </div>
          );
        })}
        <div className="col-span-2 rounded-2xl bg-gradient-deep p-5 text-primary-foreground shadow-glow lg:col-span-1">
          <ShieldCheck className="h-6 w-6" />
          <div className="mt-4 font-display text-3xl font-bold">
            {instructions.filter((i) => i.active).length}/{instructions.length}
          </div>
          <div className="text-sm opacity-90">Consignes actives validées</div>
        </div>
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Patients ayant contacté l'assistant</h2>
            <p className="text-sm text-muted-foreground">
              Motif résumé, état et consigne communiquée
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/journal">
              Tout voir <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Heure</th>
                <th className="pb-3 font-semibold">Motif résumé</th>
                <th className="pb-3 font-semibold">État</th>
                <th className="pb-3 font-semibold">Dernière consigne</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((e) => {
                const ins = instructions.find((i) => i.id === e.instructionId);
                return (
                  <tr key={e.id} className="border-t align-top">
                    <td className="py-3 pr-3">
                      <div className="whitespace-nowrap font-semibold text-ink">
                        {e.patientCode}
                      </div>
                      <Badge variant="soft" className="mt-1 text-[0.65rem]">
                        {e.language}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{formatTime(e.timestamp)}</td>
                    <td className="max-w-[22rem] py-3 pr-3">
                      <div className="font-medium">{e.summary}</div>
                      <div className="truncate text-xs text-muted-foreground" dir="auto">
                        « {e.message} »
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge outcome={e.outcome} />
                    </td>
                    <td className="py-3 text-xs">
                      {ins ? (
                        <>
                          <div className="font-semibold text-primary-deep">
                            {ins.id} · v{e.instructionVersion}
                          </div>
                          <div className="text-muted-foreground">
                            Validée le {formatDateTime(ins.approvedAt)}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Aucune — orientation</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">Activité de la semaine</h2>
          <p className="text-sm text-muted-foreground">Répartition des échanges par état</p>
          <div className="mt-4 h-64">
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

        <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold">Rappels à effectuer</h2>
          <p className="text-sm text-muted-foreground">Interactions nécessitant un contact</p>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            {callbacks.length === 0 && (
              <li className="rounded-2xl bg-success-soft p-4 text-sm text-success">
                Aucun rappel en attente.
              </li>
            )}
            {callbacks.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{e.patientCode}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(e.timestamp)}</span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge outcome={e.outcome} />
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="soft"
                  aria-label={`Rappeler ${e.patientCode}`}
                  onClick={() => {
                    markCalledBack(e.id);
                    toast.success(`Rappel de ${e.patientCode} enregistré`);
                  }}
                >
                  <Phone />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold">Sécurité du prototype</h2>
          <p className="text-sm text-muted-foreground">Benchmark sur scénarios fictifs</p>
          <div className="mt-4 space-y-4">
            {benchmark.map((b) => (
              <div key={b.label}>
                <div className="mb-1.5 flex justify-between gap-2 text-xs">
                  <span className="text-foreground">{b.label}</span>
                  <span className="font-semibold text-primary-deep">{b.value}%</span>
                </div>
                <Progress value={b.value} className="h-2 bg-primary-soft" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-success-soft p-3 text-center">
                <div className="font-display text-2xl font-bold text-success">0</div>
                <div className="text-[0.7rem] text-success">faux négatif d'alerte</div>
              </div>
              <div className="rounded-2xl bg-success-soft p-3 text-center">
                <div className="font-display text-2xl font-bold text-success">0</div>
                <div className="text-[0.7rem] text-success">accès croisé autorisé</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Consignes actives — DEMO-001</h2>
              <p className="text-sm text-muted-foreground">
                Désactivez immédiatement une consigne erronée : l'assistant ne l'utilisera plus.
              </p>
            </div>
          </div>
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
                className={`rounded-2xl border p-4 transition-opacity ${ins.active ? "" : "opacity-55"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-primary-deep">
                      {ins.id} · v{ins.version}
                    </div>
                    <h3 className="mt-0.5 font-semibold">{ins.situation}</h3>
                  </div>
                  <Switch
                    checked={ins.active}
                    aria-label={`Activer ${ins.situation}`}
                    onCheckedChange={(v) => {
                      setInstructionActive(ins.id, v);
                      toast(v ? "Consigne réactivée" : "Consigne désactivée", {
                        description: ins.situation,
                      });
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ins.permittedAction}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Validée par {ins.approvedBy} · {formatDateTime(ins.approvedAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
