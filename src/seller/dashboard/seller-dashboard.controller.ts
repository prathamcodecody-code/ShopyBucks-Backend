import {
  Controller,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/strategies/jwt-auth.guard.js";
import { SellerOnly } from "../../auth/seller-only.decorator.js";
import { SellerDashboardService } from "./seller-dashboard.service.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Dashboard")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@SellerOnly()
@Controller("seller/dashboard")
export class SellerDashboardController {
  constructor(
    private readonly service: SellerDashboardService,
  ) {}

  // ================= STATS =================

  @ApiOperation({
    summary: "Get seller dashboard stats",
    description:
      "Returns products count, total orders, pending orders, revenue, today revenue, and recent products",
  })
  @ApiOkResponse({ description: "Dashboard stats fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get("stats")
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.id);
  }

  // ================= CHARTS =================

  @ApiOperation({
    summary: "Get seller dashboard charts",
    description:
      "Returns revenue trend, orders trend, and order status distribution",
  })
  @ApiOkResponse({ description: "Dashboard charts fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get("charts")
  getCharts(@Req() req: any) {
    return this.service.getCharts(req.user.id);
  }

  // ================= LOW STOCK =================

  @ApiOperation({
    summary: "Get low stock products (Seller)",
    description: "Returns seller products with stock less than or equal to 5",
  })
  @ApiOkResponse({ description: "Low stock products fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get("low-stock")
  getLowStock(@Req() req: any) {
    return this.service.getLowStock(req.user.id);
  }
}
