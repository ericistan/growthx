import { describe, expect, it } from "vitest";
import {
  AuditOutputSchema,
  EvidenceSchema,
  FindingSchema,
  TraceEventSchema,
  VariantSchema,
} from "../src/contracts.js";

describe("EvidenceSchema", () => {
  it("rejects evidence without a valid source URL", () => {
    const result = EvidenceSchema.safeParse({
      id: "evidence-1",
      claim: "Clear pricing improves buyer confidence",
      sourceUrl: "not-a-url",
      sourceTitle: "Pricing research",
      excerpt: "Buyers look for clear pricing information.",
      retrievedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it("rejects evidence without an id", () => {
    const result = EvidenceSchema.safeParse({
      claim: "Clear pricing improves buyer confidence",
      sourceUrl: "https://example.com/research",
      sourceTitle: "Pricing research",
      excerpt: "Buyers look for clear pricing information.",
      retrievedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it("accepts cited evidence with a valid URL and excerpt", () => {
    const result = EvidenceSchema.safeParse({
      id: "evidence-1",
      claim: "Clear pricing improves buyer confidence",
      sourceUrl: "https://example.com/research",
      sourceTitle: "Pricing research",
      excerpt: "Buyers look for clear pricing information.",
      retrievedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });
});

describe("FindingSchema", () => {
  it("rejects a conversion finding without page evidence", () => {
    const result = FindingSchema.safeParse({
      id: "finding-1",
      category: "cta",
      severity: "high",
      observation: "The CTA is vague",
      evidence: "",
      recommendation: "Use a specific action-oriented CTA",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a concrete evidence-backed finding", () => {
    const result = FindingSchema.safeParse({
      id: "finding-1",
      category: "cta",
      severity: "high",
      observation: "The CTA is vague",
      evidence: "The primary button says Learn More",
      recommendation: "Use a specific action-oriented CTA",
    });

    expect(result.success).toBe(true);
  });
});

describe("VariantSchema", () => {
  it("rejects a variant with a relative deployment path", () => {
    const result = VariantSchema.safeParse({
      variant: "a",
      hypothesis: "Clarity and trust",
      deploymentUrl: "/a/",
      qaStatus: "pass",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a variant with an absolute deployment URL", () => {
    const result = VariantSchema.safeParse({
      variant: "a",
      hypothesis: "Clarity and trust",
      deploymentUrl: "https://example.com/a/",
      qaStatus: "pass",
    });

    expect(result.success).toBe(true);
  });
});

describe("TraceEventSchema", () => {
  it("requires an output path when a specialist step succeeds", () => {
    const result = TraceEventSchema.safeParse({
      runId: "run-1",
      agent: "browser-auditor",
      phase: "audit",
      status: "success",
      startedAt: 100,
      endedAt: 150,
      latencyMs: 50,
      inputSummary: "Audit the current landing page",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a complete child trace event", () => {
    const result = TraceEventSchema.safeParse({
      runId: "run-1",
      parentEventId: "manager-1",
      agent: "browser-auditor",
      phase: "audit",
      status: "success",
      startedAt: 100,
      endedAt: 150,
      latencyMs: 50,
      inputSummary: "Audit the current landing page",
      outputPath: "runs/run-1/audit/findings.json",
    });

    expect(result.success).toBe(true);
  });
});

function validAuditOutput() {
  return {
    findings: [
      {
        id: "finding-1",
        category: "cta",
        severity: "high",
        observation: "The CTA is vague",
        evidence: "The primary button says Learn More",
        recommendation: "Use a specific action-oriented CTA",
        evidenceId: "evidence-1",
      },
    ],
    evidence: [
      {
        id: "evidence-1",
        claim: "Clear pricing improves buyer confidence",
        sourceUrl: "https://example.com/research",
        sourceTitle: "Pricing research",
        excerpt: "Buyers look for clear pricing information.",
        retrievedAt: new Date().toISOString(),
      },
    ],
    variants: [
      {
        variant: "a",
        hypothesis: "Clarity and trust",
        deploymentUrl: "https://example.com/a/",
        qaStatus: "pass",
      },
      {
        variant: "b",
        hypothesis: "Problem framing",
        deploymentUrl: "https://example.com/b/",
        qaStatus: "pass",
      },
    ],
    qaReport: {
      status: "pass",
      unsupportedClaims: [],
      brokenLinks: [],
      missingSections: [],
      notes: ["All claims are cited"],
    },
  };
}

describe("AuditOutputSchema", () => {
  it("accepts a complete audit result without trace events", () => {
    const result = AuditOutputSchema.safeParse(validAuditOutput());

    expect(result.success).toBe(true);
  });

  it("accepts a complete audit result with trace events", () => {
    const withTrace = {
      ...validAuditOutput(),
      trace: [
        {
          runId: "run-1",
          agent: "browser-auditor",
          phase: "audit",
          status: "success",
          startedAt: 100,
          endedAt: 150,
          inputSummary: "Audit the current landing page",
          outputPath: "runs/run-1/audit/findings.json",
        },
      ],
    };
    const result = AuditOutputSchema.safeParse(withTrace);

    expect(result.success).toBe(true);
  });

  it("rejects an empty findings list", () => {
    const result = AuditOutputSchema.safeParse({
      ...validAuditOutput(),
      findings: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty evidence list", () => {
    const result = AuditOutputSchema.safeParse({
      ...validAuditOutput(),
      evidence: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than two variants", () => {
    const output = validAuditOutput();
    const result = AuditOutputSchema.safeParse({
      ...output,
      variants: [output.variants[0]],
    });

    expect(result.success).toBe(false);
  });

  it("rejects two variants with the same letter", () => {
    const output = validAuditOutput();
    const result = AuditOutputSchema.safeParse({
      ...output,
      variants: [output.variants[0], { ...output.variants[0] }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a variant with a relative deploymentUrl", () => {
    const output = validAuditOutput();
    const result = AuditOutputSchema.safeParse({
      ...output,
      variants: [output.variants[0], { ...output.variants[1], deploymentUrl: "/b/" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a finding whose evidenceId does not match any evidence entry", () => {
    const output = validAuditOutput();
    const result = AuditOutputSchema.safeParse({
      ...output,
      findings: [{ ...output.findings[0], evidenceId: "evidence-missing" }],
    });

    expect(result.success).toBe(false);
  });
});
