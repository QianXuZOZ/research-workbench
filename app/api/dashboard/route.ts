import { requireApiSession } from "@/lib/security";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  return Response.json(getDashboardData());
}
