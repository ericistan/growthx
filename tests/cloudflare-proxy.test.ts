import { describe, expect, it, vi } from "vitest";
import { handleRequest } from "../cloudflare/worker.js";

const env = {
  REPAGER_API_URL: "https://repager-api.187.77.157.86.sslip.io",
  REPAGER_API_KEY: "server-secret",
};

describe("Cloudflare RePager API proxy", () => {
  it("forwards audit requests with the server-side bearer key", async () => {
    const fetchFn = vi.fn<(request: Request) => Promise<Response>>(async () =>
      Response.json({ runId: "run-1" }, { status: 202 }),
    );
    const request = new Request(
      "https://hermes-buildathon-agency.growthx-buildathon.workers.dev/api/audits",
      {
        method: "POST",
        headers: {
          authorization: "Bearer attacker-controlled",
          cookie: "session=browser-cookie",
          "content-type": "application/json",
        },
        body: JSON.stringify({ url: "https://example.com" }),
      },
    );

    const response = await handleRequest(request, env, fetchFn);
    const upstream = fetchFn.mock.calls[0]?.[0] as Request;

    expect(response.status).toBe(202);
    expect(upstream.url).toBe(
      "https://repager-api.187.77.157.86.sslip.io/api/audits",
    );
    expect(upstream.headers.get("authorization")).toBe("Bearer server-secret");
    expect(upstream.headers.get("cookie")).toBeNull();
    expect(await upstream.json()).toEqual({ url: "https://example.com" });
  });

  it("does not proxy unrelated paths", async () => {
    const fetchFn = vi.fn<typeof fetch>();

    const response = await handleRequest(
      new Request(
        "https://hermes-buildathon-agency.growthx-buildathon.workers.dev/not-api",
      ),
      env,
      fetchFn,
    );

    expect(response.status).toBe(404);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
