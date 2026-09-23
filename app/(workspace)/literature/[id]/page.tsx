import { RecordDetail } from "@/components/record-detail";
import { modules } from "@/lib/module-config";

export default async function LiteratureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <RecordDetail config={modules.literature} id={(await params).id} />;
}
