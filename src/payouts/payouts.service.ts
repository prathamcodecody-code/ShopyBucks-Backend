import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { PayoutStatus } from "@prisma/client";

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  // ======================
  // LIST PAYOUTS (ADMIN)
  // ======================
  async list(query: any) {
    const { sellerId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (sellerId) where.sellerId = Number(sellerId);
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sellerPayout.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.sellerPayout.count({ where }),
    ]);

    return {
      payouts: data,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  }

  // ======================
  // GET SINGLE PAYOUT
  // ======================
  async getById(id: number) {
    const payout = await this.prisma.sellerPayout.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payout) throw new NotFoundException("Payout not found");
    return payout;
  }

  // ======================
  // APPROVE PAYOUT
  // ======================
  async approve(id: number) {
    const payout = await this.prisma.sellerPayout.findUnique({
      where: { id },
    });

    if (!payout) throw new NotFoundException("Payout not found");

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException("Only pending payouts can be approved");
    }

    return this.prisma.sellerPayout.update({
      where: { id },
      data: {
        status: PayoutStatus.APPROVED,
      },
    });
  }

  // ======================
  // REJECT PAYOUT
  // ======================
  async reject(id: number, reason: string) {
    const payout = await this.prisma.sellerPayout.findUnique({
      where: { id },
    });

    if (!payout) throw new NotFoundException("Payout not found");

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException("Only pending payouts can be rejected");
    }

    return this.prisma.sellerPayout.update({
      where: { id },
      data: {
        status: PayoutStatus.REJECTED,
        note: reason,
        processedAt: new Date(),
      },
    });
  }

  // ======================
  // MARK AS PAID
  // ======================
  async markPaid(
    id: number,
    referenceId: string,
    method = "ONLINE",
  ) {
    const payout = await this.prisma.sellerPayout.findUnique({
      where: { id },
    });

    if (!payout) throw new NotFoundException("Payout not found");

    if (payout.status !== PayoutStatus.APPROVED) {
      throw new BadRequestException(
        "Only approved payouts can be marked as paid"
      );
    }

    return this.prisma.sellerPayout.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        referenceId,
        method,
        processedAt: new Date(),
      },
    });
  }
}
