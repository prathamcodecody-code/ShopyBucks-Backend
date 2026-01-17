-- 1. Convert address to JSON safely
ALTER TABLE `Order` MODIFY `address` JSON NULL;

-- Convert existing non-json strings to json objects
UPDATE `Order`
SET `address` = JSON_OBJECT('raw', `address`)
WHERE JSON_VALID(`address`) = 0 AND `address` IS NOT NULL;

-- Enforce NOT NULL
ALTER TABLE `Order` MODIFY `address` JSON NOT NULL;

-- 2. Handle the Razorpay Index Safely
-- We drop it first to prevent the "Duplicate key" error, then recreate it.
ALTER TABLE `Order` DROP INDEX IF EXISTS `Order_razorpayOrderId_key`;
CREATE UNIQUE INDEX `Order_razorpayOrderId_key` ON `Order`(`razorpayOrderId`);

-- 3. Ensure the User Index exists
-- Using ALTER TABLE is often safer for adding indexes in MySQL
ALTER TABLE `Order` ADD INDEX IF NOT EXISTS `Order_userId_idx` (`userId`);