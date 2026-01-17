import { Module } from "@nestjs/common";
import { SellerBankController } from "./seller-bank.controller.js";
import { SellerBankService } from "./seller-bank.service.js";
import { PrismaModule } from "../../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  controllers: [SellerBankController],
  providers: [SellerBankService],
  exports: [SellerBankService], // useful for payouts
})
export class SellerBankModule {}
