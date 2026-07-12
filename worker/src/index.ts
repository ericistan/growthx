import { assignVariant } from "../../src/ab.js";

const VISITOR_COOKIE = "lp_visitor";

function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const item of cookieHeader.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/health") {
    return Response.json({ ok: true, service: "repager-agency" });
  }

  if (url.pathname === "/") {
    const existingVisitorId = readCookie(request, VISITOR_COOKIE);
    const visitorId = existingVisitorId ?? crypto.randomUUID();
    const variant = assignVariant(visitorId);
    const headers = new Headers({ location: `/${variant}/` });
    if (!existingVisitorId) {
      headers.set(
        "set-cookie",
        `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      );
    }
    return new Response(null, { status: 302, headers });
  }

  if (url.pathname === "/a/" || url.pathname === "/b/") {
    const variant = url.pathname === "/a/" ? "A" : "B";
    return new Response(`Landing Page Variant ${variant}`, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("Not found", { status: 404 });
}

export default {
  fetch: handleRequest,
};
