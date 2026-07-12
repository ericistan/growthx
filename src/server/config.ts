export interface ServerConfig {
  port: number;
  runsDir: string;
  hermesApiUrl: string;
  hermesApiKey: string;
  hermesWorkspaceRoot: string;
  corsOrigins: string[];
}

export function loadServerConfig(
  environment: Record<string, string | undefined> = process.env,
): ServerConfig {
  const hermesApiKey = environment.HERMES_API_KEY?.trim();
  if (!hermesApiKey) throw new Error("HERMES_API_KEY is required");

  const corsOrigins = (environment.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) throw new Error("CORS_ORIGINS is required");

  const port = Number(environment.PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port");
  }

  return {
    port,
    runsDir: environment.RUNS_DIR ?? "/data/runs",
    hermesApiUrl: (environment.HERMES_API_URL ?? "http://hermes:8642").replace(
      /\/$/,
      "",
    ),
    hermesApiKey,
    hermesWorkspaceRoot:
      environment.HERMES_WORKSPACE_ROOT ?? "/opt/data/repager-runs",
    corsOrigins,
  };
}
