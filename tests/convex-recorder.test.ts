import { describe, expect, it, vi } from "vitest";
import { ConvexTraceRecorder } from "../src/convex-recorder.js";

describe("ConvexTraceRecorder", () => {
  it("sends a validated trace event to the Convex mutation", async () => {
    const runMutation = vi.fn(async (_reference: unknown, _args: unknown) => null);
    const recorder = new ConvexTraceRecorder({ runMutation });
    const event = {
      runId: "run-1",
      agent: "manager",
      phase: "plan",
      status: "success" as const,
      startedAt: 100,
      endedAt: 120,
      latencyMs: 20,
      inputSummary: "Plan specialist work",
      outputPath: "runs/run-1/manifest.json",
    };

    await recorder.record(event);

    expect(runMutation).toHaveBeenCalledOnce();
    expect(runMutation.mock.calls[0]?.[1]).toEqual(event);
  });
});
