import { sqlite } from "@/lib/db";
import { calendarDateInTimeZone } from "@/lib/utils";
import { getAppSettings } from "@/lib/app-settings";

function timezone() {
  return getAppSettings(["timezone"]).timezone ?? process.env.APP_TIMEZONE ?? "Asia/Hong_Kong";
}

function addDays(date: string, days: number) {
  const d=new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
}

export function weekBounds(timeZone=timezone()) {
  const today=calendarDateInTimeZone(new Date(),timeZone);
  const d=new Date(`${today}T00:00:00Z`); const dow=d.getUTCDay(); const back=dow===0?6:dow-1;
  const start=addDays(today,-back); return {today,start,end:addDays(start,6),timezone:timeZone};
}

export function getFocusData() {
  const {today,timezone:tz}=weekBounds(); const weekEnd=addDays(today,7);
  const todayTasks=sqlite.prepare(`SELECT * FROM tasks WHERE archived_at IS NULL AND status!='done'
    AND (status='doing' OR (due_at IS NOT NULL AND due_at<=?))
    ORDER BY CASE WHEN due_at<? THEN 0 WHEN status='doing' THEN 1 ELSE 2 END,
    CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,due_at LIMIT 20`).all(today,today);
  const weekTasks=sqlite.prepare(`SELECT * FROM tasks WHERE archived_at IS NULL AND status!='done' AND due_at>? AND due_at<=?
    ORDER BY due_at,CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END LIMIT 30`).all(today,weekEnd);
  const inbox=sqlite.prepare("SELECT * FROM inbox_items WHERE archived_at IS NULL AND status='inbox' ORDER BY created_at DESC LIMIT 8").all();
  const inboxCount=(sqlite.prepare("SELECT COUNT(*) count FROM inbox_items WHERE archived_at IS NULL AND status='inbox'").get() as {count:number}).count;
  const staleBefore=addDays(today,-14);
  const staleProjects=sqlite.prepare(`SELECT id,title,status,progress,risk,updated_at FROM projects WHERE archived_at IS NULL
    AND status IN ('planning','active','paused') AND substr(updated_at,1,10)<? ORDER BY updated_at LIMIT 8`).all(staleBefore);
  return {today,weekEnd,timezone:tz,todayTasks,weekTasks,inbox,inboxCount,staleProjects};
}

export function getWeeklyReviewData() {
  const {start,end,today,timezone:tz}=weekBounds();
  const scalar=(sql:string)=>(sqlite.prepare(sql).get(start,end) as {count:number}).count;
  const counts={
    tasksCompleted:scalar("SELECT COUNT(*) count FROM tasks WHERE archived_at IS NULL AND status='done' AND substr(completed_at,1,10) BETWEEN ? AND ?"),
    questionsCreated:scalar("SELECT COUNT(*) count FROM research_questions WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ?"),
    experimentsCreated:scalar("SELECT COUNT(*) count FROM experiments WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ?"),
    runsCreated:scalar("SELECT COUNT(*) count FROM experiment_runs WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ?"),
    findingsCreated:scalar("SELECT COUNT(*) count FROM findings WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ?"),
    literatureAdded:scalar("SELECT COUNT(*) count FROM literature_items WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ?"),
  };
  const recentFindings=sqlite.prepare("SELECT id,title,status,confidence,created_at FROM findings WHERE archived_at IS NULL AND substr(created_at,1,10) BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 8").all(start,end);
  const completedTasks=sqlite.prepare("SELECT id,title,completed_at,priority FROM tasks WHERE archived_at IS NULL AND status='done' AND substr(completed_at,1,10) BETWEEN ? AND ? ORDER BY completed_at DESC LIMIT 12").all(start,end);
  const activity=sqlite.prepare("SELECT * FROM activity_logs WHERE substr(created_at,1,10) BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 20").all(start,end);
  const review=sqlite.prepare("SELECT * FROM weekly_reviews WHERE period_start=? LIMIT 1").get(start) ?? null;
  const staleBefore=addDays(today,-14);
  const staleProjects=sqlite.prepare("SELECT id,title,progress,updated_at FROM projects WHERE archived_at IS NULL AND status IN ('planning','active','paused') AND substr(updated_at,1,10)<? ORDER BY updated_at LIMIT 8").all(staleBefore);
  return {start,end,today,timezone:tz,counts,recentFindings,completedTasks,activity,review,staleProjects};
}
