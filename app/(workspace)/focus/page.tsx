import type { Metadata } from "next";
import { FocusView } from "@/components/focus-view";
import { getFocusData } from "@/lib/workflow-data";

export const metadata:Metadata={title:"今日"};

export default function FocusPage(){
  return <FocusView initialData={getFocusData()}/>;
}
