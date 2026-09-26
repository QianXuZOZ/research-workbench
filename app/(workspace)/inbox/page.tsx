import type { Metadata } from "next";
import { InboxView } from "@/components/inbox-view";
import { listInboxItems } from "@/lib/inbox-data";

export const metadata:Metadata={title:"收集箱"};

export default function InboxPage(){
  return <InboxView initialItems={listInboxItems("inbox")}/>;
}
