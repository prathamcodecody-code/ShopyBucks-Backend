import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
} from "@nestjs/common";
import { SellerService } from "./seller.service.js";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { PrismaService } from "../prisma/prisma.service.js";

// Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from "@nestjs/swagger";

@ApiTags("Seller")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("seller")
export class SellerController {
  constructor(
    private readonly sellerService: SellerService,
    private readonly prisma: PrismaService,
  ) {}

  // ================= APPLY / REAPPLY =================

  @ApiOperation({
    summary: "Apply to become a seller",
    description: "Submit or reapply for seller verification",
  })
  @ApiBody({
    schema: {
      example: {
        businessName: "FirstFemale Store",
        businessType: "Retail",
        panNumber: "ABCDE1234F",
        gstNumber: "07ABCDE1234F1Z5",
        aadhaarLast4: "1234",
      },
    },
  })
  @ApiOkResponse({ description: "Seller request submitted" })
  @ApiBadRequestResponse({
    description: "Already approved or request under review",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @Post("request")
  requestSeller(@Req() req: any, @Body() body: any) {
    return this.sellerService.createRequest(req.user.id, body);
  }

  // ================= CURRENT SELLER PROFILE =================

  @ApiOperation({
    summary: "Get my seller profile",
    description: "Returns fresh seller data from database",
  })
  @ApiOkResponse({ description: "Seller profile fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @Get("me")
  async getMySellerProfile(@Req() req: any) {
    // 🔹 Fetch FRESH data (JWT may be outdated)
    return this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        role: true,
        sellerStatus: true,
        sellerApprovedAt: true,
      },
    });
  }

  // ================= MY SELLER REQUEST =================

  @ApiOperation({
    summary: "Get my seller request status",
    description: "Returns latest seller request or NONE",
  })
  @ApiOkResponse({ description: "Seller request fetched" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @Get("request/me")
  getMySellerRequest(@Req() req: any) {
    return this.sellerService.getMyRequest(req.user.id);
  }
}
