import { resolve } from "node:path";
import { runSmokePipeline } from "../src/pipeline.js";

const runId = `smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const result = await runSmokePipeline({
  root: resolve("runs"),
  runId,
});

console.log(JSON.stringify({ runId, ...result }, null, 2));
