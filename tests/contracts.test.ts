import { describe, expect, it } from "vitest";
import {
  EvidenceSchema,
  FindingSchema,
  TraceEventSchema,
} from "../src/contracts.js";

describe("EvidenceSchema", () => {
  it("rejects evidence without a valid source URL", () => {
    const result = EvidenceSchema.safeParse({
      claim: "Clear pricing improves buyer confidence",
      sourceUrl: "not-a-url",
      sourceTitle: "Pricing research",
      excerpt: "Buyers look for clear pricing information.",
      retrievedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it("accepts cited evidence with a valid URL and excerpt", () => {
    const result = EvidenceSchema.safeParse({
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
