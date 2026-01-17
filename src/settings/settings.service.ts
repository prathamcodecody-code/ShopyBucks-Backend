import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Always ensure one settings row exists
  async getSettings() {
    return this.prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        updatedAt: new Date(),
      },
    });
  }

  async updateProfile(dto: any) {
    return this.prisma.settings.update({
      where: { id: 1 },
      data: {
        name: dto.name,
        email: dto.email,
        updatedAt: new Date(),
      },
    });
  }

  async updateStore(dto: any, file?: Express.Multer.File) {
    return this.prisma.settings.update({
      where: { id: 1 },
      data: {
        storeName: dto.storeName,
        supportEmail: dto.supportEmail,
        supportPhone: dto.supportPhone,
        address: dto.address,
        logo: file ? file.filename : undefined,
        updatedAt: new Date(),
      },
    });
  }

  async updateGeneral(dto: any) {
    return this.prisma.settings.update({
      where: { id: 1 },
      data: {
        currency: dto.currency,
        maintenanceMode: dto.maintenanceMode,
        updatedAt: new Date(),
      },
    });
  }
}
