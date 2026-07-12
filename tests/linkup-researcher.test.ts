import { describe, expect, it } from "vitest";
import { researchLandingPageEvidence } from "../src/agents/linkup-researcher.js";

describe("researchLandingPageEvidence", () => {
  it("turns Linkup sources into validated evidence records", async () => {
    const client = {
      search: async () => ({
        answer: "No direct evidence found about the named company.",
        sources: [
          {
            name: "Conversion research",
            url: "https://example.com/conversion-research",
            snippet: "Specific outcomes and visible proof reduce uncertainty.",
            favicon: "https://example.com/favicon.ico",
          },
        ],
      }),
    };

    const evidence = await researchLandingPageEvidence(client, {
      company: "Acme",
      category: "B2B analytics",
      targetUrl: "https://acme.example",
    });

    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      sourceUrl: "https://example.com/conversion-research",
      sourceTitle: "Conversion research",
    });
    expect(evidence[0].claim).toBe(
      "Specific outcomes and visible proof reduce uncertainty.",
    );
  });
});
