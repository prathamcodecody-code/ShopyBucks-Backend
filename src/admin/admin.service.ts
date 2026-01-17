import { Injectable  , NotFoundException} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { User_Role } from "@prisma/client";
import { KafkaProducer } from "../kafka/kafka.producer.js";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private kafkaProducer: KafkaProducer,
  ) {}

  async getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalSellers,
    pendingSellerRequests,
    totalCategories,
    totalProductTypes,
    totalOrders,
    revenueAgg,
  ] = await Promise.all([
    // Approved sellers
    this.prisma.user.count({
      where: {
        role: User_Role.SELLER,
        sellerStatus: "APPROVED",
      },
    }),

    // Pending seller requests
    this.prisma.sellerRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    // Platform structure
    this.prisma.category.count(),
    this.prisma.productType.count(),

    // Orders
    this.prisma.order.count(),

    // Revenue
    this.prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalSellers,
    pendingSellerRequests,
    totalCategories,
    totalProductTypes,
    totalOrders,
    revenue: revenueAgg._sum.totalAmount || 0,
  };
}

  async getChartData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  // Revenue & Orders per day
  const dailyStats = await Promise.all(
    last7Days.map(async (date) => {
      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: date, lt: next },
        },
      });

      return {
        date: date.toLocaleDateString("en-IN", { weekday: "short" }),
        orders: orders.length,
        revenue: orders.reduce(
          (sum, o) => sum + Number(o.totalAmount),
          0
        ),
      };
    })
  );

  // Order status split
  const statusCounts = await this.prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    revenueTrend: dailyStats.map(d => ({
      date: d.date,
      revenue: d.revenue,
    })),
    ordersTrend: dailyStats.map(d => ({
      date: d.date,
      orders: d.orders,
    })),
    orderStatus: statusCounts.map(s => ({
      status: s.status,
      value: s._count,
    })),
  };
}
// ======================================================
// 🟢 SELLER REQUESTS (ADMIN)
// ======================================================

async getSellerRequests() {
  return this.prisma.sellerRequest.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          sellerStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async approveSeller(requestId: number) {
  const request = await this.prisma.sellerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new NotFoundException("Seller request not found or invalid");
  }

  const approvedAt = new Date();

  await this.prisma.$transaction(async (tx) => {
    // 1️⃣ Update request
    await tx.sellerRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedAt,
        reason: null,
      },
    });

    // 2️⃣ Update user
    await tx.user.update({
      where: { id: request.userId },
      data: {
        role: User_Role.SELLER,
        sellerStatus: "APPROVED",
        sellerApprovedAt: approvedAt,

        businessName: request.businessName,
        businessType: request.businessType,
        panNumber: request.panNumber,
        gstNumber: request.gstNumber,
        aadhaarLast4: request.aadhaarLast4,
      },
    });
  });

  // 3️⃣ Kafka AFTER commit (NON-BLOCKING)
  try {
    await this.kafkaProducer.emit("seller.approved", {
      sellerId: request.userId,
      requestId,
      approvedAt: approvedAt.toISOString(),
    });
  } catch (err) {
    console.error("Kafka emit failed (seller.approved)", err.message);
  }

  return { success: true };
}

async rejectSeller(requestId: number, reason: string) {
  const request = await this.prisma.sellerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new NotFoundException("Seller request not found or invalid");
  }

  const rejectedAt = new Date();

  await this.prisma.$transaction(async (tx) => {
    // 1️⃣ Update request
    await tx.sellerRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reason,
      },
    });

    // 2️⃣ Update user
    await tx.user.update({
      where: { id: request.userId },
      data: {
        sellerStatus: "NONE",
        sellerRejectedReason: reason,
      },
    });
  });

  // 3️⃣ Kafka AFTER commit (NON-BLOCKING)
  try {
    await this.kafkaProducer.emit("seller.rejected", {
      sellerId: request.userId,
      requestId,
      reason,
      rejectedAt: rejectedAt.toISOString(),
    });
  } catch (err) {
    console.error("Kafka emit failed (seller.rejected)", err.message);
  }

  return { success: true };
}

// ================= SELLERS (APPROVED) =================
async getApprovedSellers() {
  return this.prisma.user.findMany({
    where: {
      role: User_Role.SELLER,
      sellerStatus: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      sellerStatus: true,
      sellerApprovedAt: true,
      createdAt: true,
    },
    orderBy: {
      sellerApprovedAt: "desc",
    },
  });
}

  async getSellerById(id: number) {
  const seller = await this.prisma.user.findFirst({
    where: {
      id,
      role: User_Role.SELLER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      
      sellerStatus: true,
      sellerApprovedAt: true,
      
      sellerRejectedReason: true,
      createdAt: true,
      
      businessName: true,
      businessType: true,
      panNumber: true,
      gstNumber: true,
      aadhaarLast4: true,
    },
  });

  if (!seller) {
    throw new NotFoundException("Seller not found");
  }

  return seller;
}

async getSellerRequestById(id: number) {
  const request = await this.prisma.sellerRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!request) {
    throw new NotFoundException("Seller request not found");
  }

  return request;
}

