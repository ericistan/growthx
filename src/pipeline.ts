import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRunWorkspace } from "./artifacts.js";
import {
  EvidenceSchema,
  FindingSchema,
  QaReportSchema,
} from "./contracts.js";
import { shouldDeploy } from "./qa-gate.js";
import { JsonlTraceRecorder } from "./logger.js";

interface SmokePipelineInput {
  root: string;
  runId: string;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

const html = (headline: string, cta: string) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headline}</title></head>
<body><main><section><h1>${headline}</h1><p>Evidence-backed landing page recommendations, produced by a specialist agent crew.</p><a href="#contact" data-cta="primary">${cta}</a></section><section id="contact"><h2>Get the audit</h2><p>Share your landing page URL to begin.</p></section></main></body>
</html>`;

export async function runSmokePipeline({ root, runId }: SmokePipelineInput) {
  const workspace = await createRunWorkspace({
    root,
    runId,
    targetUrl: "https://example.com/smoke-fixture",
  });

  await writeFile(
    join(workspace, "source", "page.html"),
    "<main><h1>Grow faster</h1><a href='/contact'>Learn more</a></main>",
    "utf8",
  );
  await writeFile(
    join(workspace, "source", "page.txt"),
    "Grow faster\nLearn more",
    "utf8",
  );

  const findings = [
    FindingSchema.parse({
      id: "finding-1",
      category: "cta",
      severity: "high",
      observation: "The primary CTA does not describe the action",
      evidence: "The primary link says Learn more",
      recommendation: "Name the concrete next step in the CTA",
    }),
  ];
  await writeJson(join(workspace, "audit", "findings.json"), findings);

  const evidence = [
    EvidenceSchema.parse({
      claim: "Specific calls to action reduce ambiguity",
      sourceUrl: "https://example.com/evidence-fixture",
      sourceTitle: "Smoke fixture evidence",
      excerpt: "This fixture exists only to verify the evidence handoff contract.",
      retrievedAt: new Date().toISOString(),
    }),
  ];
  await writeJson(join(workspace, "research", "evidence.json"), evidence);

  await writeJson(join(workspace, "strategy", "sections.json"), {
    sections: ["hero", "proof", "process", "cta"],
    rationale: "Lead with a concrete outcome and end with a specific next step.",
  });
  await writeJson(join(workspace, "copy", "copy.json"), {
    approvedClaims: [],
    variantA: {
      headline: "Turn landing-page friction into a prioritized action plan",
      cta: "Book a conversion audit",
    },
    variantB: {
      headline: "See what your landing page is losing",
      cta: "Get the evidence-backed teardown",
    },
  });

  await writeFile(
    join(workspace, "variants", "a", "index.html"),
    html(
      "Turn landing-page friction into a prioritized action plan",
      "Book a conversion audit",
    ),
    "utf8",
  );
  await writeFile(
    join(workspace, "variants", "b", "index.html"),
    html(
      "See what your landing page is losing",
      "Get the evidence-backed teardown",
    ),
    "utf8",
  );

  const report = QaReportSchema.parse({
    status: "pass",
    unsupportedClaims: [],
    brokenLinks: [],
    missingSections: [],
    notes: ["Smoke fixture only; replace with a real client run before demo."],
  });
  await writeJson(join(workspace, "qa", "report.json"), report);

  const qaPassed = shouldDeploy(report);
  await writeJson(join(workspace, "deploy", "result.json"), {
    status: qaPassed ? "ready" : "blocked",
    smoke: true,
    publicUrl: null,
  });

  const recorder = new JsonlTraceRecorder(join(workspace, "events.jsonl"));
  const managerEventId = `manager-${runId}`;
  const startedAt = Date.now();
  const steps = [
    ["manager", "plan", "manifest.json"],
    ["browser-auditor", "audit", "audit/findings.json"],
    ["linkup-researcher", "research", "research/evidence.json"],
    ["section-architect", "strategy", "strategy/sections.json"],
    ["copywriter", "copy", "copy/copy.json"],
    ["coder", "build", "variants/a/index.html"],
    ["qa", "qa", "qa/report.json"],
  ] as const;
  for (const [index, [agent, phase, outputPath]] of steps.entries()) {
    await recorder.record({
      runId,
      parentEventId: index === 0 ? undefined : managerEventId,
      agent,
      phase,
      status: "success",
      startedAt: startedAt + index,
      endedAt: startedAt + index + 1,
      latencyMs: 1,
      inputSummary: `Smoke fixture ${phase} step`,
      outputPath: join("runs", runId, outputPath).replaceAll("\\", "/"),
    });
  }

  return { workspace, qaPassed };
}
