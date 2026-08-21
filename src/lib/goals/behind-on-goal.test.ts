import { describe, expect, it } from "vitest";
import { evaluateBehindOnGoal } from "./behind-on-goal";

const base = {
  remainingAmount: 1000,
  incomeExpectedBeforeDeadline: 10000,
  contributionsInWindow: 100,
  incomeLoggedInWindow: 1000,
  goalAgeDays: 30,
  isPastDeadline: false,
};

describe("evaluateBehindOnGoal", () => {
  it("is funded when nothing remains", () => {
    expect(evaluateBehindOnGoal({ ...base, remainingAmount: 0 })).toEqual({ status: "funded" });
    expect(evaluateBehindOnGoal({ ...base, remainingAmount: -50 })).toEqual({ status: "funded" });
  });

  it("is overdue when the deadline has passed and the goal isn't funded", () => {
    expect(evaluateBehindOnGoal({ ...base, isPastDeadline: true })).toEqual({ status: "overdue" });
  });

  it("is too_new for goals younger than 7 days, even at 0% pace", () => {
    expect(evaluateBehindOnGoal({ ...base, goalAgeDays: 3, contributionsInWindow: 0 })).toEqual({
      status: "too_new",
    });
  });

  it("is insufficient_data when no income has been logged in the window", () => {
    expect(evaluateBehindOnGoal({ ...base, incomeLoggedInWindow: 0 })).toEqual({ status: "insufficient_data" });
  });

  it("is on_pace when actual rate meets the required rate", () => {
    // required = 1000/10000 = 0.1; actual = 100/1000 = 0.1
    const result = evaluateBehindOnGoal(base);
    expect(result.status).toBe("on_pace");
  });

  it("is on_pace within the 10% tolerance band", () => {
    // required = 0.1; actual = 0.091 -> ratio 0.91, still >= 0.9 threshold
    const result = evaluateBehindOnGoal({ ...base, contributionsInWindow: 91 });
    expect(result.status).toBe("on_pace");
  });

  it("is behind when actual rate falls below 90% of required rate", () => {
    // required = 0.1; actual = 0.05 -> ratio 0.5, well below threshold
    const result = evaluateBehindOnGoal({ ...base, contributionsInWindow: 50 });
    expect(result.status).toBe("behind");
    if (result.status === "behind") {
      expect(result.requiredRate).toBeCloseTo(0.1);
      expect(result.actualRate).toBeCloseTo(0.05);
    }
  });

  it("is behind at exactly the boundary going one cent under", () => {
    // required*0.9 = 0.09 exactly; actual just under it
    const result = evaluateBehindOnGoal({ ...base, contributionsInWindow: 89.9 });
    expect(result.status).toBe("behind");
  });
});
