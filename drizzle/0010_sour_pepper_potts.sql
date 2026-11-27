CREATE TABLE `affiliate_login_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`email` varchar(191) NOT NULL,
	`ip` varchar(64) NOT NULL DEFAULT '',
	`country_code` varchar(8) NOT NULL DEFAULT '',
	`country_name` varchar(80) NOT NULL DEFAULT '',
	`region` varchar(80) NOT NULL DEFAULT '',
	`city` varchar(80) NOT NULL DEFAULT '',
	`isp` varchar(120) NOT NULL DEFAULT '',
	`user_agent` varchar(500) NOT NULL DEFAULT '',
	`method` varchar(16) NOT NULL DEFAULT 'login',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliate_login_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_login_logs_affiliate` ON `affiliate_login_logs` (`affiliate_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_login_logs_created` ON `affiliate_login_logs` (`created_at`);