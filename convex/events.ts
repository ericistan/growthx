import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const record = internalMutation({
  args: {
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
  },
  handler: (ctx, args) => ctx.db.insert("events", args),
});

export const listByRun = internalQuery({
  args: { runId: v.string() },
  handler: (ctx, args) =>
    ctx.db
      .query("events")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .collect(),
});
