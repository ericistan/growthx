import { z } from "zod";

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  excerpt: z.string().min(1),
  retrievedAt: z.string().datetime(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "message",
    "structure",
    "trust",
    "cta",
    "friction",
    "accessibility",
  ]),
  severity: z.enum(["low", "medium", "high"]),
  observation: z.string().min(1),
  evidence: z.string().min(1),
  recommendation: z.string().min(1),
  evidenceId: z.string().min(1).optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const QaReportSchema = z.object({
  status: z.enum(["pass", "revise", "block"]),
  unsupportedClaims: z.array(
    z.object({
      text: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
  brokenLinks: z.array(z.string()),
  missingSections: z.array(z.string()),
  notes: z.array(z.string()),
});

export type QaReport = z.infer<typeof QaReportSchema>;

export const VariantSchema = z.object({
  variant: z.enum(["a", "b"]),
  hypothesis: z.string().min(1),
  deploymentUrl: z.string().url(),
  qaStatus: z.enum(["pass", "revise", "block"]),
});

export type Variant = z.infer<typeof VariantSchema>;

export const TraceEventSchema = z
  .object({
    runId: z.string().min(1),
    parentEventId: z.string().min(1).optional(),
    agent: z.string().min(1),
    phase: z.string().min(1),
    status: z.enum(["started", "success", "failure", "blocked"]),
    startedAt: z.number().nonnegative(),
    endedAt: z.number().nonnegative().optional(),
    latencyMs: z.number().nonnegative().optional(),
    inputSummary: z.string().min(1),
    outputPath: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
  })
  .superRefine((event, context) => {
    if (event.status === "success" && !event.outputPath) {
      context.addIssue({
        code: "custom",
        path: ["outputPath"],
        message: "Successful events must reference a persisted output artifact",
      });
    }
  });

export type TraceEvent = z.infer<typeof TraceEventSchema>;

// The full result shape the Hermes agent must return as `RunRecord.output`
// (see src/server/audit-service.ts#buildPrompt, which describes this shape
// in prose for the agent). Frontend code parses `output` as JSON and
// validates it against this schema before rendering real results.
export const AuditOutputSchema = z
  .object({
    findings: z.array(FindingSchema).min(1),
    evidence: z.array(EvidenceSchema).min(1),
    variants: z.array(VariantSchema).length(2),
    qaReport: QaReportSchema,
    trace: z.array(TraceEventSchema).optional(),
  })
  .superRefine((output, context) => {
    const letters = output.variants.map((variant) => variant.variant);
    if (!letters.includes("a") || !letters.includes("b")) {
      context.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Variants must contain exactly one 'a' and one 'b'",
      });
    }

    const evidenceIds = new Set(output.evidence.map((item) => item.id));
    output.findings.forEach((finding, index) => {
      if (finding.evidenceId && !evidenceIds.has(finding.evidenceId)) {
        context.addIssue({
          code: "custom",
          path: ["findings", index, "evidenceId"],
          message: `evidenceId "${finding.evidenceId}" does not match any evidence[].id`,
        });
      }
    });
  });

export type AuditOutput = z.infer<typeof AuditOutputSchema>;
