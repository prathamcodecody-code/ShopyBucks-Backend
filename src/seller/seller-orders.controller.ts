import {
  Controller,
  Get,
  Param,
  Req,
  Query,
  UseGuards,
  Patch,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { SellerOrdersService } from "./seller-orders.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { SellerOnly } from "../auth/seller-only.decorator.js";
import { OrderItem_Status } from "@prisma/client";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Orders")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@SellerOnly()
@Controller("seller/orders")
export class SellerOrdersController {
  constructor(private readonly service: SellerOrdersService) {}

  // ================= LIST =================

  @ApiOperation({
    summary: "List seller orders",
    description: "Paginated list of orders belonging to the seller",
  })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by seller order status",
  })
  @ApiOkResponse({ description: "Seller orders fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @Get()
  list(@Req() req: any, @Query() query: any) {
    return this.service.listOrders(req.user.id, query);
  }

  // ================= DETAILS =================

  @ApiOperation({
    summary: "Get seller order details",
  })
  @ApiParam({ name: "orderId", type: Number })
  @ApiOkResponse({ description: "Seller order fetched" })
  @ApiBadRequestResponse({ description: "Invalid order ID" })
  @Get(":orderId")
  getOne(
    @Req() req: any,
    @Param("orderId", ParseIntPipe) orderId: number,
  ) {
    return this.service.getOrder(orderId, req.user.id);
  }

  // ================= UPDATE ITEM STATUS =================

  @ApiOperation({
    summary: "Update order item status",
    description: "Seller updates status of an individual order item",
  })
  @ApiParam({ name: "itemId", type: Number })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: Object.values(OrderItem_Status),
          example: OrderItem_Status.SHIPPED,
        },
      },
      required: ["status"],
    },
  })
  @ApiOkResponse({ description: "Order item status updated" })
  @ApiBadRequestResponse({ description: "Invalid status transition" })
  @Patch("item/:itemId/status")
  updateStatus(
    @Req() req: any,
    @Param("itemId", ParseIntPipe) itemId: number,
    @Body("status") status: OrderItem_Status,
  ) {
    return this.service.updateItemStatus(
      req.user.id,
      itemId,
      status,
    );
  }

  // ================= VERIFY ORDER (NOTE) =================

  @ApiOperation({
    summary: "Verify order ownership",
    description:
      "Checks whether the given order belongs to the logged-in user (buyer-side check)",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Order verified" })
  @ApiBadRequestResponse({ description: "Order not found" })
  @Get(":id/verify")
  verifyOrder(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.verifyOrder(id, req.user.id);
  }
}
