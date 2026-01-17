import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { SellerBankService } from "./seller-bank.service.js";
import { UpsertSellerBankDto } from "./dto/upsert-seller-bank.dto.js";
import { ReqUser } from "../../common/decorators/req-user.decorator.js";
import { JwtAuthGuard } from "../../auth/strategies/jwt-auth.guard.js";
import { SellerGuard } from "../../auth/seller.guard.js";
import { AdminGuard } from "../../auth/admin.guard.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Bank")
@Controller()
export class SellerBankController {
  constructor(private readonly service: SellerBankService) {}

  // ================= SELLER =================

  @ApiOperation({
    summary: "Get my bank details (Seller)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiOkResponse({ description: "Bank details fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get("seller/settings/bank")
  getMyBankDetails(@ReqUser() user: any) {
    return this.service.getMyBankDetails(user.id);
  }

  @ApiOperation({
    summary: "Add or update my bank details (Seller)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiBody({ type: UpsertSellerBankDto })
  @ApiOkResponse({ description: "Bank details saved" })
  @ApiBadRequestResponse({ description: "Invalid bank details" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put("seller/settings/bank")
  upsertMyBankDetails(
    @ReqUser() user: any,
    @Body() body: UpsertSellerBankDto,
  ) {
    return this.service.upsertMyBankDetails(user.id, body);
  }

  // ================= ADMIN =================

  @ApiOperation({
    summary: "Get seller bank details (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Seller bank details fetched" })
  @ApiBadRequestResponse({ description: "Bank details not found" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/sellers/:id/bank")
  getSellerBankDetails(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.getSellerBankDetailsByAdmin(id);
  }

  @ApiOperation({
    summary: "Verify seller bank details (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Bank details verified" })
  @ApiBadRequestResponse({ description: "Bank details not found" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("admin/sellers/:id/bank/verify")
  verifySellerBank(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.verifySellerBankDetails(id);
  }

  @ApiOperation({
    summary: "Reject seller bank details (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBody({
    schema: {
      example: {
        reason: "Account number mismatch",
      },
    },
  })
  @ApiOkResponse({ description: "Bank details rejected" })
  @ApiBadRequestResponse({ description: "Bank details not found" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("admin/sellers/:id/bank/reject")
  rejectSellerBank(
    @Param("id", ParseIntPipe) id: number,
    @Body("reason") reason?: string,
  ) {
    return this.service.rejectSellerBankDetails(id, reason);
  }
}
