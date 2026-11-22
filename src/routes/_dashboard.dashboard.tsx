import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileAudio,
  HelpCircle,
  MessagesSquare,
  PhoneForwarded,
  Search,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EventSheet } from "@/components/dashboard/EventSheet";
import { FollowUpBadge, OUTCOME_META, StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCareStore } from "@/lib/care-store";
import type { Outcome } from "@/lib/care-types";
import { weeklyActivity } from "@/lib/seed-data";
import { followUpQueue } from "@/lib/events";
import { formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — 3awedhni عوضني" },
      {
        name: "description",
        content: "Demandes reçues pendant votre absence, patients à rappeler et activité de la semaine.",
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
  const { events } = useCareStore();
  const [filter, setFilter] = useState<Outcome | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const tableRef = useRef<HTMLElement>(null);

  const queue = followUpQueue(events);
  const urgent = queue.find((e) => e.outcome === "urgence");

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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="soft">
            <Link to="/assistant-patient">
              <MessagesSquare /> Ouvrir l'assistant patient
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
          <div className="min-w-[12rem] flex-1">
            <p className="font-semibold text-urgent">
              Urgence potentielle signalée — orientation urgente transmise au patient.
            </p>
            <p className="text-sm text-foreground">
              {urgent.patientCode} · {formatTime(urgent.timestamp)} · {urgent.summary}. Vérifiez les
              suites données lorsque vous êtes disponible.
            </p>
          </div>
          <Button
            variant="urgent"
            className="w-full sm:w-auto"
            onClick={() => setSelected(urgent.id)}
          >
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

      <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-semibold">Suivi des patients</h2>
        <p className="text-sm text-muted-foreground">
          Suivi différé, à traiter lorsque vous êtes disponible. Urgences déjà orientées en
          premier.
        </p>
        <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
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

      <section className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-semibold">Activité de la semaine</h2>
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
    </div>
  );
}
