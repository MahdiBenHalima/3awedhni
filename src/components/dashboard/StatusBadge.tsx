import { AlertTriangle, CheckCircle2, HelpCircle, PhoneForwarded } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FollowUpStatus, Outcome } from "@/lib/care-types";
import { FOLLOW_UP_LABELS } from "@/lib/events";

export const OUTCOME_META: Record<
  Outcome,
  {
    label: string;
    variant: "success" | "warning" | "escalate" | "urgent";
    icon: typeof CheckCircle2;
  }
> = {
  transmise: { label: "Consigne transmise", variant: "success", icon: CheckCircle2 },
  non_couverte: { label: "Non couverte", variant: "warning", icon: HelpCircle },
  escalade: { label: "Escalade", variant: "escalate", icon: PhoneForwarded },
  urgence: { label: "Urgence potentielle", variant: "urgent", icon: AlertTriangle },
};

export function StatusBadge({ outcome }: { outcome: Outcome }) {
  const meta = OUTCOME_META[outcome];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className="gap-1 whitespace-nowrap">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

const FOLLOW_UP_VARIANT: Record<
  FollowUpStatus,
  "soft" | "warning" | "escalate" | "success" | "outline"
> = {
  aucun: "outline",
  a_examiner: "warning",
  contact_tente: "escalate",
  recontacte: "soft",
  termine: "success",
};

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  return (
    <Badge
      variant={FOLLOW_UP_VARIANT[status]}
      className="whitespace-nowrap rounded-full font-medium"
    >
      {FOLLOW_UP_LABELS[status]}
    </Badge>
  );
}
