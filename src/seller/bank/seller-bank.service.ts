import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { UpsertSellerBankDto } from "./dto/upsert-seller-bank.dto.js";

@Injectable()
export class SellerBankService {
  constructor(private prisma: PrismaService) {}

  // ================= SELLER =================

  async getMyBankDetails(sellerId: number) {
    return this.prisma.sellerBankDetail.findUnique({
      where: { sellerId },
    });
  }

  async upsertMyBankDetails(
    sellerId: number,
    dto: UpsertSellerBankDto
  ) {
    return this.prisma.sellerBankDetail.upsert({
      where: { sellerId },
      create: {
        sellerId,
        ...dto,
        isVerified: false,
        rejectedReason: null,
      },
      update: {
        ...dto,
        isVerified: false,        // reset verification
        rejectedReason: null,     // clear rejection
      },
    });
  }

  // ================= ADMIN =================

  async getSellerBankDetailsByAdmin(sellerId: number) {
    return this.prisma.sellerBankDetail.findUnique({
      where: { sellerId },
    });
  }

  async verifySellerBankDetails(sellerId: number) {
    const bank = await this.prisma.sellerBankDetail.findUnique({
      where: { sellerId },
    });

    if (!bank) {
      throw new BadRequestException("Bank details not found");
    }

    return this.prisma.sellerBankDetail.update({
      where: { sellerId },
      data: {
        isVerified: true,
        rejectedReason: null, // ✅ clear old reason
      },
    });
  }

  async rejectSellerBankDetails(
    sellerId: number,
    reason?: string
  ) {
    const bank = await this.prisma.sellerBankDetail.findUnique({
      where: { sellerId },
    });

    if (!bank) {
      throw new BadRequestException("Bank details not found");
    }

    return this.prisma.sellerBankDetail.update({
      where: { sellerId },
      data: {
        isVerified: false,
        rejectedReason: reason ?? "Invalid bank details",
      },
    });
  }
}
