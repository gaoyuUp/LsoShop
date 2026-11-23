ALTER TABLE `affiliates` ADD `nickname` varchar(60) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `commissions` ADD `cost_cents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_bindings` ADD `repeat_buy` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_bindings` ADD `expires_at` datetime(3);--> statement-breakpoint
ALTER TABLE `customer_bindings` ADD `last_order_at` datetime(3);--> statement-breakpoint
CREATE INDEX `idx_orders_affiliate` ON `orders` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_type` ON `orders` (`order_type`);--> statement-breakpoint
CREATE INDEX `idx_orders_src` ON `orders` (`src`);