import type { ModuleConfig } from "@/lib/module-config";
import { listRecordItems } from "@/lib/record-data";
import { ModuleView } from "@/components/module-view";

export function RecordModulePage({ config }: { config: ModuleConfig }) {
  const initialItems = listRecordItems(config.type, { limit: 100 });
  return <ModuleView config={config} initialItems={initialItems} />;
}
