import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const audit = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
};

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_admins_email").on(table.email)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  csrfToken: text("csrf_token").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
}, (table) => [uniqueIndex("idx_sessions_token_hash").on(table.tokenHash), index("idx_sessions_expires").on(table.expiresAt)]);

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  blockedUntil: text("blocked_until"),
  updatedAt: text("updated_at").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code"),
  category: text("category").notNull().default("纵向项目"),
  role: text("role").notNull().default("负责人"),
  status: text("status").notNull().default("planning"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  completedAt: text("completed_at"),
  funding: real("funding"),
  leader: text("leader"),
  members: text("members"),
  progress: integer("progress").notNull().default(0),
  risk: text("risk").notNull().default("normal"),
  summary: text("summary"),
  notes: text("notes"),
  keywords: text("keywords"),
  ...audit,
}, (table) => [index("idx_projects_status_end").on(table.status, table.endDate)]);

export const papers = sqliteTable("papers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors"),
  authorRole: text("author_role"),
  venue: text("venue"),
  venueType: text("venue_type").notNull().default("journal"),
  status: text("status").notNull().default("idea"),
  year: integer("year"),
  submittedAt: text("submitted_at"),
  acceptedAt: text("accepted_at"),
  publishedAt: text("published_at"),
  doi: text("doi"),
  journalQuartile: text("journal_quartile"),
  casQuartile: text("cas_quartile"),
  impactFactor: real("impact_factor"),
  abstract: text("abstract"),
  keywords: text("keywords"),
  notes: text("notes"),
  bibtex: text("bibtex"),
  ...audit,
}, (table) => [uniqueIndex("idx_papers_doi_unique").on(table.doi), index("idx_papers_status_year").on(table.status, table.year)]);

export const literatureItems = sqliteTable("literature_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors"),
  venue: text("venue"),
  venueType: text("venue_type").notNull().default("journal"),
  status: text("status").notNull().default("unread"),
  year: integer("year"),
  doi: text("doi"),
  url: text("url"),
  abstract: text("abstract"),
  keywords: text("keywords"),
  notes: text("notes"),
  bibtex: text("bibtex"),
  ...audit,
}, (table) => [
  uniqueIndex("idx_literature_doi_unique").on(table.doi),
  index("idx_literature_status_year").on(table.status, table.year),
]);

