import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { getWorkbenchName } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const workbenchName = getWorkbenchName();
  return { title: workbenchName };
}

function safeNext(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  return <LoginView workbenchName={getWorkbenchName()} nextPath={safeNext(params.next)} />;
}
