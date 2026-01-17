import { Module } from "@nestjs/common";
import { PayoutsService } from "./payouts.service.js";
import { PayoutsController } from "./payouts.controller.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Module({
  controllers: [PayoutsController],
  providers: [PayoutsService, PrismaService],
})
export class PayoutsModule {}
