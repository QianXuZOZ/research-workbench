import { RecordModulePage } from "@/components/record-module-page";
import { modules } from "@/lib/module-config";

export default function Page() {
  return <RecordModulePage config={modules.findings} />;
}
