CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailStep` int NOT NULL,
	`subject` varchar(512) NOT NULL,
	`status` enum('sent','failed','scheduled') DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `email1SentAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `email2SentAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `email3SentAt` timestamp;