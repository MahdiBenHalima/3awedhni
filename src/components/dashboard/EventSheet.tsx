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
    toast.success(`Follow-up updated for ${event.patientCode}`);
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
                  {formatDateTime(event.timestamp)}
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
                      Emergency orientation delivered to the patient at the time of exchange. This
                      follow-up is deferred: review outcome when available.
                    </p>
                  </div>
                )}

                <Block title="Original message">
                  <p dir="auto" className="rounded-2xl bg-chat-out px-3 py-2 text-sm">
                    {event.message}
                  </p>
                </Block>

                <Block title="Interpretation (extraction + rules)">
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

                <Block title="Exact response sent">
                  <p dir="auto" className="rounded-2xl bg-muted px-3 py-2 text-sm leading-relaxed">
                    {event.reply}
                  </p>
                </Block>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Block title="Cited instruction">
                    {event.instructionId ? (
                      <Badge variant="soft">
                        {event.instructionId} · v{event.instructionVersion}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No instruction cited</span>
                    )}
                  </Block>
                  <Block title="Safety rule">
                    <p className="flex gap-1.5 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {event.safetyRule}
                    </p>
                  </Block>
                </div>

                <Block title="Deferred follow-up">
                  {event.followUp === "aucun" ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-sm">
                      <span className="text-muted-foreground">
                        Instruction delivered: no follow-up required.
                      </span>
                      <Button size="sm" variant="soft" onClick={() => update("a_examiner")}>
                        Add to follow-up
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="hero"
                        className="col-span-2"
                        onClick={() => setPrepOpen(true)}
                      >
                        <ClipboardList /> Prepare Callback
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        disabled={event.followUp === "contact_tente"}
                        onClick={() => update("contact_tente")}
                      >
                        <PhoneOff /> Contact Attempted
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        disabled={event.followUp === "recontacte"}
                        onClick={() => update("recontacte")}
                      >
                        <UserCheck /> Patient Reached
                      </Button>
                      <Button
                        variant="ghost"
                        className="col-span-2 text-success hover:bg-success-soft hover:text-success"
                        disabled={event.followUp === "termine"}
                        onClick={() => update("termine")}
                      >
                        <CheckCircle2 /> Follow-up Completed
                      </Button>
                    </div>
                  )}
                </Block>

                {consultation && (
                  <div className="rounded-2xl border bg-muted/40 p-4 text-xs text-muted-foreground">
                    <div className="font-semibold text-ink">
                      Associated record: {consultation.patientLabel}
                    </div>
                    <div className="mt-1">
                      {consultation.diagnosis} · Consulted on{" "}
                      {formatDateTime(consultation.consultedAt)}
                    </div>
                    <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
                      <Link to="/consultations">View validated instructions</Link>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Prepare Callback Dialog */}
      <Dialog open={prepOpen} onOpenChange={setPrepOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prepare Patient Callback</DialogTitle>
            <DialogDescription>
              Structured clinical summary before calling the patient or their legal guardian.
            </DialogDescription>
          </DialogHeader>
          {event && (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-muted p-3">
                <span className="font-semibold">Patient:</span> {event.patientCode} ·{" "}
                {consultation?.verifiedContactMasked ?? "Verified contact"}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Key clinical elements
                </div>
                <ul className="list-inside list-disc text-xs space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Diagnosis:</strong>{" "}
                    {consultation?.diagnosis ?? "Pediatric consultation"}
                  </li>
                  <li>
                    <strong className="text-foreground">Applicable instruction:</strong>{" "}
                    {event.instructionId ? `${event.instructionId}` : "None"}
                  </li>
                  <li>
                    <strong className="text-foreground">Safety trigger:</strong> {event.safetyRule}
                  </li>
                  <li>
                    <strong className="text-foreground">Patient summary:</strong> {event.summary}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-primary-soft p-3 text-xs text-primary-deep">
                <strong>Suggested opening:</strong> « Bonjour, c'est le Dr Ben Youssef. J'ai vu le
                message concernant votre enfant et je souhaitais faire le point avec vous. »
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="hero"
              onClick={() => {
                update("recontacte");
                setPrepOpen(false);
                toast.success("Callback logged — patient marked as reached");
              }}
            >
              <PhoneCall /> Call Patient Now
            </Button>
            <Button variant="ghost" onClick={() => setPrepOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
