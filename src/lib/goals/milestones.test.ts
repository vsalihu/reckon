import { describe, expect, it } from "vitest";
import { findNewlyCrossedMilestones } from "./milestones";

describe("findNewlyCrossedMilestones", () => {
  it("returns nothing below the first threshold", () => {
    expect(findNewlyCrossedMilestones(10, 100, [])).toEqual([]);
  });

  it("returns every threshold crossed at once when jumping from 0 to fully funded", () => {
    expect(findNewlyCrossedMilestones(100, 100, [])).toEqual([25, 50, 75, 100]);
  });

  it("returns only the newly crossed threshold when others are already celebrated", () => {
    expect(findNewlyCrossedMilestones(60, 100, [25])).toEqual([50]);
  });

  it("returns nothing once every crossed threshold is already celebrated", () => {
    expect(findNewlyCrossedMilestones(60, 100, [25, 50])).toEqual([]);
  });

  it("never re-returns a threshold after a dip and re-cross (correction/deletion guard)", () => {
    // Was at 60% (25 and 50 celebrated), a contribution was corrected down
    // to 40%, then a new contribution brings it back to 55%.
    expect(findNewlyCrossedMilestones(55, 100, [25, 50])).toEqual([]);
  });

  it("treats a zero or negative target as having no milestones", () => {
    expect(findNewlyCrossedMilestones(50, 0, [])).toEqual([]);
    expect(findNewlyCrossedMilestones(50, -10, [])).toEqual([]);
  });

  it("caps at 100 even if contributions exceed the target", () => {
    expect(findNewlyCrossedMilestones(150, 100, [])).toEqual([25, 50, 75, 100]);
  });
});
