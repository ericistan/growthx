// Browser-side client for src/server's HTTP API (a separate Node service
// deployed to the Hermes VPS via Dockerfile.api / docker-compose.vps.yml).
// RunRecord is hand-duplicated from src/server/run-store.ts rather than
// imported, so the browser bundle never depends on src/server's Node-only
// code.

export interface RunRecord {
  runId: string;
  targetUrl: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  hermesRunId?: string;
  output?: string;
  error?: string;
}

export interface ApiClientOptions {
  baseUrl: string;
}

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.length > 0) return body.error;
  } catch {
    // response wasn't JSON; fall through to the generic message
  }
  return fallback;
}

export async function submitAudit(
  url: string,
  { baseUrl }: ApiClientOptions,
): Promise<RunRecord> {
  const response = await fetch(`${baseUrl}/api/audits`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (response.status !== 202) {
    throw new ApiError(
      await readErrorMessage(response, "Could not submit the audit request."),
      response.status,
    );
  }

  return (await response.json()) as RunRecord;
}

export async function getAudit(
  runId: string,
  { baseUrl }: ApiClientOptions,
): Promise<RunRecord> {
  const response = await fetch(`${baseUrl}/api/audits/${encodeURIComponent(runId)}`);

  if (response.status === 404) {
    throw new ApiError("Run not found.", 404);
  }
  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(response, "Could not fetch the audit run."),
      response.status,
    );
  }

  return (await response.json()) as RunRecord;
}
