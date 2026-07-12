import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    runId: v.string(),
    targetUrl: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("blocked"),
      v.literal("failed"),
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    finalUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_run_id", ["runId"]),

  events: defineTable({
    runId: v.string(),
    parentEventId: v.optional(v.string()),
    agent: v.string(),
    phase: v.string(),
    status: v.union(
      v.literal("started"),
      v.literal("success"),
      v.literal("failure"),
      v.literal("blocked"),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    inputSummary: v.string(),
    outputPath: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_run_id", ["runId"]),

  findings: defineTable({
    runId: v.string(),
    findingId: v.string(),
    category: v.string(),
    severity: v.string(),
    observation: v.string(),
    evidence: v.string(),
    recommendation: v.string(),
  }).index("by_run_id", ["runId"]),

  variants: defineTable({
    runId: v.string(),
    variant: v.union(v.literal("a"), v.literal("b")),
    hypothesis: v.string(),
    deploymentUrl: v.optional(v.string()),
    qaStatus: v.string(),
  }).index("by_run_id", ["runId"]),

  clicks: defineTable({
    runId: v.string(),
    anonymousVisitorId: v.string(),
    variant: v.union(v.literal("a"), v.literal("b")),
    eventType: v.union(v.literal("exposure"), v.literal("cta_click")),
    timestamp: v.number(),
  }).index("by_run_id", ["runId"]),
});
