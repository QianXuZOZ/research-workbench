CREATE TABLE `inbox_items` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `body` text,
  `kind` text DEFAULT 'note' NOT NULL,
  `source_url` text,
  `status` text DEFAULT 'inbox' NOT NULL,
  `target_type` text,
  `target_id` text,
  `processed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);
CREATE INDEX `idx_inbox_status_created` ON `inbox_items` (`status`,`created_at`);

CREATE TABLE `weekly_reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `period_start` text NOT NULL,
  `period_end` text NOT NULL,
  `reflection` text,
  `next_focus` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `idx_weekly_reviews_period` ON `weekly_reviews` (`period_start`);
