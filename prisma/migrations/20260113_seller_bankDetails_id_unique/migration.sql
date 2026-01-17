-- 1. Disable foreign key checks to allow index modification
SET FOREIGN_KEY_CHECKS=0;

-- 2. Drop the existing indices safely
DROP INDEX IF EXISTS `SellerBankDetail_sellerId_idx` ON `SellerBankDetail`;
DROP INDEX IF EXISTS `SellerBankDetail_sellerId_key` ON `SellerBankDetail`;

-- 3. Create the proper Unique Index
CREATE UNIQUE INDEX `SellerBankDetail_sellerId_key` ON `SellerBankDetail`(`sellerId`);

-- 4. Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;