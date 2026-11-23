DROP TABLE `users`;--> statement-breakpoint
DROP INDEX `idx_orders_user` ON `orders`;--> statement-breakpoint
ALTER TABLE `admins` DROP COLUMN `last_login_at`;--> statement-breakpoint
ALTER TABLE `affiliates` DROP COLUMN `remark`;--> statement-breakpoint
ALTER TABLE `affiliates` DROP COLUMN `disabled_at`;--> statement-breakpoint
ALTER TABLE `commissions` DROP COLUMN `withdrawn_at`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `user_id`;
--> statement-breakpoint

-- ===== table / column comments =====
ALTER TABLE `product_categories` COMMENT = '商品分类';--> statement-breakpoint
ALTER TABLE `products` COMMENT = '商品主表';--> statement-breakpoint
ALTER TABLE `product_variants` COMMENT = '商品规格';--> statement-breakpoint
ALTER TABLE `inventory_items` COMMENT = '库存与交付内容';--> statement-breakpoint
ALTER TABLE `orders` COMMENT = '订单主表';--> statement-breakpoint
ALTER TABLE `email_logs` COMMENT = '邮件发送记录';--> statement-breakpoint
ALTER TABLE `admins` COMMENT = '后台管理员账号';--> statement-breakpoint
ALTER TABLE `settings` COMMENT = '站点键值设置';--> statement-breakpoint
ALTER TABLE `affiliate_invites` COMMENT = '代理邀请码';--> statement-breakpoint
ALTER TABLE `affiliates` COMMENT = '代理账号';--> statement-breakpoint
ALTER TABLE `price_codes` COMMENT = '代理价位码';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` COMMENT = '代理客户价';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` COMMENT = '推广链接访问记录';--> statement-breakpoint
ALTER TABLE `customer_bindings` COMMENT = '客户永久绑定关系';--> statement-breakpoint
ALTER TABLE `customer_entitlements` COMMENT = '客户会员权益与到期时间';--> statement-breakpoint
ALTER TABLE `commissions` COMMENT = '佣金流水';--> statement-breakpoint
ALTER TABLE `withdrawals` COMMENT = '代理提现申请';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` COMMENT = '代理邮箱验证码';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `slug` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL 唯一标识';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `sort` int NOT NULL DEFAULT '0' COMMENT '排序值，越小越靠前';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `slug` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL 唯一标识';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `subtitle` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '商品副标题';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `badge` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '商品角标文字';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `description` text COLLATE utf8mb4_unicode_ci COMMENT '商品描述';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '商品图片地址';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `theme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'violet' COMMENT '商品卡片主题色';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `delivery_hint` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '交付方式说明';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `warnings` json NOT NULL DEFAULT (_utf8mb4'[]') COMMENT '购买前警告，JSON 字符串数组';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `notes` json NOT NULL DEFAULT (_utf8mb4'[]') COMMENT '购买须知，JSON 对象数组';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `require_email` tinyint(1) NOT NULL DEFAULT '1' COMMENT '下单是否必须填写收件邮箱';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `listed` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否在前台展示';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `sort` int NOT NULL DEFAULT '0' COMMENT '排序值，越小越靠前';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `category_id` int NOT NULL COMMENT '所属商品分类 ID';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `is_expiring` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为会过期的会员/订阅商品';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `validity_days` int NOT NULL DEFAULT '0' COMMENT '会员有效期天数，0 表示永久';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `product_id` int NOT NULL COMMENT '商品 ID';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规格名称';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '规格说明';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `price_cents` int NOT NULL COMMENT '售价（分）';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `original_price_cents` int NOT NULL DEFAULT '0' COMMENT '划线原价（分），0 表示不显示';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `min_quantity` int NOT NULL DEFAULT '1' COMMENT '单笔最小购买数量';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `max_quantity` int NOT NULL DEFAULT '10' COMMENT '单笔最大购买数量';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `delivery_mode` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'auto' COMMENT '交付方式：auto 自动发货 / manual 人工发货';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `listed` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否在前台展示';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `sort` int NOT NULL DEFAULT '0' COMMENT '排序值，越小越靠前';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `affiliate_enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否参与代理销售';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `affiliate_cost_cents` int NOT NULL DEFAULT '0' COMMENT '代理成本价（分），0 表示使用系统售价';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `variant_id` int NOT NULL COMMENT '商品规格 ID';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '交付内容/卡密';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available' COMMENT '库存状态：available / locked / sold';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `order_id` bigint DEFAULT NULL COMMENT '关联订单 ID';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `sold_at` datetime(3) DEFAULT NULL COMMENT '售出时间';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `order_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单查询口令的 SHA-256 哈希';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '买家收件邮箱';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `product_id` int NOT NULL COMMENT '下单时商品 ID 快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `variant_id` int NOT NULL COMMENT '下单时规格 ID 快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `product_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `variant_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规格名称快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `product_image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '下单时商品图片快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `unit_price_cents` int NOT NULL COMMENT '实际成交单价（分）';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `quantity` int NOT NULL COMMENT '购买数量';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `total_cents` int NOT NULL COMMENT '订单总金额（分）';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `delivery_mode` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'auto' COMMENT '交付方式：auto 自动发货 / manual 人工发货';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '订单状态';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `payment_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'alipay' COMMENT '支付方式';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `trade_no` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '支付渠道交易号';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `delivery_content` text COLLATE utf8mb4_unicode_ci COMMENT '交付内容快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `email_status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none' COMMENT '交付邮件状态';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `admin_remark` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '后台备注';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `client_ip` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '下单客户端 IP';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `expires_at` datetime(3) NOT NULL COMMENT '过期时间/会员到期时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `paid_at` datetime(3) DEFAULT NULL COMMENT '付款时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `delivered_at` datetime(3) DEFAULT NULL COMMENT '发货时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `order_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '订单类型：normal 普通 / self 代理自购 / affiliate 代理推广';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `affiliate_id` int DEFAULT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `affiliate_code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '推广码快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `price_code_value` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '价位码值快照';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `src` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '推广渠道来源';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `system_price_cents` int NOT NULL DEFAULT '0' COMMENT '系统公开价快照（分）';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `cost_price_cents` int NOT NULL DEFAULT '0' COMMENT '代理成本价快照（分）';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `commission_cents` int NOT NULL DEFAULT '0' COMMENT '本单佣金（分）';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `validity_days` int NOT NULL DEFAULT '0' COMMENT '下单时会员有效期快照（天），0 表示永久';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `order_id` bigint DEFAULT NULL COMMENT '关联订单 ID';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `to_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收件邮箱';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮件主题';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `html` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮件 HTML 内容';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮件状态：sent / failed / skipped';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `error` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '发送失败原因';--> statement-breakpoint
ALTER TABLE `email_logs` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `admins` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `admins` MODIFY COLUMN `username` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '管理员用户名';--> statement-breakpoint
ALTER TABLE `admins` MODIFY COLUMN `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '管理员密码哈希';--> statement-breakpoint
ALTER TABLE `admins` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `settings` MODIFY COLUMN `key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设置键';--> statement-breakpoint
ALTER TABLE `settings` MODIFY COLUMN `value` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设置值';--> statement-breakpoint
ALTER TABLE `settings` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `code` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邀请码';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unused' COMMENT '邀请码状态：unused / used / disabled';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `expires_at` datetime(3) DEFAULT NULL COMMENT '过期时间/会员到期时间';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `affiliate_id` int DEFAULT NULL COMMENT '开通后关联的代理 ID';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `used_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '使用该邀请码的邮箱';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `used_at` datetime(3) DEFAULT NULL COMMENT '使用时间';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `remark` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `affiliate_invites` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '代理登录邮箱';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '代理推广码';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '代理状态：active / disabled';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `wechat` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理微信号';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `wechat_qr` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理微信二维码地址';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `qq` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理 QQ';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `telegram` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理 Telegram';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `nickname` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '代理展示名';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '价位码名称';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '价位码';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `price_codes` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `variant_id` int NOT NULL COMMENT '商品规格 ID';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `price_cents` int NOT NULL COMMENT '售价（分）';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `price_code_id` int DEFAULT NULL COMMENT '价位码 ID，空表示代理主价格';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `affiliate_pricing` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `price_code_id` int DEFAULT NULL COMMENT '价位码 ID，空表示代理主价格';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `src` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '推广渠道来源';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `visitor_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '匿名访客标识';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `affiliate_clicks` MODIFY COLUMN `is_self` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否代理本人访问';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `customer_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户邮箱';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `first_order_id` bigint DEFAULT NULL COMMENT '首次绑定订单 ID';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `remark` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `bound_at` datetime(3) NOT NULL COMMENT '绑定时间';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `repeat_buy` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已产生复购';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `expires_at` datetime(3) DEFAULT NULL COMMENT '过期时间/会员到期时间';--> statement-breakpoint
ALTER TABLE `customer_bindings` MODIFY COLUMN `last_order_at` datetime(3) DEFAULT NULL COMMENT '最近成交时间';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `customer_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户邮箱';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `order_id` int NOT NULL COMMENT '关联订单 ID';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `order_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号快照';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `product_id` int NOT NULL COMMENT '商品 ID';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `product_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称快照';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `variant_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规格名称快照';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `starts_at` datetime(3) NOT NULL COMMENT '权益开始时间';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `expires_at` datetime(3) NOT NULL COMMENT '过期时间/会员到期时间';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '权益状态：active / expired / ended';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `customer_entitlements` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `order_id` bigint NOT NULL COMMENT '关联订单 ID';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '归因代理 ID';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `order_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号快照';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `amount_cents` int NOT NULL COMMENT '金额（分）';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '佣金状态：pending / settled / withdrawn / revoked';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `settled_at` datetime(3) DEFAULT NULL COMMENT '佣金结算时间';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `revoke_reason` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '佣金撤销原因';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `revoked_at` datetime(3) DEFAULT NULL COMMENT '佣金撤销时间';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `commissions` MODIFY COLUMN `cost_cents` int NOT NULL DEFAULT '0' COMMENT '佣金对应的成本价快照（分）';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `affiliate_id` int NOT NULL COMMENT '申请提现的代理 ID';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `amount_cents` int NOT NULL COMMENT '金额（分）';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `alipay_account` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付宝账号';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `payee_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付宝收款人姓名';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '提现状态：pending / paid / rejected / canceled';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `reject_reason` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '拒绝原因';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `process_note` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '处理备注';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `processed_at` datetime(3) DEFAULT NULL COMMENT '处理时间';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';--> statement-breakpoint
ALTER TABLE `withdrawals` MODIFY COLUMN `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '最后更新时间';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT COMMENT '主键 ID';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '接收验证码的邮箱';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `code` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱验证码';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `purpose` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activate' COMMENT '验证码用途：activate 开通 / login 登录';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `expires_at` datetime(3) NOT NULL COMMENT '验证码过期时间';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `attempts` int NOT NULL DEFAULT '0' COMMENT '已尝试次数';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `used_at` datetime(3) DEFAULT NULL COMMENT '验证码使用时间';--> statement-breakpoint
ALTER TABLE `affiliate_email_codes` MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间';
