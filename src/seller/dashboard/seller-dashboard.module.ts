import { Module } from "@nestjs/common";
import { SellerDashboardController } from "./seller-dashboard.controller.js";
import { SellerDashboardService } from "./seller-dashboard.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Module({
  controllers: [SellerDashboardController],
  providers: [SellerDashboardService, PrismaService],
})
export class SellerDashboardModule {}
