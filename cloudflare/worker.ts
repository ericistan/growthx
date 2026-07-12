interface Env {
  REPAGER_API_URL: string;
  REPAGER_API_KEY: string;
}

type FetchFn = (request: Request) => Promise<Response>;

const auditStatusPath = /^\/api\/audits\/[A-Za-z0-9_-]{1,128}$/;

export async function handleRequest(
  request: Request,
  env: Env,
  fetchFn: FetchFn = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const isSubmit = url.pathname === "/api/audits" && request.method === "POST";
  const isStatus = auditStatusPath.test(url.pathname) && request.method === "GET";

  if (!isSubmit && !isStatus) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!env.REPAGER_API_URL || !env.REPAGER_API_KEY) {
    return Response.json({ error: "API proxy is not configured" }, { status: 503 });
  }

  const upstreamBase = new URL(env.REPAGER_API_URL);
  if (upstreamBase.protocol !== "https:") {
    return Response.json({ error: "API proxy is misconfigured" }, { status: 503 });
  }
  const upstreamUrl = new URL(url.pathname, upstreamBase);
  const headers = new Headers({
    authorization: `Bearer ${env.REPAGER_API_KEY}`,
    accept: "application/json",
  });

  let body: ArrayBuffer | undefined;
  if (isSubmit) {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 8_192) {
      return Response.json({ error: "Request body is too large" }, { status: 413 });
    }
    body = await request.arrayBuffer();
    if (body.byteLength > 8_192) {
      return Response.json({ error: "Request body is too large" }, { status: 413 });
    }
    headers.set("content-type", "application/json");
  }

  const upstreamResponse = await fetchFn(
    new Request(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    }),
  );
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set("cache-control", "no-store");
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export default {
  fetch(request: Request, env: Env) {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
