import { secureCompare } from "@/lib/auth";
import { oauthChallenge, validateOAuthAccessToken, type WorkbenchScope } from "@/lib/oauth";

const writeTools = new Set([
  "create_record","update_record","create_task","update_task",
  "capture_item","process_inbox_item","save_weekly_review","link_records",
  "bulk_create_records","bulk_update_records","bulk_create_tasks","bulk_update_tasks",
  "preview_bulk_operation","execute_bulk_operation",
]);

export type McpAuthContext =
  | { kind: "static"; adminId: null; scopes: WorkbenchScope[] }
  | { kind: "oauth"; adminId: string; clientId: string; scopes: string[] };

function unauthorized(scope: WorkbenchScope, error = "invalid_token", description = "A valid MCP access token is required.") {
  let challenge = "Bearer";
  try { challenge = oauthChallenge(scope, error, description); } catch {}
  return Response.json({ error: "Unauthorized" }, {
    status: 401,
    headers: { "WWW-Authenticate": challenge, "Cache-Control": "no-store" },
  });
}

export function authorizeMcpRequest(request: Request, requiredScope: WorkbenchScope = "workbench.read") {
  const header = request.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!supplied) return { ok: false as const, response: unauthorized(requiredScope) };

  const configured = process.env.MCP_ACCESS_TOKEN?.trim() ?? "";
  if (configured.length >= 32 && secureCompare(supplied, configured)) {
    return { ok: true as const, auth: { kind: "static", adminId: null, scopes: ["workbench.read","workbench.write"] } satisfies McpAuthContext };
  }

  let oauth = null;
  try { oauth = validateOAuthAccessToken(supplied); } catch {}
  if (!oauth) return { ok: false as const, response: unauthorized(requiredScope) };
  if (!oauth.scopes.includes(requiredScope)) {
    return {
      ok: false as const,
      response: unauthorized(requiredScope, "insufficient_scope", `The ${requiredScope} scope is required for this MCP operation.`),
    };
  }
  return {
    ok: true as const,
    auth: { kind: "oauth", adminId: oauth.adminId, clientId: oauth.clientId, scopes: oauth.scopes } satisfies McpAuthContext,
  };
}

function bodyRequiredScope(body: unknown): WorkbenchScope {
  const messages = Array.isArray(body) ? body : [body];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const value = message as Record<string, unknown>;
    if (value.method !== "tools/call") continue;
    const params = value.params && typeof value.params === "object" ? value.params as Record<string, unknown> : null;
    const name = typeof params?.name === "string" ? params.name : "";
    if (writeTools.has(name)) return "workbench.write";
  }
  return "workbench.read";
}

export async function requiredScopeForMcpRequest(request: Request): Promise<WorkbenchScope> {
  if (request.method !== "POST") return "workbench.read";
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return "workbench.read";
    return bodyRequiredScope(await request.clone().json());
  } catch {
    return "workbench.read";
  }
}
