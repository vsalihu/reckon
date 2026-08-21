import { describe, expect, it } from "vitest";
import { evaluateGoals } from "./evaluate-goals";

describe("evaluateGoals", () => {
  const now = new Date("2025-07-01");

  it("marks a well-funded, on-pace goal as on_pace", () => {
    const [status] = evaluateGoals({
      now,
      annualGrossTarget: 36_500, // £100/day for easy math
      goals: [{ id: "g1", target_amount: 2000, deadline: "2026-01-01", created_at: "2025-01-01" }],
      contributions: [
        { goal_id: "g1", amount: 900, contributed_at: "2025-06-15" }, // within trailing 90d window
      ],
      incomeEntries: [{ amount: 9000, entry_date: "2025-06-15" }],
    });

    expect(status.contributedTotal).toBe(900);
    expect(status.result.status).toBe("on_pace");
  });

  it("marks a goal as behind when contributions lag income", () => {
    const [status] = evaluateGoals({
      now,
      annualGrossTarget: 36_500,
      goals: [{ id: "g1", target_amount: 10_000, deadline: "2026-01-01", created_at: "2025-01-01" }],
      contributions: [{ goal_id: "g1", amount: 10, contributed_at: "2025-06-15" }],
      incomeEntries: [{ amount: 9000, entry_date: "2025-06-15" }],
    });

    expect(status.result.status).toBe("behind");
  });

  it("ignores contributions/income logged to a different goal or outside the window", () => {
    const [status] = evaluateGoals({
      now,
      annualGrossTarget: 36_500,
      goals: [{ id: "g1", target_amount: 20_000, deadline: "2026-01-01", created_at: "2025-01-01" }],
      contributions: [
        { goal_id: "g2", amount: 5000, contributed_at: "2025-06-15" }, // different goal
        { goal_id: "g1", amount: 5000, contributed_at: "2025-01-05" }, // outside 90d window but still in contributedTotal
      ],
      incomeEntries: [{ amount: 9000, entry_date: "2025-06-15" }],
    });

    // contributedTotal includes all-time contributions to g1, regardless of window
    expect(status.contributedTotal).toBe(5000);
    // but the pace check only sees what's within the trailing window -> 0 contributions in window -> behind
    expect(status.result.status).toBe("behind");
  });

  it("reports funded once contributions meet the target", () => {
    const [status] = evaluateGoals({
      now,
      annualGrossTarget: 36_500,
      goals: [{ id: "g1", target_amount: 1000, deadline: "2026-01-01", created_at: "2025-01-01" }],
      contributions: [{ goal_id: "g1", amount: 1000, contributed_at: "2025-06-15" }],
      incomeEntries: [{ amount: 9000, entry_date: "2025-06-15" }],
    });

    expect(status.result.status).toBe("funded");
  });
});
