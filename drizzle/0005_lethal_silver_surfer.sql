CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`type` enum('free_post','discount_percent','discount_fixed') DEFAULT 'free_post',
	`value` int DEFAULT 1,
	`maxUses` int DEFAULT 1,
	`usedCount` int DEFAULT 0,
	`usedBy` int,
	`usedAt` timestamp,
	`expiresAt` timestamp,
	`createdBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `applications` ADD `checkInAt` bigint;--> statement-breakpoint
ALTER TABLE `applications` ADD `checkOutAt` bigint;--> statement-breakpoint
ALTER TABLE `applications` ADD `shiftStartedAt` bigint;--> statement-breakpoint
ALTER TABLE `applications` ADD `shiftEndedAt` bigint;--> statement-breakpoint
ALTER TABLE `applications` ADD `hoursWorked` decimal(6,2);--> statement-breakpoint
ALTER TABLE `applications` ADD `totalWagesOwed` decimal(10,2);--> statement-breakpoint
ALTER TABLE `applications` ADD `payoutStatus` enum('unpaid','processing','paid','failed') DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `applications` ADD `payoutMethod` enum('stripe_bank','stripe_instant','cash_app','square');--> statement-breakpoint
ALTER TABLE `applications` ADD `payoutAt` bigint;--> statement-breakpoint
ALTER TABLE `users` ADD `bankRoutingNumber` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `bankAccountNumber` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `bankAccountType` enum('checking','savings');--> statement-breakpoint
ALTER TABLE `users` ADD `bankAccountName` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `contactPreference` enum('email','phone') DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);