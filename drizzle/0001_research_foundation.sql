ALTER TABLE `projects` ADD `completed_at` text;

CREATE TABLE `literature_items` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `authors` text,
  `venue` text,
  `venue_type` text DEFAULT 'journal' NOT NULL,
  `status` text DEFAULT 'unread' NOT NULL,
  `year` integer,
  `doi` text,
  `url` text,
  `abstract` text,
  `keywords` text,
  `notes` text,
  `bibtex` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `archived_at` text
);

CREATE UNIQUE INDEX `idx_literature_doi_unique` ON `literature_items` (`doi`) WHERE `doi` IS NOT NULL AND `doi` != '';
CREATE INDEX `idx_literature_status_year` ON `literature_items` (`status`, `year`);
