ALTER TABLE `jobs`
  ADD COLUMN `latitude` float,
  ADD COLUMN `longitude` float,
  ADD COLUMN `contactName` varchar(256),
  ADD COLUMN `contactPhone` varchar(32);
