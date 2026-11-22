import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { FollowUpBadge, StatusBadge } from "@/components/dashboard/StatusBadge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCareStore } from "@/lib/care-store";
import type { FollowUpStatus } from "@/lib/care-types";
import { formatDateTime } from "@/lib/format";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

export function EventSheet({ eventId, onClose }: { eventId: string | null; onClose: () => void }) {
  const { events, consultations, setFollowUp } = useCareStore();
  const [prepOpen, setPrepOpen] = useState(false);
  const event = events.find((e) => e.id === eventId) ?? null;
  const consultation = event ? consultations.find((c) => c.id === event.consultationId) : undefined;

  function update(status: FollowUpStatus) {
    if (!event) return;
    setFollowUp(event.id, status);
    toast.success(`Suivi mis à jour pour ${event.patientCode}`);
  }

  return (
    <>
      <Sheet open={event !== null} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {event && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 font-display text-xl">
                  {event.patientCode}
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {event.id}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(event.timestamp)} · {event.language}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  <StatusBadge outcome={event.outcome} />
                  <FollowUpBadge status={event.followUp} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {event.outcome === "urgence" && (
                  <div className="flex gap-3 rounded-2xl border border-urgent/25 bg-urgent-soft p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-urgent" />
                    <p>
                      Orientation urgente transmise au patient au moment de l'échange. Ce suivi est
                      différé : vérifiez les suites données lorsque vous êtes disponible.
                    </p>
                  </div>
                )}

                <Block title="Message original">
                  <p dir="auto" className="rounded-2xl bg-chat-out px-3 py-2 text-sm">
                    {event.message}
                  </p>
                </Block>

                <Block title="Interprétation (extraction + règles)">
                  <ol className="space-y-1.5">
                    {event.trace.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[0.65rem] font-bold text-primary-deep">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </Block>

                <Block title="Réponse exacte envoyée">
                  <p dir="auto" className="rounded-2xl bg-muted px-3 py-2 text-sm leading-relaxed">
                    {event.reply}
                  </p>
                </Block>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Block title="Consigne citée">
                    {event.instructionId ? (
                      <Badge variant="soft">
                        {event.instructionId} · v{event.instructionVersion}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Aucune consigne citée</span>
                    )}
                  </Block>
                  <Block title="Règle de sécurité">
                    <p className="flex gap-1.5 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {event.safetyRule}
                    </p>
                  </Block>
                </div>

                <Block title="Suivi différé">
                  {event.followUp === "aucun" ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-sm">
                      <span className="text-muted-foreground">
                        Consigne transmise : aucun suivi requis.
                      </span>
                      <Button size="sm" variant="soft" onClick={() => update("a_examiner")}>
                        Ajouter au suivi
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="hero"
                        className="col-span-2"
                        onClick={() => setPrepOpen(true)}
                      >
                        <ClipboardList /> Préparer un rappel
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        disabled={event.followUp === "contact_tente"}
                        onClick={() => update("contact_tente")}
                      >
                        <PhoneOff /> Contact tenté
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        disabled={event.followUp === "recontacte"}
                        onClick={() => update("recontacte")}
                      >
                        <UserCheck /> Patient recontacté
                      </Button>
                      <Button
                        variant="soft"
                        className="col-span-2"
                        disabled={event.followUp === "termine"}
                        onClick={() => update("termine")}
                      >
                        <CheckCircle2 /> Suivi terminé
                      </Button>
                    </div>
                  )}
                </Block>

                <Button asChild variant="link" className="px-0">
                  <Link to="/journal">Voir l'historique complet</Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={prepOpen && event !== null} onOpenChange={setPrepOpen}>
        <DialogContent className="rounded-3xl">
          {event && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Préparer un rappel · {event.patientCode}
                </DialogTitle>
                <DialogDescription>
                  Aucune intégration téléphonique n'est connectée : l'appel n'est pas passé par
                  l'application. Appelez depuis votre téléphone, puis enregistrez le résultat.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Dossier autorisé</div>
                  <div className="font-semibold text-ink">
                    {consultation?.patientLabel} · {consultation?.diagnosis}
                  </div>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Canal de contact vérifié</div>
                  <div className="flex items-center gap-2 font-mono font-semibold text-ink">
                    <PhoneCall className="h-4 w-4 text-primary" />
                    {consultation?.verifiedContactMasked}
                  </div>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Motif à aborder</div>
                  <div className="text-ink">{event.summary}</div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    update("contact_tente");
                    setPrepOpen(false);
                  }}
                >
                  Contact tenté
                </Button>
                <Button
                  variant="hero"
                  onClick={() => {
                    update("recontacte");
                    setPrepOpen(false);
                  }}
                >
                  Patient recontacté
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
