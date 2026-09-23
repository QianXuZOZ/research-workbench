import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span><Icon size={24} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
