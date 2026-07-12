import { describe, expect, it } from "vitest";
import { validatePublicTargetUrl } from "../src/server/target-url.js";

describe("validatePublicTargetUrl", () => {
  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      validatePublicTargetUrl("https://internal.example", async () => ["10.0.0.8"]),
    ).rejects.toThrow(/public/i);
  });

  it("accepts an HTTPS URL that resolves only to public addresses", async () => {
    const url = await validatePublicTargetUrl(
      "https://example.com/pricing",
      async () => ["93.184.216.34"],
    );

    expect(url.href).toBe("https://example.com/pricing");
  });
});
