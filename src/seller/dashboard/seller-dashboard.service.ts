import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { OrderItem_Status } from "@prisma/client";
import { RedisService } from "../../redis/redis.service.js";


@Injectable()
export class SellerDashboardService {
  constructor(
  private prisma: PrismaService,
  private redis: RedisService,
) {}

  // =========================
  // STATS
  // =========================
  async getStats(sellerId: number) {
  const cacheKey = `seller:${sellerId}:dashboard:stats`;

  const cached = await this.redis.get(cacheKey);
  if (cached) return cached;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    products,
    totalOrders,
    pendingOrders,
    revenueAgg,
    todayRevenueAgg,
    recentProducts,
  ] = await Promise.all([
    this.prisma.product.count({
      where: { sellerId, isActive: true },
    }),
    this.prisma.orderItem.count({ where: { sellerId } }),
    this.prisma.orderItem.count({
      where: { sellerId, status: OrderItem_Status.PENDING },
    }),
    this.prisma.orderItem.aggregate({
      where: {
        sellerId,
        status: {
          in: [
            OrderItem_Status.SHIPPED,
            OrderItem_Status.DELIVERED,
          ],
        },
      },
      _sum: { price: true },
    }),
    this.prisma.orderItem.aggregate({
      where: {
        sellerId,
        status: {
          in: [
            OrderItem_Status.SHIPPED,
            OrderItem_Status.DELIVERED,
          ],
        },
        createdAt: { gte: today },
      },
      _sum: { price: true },
    }),
    this.prisma.product.findMany({
      where: { sellerId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const result = {
    products,
    totalOrders,
    pendingOrders,
    revenue: Number(revenueAgg._sum.price || 0),
    todayRevenue: Number(todayRevenueAgg._sum.price || 0),
    recentProducts,
  };

  await this.redis.set(cacheKey, result, 120); // 2 minutes
  return result;
}

  // =========================
  // CHARTS
  // =========================
  async getCharts(sellerId: number) {
  const cacheKey = `seller:${sellerId}:dashboard:charts`;

  const cached = await this.redis.get(cacheKey);
  if (cached) return cached;

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);

  const revenueRaw = await this.prisma.orderItem.groupBy({
    by: ["createdAt"],
    where: {
      sellerId,
      status: {
        in: [
          OrderItem_Status.SHIPPED,
          OrderItem_Status.DELIVERED,
        ],
      },
      createdAt: { gte: last7Days },
    },
    _sum: { price: true },
  });

  const revenueTrend = revenueRaw.map(r => ({
    date: r.createdAt.toISOString().slice(0, 10),
    revenue: Number(r._sum.price || 0),
  }));

  const ordersRaw = await this.prisma.orderItem.groupBy({
    by: ["createdAt"],
    where: {
      sellerId,
      createdAt: { gte: last7Days },
    },
    _count: { id: true },
  });

  const ordersTrend = ordersRaw.map(o => ({
    date: o.createdAt.toISOString().slice(0, 10),
    orders: o._count.id,
  }));

  const statusRaw = await this.prisma.orderItem.groupBy({
    by: ["status"],
    where: { sellerId },
    _count: { status: true },
  });

  const orderStatus = statusRaw.map(s => ({
    status: s.status,
    count: s._count.status,
  }));

  const result = {
    revenueTrend,
    ordersTrend,
    orderStatus,
  };

  await this.redis.set(cacheKey, result, 300); // 5 minutes
  return result;
}

  // =========================
  // LOW STOCK
  // =========================
  async getLowStock(sellerId: number) {
  const cacheKey = `seller:${sellerId}:dashboard:low-stock`;

  const cached = await this.redis.get(cacheKey);
  if (cached) return cached;

  const products = await this.prisma.product.findMany({
    where: {
      sellerId,
      isActive: true,
      stock: { lte: 5 },
    },
    orderBy: { stock: "asc" },
    take: 10,
  });

  await this.redis.set(cacheKey, products, 300);
  return products;
}

}
