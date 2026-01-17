import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { SellerSettingsService } from "./seller.settings.service.js";
import { UpdateSellerSettingsDto } from "./dto/update-seller-settings.dto.js";
import { AdminUpdateSellerSettingsDto } from "./dto/admin-update-seller-settings.dto.js";
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
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Seller Settings")
@Controller()
export class SellerSettingsController {
  constructor(
    private readonly service: SellerSettingsService,
  ) {}

  // ================= SELLER =================

  @ApiOperation({
    summary: "Get my seller settings",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiOkResponse({ description: "Seller settings fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Get("seller/settings")
  getMySettings(@ReqUser() user: any) {
    return this.service.getSellerSettings(user.id);
  }

  @ApiOperation({
    summary: "Update my seller settings",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiBody({ type: UpdateSellerSettingsDto })
  @ApiOkResponse({ description: "Seller settings updated" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Seller access only" })
  @UseGuards(JwtAuthGuard, SellerGuard)
  @Patch("seller/settings")
  updateMySettings(
    @ReqUser() user: any,
    @Body() dto: UpdateSellerSettingsDto,
  ) {
    return this.service.updateSellerSettings(user.id, dto);
  }

  // ================= ADMIN =================

  @ApiOperation({
    summary: "Get seller settings (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Seller settings fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/sellers/:id/settings")
  getSellerSettingsByAdmin(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.getSellerSettingsByAdmin(id);
  }

  @ApiOperation({
    summary: "Update seller settings (Admin)",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: AdminUpdateSellerSettingsDto })
  @ApiOkResponse({ description: "Seller settings updated" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Admin access only" })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("admin/sellers/:id/settings")
  adminUpdateSellerSettings(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdateSellerSettingsDto,
  ) {
    return this.service.adminUpdateSellerSettings(id, dto);
  }
}
