import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { AdminService } from "./admin.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { AdminGuard } from "../auth/admin.guard.js";

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("Admin")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ================= DASHBOARD =================

  @ApiOperation({ summary: "Get admin dashboard statistics" })
  @ApiResponse({ status: 200, description: "Dashboard statistics returned" })
  @Get("stats")
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @ApiOperation({ summary: "Get admin dashboard charts data" })
  @Get("charts")
  getCharts() {
    return this.adminService.getChartData();
  }

  // ================= SELLER REQUESTS =================

  @ApiOperation({ summary: "Get pending seller requests" })
  @Get("sellers/requests")
  getSellerRequests() {
    return this.adminService.getSellerRequests();
  }

  @ApiOperation({ summary: "Approve seller request" })
  @ApiParam({ name: "id", type: Number })
  @Patch("sellers/requests/:id/approve")
  approveSeller(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.approveSeller(id);
  }

  @ApiOperation({ summary: "Reject seller request" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: { type: "string", example: "Invalid documents" },
      },
      required: ["reason"],
    },
  })
  @Patch("sellers/requests/:id/reject")
  rejectSeller(
    @Param("id", ParseIntPipe) id: number,
    @Body("reason") reason: string,
  ) {
    return this.adminService.rejectSeller(id, reason);
  }

  @ApiOperation({ summary: "Get seller request by ID" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/requests/:id")
  getSellerRequestById(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerRequestById(id);
  }

  // ================= SELLERS =================

  @ApiOperation({ summary: "Get approved sellers" })
  @Get("sellers")
  getApprovedSellers() {
    return this.adminService.getApprovedSellers();
  }

  @ApiOperation({ summary: "Get seller details" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/:id")
  getSeller(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerById(id);
  }

  @ApiOperation({ summary: "Get seller orders" })
  @ApiParam({ name: "id", type: Number })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  @Get("sellers/:id/orders")
  getSellerOrders(
    @Param("id", ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.adminService.getSellerOrders(id, query);
  }

  @ApiOperation({ summary: "Get seller products" })
  @ApiParam({ name: "id", type: Number })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  @Get("sellers/:id/products")
  getSellerProducts(
    @Param("id", ParseIntPipe) id: number,
    @Query() query: any,
  ) {
    return this.adminService.getSellerProducts(id, query);
  }

  // ================= PRODUCTS =================

  @ApiOperation({ summary: "Block product" })
  @ApiParam({ name: "id", type: Number })
  @Patch("products/:id/block")
  blockProduct(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.blockProduct(id);
  }

  @ApiOperation({ summary: "Unblock product" })
  @ApiParam({ name: "id", type: Number })
  @Patch("products/:id/unblock")
  unblockProduct(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.unblockProduct(id);
  }

  // ================= SELLER FINANCE =================

  @ApiOperation({ summary: "Get seller earnings" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/:id/earnings")
  getSellerEarnings(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerEarnings(id);
  }

  @ApiOperation({ summary: "Get seller payouts" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/:id/payouts")
  getSellerPayouts(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerPayouts(id);
  }

  @ApiOperation({ summary: "Get payout by ID" })
  @ApiParam({ name: "id", type: Number })
  @Get("payouts/:id")
  getPayoutById(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getPayoutById(id);
  }

  // ================= SELLER SETTINGS =================

  @ApiOperation({ summary: "Get seller settings" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/:id/settings")
  getSellerSettings(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerSettings(id);
  }

  @ApiOperation({ summary: "Update seller settings" })
  @ApiParam({ name: "id", type: Number })
  @Patch("sellers/:id/settings")
  updateSellerSettings(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.adminService.updateSellerSettings(id, body);
  }

  // ================= USERS =================

  @ApiOperation({ summary: "Get user stats" })
  @Get("users/stats")
  getUserStats() {
    return this.adminService.getUserStats();
  }

  @ApiOperation({ summary: "Get users list" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("users")
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(
      Number(query.page || 1),
      Number(query.limit || 10),
    );
  }

  @ApiOperation({ summary: "Get user analytics" })
  @ApiParam({ name: "id", type: Number })
  @Get("users/:id/analytics")
  getUserAnalytics(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getUserAnalytics(id);
  }

  // ================= BANK =================

  @ApiOperation({ summary: "Get seller bank details" })
  @ApiParam({ name: "id", type: Number })
  @Get("sellers/:id/bank")
  getSellerBank(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.getSellerBank(id);
  }
}