async getSellerOrders(
  sellerId: number,
  query: any
) {
  const { page = 1, limit = 10, status } = query;
  const take = Number(limit);
  const skip = (page - 1) * take;

  const where: any = { sellerId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    this.prisma.sellerOrder.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            address: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, img1: true },
            },
            productsize: true,
          },
        },
      },
    }),

    this.prisma.sellerOrder.count({ where }),
  ]);

  return {
    orders,
    total,
    page,
    pages: Math.ceil(total / take),
  };
}

  async getSellerProducts(
  sellerId: number,
  query: any
) {
  const { page = 1, limit = 10, status } = query;
  const take = Number(limit);
  const skip = (page - 1) * take;

  const where: any = { sellerId };
  if (status) where.status = status;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    pages: Math.ceil(total / take),
  };
}

  async suspendSeller(id: number, reason: string) {
  const seller = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!seller || seller.role !== User_Role.SELLER) {
    throw new NotFoundException("Seller not found");
  }

  await this.prisma.user.update({
    where: { id },
    data: {
      sellerStatus: "SUSPENDED",
      sellerRejectedReason: reason,
    },
  });

  return { success: true };
}

  async reactivateSeller(id: number) {
  const seller = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!seller || seller.role !== User_Role.SELLER) {
    throw new NotFoundException("Seller not found");
  }

  await this.prisma.user.update({
    where: { id },
    data: {
      sellerStatus: "APPROVED",
      sellerRejectedReason: null,
    },
  });

  return { success: true };
}

  async blockProduct(productId: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: "BLOCKED" },
    });
  }

  async unblockProduct(productId: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { status: "ACTIVE" },
    });
  }

async getSellerEarnings(sellerId: number) {
  // 1️⃣ Total earned (from delivered order items)
  const totalEarnedAgg = await this.prisma.orderItem.aggregate({
    where: {
      sellerId,
      status: "DELIVERED",
    },
    _sum: {
      price: true,
    },
  });

  const totalEarned = Number(totalEarnedAgg._sum.price || 0);

  // 2️⃣ Total paid out
  const totalPaidAgg = await this.prisma.sellerPayout.aggregate({
    where: {
      sellerId,
      status: "PAID",
    },
    _sum: {
      amount: true,
    },
  });

  const totalPaid = Number(totalPaidAgg._sum.amount || 0);

  // 3️⃣ Available balance
  const availableBalance = totalEarned - totalPaid;

  // 4️⃣ Optional: recent payouts
  const recentPayouts = await this.prisma.sellerPayout.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    sellerId,
    totalEarned,
    totalPaid,
    availableBalance,
    recentPayouts,
  };
}


  async getSellerSettings(sellerId: number) {
  return this.prisma.sellerSettings.upsert({
    where: { sellerId },
    create: { sellerId },
    update: {},
  });
}

async updateSellerSettings(
  sellerId: number,
  data: any
) {
  return this.prisma.sellerSettings.update({
    where: { sellerId },
    data: {
      commissionRate: data.commissionRate,
      minPayoutAmount: data.minPayoutAmount,
      autoPayout: data.autoPayout,
      allowCOD: data.allowCOD,
      payoutHold: data.payoutHold,
      isVerified: data.isVerified,
      isVisible: data.isVisible,
      adminNote: data.adminNote,
    },
  });
}

async getSellerPayouts(sellerId: number) {
  return this.prisma.sellerPayout.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
}

async getPayoutById(payoutId: number) {
  const payout = await this.prisma.sellerPayout.findUnique({
    where: { id: payoutId },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payout) {
    throw new NotFoundException("Payout not found");
  }

  return payout;
}

async getUserStats() {
  const [totalUsers, newToday, newWeek, buyers] = await Promise.all([
    this.prisma.user.count(),

    this.prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } }
    }),

    this.prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } }
    }),

    this.prisma.order.groupBy({
      by: ['userId']
    }).then(r => r.length),
  ]);

  return { totalUsers, newToday, newThisWeek: newWeek, buyers };
}
async getUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const users = await this.prisma.user.findMany({
    skip,
    take: limit,
    include: {
      order: {
        select: {
          totalAmount: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatted = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    ordersCount: u.order.length,
    totalSpent: u.order.reduce(
      (sum, o) => sum + Number(o.totalAmount), 0
    )
  }));

  const total = await this.prisma.user.count();

  return {
    users: formatted,
    total,
    pages: Math.ceil(total / limit)
  };
}

async getUserAnalytics(userId: number) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new NotFoundException("User not found");

  const orders = await this.prisma.order.findMany({
    where: { userId },
    include: {
      orderitem: {
        include: {
          product: {
            include: { category: true }
          }
        }
      }
    }
  });

  let totalSpent = 0;
  const categoryMap = new Map();
  const productMap = new Map();

  for (const order of orders) {
    for (const item of order.orderitem) {
      const amount = Number(item.price) * item.quantity;
      totalSpent += amount;

      const cat = item.product.category?.name || "Other";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);

      const pid = item.product.id;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          id: pid,
          title: item.product.title,
          quantity: 0,
          amount: 0
        });
      }

      const p = productMap.get(pid);
      p.quantity += item.quantity;
      p.amount += amount;
    }
  }

  return {
    user,
    summary: {
      orders: orders.length,
      totalSpent
    },
    categories: Array.from(categoryMap, ([name, count]) => ({ name, count })),
    products: Array.from(productMap.values())
  };
}

async getSellerBank(sellerId: number) {
  return this.prisma.sellerBankDetail.findUnique({
    where: { sellerId },
  });
}


}
