CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`name` text NOT NULL,
	`file_name` text NOT NULL,
	`object_key` text NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`edit_state` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
