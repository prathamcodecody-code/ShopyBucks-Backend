import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { Order_Status, OrderItem_Status , SellerOrder_Status } from "@prisma/client";
import { KafkaProducer } from "../kafka/kafka.producer.js";

@Injectable()
export class SellerOrdersService {
  constructor(
    private prisma: PrismaService,
    private kafkaProducer: KafkaProducer,
  ) {}

  // ============================
  // LIST SELLER ORDERS
  // ============================
  async listOrders(sellerId: number, query: any) {
  const { page = 1, limit = 10, status } = query;
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

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
          include: { user: true },
        },
        items: {
          include: {
            product: true,
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


  // ============================
  // GET SINGLE SELLER ORDER
  // ============================
  async getOrder(sellerOrderId: number, sellerId: number) {
  const sellerOrder = await this.prisma.sellerOrder.findFirst({
    where: {
      id: sellerOrderId,
      sellerId,
    },
    include: {
      order: {
        include: { user: true },
      },
      items: {
        include: {
          product: true,
          productsize: true,
        },
      },
    },
  });

  if (!sellerOrder) {
    throw new NotFoundException("Seller order not found");
  }

  return sellerOrder;
}

async updateItemStatus(
  sellerId: number,
  orderItemId: number,
  status: OrderItem_Status
) {
  const result = await this.prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findFirst({
      where: { id: orderItemId, sellerId },
      select: {
        id: true,
        status: true,
        sellerOrderId: true,
        orderId: true,
        productId: true,
      },
    });

    if (!item) {
      throw new NotFoundException("Order item not found");
    }

    const allowedTransitions: Record<OrderItem_Status, OrderItem_Status[]> = {
      PENDING: ["ACCEPTED", "CANCELLED"],
      ACCEPTED: ["PACKED", "CANCELLED"],
      PACKED: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["RETURNED"],
      CANCELLED: [],
      RETURNED: [],
    };

    if (!allowedTransitions[item.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${item.status} to ${status}`
      );
    }

    // 1️⃣ Update item
    const updatedItem = await tx.orderItem.update({
      where: { id: orderItemId },
      data: { status },
    });

    // 2️⃣ Update SellerOrder
    const items = await tx.orderItem.findMany({
      where: { sellerOrderId: item.sellerOrderId },
    });

    const sellerOrderAllDelivered = items.every(
      i => i.status === OrderItem_Status.DELIVERED
    );

    const sellerOrderAllCancelled = items.every(
      i => i.status === OrderItem_Status.CANCELLED
    );

    if (sellerOrderAllDelivered) {
      await tx.sellerOrder.update({
        where: { id: item.sellerOrderId },
        data: { status: SellerOrder_Status.DELIVERED },
      });
    } else if (sellerOrderAllCancelled) {
      await tx.sellerOrder.update({
        where: { id: item.sellerOrderId },
        data: { status: SellerOrder_Status.CANCELLED },
      });
    } else {
      const priority: Record<OrderItem_Status, number> = {
        CANCELLED: 0,
        PENDING: 1,
        ACCEPTED: 2,
        PACKED: 3,
        SHIPPED: 4,
        DELIVERED: 5,
        RETURNED: 6,
      };

      const highest = items.reduce((a, b) =>
        priority[b.status] > priority[a.status] ? b : a
      ).status;

      await tx.sellerOrder.update({
        where: { id: item.sellerOrderId },
        data: { status: highest },
      });
    }

    // 3️⃣ Update parent Order
    const sellerOrders = await tx.sellerOrder.findMany({
      where: { orderId: item.orderId },
    });

    let orderStatus: Order_Status = Order_Status.PENDING;

    if (sellerOrders.every(o => o.status === "DELIVERED")) {
      orderStatus = Order_Status.DELIVERED;
    } else if (sellerOrders.every(o => o.status === "CANCELLED")) {
      orderStatus = Order_Status.CANCELLED;
    } else if (sellerOrders.some(o => o.status === "SHIPPED")) {
      orderStatus = Order_Status.SHIPPED;
    } else if (sellerOrders.some(o =>
      ["ACCEPTED", "PACKED"].includes(o.status)
    )) {
      orderStatus = Order_Status.CONFIRMED;
    }

    await tx.order.update({
      where: { id: item.orderId },
      data: { status: orderStatus },
    });

    return {
      updatedItem,
      meta: {
        orderId: item.orderId,
        productId: item.productId,
        oldStatus: item.status,
      },
    };
  });

  // 🔔 Kafka AFTER commit
  try {
    await this.kafkaProducer.emit("order.item.status.updated", {
      orderItemId,
      orderId: result.meta.orderId,
      sellerId,
      productId: result.meta.productId,
      oldStatus: result.meta.oldStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Kafka emit failed:", err.message);
  }

  return result.updatedItem;
}
  
async verifyOrder(orderId: number, userId: number) {
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: { id: true },
  });

  if (!order) {
    throw new NotFoundException("Order not found");
  }

  return { ok: true };
}

}


