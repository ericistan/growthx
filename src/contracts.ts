import { z } from "zod";

export const EvidenceSchema = z.object({
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
