CREATE TABLE `verificationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`idImageUrl` text NOT NULL,
	`selfieUrl` text,
	`legalName` varchar(256) NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`adminNote` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verificationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `verificationStatus` enum('unverified','pending','verified','rejected') DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE `users` ADD `verificationIdUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationNote` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `contractSigned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `contractSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `contractIp` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingEmailSent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0;