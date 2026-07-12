import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createLinkupClient,
  researchLandingPageEvidence,
} from "../src/agents/linkup-researcher.js";

const apiKey = process.env.LINKUP_API_KEY;
if (!apiKey) {
  throw new Error("LINKUP_API_KEY is required");
}

const outputDir = resolve("runs", "linkup-live-check", "research");
await mkdir(outputDir, { recursive: true });
const evidence = await researchLandingPageEvidence(createLinkupClient(apiKey), {
  company: "RePager",
  category: "B2B landing-page optimization services",
  targetUrl: "https://example.com",
});
if (evidence.length === 0) {
  throw new Error("Linkup returned no cited evidence");
}
await writeFile(
  resolve(outputDir, "evidence.json"),
  JSON.stringify(evidence, null, 2),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      ok: true,
      evidenceCount: evidence.length,
      output: resolve(outputDir, "evidence.json"),
    },
    null,
    2,
  ),
);
