import { describe, expect, it, vi } from "vitest";
import { HermesRunsClient } from "../src/server/hermes-client.js";

describe("HermesRunsClient", () => {
  it("stops a Hermes run after the configured timeout", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ run_id: "hermes-run-1", status: "started" }),
      )
      .mockResolvedValueOnce(
        Response.json({ run_id: "hermes-run-1", status: "running" }),
      )
      .mockResolvedValueOnce(Response.json({ status: "stopping" }));
    const now = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1_001);
    const client = new HermesRunsClient({
      baseUrl: "http://hermes:8642",
      apiKey: "test-key",
      fetchFn,
      sleep: async () => undefined,
      maxRunMs: 1_000,
      now,
    });

    await expect(client.run("Audit", "repager-run-1")).rejects.toThrow(/timed out/i);

    expect(fetchFn.mock.calls[2]?.[0]).toBe(
      "http://hermes:8642/v1/runs/hermes-run-1/stop",
    );
    expect(fetchFn.mock.calls[2]?.[1]).toMatchObject({ method: "POST" });
  });

  it("submits a run and polls until Hermes completes", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ run_id: "hermes-run-1", status: "started" }),
      )
      .mockResolvedValueOnce(
        Response.json({ run_id: "hermes-run-1", status: "running" }),
      )
      .mockResolvedValueOnce(
        Response.json({
          run_id: "hermes-run-1",
          status: "completed",
          output: "REPAGER_DONE",
        }),
      );
    const client = new HermesRunsClient({
      baseUrl: "http://hermes:8642",
      apiKey: "test-key",
      fetchFn,
      sleep: async () => undefined,
    });

    const result = await client.run("Audit https://example.com", "repager-run-1");

    expect(result.output).toBe("REPAGER_DONE");
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(fetchFn.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer test-key",
        "content-type": "application/json",
      },
    });
  });
});
