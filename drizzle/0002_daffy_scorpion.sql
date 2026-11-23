CREATE TABLE `affiliate_clicks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`price_code_id` int,
	`src` varchar(40) NOT NULL DEFAULT '',
	`visitor_key` varchar(64) NOT NULL DEFAULT '',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliate_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_email_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`code` varchar(12) NOT NULL,
	`purpose` varchar(16) NOT NULL DEFAULT 'activate',
	`expires_at` datetime(3) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`used_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliate_email_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'unused',
	`expires_at` datetime(3),
	`affiliate_id` int,
	`used_email` varchar(191) NOT NULL DEFAULT '',
	`used_at` datetime(3),
	`remark` varchar(200) NOT NULL DEFAULT '',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliate_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_invite_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`price_cents` int NOT NULL,
	`price_code_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliate_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_affiliate_price` UNIQUE(`affiliate_id`,`variant_id`,`price_code_id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`code` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`wechat` varchar(120) NOT NULL DEFAULT '',
	`wechat_qr` varchar(500) NOT NULL DEFAULT '',
	`qq` varchar(120) NOT NULL DEFAULT '',
	`telegram` varchar(191) NOT NULL DEFAULT '',
	`remark` varchar(200) NOT NULL DEFAULT '',
	`disabled_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_affiliates_email` UNIQUE(`email`),
	CONSTRAINT `uk_affiliates_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` bigint NOT NULL,
	`affiliate_id` int NOT NULL,
	`order_no` varchar(32) NOT NULL,
	`amount_cents` int NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`settled_at` datetime(3),
	`revoke_reason` varchar(200) NOT NULL DEFAULT '',
	`revoked_at` datetime(3),
	`withdrawn_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_commission_order` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `customer_bindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`customer_email` varchar(191) NOT NULL,
	`first_order_id` bigint,
	`remark` varchar(200) NOT NULL DEFAULT '',
	`bound_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `customer_bindings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`name` varchar(60) NOT NULL DEFAULT '',
	`code` varchar(16) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `price_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_price_code_value` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`amount_cents` int NOT NULL,
	`alipay_account` varchar(191) NOT NULL,
	`payee_name` varchar(60) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`reject_reason` varchar(300) NOT NULL DEFAULT '',
	`process_note` varchar(300) NOT NULL DEFAULT '',
	`processed_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `order_type` varchar(16) DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `affiliate_id` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `affiliate_code` varchar(16) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `price_code_value` varchar(16) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `src` varchar(40) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `system_price_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cost_price_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `commission_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `affiliate_enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `affiliate_cost_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_clicks_affiliate` ON `affiliate_clicks` (`affiliate_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_clicks_visitor` ON `affiliate_clicks` (`visitor_key`);--> statement-breakpoint
CREATE INDEX `idx_email_code_email` ON `affiliate_email_codes` (`email`,`purpose`);--> statement-breakpoint
CREATE INDEX `idx_email_code_expires` ON `affiliate_email_codes` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_invites_status` ON `affiliate_invites` (`status`);--> statement-breakpoint
CREATE INDEX `idx_invites_affiliate` ON `affiliate_invites` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `idx_price_variant` ON `affiliate_pricing` (`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_affiliates_status` ON `affiliates` (`status`);--> statement-breakpoint
CREATE INDEX `idx_commission_affiliate` ON `commissions` (`affiliate_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_commission_created` ON `commissions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_binding_email` ON `customer_bindings` (`customer_email`);--> statement-breakpoint
CREATE INDEX `idx_binding_affiliate` ON `customer_bindings` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `idx_price_code_affiliate` ON `price_codes` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `idx_withdraw_affiliate` ON `withdrawals` (`affiliate_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_withdraw_status` ON `withdrawals` (`status`);