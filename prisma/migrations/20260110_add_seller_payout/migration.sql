-- CreateEnum
CREATE TABLE `_PayoutStatus` (
  `value` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_PayoutStatus` (`value`) VALUES
('PENDING'),
('APPROVED'),
('PAID'),
('REJECTED');

-- CreateTable
CREATE TABLE `SellerPayout` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sellerId` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `method` VARCHAR(191) NULL,
  `referenceId` VARCHAR(191) NULL,
  `note` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedAt` DATETIME(3) NULL,

  PRIMARY KEY (`id`),
  INDEX `SellerPayout_sellerId_idx` (`sellerId`),
  INDEX `SellerPayout_status_idx` (`status`),

  CONSTRAINT `SellerPayout_sellerId_fkey`
    FOREIGN KEY (`sellerId`)
    REFERENCES `User`(`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
