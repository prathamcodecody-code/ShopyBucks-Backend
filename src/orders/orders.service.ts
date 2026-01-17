import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { Order_Status } from "@prisma/client";
import { KafkaProducer } from "../kafka/kafka.producer.js";


@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService ,
    private kafka: KafkaProducer,
  ) {}

  // ================= ADMIN =================

  async getAll(query: any) {
    const { page = 1, limit = 10, status, minAmount, maxAmount } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = Number(minAmount);
      if (maxAmount) where.totalAmount.lte = Number(maxAmount);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: true,
          orderitem: { include: { product: true ,
            productsize: true,
           } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    };
  }

  async getOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, orderitem: { include: { product: true, productsize: true } } },
    });

    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  // ================= ADMIN STATUS UPDATE =================
  async updateStatus(orderId: number, status: Order_Status) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // ================= CREATE ORDER (COD / RAZORPAY) =================
  async createOrder(userId: number, address: any) {
  const cart = await this.prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
      productsize: true,
    },
  });

  if (!cart.length) {
    throw new BadRequestException("Cart is empty");
  }

  // 🔹 Group cart items by sellerId
  const itemsBySeller = new Map<number, typeof cart>();

  for (const item of cart) {
    const sellerId = item.product.sellerId;
    if (!sellerId) {
      throw new BadRequestException(
        `Product ${item.product.id} has no seller`
      );
    }

    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, []);
    }
    itemsBySeller.get(sellerId)!.push(item);
  }

  return this.prisma.$transaction(async (tx) => {
    // 🔹 Create main Order
    const order = await tx.order.create({
      data: {
        userId,
        status: Order_Status.PENDING,
        address,
        totalAmount: 0, // temporary
      },
    });

    let orderTotal = 0;

    // 🔹 Create SellerOrders
    for (const [sellerId, items] of itemsBySeller.entries()) {
      let sellerTotal = 0;

      for (const i of items) {
        let price = Number(i.product.price);
        let finalPrice = price;

        if (i.product.discountType === "PERCENT") {
          finalPrice -= (price * Number(i.product.discountValue)) / 100;
        }

        if (i.product.discountType === "FLAT") {
          finalPrice -= Number(i.product.discountValue);
        }

        finalPrice = Math.max(0, finalPrice);
        sellerTotal += finalPrice * i.quantity;
      }

      // ✅ Create SellerOrder
      const sellerOrder = await tx.sellerOrder.create({
        data: {
          orderId: order.id,
          sellerId,
          totalAmount: sellerTotal,
        },
      });

      orderTotal += sellerTotal;

      // 🔹 Create OrderItems
      for (const i of items) {
        let price = Number(i.product.price);
        let finalPrice = price;

        if (i.product.discountType === "PERCENT") {
          finalPrice -= (price * Number(i.product.discountValue)) / 100;
        }

        if (i.product.discountType === "FLAT") {
          finalPrice -= Number(i.product.discountValue);
        }

        finalPrice = Math.max(0, finalPrice);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            sellerOrderId: sellerOrder.id,
            sellerId,
            productId: i.productId,
            quantity: i.quantity,
            price: finalPrice,
            originalPrice: price,
            discountType: i.product.discountType,
            discountValue: i.product.discountValue,
            sizeId: i.sizeId ?? null,
          },
        });

        // 🔥 STOCK UPDATE
        if (i.sizeId) {
          const updated = await tx.productSize.updateMany({
            where: {
              id: i.sizeId,
              stock: { gte: i.quantity },
            },
            data: {
              stock: { decrement: i.quantity },
            },
          });

          if (!updated.count) {
            throw new BadRequestException(
              `${i.product.title} (${i.productsize?.size}) is out of stock`
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: {
              id: i.productId,
              stock: { gte: i.quantity },
            },
            data: {
              stock: { decrement: i.quantity },
            },
          });

          if (!updated.count) {
            throw new BadRequestException(
              `${i.product.title} is out of stock`
            );
          }
        }
      }
    }

    // 🔹 Update final order total
    await tx.order.update({
      where: { id: order.id },
      data: { totalAmount: orderTotal },
    });

    // 🧹 Clear cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return { orderId: order.id };
  });
}

  // ================= USER =================

  async getMyOrders(userId: number, page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { orderitem: { include: { product: true , productsize: true, } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      page,
      pages: Math.ceil(total / limit),
      total,
    };
  }

  async getMyOrderById(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { orderitem: { include: { product: true, productsize: true } } },
    });

    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  // ================= CANCEL =================
  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderitem: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId)
      throw new BadRequestException("Unauthorized");

    // ❌ FIXED: only PENDING allowed
    if (order.status !== Order_Status.PENDING) {
      throw new BadRequestException(
        "Order cannot be cancelled after confirmation"
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // restore stock
      for (const item of order.orderitem) {
  if (item.sizeId) {
    await tx.productSize.update({
      where: { id: item.sizeId },
      data: { stock: { increment: item.quantity } },
    });
  } else {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}


      await tx.order.update({
        where: { id: orderId },
        data: { status: Order_Status.CANCELLED },
      });
    });

    return { success: true };
  }

  // ================= REORDER =================
  async reorder(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderitem: true },
    });

    if (!order || order.userId !== userId)
      throw new NotFoundException("Order not found");

    for (const item of order.orderitem) {
  if (item.sizeId) {
    const size = await this.prisma.productSize.findUnique({
      where: { id: item.sizeId },
    });

    if (!size || size.stock < item.quantity) {
      throw new BadRequestException(
        `${item.productId} size is out of stock`
      );
    }
  } else {
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.stock < item.quantity) {
      throw new BadRequestException(
        `${product?.title} is out of stock`
      );
    }
  }
}


    await this.prisma.cartItem.deleteMany({ where: { userId } });

    await this.prisma.cartItem.createMany({
  data: order.orderitem.map((i) => ({
    userId,
    productId: i.productId,
    sizeId: i.sizeId ?? null,
    quantity: i.quantity,
  })),
});


    return { success: true };
  }
}
