-- 1. Update User Table
ALTER TABLE `User` 
ADD COLUMN `sellerStatus` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'NONE',
ADD COLUMN `sellerApprovedAt` DATETIME(3) NULL,
ADD COLUMN `sellerRejectedReason` TEXT NULL;

-- 2. Handle SellerRequest Table Status Change
-- First, rename the old column if it exists to avoid data loss
ALTER TABLE `SellerRequest` CHANGE COLUMN `status` `status_old` VARCHAR(191);

-- Add the new Enum column
ALTER TABLE `SellerRequest` 
ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- Migrate the data
UPDATE `SellerRequest` SET `status` = 'APPROVED' WHERE `status_old` = 'APPROVED';
UPDATE `SellerRequest` SET `status` = 'REJECTED' WHERE `status_old` = 'REJECTED';

-- Drop the old column
ALTER TABLE `SellerRequest` DROP COLUMN `status_old`;

-- 3. Add Audit Fields
ALTER TABLE `SellerRequest` 
ADD COLUMN `approvedBy` INTEGER NULL,
ADD COLUMN `approvedAt` DATETIME(3) NULL;

-- 4. Create Indexes
CREATE INDEX `idx_user_sellerStatus` ON `User`(`sellerStatus`);
CREATE INDEX `idx_seller_request_status` ON `SellerRequest`(`status`);