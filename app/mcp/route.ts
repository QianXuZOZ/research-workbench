import { createMcpHandler } from "@modelcontextprotocol/server";
import { authorizeMcpRequest } from "@/lib/mcp-auth";
import { buildResearchMcpServer } from "@/lib/mcp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(buildResearchMcpServer);

async function serve(request: Request) {
  const auth = authorizeMcpRequest(request);
  if (!auth.ok) return auth.response;
  return handler.fetch(request);
}

export const GET = serve;
export const POST = serve;
export const DELETE = serve;
