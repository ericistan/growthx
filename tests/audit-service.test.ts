import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditService } from "../src/server/audit-service.js";
import { FileRunStore } from "../src/server/run-store.js";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("AuditService", () => {
  it("rejects submissions when the pending queue is full", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-service-"));
    created.push(root);
    const store = new FileRunStore(root);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const run = vi.fn(async () => {
      await pending;
      return { runId: "hermes-1", status: "completed" as const, output: "done" };
    });
    const ids = ["run-1", "run-2"];
    const service = new AuditService({
      store,
      hermes: { run },
      validateTarget: async (rawUrl) => new URL(rawUrl),
      idFactory: () => ids.shift()!,
      maxPendingRuns: 1,
    });

    await service.submit("https://one.example");

    await expect(service.submit("https://two.example")).rejects.toThrow(/queue is full/i);
    release();
    await service.waitFor("run-1");
  });

  it("marks interrupted queued and running records failed on startup", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-service-"));
    created.push(root);
    const store = new FileRunStore(root);
    await store.create({ runId: "queued-run", targetUrl: "https://one.example" });
    await store.create({ runId: "running-run", targetUrl: "https://two.example" });
    await store.update("running-run", { status: "running" });
    const service = new AuditService({
      store,
      hermes: { run: vi.fn() },
      validateTarget: async (rawUrl) => new URL(rawUrl),
    });

    await service.recoverInterrupted();

    await expect(store.get("queued-run")).resolves.toMatchObject({ status: "failed" });
    await expect(store.get("running-run")).resolves.toMatchObject({ status: "failed" });
  });

  it("runs only one Hermes audit at a time", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-service-"));
    created.push(root);
    const store = new FileRunStore(root);
    let releaseFirst!: () => void;
    const firstRun = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let callCount = 0;
    const run = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) await firstRun;
      return {
        runId: `hermes-${callCount}`,
        status: "completed" as const,
        output: "done",
      };
    });
    const ids = ["run-1", "run-2"];
    const service = new AuditService({
      store,
      hermes: { run },
      validateTarget: async (rawUrl) => new URL(rawUrl),
      idFactory: () => ids.shift()!,
    });

    await service.submit("https://one.example");
    await service.submit("https://two.example");
    await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    releaseFirst();
    await Promise.all([service.waitFor("run-1"), service.waitFor("run-2")]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("executes a submitted URL through Hermes and persists completion", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-service-"));
    created.push(root);
    const store = new FileRunStore(root);
    const run = vi.fn(async (_input: string, _sessionId: string) => ({
      runId: "hermes-1",
      status: "completed" as const,
      output: "audit complete",
    }));
    const service = new AuditService({
      store,
      hermes: { run },
      validateTarget: async (rawUrl) => new URL(rawUrl),
      idFactory: () => "run-1",
      hermesWorkspaceRoot: "/opt/data/repager-runs",
    });

    const submitted = await service.submit("https://example.com");
    await service.waitFor("run-1");

    expect(submitted).toMatchObject({ runId: "run-1", status: "queued" });
    await expect(store.get("run-1")).resolves.toMatchObject({
      status: "completed",
      hermesRunId: "hermes-1",
      output: "audit complete",
    });
    expect(run).toHaveBeenCalledWith(
      expect.stringContaining("https://example.com/"),
      "repager-run-1",
    );
    expect(run.mock.calls[0]?.[0]).toContain("/opt/data/repager-runs/run-1");
  });

  it("describes the AuditOutputSchema shape in the Hermes prompt", async () => {
    const root = await mkdtemp(join(tmpdir(), "repager-service-"));
    created.push(root);
    const store = new FileRunStore(root);
    const run = vi.fn(async (_input: string, _sessionId: string) => ({
      runId: "hermes-1",
      status: "completed" as const,
      output: "audit complete",
    }));
    const service = new AuditService({
      store,
      hermes: { run },
      validateTarget: async (rawUrl) => new URL(rawUrl),
      idFactory: () => "run-1",
    });

    await service.submit("https://example.com");
    await service.waitFor("run-1");

    const prompt = run.mock.calls[0]?.[0] ?? "";
    for (const field of [
      "findings",
      "evidence",
      "variants",
      "qaReport",
      "deploymentUrl",
      "evidenceId",
    ]) {
      expect(prompt).toContain(field);
    }
  });
});
