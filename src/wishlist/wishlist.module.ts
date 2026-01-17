import { Module } from "@nestjs/common";
import { WishlistService } from "./wishlist.service.js";
import { WishlistController } from "./wishlist.controller.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Module({
  controllers: [WishlistController],
  providers: [WishlistService, PrismaService],
})
export class WishlistModule {}
