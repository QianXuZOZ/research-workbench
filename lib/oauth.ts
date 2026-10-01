import { createHash, randomBytes, randomUUID } from "node:crypto";
import { sqlite } from "@/lib/db";
import { secureCompare } from "@/lib/auth";
import { nowIso } from "@/lib/utils";

export const WORKBENCH_SCOPES = ["workbench.read", "workbench.write"] as const;
export type WorkbenchScope = (typeof WORKBENCH_SCOPES)[number];

export type OAuthAuthorizationRequest = {
  responseType: "code";
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource: string;
  scopes: string[];
  state: string | null;
};

export type OAuthAccessContext = {
  adminId: string;
  clientId: string;
  resource: string;
  scopes: string[];
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function secret(prefix: string) {
  return prefix + randomBytes(32).toString("base64url");
}

export function oauthOrigin() {
  const configured = (process.env.MCP_PUBLIC_ORIGIN ?? process.env.TRUSTED_ORIGIN ?? "").trim();
  if (!configured) throw new Error("MCP_PUBLIC_ORIGIN or TRUSTED_ORIGIN is required for OAuth");
  const url = new URL(configured);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("MCP OAuth origin must be an origin only");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("MCP OAuth requires HTTPS in production");
  return url.origin;
}

export function oauthIssuer() {
  return oauthOrigin();
}

export function mcpResource() {
  return oauthOrigin() + "/mcp";
}

export function protectedResourceMetadataUrl() {
  return oauthOrigin() + "/.well-known/oauth-protected-resource";
}

export function oauthAuthorizationServerMetadata() {
  const issuer = oauthIssuer();
  return {
    issuer,
    authorization_response_iss_parameter_supported: true,
    authorization_endpoint: issuer + "/oauth/authorize",
    token_endpoint: issuer + "/oauth/token",
    client_id_metadata_document_supported: true,
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [...WORKBENCH_SCOPES, "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
  };
}

export function oauthProtectedResourceMetadata() {
  return {
    resource: mcpResource(),
    authorization_servers: [oauthIssuer()],
    scopes_supported: [...WORKBENCH_SCOPES],
  };
}

function parseScopes(raw: string | null) {
  const requested = (raw ?? "workbench.read").split(/\s+/).map((item) => item.trim()).filter(Boolean);
  const allowed = new Set<string>([...WORKBENCH_SCOPES, "offline_access"]);
  if (requested.some((scope) => !allowed.has(scope))) throw new Error("invalid_scope");
  if (!requested.some((scope) => WORKBENCH_SCOPES.includes(scope as WorkbenchScope))) requested.unshift("workbench.read");
  return [...new Set(requested)];
}

function validateChatGptClientUrl(clientId: string) {
  const url = new URL(clientId);
  if (url.protocol !== "https:" || url.hostname !== "chatgpt.com" || url.port || url.username || url.password || url.search || url.hash) {
    throw new Error("invalid_client");
  }
  if (!/^\/oauth\/(?:[A-Za-z0-9_-]+\/)?client\.json$/.test(url.pathname)) throw new Error("invalid_client");
  return url;
}

export async function validateClientMetadata(clientId: string, redirectUri: string) {
  const url = validateChatGptClientUrl(clientId);
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("invalid_client");
  const data = await response.json() as Record<string, unknown>;
  if (data.client_id && String(data.client_id) !== clientId) throw new Error("invalid_client");
  const redirects = Array.isArray(data.redirect_uris) ? data.redirect_uris.map(String) : [];
  if (!redirects.includes(redirectUri)) throw new Error("invalid_redirect_uri");
  const methods = Array.isArray(data.token_endpoint_auth_methods_supported)
    ? data.token_endpoint_auth_methods_supported.map(String)
    : data.token_endpoint_auth_method ? [String(data.token_endpoint_auth_method)] : [];
  if (!methods.includes("none")) throw new Error("unsupported_client_auth");
  const grants = Array.isArray(data.grant_types) ? data.grant_types.map(String) : ["authorization_code"];
  if (!grants.includes("authorization_code")) throw new Error("unsupported_grant_type");
  return { clientId, redirectUri };
}

export function parseAuthorizationRequest(params: URLSearchParams): OAuthAuthorizationRequest {
  if (params.get("response_type") !== "code") throw new Error("unsupported_response_type");
  const clientId = params.get("client_id")?.trim() ?? "";
  const redirectUri = params.get("redirect_uri")?.trim() ?? "";
  const codeChallenge = params.get("code_challenge")?.trim() ?? "";
  const method = params.get("code_challenge_method")?.trim() ?? "";
  const resource = params.get("resource")?.trim() ?? "";
  if (!clientId || !redirectUri) throw new Error("invalid_request");
  validateChatGptClientUrl(clientId);
  if (method !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) throw new Error("invalid_request");
  if (resource !== mcpResource()) throw new Error("invalid_target");
  const state = params.get("state");
  if (state && state.length > 2048) throw new Error("invalid_request");
  return {
    responseType: "code",
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: "S256",
    resource,
    scopes: parseScopes(params.get("scope")),
    state,
  };
}

export function createAuthorizationCode(adminId: string, request: OAuthAuthorizationRequest) {
  const code = secret("rw_ac_");
  const now = new Date();
  const expires = new Date(now.getTime() + 5 * 60_000);
  sqlite.prepare("DELETE FROM oauth_authorization_codes WHERE expires_at<=? OR used_at IS NOT NULL").run(now.toISOString());
  sqlite.prepare(`INSERT INTO oauth_authorization_codes
    (id,admin_id,code_hash,client_id,redirect_uri,code_challenge,resource,scope,expires_at,used_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,NULL,?)`)
    .run(randomUUID(), adminId, sha256(code), request.clientId, request.redirectUri, request.codeChallenge, request.resource, request.scopes.join(" "), expires.toISOString(), now.toISOString());
  return code;
}

function issueTokens(adminId: string, clientId: string, resource: string, scope: string) {
  const accessToken = secret("rw_at_");
  const refreshToken = secret("rw_rt_");
  const now = new Date();
  const accessExpiresAt = new Date(now.getTime() + 60 * 60_000);
  const refreshExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60_000);
  const id = randomUUID();
  sqlite.prepare(`INSERT INTO oauth_tokens
    (id,admin_id,client_id,resource,scope,access_token_hash,refresh_token_hash,access_expires_at,refresh_expires_at,revoked_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?)`)
    .run(id, adminId, clientId, resource, scope, sha256(accessToken), sha256(refreshToken), accessExpiresAt.toISOString(), refreshExpiresAt.toISOString(), now.toISOString(), now.toISOString());
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope,
  };
}

