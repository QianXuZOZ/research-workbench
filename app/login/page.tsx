import { LoginView } from "@/components/login-view";
import { getWorkbenchName } from "@/lib/app-settings";

export default function LoginPage() {
  return <LoginView workbenchName={getWorkbenchName()} />;
}
