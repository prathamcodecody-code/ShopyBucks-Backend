import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { Prisma, PayoutStatus } from "@prisma/client";
import { AdminUpdatePayoutDto } from "./dto/admin-update-payout.dto.js";
import { KafkaProducer } from "../../kafka/kafka.producer.js";

@Injectable()
export class SellerPayoutService {
  constructor(
  private prisma: PrismaService,
  private kafkaProducer: KafkaProducer,
) {}

  // ================= SELLER =================

  async getSellerBalance(sellerId: number) {
    const earned = await this.prisma.sellerOrder.aggregate({
      where: { sellerId, status: "DELIVERED" },
      _sum: { totalAmount: true },
    });

    const paid = await this.prisma.sellerPayout.aggregate({
      where: { sellerId, status: PayoutStatus.PAID },
      _sum: { amount: true },
    });

    const totalEarned =
      earned._sum.totalAmount ?? new Prisma.Decimal(0);
    const totalPaid =
      paid._sum.amount ?? new Prisma.Decimal(0);

    return {
  totalEarned: totalEarned.toNumber(),
  totalPaid: totalPaid.toNumber(),
  availableBalance: totalEarned.minus(totalPaid).toNumber(),
};
  }

  async requestPayout(sellerId: number, data: any) {
    const balance = await this.getSellerBalance(sellerId);

const seller = await this.prisma.user.findUnique({
  where: { id: sellerId },
  include: {
    sellerBankDetail: true,
    sellerSettings: true,
  },
});

if (!seller) {
  throw new NotFoundException("Seller not found");
}

if (seller.sellerStatus !== "APPROVED") {
  throw new BadRequestException("Seller not approved");
}

if (!seller.sellerBankDetail) {
  throw new BadRequestException("Bank details not submitted");
}

if (!seller.sellerBankDetail.isVerified) {
  throw new BadRequestException("Bank details not verified");
}

if (seller.sellerSettings?.payoutHold) {
  throw new BadRequestException("Payouts are temporarily blocked");
}


   if (new Prisma.Decimal(data.amount).gt(balance.availableBalance)) {
      throw new BadRequestException("Insufficient balance");
    }

    const payout = await this.prisma.sellerPayout.create({
  data: {
    sellerId,
    amount: new Prisma.Decimal(data.amount),
    method: data.method,
    note: data.note,
  },
});

// 🔔 Kafka (non-blocking)
try {
  await this.kafkaProducer.emit("payout.requested", {
    payoutId: payout.id,
    sellerId,
    amount: data.amount,
    method: data.method,
    requestedAt: new Date().toISOString(),
  });
} catch (err) {
  console.error("Kafka emit failed: payout.requested", err.message);
}

return payout;

  }

  
  // ================= ADMIN =================

  async listAllPayouts(query: any) {
    const { status } = query;

    return this.prisma.sellerPayout.findMany({
      where: status ? { status } : {},
      include: {
        seller: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

async updatePayoutStatus(payoutId: number, data: AdminUpdatePayoutDto) {
  const payout = await this.prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new NotFoundException("Payout not found");
  }

  if (payout.status === PayoutStatus.PAID) {
    throw new BadRequestException("Payout already completed");
  }

  if (
    payout.status === PayoutStatus.PENDING &&
    data.status === PayoutStatus.PAID
  ) {
    throw new BadRequestException("Approve payout before marking paid");
  }

  const updated = await this.prisma.sellerPayout.update({
  where: { id: payoutId },
  data: {
    status: data.status,
    referenceId: data.referenceId,
    note: data.note,
    processedAt:
      data.status === PayoutStatus.PAID ? new Date() : null,
  },
});

// 🔔 Kafka (non-blocking)
try {
  await this.kafkaProducer.emit(`payout.${data.status.toLowerCase()}`, {
    payoutId,
    sellerId: payout.sellerId,
    status: data.status,
    referenceId: data.referenceId ?? null,
    processedAt: updated.processedAt?.toISOString() ?? null,
  });
} catch (err) {
  console.error("Kafka emit failed: payout status", err.message);
}

return updated;

}
// ======================admin GET PAYOUT BY ID
async getSellerEarnings(sellerId: number) {
  const delivered = await this.prisma.orderItem.aggregate({
    where: {
      sellerId,
      status: "DELIVERED",
    },
    _sum: { price: true },
  });

  const payouts = await this.prisma.sellerPayout.aggregate({
    where: {
      sellerId,
      status: "PAID",
    },
    _sum: { amount: true },
  });

  const totalEarned = Number(delivered._sum.price || 0);
  const totalPaid = Number(payouts._sum.amount || 0);

  return {
    totalEarned,
    totalPaid,
    available: totalEarned - totalPaid,
  };
}
async getSellerPayouts(sellerId: number) {
  return this.prisma.sellerPayout.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
}
async getPayoutById(payoutId: number) {
  return this.prisma.sellerPayout.findUnique({
    where: { id: payoutId },
    include: {
      seller: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
}
