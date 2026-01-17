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
import { SellerPayoutService } from "./seller-payout.service.js";
import { JwtAuthGuard } from "../../auth/strategies/jwt-auth.guard.js";
import { AdminGuard } from "../../auth/admin.guard.js";
import { AdminUpdatePayoutDto } from "./dto/admin-update-payout.dto.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Admin Payouts")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/payouts")
export class AdminPayoutController {
  constructor(
    private readonly service: SellerPayoutService,
  ) {}

  // ================= LIST =================

  @ApiOperation({
    summary: "List all seller payouts (Admin)",
    description:
      "Fetch all payout requests with optional status filter",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by payout status (PENDING / APPROVED / PAID / REJECTED)",
  })
  @ApiOkResponse({ description: "Payouts fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @Get()
  listAll(@Query() query: any) {
    return this.service.listAllPayouts(query);
  }

  // ================= GET BY ID =================

  @ApiOperation({
    summary: "Get payout by ID (Admin)",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Payout fetched" })
  @ApiBadRequestResponse({ description: "Invalid payout ID" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @Get(":id")
  getById(@Param("id", ParseIntPipe) id: number) {
    return this.service.getPayoutById(id);
  }

  // ================= UPDATE STATUS =================

  @ApiOperation({
    summary: "Update payout status (Admin)",
    description:
      "Approve, reject, or mark payout as paid",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: AdminUpdatePayoutDto })
  @ApiOkResponse({ description: "Payout updated" })
  @ApiBadRequestResponse({ description: "Invalid payout state" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @Patch(":id")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdatePayoutDto,
  ) {
    return this.service.updatePayoutStatus(id, dto);
  }
}