export const researchQuestions = sqliteTable("research_questions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  projectId: text("project_id"),
  status: text("status").notNull().default("open"),
  context: text("context"),
  successCriteria: text("success_criteria"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_questions_project_status").on(table.projectId, table.status)]);

export const hypotheses = sqliteTable("hypotheses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  projectId: text("project_id"),
  questionId: text("question_id"),
  status: text("status").notNull().default("proposed"),
  rationale: text("rationale"),
  prediction: text("prediction"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_hypotheses_project_status").on(table.projectId, table.status)]);

export const experiments = sqliteTable("experiments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  projectId: text("project_id"),
  hypothesisId: text("hypothesis_id"),
  status: text("status").notNull().default("planned"),
  method: text("method"),
  platform: text("platform"),
  variables: text("variables"),
  expectedResult: text("expected_result"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_experiments_project_status").on(table.projectId, table.status)]);

export const experimentRuns = sqliteTable("experiment_runs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  experimentId: text("experiment_id"),
  status: text("status").notNull().default("planned"),
  runAt: text("run_at"),
  parameters: text("parameters"),
  resultSummary: text("result_summary"),
  errorMetric: real("error_metric"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_runs_experiment_status").on(table.experimentId, table.status)]);

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  projectId: text("project_id"),
  experimentId: text("experiment_id"),
  runId: text("run_id"),
  status: text("status").notNull().default("candidate"),
  claim: text("claim"),
  evidence: text("evidence"),
  confidence: integer("confidence").notNull().default(50),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_findings_project_status").on(table.projectId, table.status)]);

export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  projectId: text("project_id"),
  experimentId: text("experiment_id"),
  runId: text("run_id"),
  artifactType: text("artifact_type").notNull().default("document"),
  storageType: text("storage_type").notNull().default("upload"),
  location: text("location"),
  version: text("version"),
  checksum: text("checksum"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_artifacts_project_type").on(table.projectId, table.artifactType)]);

export const patents = sqliteTable("patents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  patentType: text("patent_type").notNull().default("invention"),
  status: text("status").notNull().default("drafting"),
  applicationNumber: text("application_number"),
  publicationNumber: text("publication_number"),
  inventors: text("inventors"),
  applicant: text("applicant"),
  agency: text("agency"),
  filedAt: text("filed_at"),
  publishedAt: text("published_at"),
  grantedAt: text("granted_at"),
  feeDueAt: text("fee_due_at"),
  abstract: text("abstract"),
  keywords: text("keywords"),
  notes: text("notes"),
  ...audit,
}, (table) => [uniqueIndex("idx_patents_application_unique").on(table.applicationNumber), index("idx_patents_status_due").on(table.status, table.feeDueAt)]);

export const growthItems = sqliteTable("growth_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("skill"),
  status: text("status").notNull().default("planned"),
  startedAt: text("started_at"),
  dueAt: text("due_at"),
  completedAt: text("completed_at"),
  targetValue: real("target_value"),
  currentValue: real("current_value").notNull().default(0),
  unit: text("unit"),
  provider: text("provider"),
  evidence: text("evidence"),
  notes: text("notes"),
  keywords: text("keywords"),
  ...audit,
}, (table) => [index("idx_growth_status_due").on(table.status, table.dueAt)]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("task"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueAt: text("due_at"),
  startAt: text("start_at"),
  completedAt: text("completed_at"),
  progress: integer("progress").notNull().default(0),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_tasks_status_due").on(table.status, table.dueAt), index("idx_tasks_entity").on(table.entityType, table.entityId)]);

export const promotionCycles = sqliteTable("promotion_cycles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  targetRole: text("target_role"),
  status: text("status").notNull().default("active"),
  startsAt: text("starts_at"),
  dueAt: text("due_at"),
  notes: text("notes"),
  ...audit,
}, (table) => [index("idx_promotion_cycles_status_due").on(table.status, table.dueAt)]);

export const promotionMetrics = sqliteTable("promotion_metrics", {
  id: text("id").primaryKey(),
  cycleId: text("cycle_id").notNull().references(() => promotionCycles.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  name: text("name").notNull(),
  metricType: text("metric_type").notNull().default("count"),
  sourceType: text("source_type").notNull().default("manual"),
  sourceFilter: text("source_filter"),
  targetValue: real("target_value").notNull().default(1),
  manualValue: real("manual_value").notNull().default(0),
  weight: real("weight").notNull().default(1),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  evidenceNotes: text("evidence_notes"),
  ...audit,
}, (table) => [index("idx_promotion_metrics_cycle").on(table.cycleId)]);

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  originalName: text("original_name").notNull(),
  storageName: text("storage_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  label: text("label"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_attachments_entity").on(table.entityType, table.entityId)]);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("cyan"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_tags_name").on(table.name)]);

export const recordTags = sqliteTable("record_tags", {
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("idx_record_tags_unique").on(table.entityType, table.entityId, table.tagId), index("idx_record_tags_tag").on(table.tagId)]);

export const researchLinks = sqliteTable("research_links", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  relation: text("relation").notNull().default("related"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_research_links_unique").on(table.sourceType, table.sourceId, table.targetType, table.targetId, table.relation), index("idx_research_links_source").on(table.sourceType, table.sourceId)]);

export const recordRevisions = sqliteTable("record_revisions", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actor: text("actor").notNull().default("user"),
  snapshot: text("snapshot").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_revisions_entity_created").on(table.entityType, table.entityId, table.createdAt)]);

export const promotionEvidenceLinks = sqliteTable("promotion_evidence_links", {
  id: text("id").primaryKey(),
  metricId: text("metric_id").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_promotion_evidence_unique").on(table.metricId, table.entityType, table.entityId)]);

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_activity_logs_created").on(table.createdAt)]);


export const inboxItems = sqliteTable("inbox_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  kind: text("kind").notNull().default("note"),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("inbox"),
  targetType: text("target_type"),
  targetId: text("target_id"),
  processedAt: text("processed_at"),
  ...audit,
}, (table) => [index("idx_inbox_status_created").on(table.status, table.createdAt)]);

export const weeklyReviews = sqliteTable("weekly_reviews", {
  id: text("id").primaryKey(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  reflection: text("reflection"),
  nextFocus: text("next_focus"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("idx_weekly_reviews_period").on(table.periodStart)]);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
