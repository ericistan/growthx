import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { RunRecord } from "./run-store.js";

interface AuditApiService {
  submit(rawUrl: string): Promise<RunRecord>;
  get(runId: string): Promise<RunRecord | undefined>;
}

interface RepagerServerOptions {
  service: AuditApiService;
  corsOrigins: string[];
  apiKey: string;
}

export function createRepagerServer(options: RepagerServerOptions) {
  return createServer((request, response) => {
    void routeRequest(request, response, options).catch(() => {
      sendJson(response, 500, { error: "Internal server error" });
    });
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: RepagerServerOptions,
): Promise<void> {
  applyCors(request, response, options.corsOrigins);
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  const url = new URL(request.url ?? "/", "http://repager.local");
  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: "repager-api" });
    return;
  }

  if (url.pathname.startsWith("/api/") && !isAuthorized(request, options.apiKey)) {
    sendJson(response, 401, { error: "Unauthorized" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/audits") {
    try {
      const body = JSON.parse(await readBody(request)) as { url?: unknown };
      if (typeof body.url !== "string" || body.url.length > 2_048) {
        throw new Error("A valid URL is required");
      }
      const record = await options.service.submit(body.url);
      sendJson(response, 202, record);
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
    return;
  }

  const match = url.pathname.match(/^\/api\/audits\/([A-Za-z0-9_-]{1,128})$/);
  if (request.method === "GET" && match) {
    const record = await options.service.get(match[1]!);
    if (!record) {
      sendJson(response, 404, { error: "Run not found" });
      return;
    }
    sendJson(response, 200, record);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

function applyCors(
  request: IncomingMessage,
  response: ServerResponse,
  allowedOrigins: string[],
): void {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
  }
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "authorization,content-type");
}

function isAuthorized(request: IncomingMessage, apiKey: string): boolean {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(apiKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > 8_192) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return;
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(body)}\n`);
}
