import { secureCompare } from "@/lib/auth";

export function authorizeMcpRequest(request: Request) {
  const configured = process.env.MCP_ACCESS_TOKEN?.trim() ?? "";
  if (configured.length < 32) {
    return { ok: false as const, response: Response.json({ error: "MCP server is not configured" }, { status: 503 }) };
  }
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!supplied || !secureCompare(supplied, configured)) {
    return {
      ok: false as const,
      response: Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } }),
    };
  }
  return { ok: true as const };
}
