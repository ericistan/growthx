import { AuditService } from "./audit-service.js";
import { loadServerConfig } from "./config.js";
import { HermesRunsClient } from "./hermes-client.js";
import { createRepagerServer } from "./http-server.js";
import { FileRunStore } from "./run-store.js";

const config = loadServerConfig();
const store = new FileRunStore(config.runsDir);
const hermes = new HermesRunsClient({
  baseUrl: config.hermesApiUrl,
  apiKey: config.hermesApiKey,
});
const service = new AuditService({
  store,
  hermes,
  hermesWorkspaceRoot: config.hermesWorkspaceRoot,
});
const server = createRepagerServer({
  service,
  corsOrigins: config.corsOrigins,
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`RePager API listening on port ${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}; shutting down`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
