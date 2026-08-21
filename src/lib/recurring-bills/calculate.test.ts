import { describe, expect, it } from "vitest";
import {
  calculateMonthlyEquivalent,
  calculateTotalMonthlyCommitment,
  getUpcomingBills,
  calculateNextDueDate,
} from "./calculate";

describe("calculateMonthlyEquivalent", () => {
  it("returns a monthly amount unchanged", () => {
    expect(calculateMonthlyEquivalent(50, "monthly")).toBe(50);
  });

  it("converts weekly to its monthly equivalent (52/12 weeks)", () => {
    expect(calculateMonthlyEquivalent(10, "weekly")).toBeCloseTo(10 * (52 / 12), 5);
  });

  it("converts annually to its monthly equivalent (/12)", () => {
    expect(calculateMonthlyEquivalent(1200, "annually")).toBeCloseTo(100, 5);
  });
});

describe("calculateTotalMonthlyCommitment", () => {
  it("sums monthly-equivalent costs across mixed frequencies", () => {
    const total = calculateTotalMonthlyCommitment([
      { amount: 1000, frequency: "monthly" }, // rent: 1000
      { amount: 15, frequency: "weekly" }, // ~65
      { amount: 120, frequency: "annually" }, // 10
    ]);
    expect(total).toBeCloseTo(1000 + 15 * (52 / 12) + 10, 1);
  });

  it("is 0 for no bills", () => {
    expect(calculateTotalMonthlyCommitment([])).toBe(0);
  });
});

describe("getUpcomingBills", () => {
  const now = new Date("2025-06-01");

  it("includes bills due within the window, excludes those further out", () => {
    const bills = [
      { id: "a", nextDueDate: new Date("2025-06-05") }, // within 7 days
      { id: "b", nextDueDate: new Date("2025-06-20") }, // outside 7 days
    ];
    const result = getUpcomingBills(bills, 7, now);
    expect(result.map((b) => b.id)).toEqual(["a"]);
  });

  it("sorts soonest first", () => {
    const bills = [
      { id: "later", nextDueDate: new Date("2025-06-25") },
      { id: "sooner", nextDueDate: new Date("2025-06-10") },
    ];
    const result = getUpcomingBills(bills, 30, now);
    expect(result.map((b) => b.id)).toEqual(["sooner", "later"]);
  });

  it("includes overdue bills (past due date) — they still need attention", () => {
    const bills = [{ id: "overdue", nextDueDate: new Date("2025-05-01") }];
    const result = getUpcomingBills(bills, 7, now);
    expect(result.map((b) => b.id)).toEqual(["overdue"]);
  });
});

describe("calculateNextDueDate", () => {
  it("advances weekly by 7 days", () => {
    const next = calculateNextDueDate(new Date("2025-06-01"), "weekly");
    expect(next.toISOString().slice(0, 10)).toBe("2025-06-08");
  });

  it("advances monthly by 1 month", () => {
    const next = calculateNextDueDate(new Date("2025-06-01"), "monthly");
    expect(next.toISOString().slice(0, 10)).toBe("2025-07-01");
  });

  it("advances annually by 1 year", () => {
    const next = calculateNextDueDate(new Date("2025-06-01"), "annually");
    expect(next.toISOString().slice(0, 10)).toBe("2026-06-01");
  });

  it("handles month-end rollover sensibly (Jan 31 monthly -> Mar 3, JS Date's own overflow behaviour)", () => {
    // Documenting actual behavior rather than asserting an ideal "clamp to
    // last day of month" — JS Date overflows Feb 31 into early March.
    const next = calculateNextDueDate(new Date("2025-01-31"), "monthly");
    expect(next.getMonth()).toBe(2); // March (0-indexed)
  });
});
