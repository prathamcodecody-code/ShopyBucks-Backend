-- ===============================
-- SELLER SETTINGS
-- ===============================

CREATE TABLE `SellerSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sellerId` INT NOT NULL,

  `commissionRate` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `minPayoutAmount` DECIMAL(10,2) NOT NULL DEFAULT 500.00,

  `autoPayout` BOOLEAN NOT NULL DEFAULT FALSE,
  `allowCOD` BOOLEAN NOT NULL DEFAULT TRUE,
  `payoutHold` BOOLEAN NOT NULL DEFAULT FALSE,

  `isVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `isVisible` BOOLEAN NOT NULL DEFAULT TRUE,

  `adminNote` TEXT NULL,

  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `SellerSettings_sellerId_key` (`sellerId`),
  INDEX `SellerSettings_sellerId_idx` (`sellerId`),

  CONSTRAINT `SellerSettings_sellerId_fkey`
    FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ===============================
-- SELLER BANK DETAILS
-- ===============================

CREATE TABLE `SellerBankDetail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sellerId` INT NOT NULL,

  `accountHolder` VARCHAR(255) NOT NULL,
  `bankName` VARCHAR(255) NOT NULL,
  `accountNumber` VARCHAR(255) NOT NULL,
  `ifscCode` VARCHAR(20) NOT NULL,

  `upiId` VARCHAR(255) NULL,
  `isVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `rejectedReason` TEXT NULL,

  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `SellerBankDetail_sellerId_key` (`sellerId`),
  INDEX `SellerBankDetail_sellerId_idx` (`sellerId`),

  CONSTRAINT `SellerBankDetail_sellerId_fkey`
    FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
