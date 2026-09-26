import type { Metadata } from "next";
import { ReviewCenter } from "@/components/review-center";
import { getWeeklyReviewData } from "@/lib/workflow-data";

export const metadata:Metadata={title:"复盘中心"};

export default function ReviewsPage(){
  return <ReviewCenter initialData={getWeeklyReviewData()}/>;
}
