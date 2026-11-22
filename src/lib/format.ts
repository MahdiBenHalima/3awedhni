export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Physician names are never displayed; the identity stays in the protected audit data. */
export function displayActor(actor: string) {
  return /^Dr\.?\s/i.test(actor) ? "Médecin" : actor;
}
