import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "总览" };

export default function DashboardPage() {
  return <DashboardView initialData={getDashboardData()} />;
}
