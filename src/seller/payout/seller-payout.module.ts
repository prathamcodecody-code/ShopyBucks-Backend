import { Module } from "@nestjs/common";
import { SellerPayoutService } from "./seller-payout.service.js";
import { SellerPayoutController } from "./seller-payout.controller.js";
import { AdminPayoutController } from "./admin-payout.controller.js";

@Module({
  controllers: [
    SellerPayoutController,
    AdminPayoutController,
  ],
  providers: [SellerPayoutService],
  exports: [SellerPayoutService],
})
export class SellerPayoutModule {}
