import { ModuleView } from "@/components/module-view";
import { modules } from "@/lib/module-config";

export default function LiteraturePage() {
  return <ModuleView config={modules.literature} />;
}
