CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(60) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`last_login_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_admins_username` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_id` bigint,
	`to_email` varchar(191) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`html` text NOT NULL,
	`status` varchar(16) NOT NULL,
	`error` varchar(500) NOT NULL DEFAULT '',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`variant_id` int NOT NULL,
	`content` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'available',
	`order_id` bigint,
	`sold_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`order_no` varchar(32) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`user_id` int,
	`email` varchar(191) NOT NULL DEFAULT '',
	`product_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`product_name` varchar(120) NOT NULL,
	`variant_name` varchar(120) NOT NULL,
	`product_image` varchar(500) NOT NULL DEFAULT '',
	`unit_price_cents` int NOT NULL,
	`quantity` int NOT NULL,
	`total_cents` int NOT NULL,
	`delivery_mode` varchar(16) NOT NULL DEFAULT 'auto',
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`payment_method` varchar(20) NOT NULL DEFAULT 'alipay',
	`trade_no` varchar(64),
	`delivery_content` text,
	`email_status` varchar(16) NOT NULL DEFAULT 'none',
	`admin_remark` varchar(500) NOT NULL DEFAULT '',
	`client_ip` varchar(64) NOT NULL DEFAULT '',
	`expires_at` datetime(3) NOT NULL,
	`paid_at` datetime(3),
	`delivered_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_orders_no` UNIQUE(`order_no`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`price_cents` int NOT NULL,
	`original_price_cents` int NOT NULL DEFAULT 0,
	`min_quantity` int NOT NULL DEFAULT 1,
	`max_quantity` int NOT NULL DEFAULT 10,
	`delivery_mode` varchar(16) NOT NULL DEFAULT 'auto',
	`listed` boolean NOT NULL DEFAULT true,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`subtitle` varchar(160) NOT NULL DEFAULT '',
	`badge` varchar(40) NOT NULL DEFAULT '',
	`description` text,
	`image` varchar(500) NOT NULL DEFAULT '',
	`theme` varchar(20) NOT NULL DEFAULT 'violet',
	`delivery_hint` varchar(160) NOT NULL DEFAULT '',
	`warnings` json NOT NULL DEFAULT ('[]'),
	`notes` json NOT NULL DEFAULT ('[]'),
	`require_email` boolean NOT NULL DEFAULT true,
	`listed` boolean NOT NULL DEFAULT true,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_products_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255),
	`nickname` varchar(60) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_users_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `idx_email_order` ON `email_logs` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_variant_status` ON `inventory_items` (`variant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_inventory_order` ON `inventory_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_email` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `idx_orders_user` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_variants_product` ON `product_variants` (`product_id`);