import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { OrdersService } from "./orders.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto.js";
import { AdminGuard } from "../auth/admin.guard.js";

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from "@nestjs/swagger";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ================= USER ROUTES =================

  @ApiOperation({
    summary: "Get my orders",
    description: "Paginated orders for logged-in user",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 5 })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiOkResponse({ description: "Orders fetched successfully" })
  @UseGuards(JwtAuthGuard)
  @Get("my")
  getMyOrders(@Req() req: any, @Query() query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 5;
    return this.ordersService.getMyOrders(req.user.id, page, limit);
  }

  @ApiOperation({
    summary: "Get my order by ID",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiBadRequestResponse({ description: "Invalid order id" })
  @ApiOkResponse({ description: "Order fetched successfully" })
  @UseGuards(JwtAuthGuard)
  @Get("my/:id")
  getMyOrderById(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.getMyOrderById(id, req.user.id);
  }

  // ================= ADMIN ROUTES =================

  @ApiOperation({
    summary: "Get all orders (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "minAmount", required: false })
  @ApiQuery({ name: "maxAmount", required: false })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @ApiOkResponse({ description: "Orders fetched successfully" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  getAll(@Query() query: any) {
    return this.ordersService.getAll(query);
  }

  @ApiOperation({
    summary: "Get order by ID (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBadRequestResponse({ description: "Invalid order id" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @ApiOkResponse({ description: "Order fetched successfully" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id")
  getOne(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.getOne(id);
  }

  @ApiOperation({
    summary: "Update order status (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access required" })
  @ApiBadRequestResponse({ description: "Invalid order id" })
  @ApiOkResponse({ description: "Order status updated" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  // ================= USER ACTIONS =================

  @ApiOperation({
    summary: "Place order",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiBody({
    schema: {
      example: {
        address: {
          name: "Pratham",
          street: "MG Road",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          phone: "9999999999",
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiBadRequestResponse({ description: "Invalid request" })
  @ApiOkResponse({ description: "Order placed successfully" })
  @UseGuards(JwtAuthGuard)
  @Post()
  placeOrder(@Req() req: any, @Body("address") address: any) {
    return this.ordersService.createOrder(req.user.id, address);
  }

  @ApiOperation({
    summary: "Cancel order",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBadRequestResponse({ description: "Invalid order id" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiOkResponse({ description: "Order cancelled" })
  @UseGuards(JwtAuthGuard)
  @Put(":id/cancel")
  cancelOrder(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  @ApiOperation({
    summary: "Reorder",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBadRequestResponse({ description: "Invalid order id" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiOkResponse({ description: "Reorder successful" })
  @UseGuards(JwtAuthGuard)
  @Post(":id/reorder")
  reorder(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.ordersService.reorder(id, req.user.id);
  }
}
