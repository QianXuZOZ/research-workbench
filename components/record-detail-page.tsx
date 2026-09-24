import { notFound } from "next/navigation";
import type { ModuleConfig } from "@/lib/module-config";
import { getRecordDetailData } from "@/lib/record-data";
import { RecordDetail } from "@/components/record-detail";

export function RecordDetailPage({ config, id }: { config: ModuleConfig; id: string }) {
  const initialData = getRecordDetailData(config.type, id);
  if (!initialData) notFound();
  return <RecordDetail config={config} id={id} initialData={initialData} />;
}
