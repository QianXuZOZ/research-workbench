import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { getWorkbenchName } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const workbenchName = getWorkbenchName();
  return { title: workbenchName };
}

export default function LoginPage() {
  return <LoginView workbenchName={getWorkbenchName()} />;
}
