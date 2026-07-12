import { describe, expect, it } from "vitest";
import { shouldDeploy } from "../src/qa-gate.js";

describe("shouldDeploy", () => {
  it("blocks a report that marks unsupported claims as pass", () => {
    expect(
      shouldDeploy({
        status: "pass",
        unsupportedClaims: [
          { text: "Trusted by 10,000 teams", reason: "No supporting evidence" },
        ],
        brokenLinks: [],
        missingSections: [],
        notes: [],
      }),
    ).toBe(false);
  });

  it("allows a clean passing report", () => {
    expect(
      shouldDeploy({
        status: "pass",
        unsupportedClaims: [],
        brokenLinks: [],
        missingSections: [],
        notes: [],
      }),
    ).toBe(true);
  });
});
