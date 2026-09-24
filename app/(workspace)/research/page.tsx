import Link from "next/link";
import { Beaker, Boxes, FlaskConical, Lightbulb, Network, PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const items = [
  ["/questions", "研究问题", "明确需要回答的关键未知量与验证标准", Lightbulb],
  ["/hypotheses", "研究假设", "把问题转化为可检验的机理判断和预测", Network],
  ["/experiments", "实验设计", "组织 MATLAB、PSCAD、ADPSS/HIL 等验证方案", FlaskConical],
  ["/runs", "实验运行", "保存每一次工况、参数、误差和结果", Beaker],
  ["/findings", "研究发现", "沉淀可复用、可引用的研究结论", Boxes],
  ["/artifacts", "科研资产", "管理代码、模型、数据、图表和外部文件位置", PackageSearch],
] as const;

export default function ResearchProcessPage() {
  return <div className="module-page">
    <PageHeader title="科研过程" description="从研究问题、假设、实验到发现和科研资产，形成可追溯的研究链。" />
    <div className="research-process-grid">
      {items.map(([href, title, description, Icon]) => <Link className="process-card" href={href} key={href}>
        <span><Icon size={22} /></span><div><h2>{title}</h2><p>{description}</p></div>
      </Link>)}
    </div>
  </div>;
}
