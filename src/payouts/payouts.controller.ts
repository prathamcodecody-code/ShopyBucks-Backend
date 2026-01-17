import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { PayoutsService } from "./payouts.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { AdminGuard } from "../auth/admin.guard.js";
import { AdminUpdatePayoutDto } from "../seller/payout/dto/admin-update-payout.dto.js";

@Controller("admin/payouts")
@UseGuards(JwtAuthGuard, AdminGuard)
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  // ======================
  // LIST
  // ======================
  @Get()
  list(@Query() query) {
    return this.payouts.list(query);
  }

  // ======================
  // GET ONE
  // ======================
  @Get(":id")
  get(@Param("id") id: string) {
    return this.payouts.getById(Number(id));
  }

  // ======================
  // APPROVE
  // ======================
  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.payouts.approve(Number(id));
  }

  // ======================
  // REJECT
  // ======================
  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.payouts.reject(Number(id), reason);
  }

  // ======================
  // MARK AS PAID
  // ======================
 @Patch(":id/paid")
markPaid(
  @Param("id") id: string,
  @Body() body: { referenceId: string; method?: string }
) {
  if (!body.referenceId) {
    throw new BadRequestException("referenceId is required");
  }

  return this.payouts.markPaid(
    Number(id),
    body.referenceId,
    body.method ?? "ONLINE"
  );
}
}