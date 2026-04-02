--> statement-breakpoint
ALTER TABLE `applications`
  ADD COLUMN `checkInAt` bigint,
  ADD COLUMN `checkOutAt` bigint,
  ADD COLUMN `shiftStartedAt` bigint,
  ADD COLUMN `shiftEndedAt` bigint,
  ADD COLUMN `hoursWorked` decimal(6,2),
  ADD COLUMN `totalWagesOwed` decimal(10,2),
  ADD COLUMN `payoutStatus` enum('unpaid','processing','paid','failed') DEFAULT 'unpaid',
  ADD COLUMN `payoutMethod` enum('stripe_bank','stripe_instant','cash_app','square'),
  ADD COLUMN `payoutAt` bigint;
--> statement-breakpoint
ALTER TABLE `jobs`
  ADD COLUMN `latitude` float,
  ADD COLUMN `longitude` float,
  ADD COLUMN `contactName` varchar(256),
  ADD COLUMN `contactPhone` varchar(32);
