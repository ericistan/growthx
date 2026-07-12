import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runSmokePipeline } from "../src/pipeline.js";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("runSmokePipeline", () => {
  it("produces a complete QA-approved artifact chain", async () => {
    const root = await mkdtemp(join(tmpdir(), "agency-smoke-"));
    created.push(root);

    const result = await runSmokePipeline({ root, runId: "smoke-1" });

    expect(result.qaPassed).toBe(true);
    const variantA = await readFile(join(result.workspace, "variants", "a", "index.html"), "utf8");
    const variantB = await readFile(join(result.workspace, "variants", "b", "index.html"), "utf8");
    const report = JSON.parse(await readFile(join(result.workspace, "qa", "report.json"), "utf8"));
    const traceLines = (
      await readFile(join(result.workspace, "events.jsonl"), "utf8")
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(variantA).toContain("Book a conversion audit");
    expect(variantB).toContain("See what your landing page is losing");
    expect(report.status).toBe("pass");
    expect(traceLines.map((event) => event.agent)).toEqual([
      "manager",
      "browser-auditor",
      "linkup-researcher",
      "section-architect",
      "copywriter",
      "coder",
      "qa",
    ]);
  });
});
