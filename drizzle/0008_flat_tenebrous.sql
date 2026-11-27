ALTER TABLE `orders` ADD `buyer_input_label` varchar(60) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `buyer_input` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `buyer_input_label` varchar(60) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `buyer_input_placeholder` varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `buyer_input_hint` varchar(200) DEFAULT '' NOT NULL;--> statement-breakpoint
INSERT INTO `products` (`category_id`, `slug`, `name`, `subtitle`, `badge`, `description`, `image`, `theme`, `delivery_hint`, `buyer_input_label`, `buyer_input_placeholder`, `buyer_input_hint`, `listed`, `sort`)
SELECT `id`, 'muse-ai-token', 'Muse AI Token', '自动充值到你的 Muse 账号', '自动充值', 'Muse AI Token 自动充值，10 亿 token/份，5 份起购，每单最多 30 份。充值完成后发送通知邮件。', '/products/muse.svg', 'violet', '充值完成后发送通知邮件', 'Muse 邀请码', '请输入要充值的 Muse 邀请码', '请确认邀请码填写正确，充值后将无法撤回', 1, 15
FROM `product_categories`
WHERE `slug` = 'muse-ai'
  AND NOT EXISTS (SELECT 1 FROM `products` WHERE `slug` = 'muse-ai-token')
LIMIT 1;--> statement-breakpoint
INSERT INTO `product_variants` (`product_id`, `name`, `description`, `price_cents`, `original_price_cents`, `min_quantity`, `max_quantity`, `delivery_mode`, `listed`, `sort`, `affiliate_enabled`, `affiliate_cost_cents`)
SELECT `p`.`id`, '10 亿 Token/份', '10 亿 token/份', 200, 0, 5, 30, 'manual', 1, 10, 1, 0
FROM `products` `p`
WHERE `p`.`slug` = 'muse-ai-token'
  AND NOT EXISTS (SELECT 1 FROM `product_variants` `v` WHERE `v`.`product_id` = `p`.`id` AND `v`.`name` = '10 亿 Token/份')
LIMIT 1;