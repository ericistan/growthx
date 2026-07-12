import { describe, expect, it } from "vitest";
import { loadServerConfig } from "../src/server/config.js";

describe("loadServerConfig", () => {
  it("requires the Hermes API key", () => {
    expect(() =>
      loadServerConfig({
        HERMES_API_URL: "http://hermes:8642",
        CORS_ORIGINS: "https://repager.test",
      }),
    ).toThrow(/HERMES_API_KEY/);
  });

  it("requires the RePager submission API key", () => {
    expect(() =>
      loadServerConfig({
        HERMES_API_URL: "http://hermes:8642",
        HERMES_API_KEY: "hermes-secret",
        CORS_ORIGINS: "https://repager.test",
      }),
    ).toThrow(/SUBMIT_API_KEY/);
  });

  it("parses the configured API and CORS values", () => {
    expect(
      loadServerConfig({
        HERMES_API_URL: "http://hermes:8642/",
        HERMES_API_KEY: "secret",
        SUBMIT_API_KEY: "submit-secret",
        CORS_ORIGINS: "https://one.test, https://two.test",
        PORT: "3100",
        RUNS_DIR: "/data/runs",
      }),
    ).toMatchObject({
      hermesApiUrl: "http://hermes:8642",
      hermesApiKey: "secret",
      submitApiKey: "submit-secret",
      corsOrigins: ["https://one.test", "https://two.test"],
      port: 3100,
      runsDir: "/data/runs",
    });
  });
});
