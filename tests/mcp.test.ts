import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-workbench-mcp-auth-"));
process.env.DATABASE_PATH = path.join(tempDir, "workbench.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");
process.env.MCP_PUBLIC_ORIGIN = "https://lab.example.test";

let authorizeMcpRequest: typeof import("../lib/mcp-auth").authorizeMcpRequest;
let requiredScopeForMcpRequest: typeof import("../lib/mcp-auth").requiredScopeForMcpRequest;

describe("MCP bearer authentication", () => {
  beforeAll(async () => {
    fs.mkdirSync(process.env.UPLOAD_DIR!, { recursive: true });
    const auth = await import("../lib/mcp-auth");
    authorizeMcpRequest = auth.authorizeMcpRequest;
    requiredScopeForMcpRequest = auth.requiredScopeForMcpRequest;
  });

  afterAll(async () => {
    const { sqlite } = await import("../lib/db");
    sqlite.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("rejects requests without a bearer token and advertises OAuth metadata", () => {
    const previous = process.env.MCP_ACCESS_TOKEN;
    delete process.env.MCP_ACCESS_TOKEN;
    const result = authorizeMcpRequest(new Request("https://lab.example.test/mcp"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(result.response.headers.get("www-authenticate")).toContain("oauth-protected-resource");
    }
    process.env.MCP_ACCESS_TOKEN = previous;
  });

  it("accepts only the configured static bearer token", () => {
    const previous = process.env.MCP_ACCESS_TOKEN;
    process.env.MCP_ACCESS_TOKEN = "a".repeat(48);
    const bad = authorizeMcpRequest(new Request("https://lab.example.test/mcp", { headers: { authorization: "Bearer wrong" } }));
    expect(bad.ok).toBe(false);
    const good = authorizeMcpRequest(new Request("https://lab.example.test/mcp", { headers: { authorization: `Bearer ${"a".repeat(48)}` } }), "workbench.write");
    expect(good.ok).toBe(true);
    process.env.MCP_ACCESS_TOKEN = previous;
  });

  it("requires write scope for mutating MCP tool calls", async () => {
    const readRequest = new Request("https://lab.example.test/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_focus", arguments: {} } }),
    });
    const writeRequest = new Request("https://lab.example.test/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "capture_item", arguments: {} } }),
    });
    expect(await requiredScopeForMcpRequest(readRequest)).toBe("workbench.read");
    expect(await requiredScopeForMcpRequest(writeRequest)).toBe("workbench.write");
  });
});
