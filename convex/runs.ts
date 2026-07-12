import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const start = internalMutation({
  args: { runId: v.string(), targetUrl: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("runs")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("runs", {
      ...args,
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const finish = internalMutation({
  args: {
    runId: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("blocked"),
      v.literal("failed"),
    ),
    finalUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("runs")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .unique();
    if (!run) throw new Error(`Unknown run: ${args.runId}`);
    await ctx.db.patch(run._id, {
      status: args.status,
      completedAt: Date.now(),
      finalUrl: args.finalUrl,
      error: args.error,
    });
  },
});

export const getByRunId = internalQuery({
  args: { runId: v.string() },
  handler: (ctx, args) =>
    ctx.db
      .query("runs")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .unique(),
});
