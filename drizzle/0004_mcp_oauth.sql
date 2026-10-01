CREATE TABLE `oauth_authorization_codes` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_id` text NOT NULL,
  `code_hash` text NOT NULL,
  `client_id` text NOT NULL,
  `redirect_uri` text NOT NULL,
  `code_challenge` text NOT NULL,
  `resource` text NOT NULL,
  `scope` text NOT NULL,
  `expires_at` text NOT NULL,
  `used_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `idx_oauth_codes_hash` ON `oauth_authorization_codes` (`code_hash`);
CREATE INDEX `idx_oauth_codes_expires` ON `oauth_authorization_codes` (`expires_at`);

CREATE TABLE `oauth_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_id` text NOT NULL,
  `client_id` text NOT NULL,
  `resource` text NOT NULL,
  `scope` text NOT NULL,
  `access_token_hash` text NOT NULL,
  `refresh_token_hash` text NOT NULL,
  `access_expires_at` text NOT NULL,
  `refresh_expires_at` text NOT NULL,
  `revoked_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `idx_oauth_access_hash` ON `oauth_tokens` (`access_token_hash`);
CREATE UNIQUE INDEX `idx_oauth_refresh_hash` ON `oauth_tokens` (`refresh_token_hash`);
CREATE INDEX `idx_oauth_tokens_admin` ON `oauth_tokens` (`admin_id`);
CREATE INDEX `idx_oauth_tokens_refresh_expires` ON `oauth_tokens` (`refresh_expires_at`);
