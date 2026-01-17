import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SellerPayoutService } from "./seller-payout.service.js";
import { SellerGuard } from "../../auth/seller.guard.js";
import { JwtAuthGuard } from "../../auth/strategies/jwt-auth.guard.js";
import { RequestPayoutDto } from "./dto/request-payout.dto.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Payouts")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, SellerGuard)
@Controller("seller/payouts")
export class SellerPayoutController {
  constructor(
    private readonly service: SellerPayoutService,
  ) {}

  // ================= BALANCE =================

  @ApiOperation({
    summary: "Get seller payout balance",
    description:
      "Returns total earned, total paid, and available balance for payout",
  })
  @ApiOkResponse({
    description: "Seller balance fetched",
    schema: {
      example: {
        totalEarned: 120000,
        totalPaid: 70000,
        availableBalance: 50000,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get("balance")
  getBalance(@Req() req: any) {
    return this.service.getSellerBalance(req.user.id);
  }

  // ================= REQUEST PAYOUT =================

  @ApiOperation({
    summary: "Request payout",
    description:
      "Seller requests payout from available balance (bank must be verified)",
  })
  @ApiBody({ type: RequestPayoutDto })
  @ApiOkResponse({
    description: "Payout request created",
    schema: {
      example: {
        id: 12,
        amount: 25000,
        status: "PENDING",
        method: "BANK",
        createdAt: "2026-01-10T10:20:30.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      "Insufficient balance / bank not verified / payout hold",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Post("request")
  requestPayout(
    @Req() req: any,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.service.requestPayout(req.user.id, dto);
  }

  // ================= LIST PAYOUTS =================

  @ApiOperation({
    summary: "Get my payout history",
    description: "Returns all payout requests made by the seller",
  })
  @ApiOkResponse({ description: "Seller payouts fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get()
  getMyPayouts(@Req() req: any) {
    return this.service.getSellerPayouts(req.user.id);
  }
}
