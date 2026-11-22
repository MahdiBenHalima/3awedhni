import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { History, MessageSquareText } from "lucide-react";

import { OUTCOME_META, StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCareStore } from "@/lib/care-store";
import type { Outcome } from "@/lib/care-types";
import { displayActor, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/journal")({
  head: () => ({
    meta: [
      { title: "Journal d'audit — 3awedhni عوضني" },
      {
        name: "description",
        content: "Historique des interactions patients et journal d'audit des actions.",
      },
      { property: "og:title", content: "Journal d'audit — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Chaque réponse, sa source et sa décision de sécurité, tracées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

const FILTERS: (Outcome | "all")[] = ["all", "transmise", "non_couverte", "escalade", "urgence"];

function JournalPage() {
  const { events, audit } = useCareStore();
  const [filter, setFilter] = useState<Outcome | "all">("all");
  const shown = filter === "all" ? events : events.filter((e) => e.outcome === filter);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <span className="eyebrow">Traçabilité</span>
        <h1 className="mt-2 text-3xl font-bold">Journal d'audit</h1>
        <p className="mt-1 text-muted-foreground">
          Données minimisées : seuls le motif résumé et la décision sont conservés.
        </p>
      </div>

      <Tabs defaultValue="interactions">
        <TabsList className="rounded-full bg-card p-1 shadow-soft">
          <TabsTrigger
            value="interactions"
            className="gap-1.5 rounded-full data-[state=active]:bg-primary-soft data-[state=active]:text-primary-deep"
          >
            <MessageSquareText className="h-4 w-4" /> Interactions
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="gap-1.5 rounded-full data-[state=active]:bg-primary-soft data-[state=active]:text-primary-deep"
          >
            <History className="h-4 w-4" /> Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactions" className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? "border-primary bg-primary-soft font-semibold text-primary-deep"
                    : "bg-card hover:border-primary/50"
                }`}
              >
                {f === "all" ? "Tous" : OUTCOME_META[f].label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {f === "all" ? events.length : events.filter((e) => e.outcome === f).length}
                </span>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-3xl bg-card p-5 shadow-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-semibold">Événement</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Patient</th>
                  <th className="pb-3 font-semibold">Message</th>
                  <th className="pb-3 font-semibold">Décision</th>
                  <th className="pb-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className="border-t align-top">
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">{formatDateTime(e.timestamp)}</td>
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-ink">{e.patientCode}</div>
                      <Badge variant="soft" className="mt-1 text-[0.65rem]">
                        {e.language}
                      </Badge>
                    </td>
                    <td className="max-w-[18rem] py-3 pr-3">
                      <div dir="auto">« {e.message} »</div>
                      <div className="text-xs text-muted-foreground">{e.summary}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge outcome={e.outcome} />
                    </td>
                    <td className="py-3 text-xs">
                      {e.instructionId ? (
                        <span className="font-semibold text-primary-deep">
                          {e.instructionId} · v{e.instructionVersion}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Règle de sécurité</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-5">
          <ol className="relative space-y-4 rounded-3xl bg-card p-6 shadow-card">
            {audit.map((a) => (
              <li key={a.id} className="flex gap-4">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-primary" />
                <div className="flex-1 border-b pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{a.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(a.timestamp)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {displayActor(a.actor)} ·{" "}
                    <span className="font-mono text-xs">{a.resource}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}
