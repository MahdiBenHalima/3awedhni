export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Physician names are never displayed; the identity stays in the protected audit data. */
export function displayActor(actor: string) {
  return /^Dr\.?\s/i.test(actor) ? "Doctor" : actor;
}
