-- ADD sellerId columns
ALTER TABLE `orderitem` ADD COLUMN `sellerId` INTEGER NOT NULL;
ALTER TABLE `product` ADD COLUMN `sellerId` INTEGER NOT NULL;

-- Update enum
ALTER TABLE `user`
MODIFY `role` ENUM('USER', 'ADMIN', 'SELLER') NOT NULL DEFAULT 'USER';

-- Seller request table
CREATE TABLE `SellerRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
);

-- Foreign keys
ALTER TABLE `Order`
ADD CONSTRAINT `fk_order_user`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`);

ALTER TABLE `OrderItem`
ADD CONSTRAINT `fk_orderitem_seller`
FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`);

ALTER TABLE `Product`
ADD CONSTRAINT `fk_product_seller`
FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`);

ALTER TABLE `SellerRequest`
ADD CONSTRAINT `fk_seller_request_user`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`);
