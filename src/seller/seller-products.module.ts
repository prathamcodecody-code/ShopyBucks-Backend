import { Module } from "@nestjs/common";
import { SellerProductsService } from "./seller-products.service.js" ;
import { SellerProductsController } from "./seller-products.controller.js" 
import { PrismaModule } from "../prisma/prisma.module.js";
import { KafkaModule } from "../kafka/kafka.module.js"; // ✅

@Module({
  imports: [PrismaModule, KafkaModule], // ✅
  controllers: [SellerProductsController],
  providers: [SellerProductsService],
})
export class SellerProductsModule {}
