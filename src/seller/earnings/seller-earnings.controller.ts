import {
  Controller,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/strategies/jwt-auth.guard.js";
import { SellerEarningsService } from "./seller-earnings.service.js";
import { SellerGuard } from "../../auth/seller.guard.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Earnings")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, SellerGuard)
@Controller("seller/earnings")
export class SellerEarningsController {
  constructor(
    private readonly earnings: SellerEarningsService,
  ) {}

  @ApiOperation({
    summary: "Get seller earnings",
    description:
      "Returns total earned amount, total paid payouts, and available balance",
  })
  @ApiOkResponse({
    description: "Seller earnings fetched successfully",
    schema: {
      example: {
        totalEarned: 125000,
        totalPaid: 75000,
        available: 50000,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get()
  getMyEarnings(@Req() req: any) {
    return this.earnings.getEarnings(req.user.id);
  }
}
