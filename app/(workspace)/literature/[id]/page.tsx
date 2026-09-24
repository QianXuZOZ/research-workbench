import { RecordDetailPage } from "@/components/record-detail-page";
import { modules } from "@/lib/module-config";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <RecordDetailPage config={modules.literature} id={(await params).id} />;
}
