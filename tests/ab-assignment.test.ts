import { describe, expect, it } from "vitest";
import { assignVariant } from "../src/ab.js";

describe("assignVariant", () => {
  it("assigns the same anonymous visitor consistently", () => {
    expect(assignVariant("visitor-123")).toBe(assignVariant("visitor-123"));
  });

  it("distributes a representative visitor set across both variants", () => {
    const assignments = new Set(
      Array.from({ length: 100 }, (_, index) => assignVariant(`visitor-${index}`)),
    );

    expect(assignments).toEqual(new Set(["a", "b"]));
  });
});
