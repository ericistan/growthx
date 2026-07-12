import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface RunRecord {
  runId: string;
  targetUrl: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  hermesRunId?: string;
  output?: string;
  error?: string;
}

export class FileRunStore {
  constructor(private readonly root: string) {}

  async create(input: { runId: string; targetUrl: string }): Promise<RunRecord> {
    this.assertRunId(input.runId);
    const now = new Date().toISOString();
    const record: RunRecord = {
      ...input,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };
    await this.write(record);
    return record;
  }

  async get(runId: string): Promise<RunRecord | undefined> {
    this.assertRunId(runId);
    try {
      return JSON.parse(await readFile(this.statePath(runId), "utf8")) as RunRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  async update(
    runId: string,
    patch: Partial<Omit<RunRecord, "runId" | "targetUrl" | "createdAt">>,
  ): Promise<RunRecord> {
    const current = await this.get(runId);
    if (!current) throw new Error(`Unknown run: ${runId}`);
    const record: RunRecord = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.write(record);
    return record;
  }

  private async write(record: RunRecord): Promise<void> {
    const directory = join(this.root, record.runId);
    await mkdir(directory, { recursive: true });
    const destination = this.statePath(record.runId);
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(temporary, destination);
  }

  private statePath(runId: string): string {
    return join(this.root, runId, "state.json");
  }

  private assertRunId(runId: string): void {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(runId)) {
      throw new Error("Invalid run ID");
    }
  }
}
