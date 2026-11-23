CREATE TABLE `customer_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliate_id` int NOT NULL,
	`customer_email` varchar(191) NOT NULL,
	`order_id` int NOT NULL,
	`order_no` varchar(32) NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(120) NOT NULL,
	`variant_name` varchar(120) NOT NULL,
	`starts_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `customer_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_entitlement_order` UNIQUE(`order_id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `validity_days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `is_expiring` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `validity_days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_entitlement_affiliate` ON `customer_entitlements` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `idx_entitlement_email` ON `customer_entitlements` (`customer_email`);--> statement-breakpoint
CREATE INDEX `idx_entitlement_expires` ON `customer_entitlements` (`expires_at`);