DROP INDEX `idx_binding_email` ON `customer_bindings`;--> statement-breakpoint
ALTER TABLE `customer_bindings` ADD CONSTRAINT `uk_binding_email` UNIQUE(`customer_email`);