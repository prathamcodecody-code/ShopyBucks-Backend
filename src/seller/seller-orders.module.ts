import { Module } from "@nestjs/common";
import { SellerOrdersService } from "./seller-orders.service.js";
import { SellerOrdersController } from "./seller-orders.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { KafkaModule } from "../kafka/kafka.module.js"; // ✅

@Module({
  imports: [PrismaModule, KafkaModule], // ✅
  controllers: [SellerOrdersController],
  providers: [SellerOrdersService],
})
export class SellerOrdersModule {}
