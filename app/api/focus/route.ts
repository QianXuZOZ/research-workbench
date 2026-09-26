import { requireApiSession } from "@/lib/security";
import { getFocusData } from "@/lib/workflow-data";

export async function GET() {
  const auth=await requireApiSession(); if("response" in auth) return auth.response;
  return Response.json(getFocusData());
}
