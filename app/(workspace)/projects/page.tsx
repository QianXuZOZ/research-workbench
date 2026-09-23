import { ModuleView } from "@/components/module-view"; import { modules } from "@/lib/module-config";
export default function ProjectsPage() { return <ModuleView config={modules.projects} />; }
