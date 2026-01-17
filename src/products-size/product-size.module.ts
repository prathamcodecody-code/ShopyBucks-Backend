import { Module } from "@nestjs/common";
import { ProductSizeService } from "./product-size.service.js";
import { ProductSizeController } from "./product-size.controller.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Module({
  controllers: [ProductSizeController],
  providers: [ProductSizeService, PrismaService],
})
export class ProductSizeModule {}
