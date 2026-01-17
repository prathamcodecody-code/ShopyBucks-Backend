import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { UpdateSellerSettingsDto } from "./dto/update-seller-settings.dto.js";
import { AdminUpdateSellerSettingsDto } from "./dto/admin-update-seller-settings.dto.js";


@Injectable()
export class SellerSettingsService {
  constructor(private prisma: PrismaService) {}

  // 🔹 Ensure settings exist
  async getOrCreate(sellerId: number) {
    let settings = await this.prisma.sellerSettings.findUnique({
      where: { sellerId },
    });

    if (!settings) {
      settings = await this.prisma.sellerSettings.create({
        data: { sellerId },
      });
    }

    return settings;
  }

  // 🔹 Seller fetch own settings
  async getSellerSettings(sellerId: number) {
    return this.getOrCreate(sellerId);
  }

  // 🔹 Seller update own settings (limited)
  async updateSellerSettings(
    sellerId: number,
    dto: UpdateSellerSettingsDto
  ) {
    await this.getOrCreate(sellerId);

    return this.prisma.sellerSettings.update({
      where: { sellerId },
      data: dto,
    });
  }

  // 🔹 Admin fetch seller settings
  async getSellerSettingsByAdmin(sellerId: number) {
    return this.getOrCreate(sellerId);
  }

  // 🔹 Admin update seller settings
  async adminUpdateSellerSettings(
    sellerId: number,
    dto: AdminUpdateSellerSettingsDto
  ) {
    await this.getOrCreate(sellerId);

    return this.prisma.sellerSettings.update({
      where: { sellerId },
      data: dto,
    });
  }
}
