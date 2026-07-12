import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { TraceEventSchema, type TraceEvent } from "./contracts.js";

export interface TraceRecorder {
  record(event: TraceEvent): Promise<void>;
}

export class JsonlTraceRecorder implements TraceRecorder {
  constructor(private readonly path: string) {}

  async record(candidate: TraceEvent): Promise<void> {
    const event = TraceEventSchema.parse(candidate);
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, `${JSON.stringify(event)}\n`, "utf8");
  }
}
