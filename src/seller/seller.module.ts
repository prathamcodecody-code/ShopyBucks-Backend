import { Module } from "@nestjs/common";
import { SellerService } from "./seller.service.js";
import { SellerController } from "./seller.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { KafkaModule } from "../kafka/kafka.module.js";

@Module({
  imports: [PrismaModule, KafkaModule], // Import KafkaModule here
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}