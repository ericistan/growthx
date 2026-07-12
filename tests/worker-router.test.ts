import { describe, expect, it } from "vitest";
import { handleRequest } from "../worker/src/index.js";

describe("Cloudflare A/B router", () => {
  it("sets an anonymous visitor cookie and redirects the root path", async () => {
    const response = await handleRequest(new Request("https://agency.test/"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toMatch(/^\/[ab]\/$/);
    expect(response.headers.get("set-cookie")).toContain("lp_visitor=");
  });

  it("treats a malformed visitor cookie as a new visitor", async () => {
    const request = new Request("https://agency.test/", {
      headers: { cookie: "lp_visitor=%E0%A4%A" },
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(302);
    expect(response.headers.get("set-cookie")).toContain("lp_visitor=");
  });

  it("keeps an existing visitor on the same variant", async () => {
    const request = new Request("https://agency.test/", {
      headers: { cookie: "lp_visitor=visitor-123" },
    });
    const first = await handleRequest(request);
    const second = await handleRequest(request);

    expect(first.headers.get("location")).toBe(second.headers.get("location"));
  });
});
