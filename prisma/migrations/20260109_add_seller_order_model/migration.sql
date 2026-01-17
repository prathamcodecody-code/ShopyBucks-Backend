-- 1. Create SellerOrder table
CREATE TABLE `SellerOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM(
      'PENDING',
      'ACCEPTED',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED'
    ) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SellerOrder_sellerId_idx`(`sellerId`),
    INDEX `SellerOrder_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Add sellerOrderId to OrderItem
ALTER TABLE `OrderItem`
ADD COLUMN `sellerOrderId` INTEGER NULL;

-- 3. Backfill SellerOrder from existing OrderItem
INSERT INTO `SellerOrder` (`orderId`, `sellerId`, `totalAmount`, `status`)
SELECT 
  `orderId`,
  `sellerId`,
  SUM(`price` * `quantity`),
  'PENDING'
FROM `OrderItem`
WHERE `sellerId` IS NOT NULL
GROUP BY `orderId`, `sellerId`;

-- 4. Link OrderItem to SellerOrder
UPDATE `OrderItem` oi
JOIN `SellerOrder` so 
  ON oi.orderId = so.orderId 
 AND oi.sellerId = so.sellerId
SET oi.sellerOrderId = so.id;

-- 5. Enforce NOT NULL
ALTER TABLE `OrderItem`
MODIFY `sellerOrderId` INTEGER NOT NULL;

-- 6. Foreign keys
ALTER TABLE `OrderItem`
ADD CONSTRAINT `OrderItem_sellerOrderId_fkey`
FOREIGN KEY (`sellerOrderId`)
REFERENCES `SellerOrder`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE `SellerOrder`
ADD CONSTRAINT `SellerOrder_orderId_fkey`
FOREIGN KEY (`orderId`)
REFERENCES `Order`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE `SellerOrder`
ADD CONSTRAINT `SellerOrder_sellerId_fkey`
FOREIGN KEY (`sellerId`)
REFERENCES `User`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;
