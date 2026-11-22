import { describe, expect, it } from "vitest";

import { initialEvents } from "./demo-data";
import { followUpQueue, initialFollowUp } from "./events";
import { runSafetyChecks } from "./safety-checks";

describe("deferred follow-up", () => {
  it("a transmitted instruction never creates a mandatory follow-up", () => {
    expect(initialFollowUp("transmise")).toBe("aucun");
    expect(initialFollowUp("urgence")).toBe("a_examiner");
  });

  it("orders urgent first, then escalations, then uncovered requests", () => {
    const base = initialEvents[0]!;
    const mk = (id: string, outcome: typeof base.outcome, ts: string) => ({
      ...base,
      id,
      outcome,
      timestamp: ts,
      followUp: "a_examiner" as const,
    });
    const queue = followUpQueue([
      mk("nc", "non_couverte", "2026-11-21T23:00:00"),
      mk("esc", "escalade", "2026-11-21T22:00:00"),
      mk("urg", "urgence", "2026-11-21T08:00:00"),
    ]);
    expect(queue.map((e) => e.id)).toEqual(["urg", "esc", "nc"]);
  });

  it("finished follow-ups leave the queue", () => {
    const done = { ...initialEvents[0]!, followUp: "termine" as const };
    expect(followUpQueue([done])).toHaveLength(0);
  });
});

describe("safety controls panel", () => {
  it("every measured check passes and server checks are reported as not measured", () => {
    const results = runSafetyChecks();
    expect(results.filter((r) => r.status === "echec")).toEqual([]);
    expect(results.some((r) => r.status === "non_mesure")).toBe(true);
  });
});
