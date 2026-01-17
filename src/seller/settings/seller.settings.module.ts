import { Module } from "@nestjs/common";
import { SellerSettingsService } from "./seller.settings.service.js";
import { SellerSettingsController } from "./seller.settings.controller.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Module({
  controllers: [SellerSettingsController],
  providers: [SellerSettingsService, PrismaService],
})
export class SellerSettingsModule {}
