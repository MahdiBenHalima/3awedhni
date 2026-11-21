import { AlertTriangle, CheckCircle2, HelpCircle, PhoneForwarded } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Outcome } from "@/lib/care-types";

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
