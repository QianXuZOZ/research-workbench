import { describe, expect, it } from "vitest";
import { authorizeMcpRequest } from "@/lib/mcp-auth";

describe("MCP bearer authentication", () => {
  it("rejects requests when MCP is not configured", () => {
    const previous = process.env.MCP_ACCESS_TOKEN;
    delete process.env.MCP_ACCESS_TOKEN;
    const result = authorizeMcpRequest(new Request("https://example.test/mcp"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
    process.env.MCP_ACCESS_TOKEN = previous;
  });

  it("accepts only the configured bearer token", () => {
    const previous = process.env.MCP_ACCESS_TOKEN;
    process.env.MCP_ACCESS_TOKEN = "a".repeat(48);
    const bad = authorizeMcpRequest(new Request("https://example.test/mcp", { headers: { authorization: "Bearer wrong" } }));
    expect(bad.ok).toBe(false);
    const good = authorizeMcpRequest(new Request("https://example.test/mcp", { headers: { authorization: `Bearer ${"a".repeat(48)}` } }));
    expect(good.ok).toBe(true);
    process.env.MCP_ACCESS_TOKEN = previous;
  });
});
