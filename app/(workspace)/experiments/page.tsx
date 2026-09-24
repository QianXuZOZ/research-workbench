import { ModuleView } from "@/components/module-view";
import { modules } from "@/lib/module-config";

export default function Page() {
  return <ModuleView config={modules.experiments} />;
}
