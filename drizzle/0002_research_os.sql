CREATE TABLE `research_questions` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `project_id` text,
  `status` text DEFAULT 'open' NOT NULL,
  `context` text,
  `success_criteria` text,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_questions_project_status` ON `research_questions` (`project_id`, `status`);

CREATE TABLE `hypotheses` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `project_id` text,
  `question_id` text,
  `status` text DEFAULT 'proposed' NOT NULL,
  `rationale` text,
  `prediction` text,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_hypotheses_project_status` ON `hypotheses` (`project_id`, `status`);

CREATE TABLE `experiments` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `project_id` text,
  `hypothesis_id` text,
  `status` text DEFAULT 'planned' NOT NULL,
  `method` text,
  `platform` text,
  `variables` text,
  `expected_result` text,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_experiments_project_status` ON `experiments` (`project_id`, `status`);

CREATE TABLE `experiment_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `experiment_id` text,
  `status` text DEFAULT 'planned' NOT NULL,
  `run_at` text,
  `parameters` text,
  `result_summary` text,
  `error_metric` real,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_runs_experiment_status` ON `experiment_runs` (`experiment_id`, `status`);

CREATE TABLE `findings` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `project_id` text,
  `experiment_id` text,
  `run_id` text,
  `status` text DEFAULT 'candidate' NOT NULL,
  `claim` text,
  `evidence` text,
  `confidence` integer DEFAULT 50 NOT NULL,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_findings_project_status` ON `findings` (`project_id`, `status`);

CREATE TABLE `artifacts` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `project_id` text,
  `experiment_id` text,
  `run_id` text,
  `artifact_type` text DEFAULT 'document' NOT NULL,
  `storage_type` text DEFAULT 'upload' NOT NULL,
  `location` text,
  `version` text,
  `checksum` text,
  `keywords` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_artifacts_project_type` ON `artifacts` (`project_id`, `artifact_type`);

CREATE TABLE `record_revisions` (
  `id` text PRIMARY KEY NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `actor` text DEFAULT 'user' NOT NULL,
  `snapshot` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `idx_revisions_entity_created` ON `record_revisions` (`entity_type`, `entity_id`, `created_at`);

CREATE TABLE `promotion_evidence_links` (
  `id` text PRIMARY KEY NOT NULL,
  `metric_id` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text NOT NULL,
  `note` text,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `idx_promotion_evidence_unique` ON `promotion_evidence_links` (`metric_id`, `entity_type`, `entity_id`);

DROP INDEX IF EXISTS `idx_research_links_unique`;
CREATE UNIQUE INDEX `idx_research_links_unique` ON `research_links` (`source_type`, `source_id`, `target_type`, `target_id`, `relation`);