export function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  resource: string;
}) {
  const now = new Date();
  const row = sqlite.prepare("SELECT * FROM oauth_authorization_codes WHERE code_hash=? LIMIT 1").get(sha256(input.code)) as Record<string, unknown> | undefined;
  if (!row || row.used_at || new Date(String(row.expires_at)).getTime() <= now.getTime()) throw new Error("invalid_grant");
  if (String(row.client_id) !== input.clientId || String(row.redirect_uri) !== input.redirectUri || String(row.resource) !== input.resource) throw new Error("invalid_grant");
  if (input.resource !== mcpResource()) throw new Error("invalid_target");
  if (input.codeVerifier.length < 43 || input.codeVerifier.length > 128 || !secureCompare(pkceChallenge(input.codeVerifier), String(row.code_challenge))) throw new Error("invalid_grant");

  return sqlite.transaction(() => {
    const marked = sqlite.prepare("UPDATE oauth_authorization_codes SET used_at=? WHERE id=? AND used_at IS NULL").run(now.toISOString(), row.id);
    if (marked.changes !== 1) throw new Error("invalid_grant");
    return issueTokens(String(row.admin_id), String(row.client_id), String(row.resource), String(row.scope));
  })();
}

export function rotateRefreshToken(input: { refreshToken: string; clientId: string; resource: string }) {
  const now = new Date();
  const row = sqlite.prepare("SELECT * FROM oauth_tokens WHERE refresh_token_hash=? LIMIT 1").get(sha256(input.refreshToken)) as Record<string, unknown> | undefined;
  if (!row || row.revoked_at || new Date(String(row.refresh_expires_at)).getTime() <= now.getTime()) throw new Error("invalid_grant");
  if (String(row.client_id) !== input.clientId || String(row.resource) !== input.resource || input.resource !== mcpResource()) throw new Error("invalid_grant");

  return sqlite.transaction(() => {
    const revoked = sqlite.prepare("UPDATE oauth_tokens SET revoked_at=?,updated_at=? WHERE id=? AND revoked_at IS NULL").run(now.toISOString(), now.toISOString(), row.id);
    if (revoked.changes !== 1) throw new Error("invalid_grant");
    return issueTokens(String(row.admin_id), String(row.client_id), String(row.resource), String(row.scope));
  })();
}

export function validateOAuthAccessToken(token: string): OAuthAccessContext | null {
  if (!token.startsWith("rw_at_")) return null;
  const row = sqlite.prepare("SELECT * FROM oauth_tokens WHERE access_token_hash=? LIMIT 1").get(sha256(token)) as Record<string, unknown> | undefined;
  if (!row || row.revoked_at) return null;
  if (new Date(String(row.access_expires_at)).getTime() <= Date.now()) return null;
  if (String(row.resource) !== mcpResource()) return null;
  return {
    adminId: String(row.admin_id),
    clientId: String(row.client_id),
    resource: String(row.resource),
    scopes: String(row.scope).split(/\s+/).filter(Boolean),
  };
}

export function oauthErrorRedirect(request: OAuthAuthorizationRequest, error: string, description?: string) {
  const url = new URL(request.redirectUri);
  url.searchParams.set("error", error);
  if (description) url.searchParams.set("error_description", description);
  if (request.state) url.searchParams.set("state", request.state);
  url.searchParams.set("iss", oauthIssuer());
  return url;
}

export function oauthSuccessRedirect(request: OAuthAuthorizationRequest, code: string) {
  const url = new URL(request.redirectUri);
  url.searchParams.set("code", code);
  if (request.state) url.searchParams.set("state", request.state);
  url.searchParams.set("iss", oauthIssuer());
  return url;
}

export function oauthChallenge(scope: WorkbenchScope = "workbench.read", error?: string, description?: string) {
  const fields = [`resource_metadata="${protectedResourceMetadataUrl()}"`, `scope="${scope}"`];
  if (error) fields.push(`error="${error.replaceAll('"', "")}"`);
  if (description) fields.push(`error_description="${description.replaceAll('"', "")}"`);
  return "Bearer " + fields.join(", ");
}

export function oauthTokenResponseError(error: string, description: string, status = 400) {
  return Response.json({ error, error_description: description }, { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
}

export function cleanupOAuthState() {
  const now = nowIso();
  sqlite.prepare("DELETE FROM oauth_authorization_codes WHERE expires_at<=? OR used_at IS NOT NULL").run(now);
  sqlite.prepare("DELETE FROM oauth_tokens WHERE refresh_expires_at<=?").run(now);
}
