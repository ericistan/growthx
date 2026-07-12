import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRepagerServer } from "../src/server/http-server.js";

const servers: Array<ReturnType<typeof createRepagerServer>> = [];
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

describe("RePager HTTP API", () => {
  it("submits an audit and returns its status", async () => {
    const record = {
      runId: "run-1",
      targetUrl: "https://example.com/",
      status: "queued" as const,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    };
    const service = {
      submit: vi.fn(async () => record),
      get: vi.fn(async () => record),
    };
    const server = createRepagerServer({ service, corsOrigins: ["https://repager.test"] });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as AddressInfo).port;

    const submitted = await fetch(`http://127.0.0.1:${port}/api/audits`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://repager.test" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const status = await fetch(`http://127.0.0.1:${port}/api/audits/run-1`);

    expect(submitted.status).toBe(202);
    expect(await submitted.json()).toMatchObject({ runId: "run-1", status: "queued" });
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({ runId: "run-1" });
    expect(service.submit).toHaveBeenCalledWith("https://example.com");
  });
});
