import { internal } from "../convex/_generated/api.js";
import { TraceEventSchema, type TraceEvent } from "./contracts.js";
import type { TraceRecorder } from "./logger.js";

interface InternalMutationRunner {
  runMutation(
    reference: typeof internal.events.record,
    args: TraceEvent,
  ): Promise<unknown>;
}

export class ConvexTraceRecorder implements TraceRecorder {
  constructor(private readonly runner: InternalMutationRunner) {}

  async record(candidate: TraceEvent): Promise<void> {
    const event = TraceEventSchema.parse(candidate);
    await this.runner.runMutation(internal.events.record, event);
  }
}
