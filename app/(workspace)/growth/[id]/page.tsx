import { RecordDetail } from "@/components/record-detail"; import { modules } from "@/lib/module-config";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <RecordDetail config={modules.growth} id={(await params).id} />; }
