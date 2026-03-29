CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`workerId` int NOT NULL,
	`employerId` int NOT NULL,
	`status` enum('pending','accepted','rejected','completed','cancelled') DEFAULT 'pending',
	`coverNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`skills` text NOT NULL,
	`city` varchar(128) DEFAULT 'Austin, TX',
	`location` varchar(256),
	`note` text,
	`isActive` boolean DEFAULT true,
	`expiresAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`role` enum('cook','sous_chef','prep','dishwasher','cleaner','server','bartender','host','manager') NOT NULL,
	`payRate` decimal(8,2) NOT NULL,
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`totalPay` decimal(10,2),
	`city` varchar(128) DEFAULT 'Austin, TX',
	`location` varchar(256),
	`description` text,
	`minRating` float DEFAULT 0,
	`isPermanent` boolean DEFAULT false,
	`restaurantName` varchar(256),
	`restaurantImage` text,
	`status` enum('live','filled','completed','expired','cancelled') DEFAULT 'live',
	`acceptedWorkerId` int,
	`paymentIntentId` varchar(256),
	`paymentStatus` enum('unpaid','held','released','refunded') DEFAULT 'unpaid',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`employerId` int NOT NULL,
	`workerId` int NOT NULL,
	`amount` bigint NOT NULL,
	`platformFee` bigint NOT NULL,
	`workerPayout` bigint NOT NULL,
	`stripePaymentIntentId` varchar(256),
	`stripeTransferId` varchar(256),
	`status` enum('pending','held','released','refunded','failed') DEFAULT 'pending',
	`paidAt` timestamp,
	`releasedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`creditType` enum('single','bundle3','subscription') NOT NULL,
	`creditsAdded` int NOT NULL,
	`amountPaid` bigint NOT NULL,
	`stripePaymentIntentId` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postCredits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`paymentId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`score` int NOT NULL,
	`comment` text,
	`response` text,
	`raterType` enum('worker','employer') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('worker','employer','both') DEFAULT 'worker';--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(128) DEFAULT 'Austin, TX';--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `users` ADD `experience` text;--> statement-breakpoint
ALTER TABLE `users` ADD `rating` float DEFAULT 5;--> statement-breakpoint
ALTER TABLE `users` ADD `reliabilityScore` float DEFAULT 100;--> statement-breakpoint
ALTER TABLE `users` ADD `totalRatings` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeAccountId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeOnboardingComplete` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('none','active','cancelled') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `postsRemaining` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `pendingBalance` bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `totalEarned` bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `profileComplete` boolean DEFAULT false;