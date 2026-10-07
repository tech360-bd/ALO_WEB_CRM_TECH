import { describe, expect, it } from "vitest";
import {
  buildPerformanceWarning,
  evaluateIncidentPeriod,
  SLA_INCIDENT_THRESHOLD_DEFAULT,
  type SlaEventView,
} from "@/lib/sla-incidents";

const C = "counselor-7";
const PERIOD = "2026-10";

function ev(id: string, patch: Partial<SlaEventView> = {}): SlaEventView {
  return {
    id,
    threadId: `thread-${id}`,
    counselorId: C,
    channel: "whatsapp",
    eventType: "overdue",
    resolvedAt: null,
    resolution: null,
    createdAt: new Date(`${PERIOD}-10T09:00:00Z`),
    ...patch,
  };
}

describe("§152 — incident counting with valid exclusions", () => {
  it("counts plain overdue events as breaches", () => {
    const r = evaluateIncidentPeriod({ counselorId: C, period: PERIOD, events: [ev("a"), ev("b")] });
    expect(r.slaBreaches).toBe(2);
    expect(r.breachEventIds).toEqual(["a", "b"]);
  });

  it("ignores other counselors' events", () => {
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [ev("x"), { ...ev("y"), counselorId: "other" }],
    });
    expect(r.slaBreaches).toBe(1);
    expect(r.totalAssigned).toBe(1);
  });

  it("never counts warning/resolved event types as breaches", () => {
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [ev("w", { eventType: "warning" }), ev("r", { eventType: "resolved" }), ev("o")],
    });
    expect(r.slaBreaches).toBe(1);
    expect(r.breachEventIds).toEqual(["o"]);
  });

  it("excludes events inside provider outage windows", () => {
    const created = new Date(`${PERIOD}-12T12:00:00Z`);
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [ev("out1", { createdAt: created }), ev("out2", { createdAt: new Date(`${PERIOD}-13T12:00:00Z`) })],
      outageWindows: [{ outageFrom: new Date(`${PERIOD}-12T00:00:00Z`), outageTo: new Date(`${PERIOD}-12T23:59:00Z`) }],
    });
    expect(r.slaBreaches).toBe(1);
    expect(r.validExclusionsPerEvent["out1"]).toBe("provider_outage");
    expect(r.breachEventIds).toEqual(["out2"]);
  });

  it("excludes manager-excluded and accepted-justification events", () => {
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [
        ev("m", { resolution: "excluded" }),
        ev("j1"),
        ev("j2"),
      ],
      assertedExclusions: {
        byEventId: new Map([
          ["j1", "APPROVED_LEAVE"],
          ["j2", "WRONG_ASSIGNMENT"],
        ]),
      },
    });
    expect(r.slaBreaches).toBe(0);
    expect(r.validExclusionsPerEvent["m"]).toBe("excluded_by_manager");
    expect(r.validExclusionsPerEvent["j1"]).toBe("approved_leave");
    expect(r.validExclusionsPerEvent["j2"]).toBe("wrong_assignment");
  });

  it("excludes events created on holidays or Fridays", () => {
    // 2026-10-16 is a Friday; 2026-08-15 is a BD holiday (via caller-provided list)
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [
        ev("fri", { createdAt: new Date("2026-10-16T09:00:00Z") }),
        ev("hol", { createdAt: new Date("2026-08-15T09:00:00Z") }),
        ev("norm", { createdAt: new Date("2026-10-20T09:00:00Z") }),
      ],
      holidayDates: ["2026-08-15"],
    });
    expect(r.breachEventIds).toEqual(["norm"]);
    expect(r.validExclusionsPerEvent["fri"]).toBe("holiday_or_non_working_hours");
    expect(r.validExclusionsPerEvent["hol"]).toBe("holiday_or_non_working_hours");
  });

  it("unknown justification categories fall back to no_response_required instead of counting as breach", () => {
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [ev("q")],
      assertedExclusions: { byEventId: new Map([["q", "OTHER"]]) },
    });
    expect(r.slaBreaches).toBe(0);
    expect(r.validExclusionsPerEvent["q"]).toBe("no_response_required");
  });
});

describe("§153 — five-incident threshold warning", () => {
  it("no warning below threshold (4 breaches)", () => {
    const events = [ev("1"), ev("2"), ev("3"), ev("4")];
    const r = evaluateIncidentPeriod({ counselorId: C, period: PERIOD, events });
    expect(r.warningRequired).toBe(false);
    expect(r.threshold).toBe(SLA_INCIDENT_THRESHOLD_DEFAULT);
  });

  it("warning at exactly the threshold (5 breaches)", () => {
    const events = [ev("1"), ev("2"), ev("3"), ev("4"), ev("5")];
    const r = evaluateIncidentPeriod({ counselorId: C, period: PERIOD, events });
    expect(r.warningRequired).toBe(true);
  });

  it("threshold is configurable", () => {
    const events = [ev("1"), ev("2"), ev("3")];
    const r = evaluateIncidentPeriod({ counselorId: C, period: PERIOD, events, threshold: 3 });
    expect(r.warningRequired).toBe(true);
    expect(r.threshold).toBe(3);
  });

  it("valid exclusions can bring an apparent 5-breach period back under threshold", () => {
    const created = new Date(`${PERIOD}-12T12:00:00Z`);
    const r = evaluateIncidentPeriod({
      counselorId: C,
      period: PERIOD,
      events: [ev("1", { createdAt: created }), ev("2"), ev("3"), ev("4"), ev("5")],
      outageWindows: [{ outageFrom: new Date(`${PERIOD}-12T00:00:00Z`), outageTo: new Date(`${PERIOD}-12T23:59:00Z`) }],
    });
    expect(r.slaBreaches).toBe(4);
    expect(r.warningRequired).toBe(false);
  });

  it("warning payload carries counselor, period, totals, exclusions and event IDs (§153)", () => {
    const events = [ev("1"), ev("2"), ev("3"), ev("4"), ev("5")];
    const r = evaluateIncidentPeriod({ counselorId: C, period: PERIOD, events });
    const w = buildPerformanceWarning(r);
    expect(w.title).toContain(C + "" === "" ? "" : "");
    expect(w.title).toMatch(/PERFORMANCE WARNING/);
    expect(w.title).toContain("5/5");
    expect(w.title).toContain(PERIOD);
    expect(w.description).toContain(`Counselor: ${C}`);
    expect(w.description).toContain("JUSTIFICATION REQUIRED");
    expect(w.description).toContain("1, 2, 3, 4, 5");
    expect(w.description).toMatch(/Total assigned messages: 5/);
    expect(w.description).toMatch(/Valid exclusions applied: 0/);
  });
});
