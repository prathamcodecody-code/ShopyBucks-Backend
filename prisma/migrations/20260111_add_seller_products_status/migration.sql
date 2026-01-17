-- 1️⃣ Add product status column
ALTER TABLE `Product`
ADD COLUMN `status` ENUM('ACTIVE', 'BLOCKED', 'DRAFT')
NOT NULL DEFAULT 'ACTIVE';

-- 2️⃣ Index for admin & seller filtering
CREATE INDEX `Product_status_idx` ON `Product`(`status`);
CREATE INDEX `Product_sellerId_idx` ON `Product`(`sellerId`);
