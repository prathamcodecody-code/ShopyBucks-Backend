import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class SellerEarningsService {
  constructor(private prisma: PrismaService) {}

  async getEarnings(sellerId: number) {
    const delivered = await this.prisma.orderItem.aggregate({
      where: {
        sellerId,
        status: 'DELIVERED',
      },
      _sum: {
        price: true,
      },
    });

    const payouts = await this.prisma.sellerPayout.aggregate({
      where: {
        sellerId,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    const totalEarned = delivered._sum.price ?? 0;
    const totalPaid = payouts._sum.amount ?? 0;
    const available =
  Number(totalEarned) - Number(totalPaid);

    return {
      totalEarned,
      totalPaid,
      available,
    };
  }
}
