import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const record = internalMutation({
  args: {
    runId: v.string(),
    anonymousVisitorId: v.string(),
    variant: v.union(v.literal("a"), v.literal("b")),
    eventType: v.union(v.literal("exposure"), v.literal("cta_click")),
    timestamp: v.number(),
  },
  handler: (ctx, args) => ctx.db.insert("clicks", args),
});

export const listByRun = internalQuery({
  args: { runId: v.string() },
  handler: (ctx, args) =>
    ctx.db
      .query("clicks")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .collect(),
});
