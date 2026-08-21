import { describe, expect, it } from "vitest";
import { calculateRoundUp } from "./round-up";

describe("calculateRoundUp", () => {
  it("rounds up to the nearest whole unit", () => {
    expect(calculateRoundUp(4.6)).toBeCloseTo(0.4, 2);
    expect(calculateRoundUp(0.01)).toBeCloseTo(0.99, 2);
  });

  it("is 0 for an amount already a whole unit", () => {
    expect(calculateRoundUp(5)).toBe(0);
    expect(calculateRoundUp(0)).toBe(0);
  });

  it("handles floating-point-prone amounts cleanly", () => {
    expect(calculateRoundUp(19.99)).toBeCloseTo(0.01, 2);
  });

  it("is 0 for a non-positive amount", () => {
    expect(calculateRoundUp(-5)).toBe(0);
  });
});
