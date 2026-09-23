import { sqlite } from "../lib/db";
import { nowIso } from "../lib/utils";

if (process.env.ALLOW_SAMPLE_DATA !== "true") {
  throw new Error("示例数据写入已停止。仅在明确需要时设置 ALLOW_SAMPLE_DATA=true。");
}

const now = nowIso();
const projectId = crypto.randomUUID();
const paperId = crypto.randomUUID();
const taskId = crypto.randomUUID();

sqlite.transaction(() => {
  sqlite.prepare("INSERT INTO projects (id,title,code,category,role,status,start_date,end_date,progress,risk,summary,keywords,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(projectId, "示例：高比例新能源系统保护适应性研究", "DEMO-PS-01", "内部研究", "负责人", "active", "2026-01-01", "2026-12-31", 46, "watch", "用于演示项目推进、任务关联与风险状态。", "新能源并网；继电保护", now, now);
  sqlite.prepare("INSERT INTO papers (id,title,authors,author_role,venue,status,year,doi,abstract,keywords,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(paperId, "示例：弱电网条件下的保护约束分析", "研究者; 合作者", "第一作者", "示例期刊", "drafting", 2026, null, "此记录为演示内容，不代表真实成果。", "弱电网；保护约束", now, now);
  sqlite.prepare("INSERT INTO tasks (id,title,kind,status,priority,due_at,progress,entity_type,entity_id,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(taskId, "复核故障工况参数", "task", "doing", "high", new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10), 40, "projects", projectId, "示例任务，可随时删除。", now, now);
})();

console.log("已写入明确标记的示例数据。");
