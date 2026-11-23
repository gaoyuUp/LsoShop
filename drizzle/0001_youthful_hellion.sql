CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_categories_slug` UNIQUE(`slug`),
	CONSTRAINT `uk_categories_name` UNIQUE(`name`)
);
--> statement-breakpoint
INSERT INTO `product_categories` (`name`, `slug`, `sort`) VALUES ('Muse AI', 'muse-ai', 10), ('Plus成品', 'plus-product', 20);
--> statement-breakpoint
ALTER TABLE `products` ADD `category_id` int;
--> statement-breakpoint
UPDATE `products` SET `category_id` = (SELECT `id` FROM `product_categories` WHERE `slug` = 'muse-ai') WHERE `slug` = 'muse-ai';
--> statement-breakpoint
UPDATE `products` SET `category_id` = (SELECT `id` FROM `product_categories` WHERE `slug` = 'plus-product') WHERE `slug` = 'gpt-plus';
--> statement-breakpoint
UPDATE `products` SET `category_id` = (SELECT `id` FROM `product_categories` ORDER BY `sort`, `id` LIMIT 1) WHERE `category_id` IS NULL;
--> statement-breakpoint
ALTER TABLE `products` MODIFY `category_id` int NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category_id`);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_product_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE restrict ON UPDATE no action;
