import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { KafkaProducer } from "../kafka/kafka.producer.js";
import { User_Role } from "@prisma/client";

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  // ================= CREATE REQUEST =================
  async createRequest(userId: number, body: any) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const existingRequest = await this.prisma.sellerRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  let result: {
    requestId: number;
    isReapply: boolean;
    businessName: string | null;
  };

  // ⏳ Already under review
  if (existingRequest && existingRequest.status === "PENDING") {
    throw new BadRequestException(
      "Your seller application is already under review"
    );
  }

  // ❌ Already approved
  if (user.sellerStatus === "APPROVED") {
    throw new BadRequestException("You are already an approved seller");
  }

  // ===============================
  // TRANSACTION
  // ===============================
     result = await this.prisma.$transaction(async (tx) => {
    if (existingRequest && existingRequest.status === "REJECTED") {
      const updated = await tx.sellerRequest.update({
        where: { id: existingRequest.id },
        data: {
          panNumber: body.panNumber,
          gstNumber: body.gstNumber,
          aadhaarLast4: body.aadhaarLast4,
          businessName: body.businessName,
          businessType: body.businessType,
          status: "PENDING",
          reason: null,
          createdAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { sellerStatus: "PENDING" },
      });

      return {
        requestId: updated.id,
        isReapply: true,
        businessName: updated.businessName,
      };
    }

    // ✅ FIRST-TIME APPLY
    const created = await tx.sellerRequest.create({
      data: {
        userId,
        panNumber: body.panNumber,
        gstNumber: body.gstNumber,
        aadhaarLast4: body.aadhaarLast4,
        businessName: body.businessName,
        businessType: body.businessType,
        status: "PENDING",
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { sellerStatus: "PENDING" },
    });

    return {
      requestId: created.id,
      isReapply: false,
      businessName: created.businessName,
    };
  });

  // ===============================
  // KAFKA — AFTER COMMIT
  // ===============================
  try {
    await this.kafkaProducer.emit("seller.requested", {
      sellerId: userId,
      requestId: result.requestId,
      businessName: result.businessName,
      isReapply: result.isReapply,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // 🔥 Never break the user flow
    console.error("Kafka emit failed (seller.requested)", err.message);
  }

  return { success: true };
}

async getMyRequest(userId: number) {
  const request = await this.prisma.sellerRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      reason: true,
      businessName: true,
      businessType: true,
      panNumber: true,
      gstNumber: true,
      aadhaarLast4: true,
      createdAt: true,
    },
  });

  if (!request) {
    return { status: "NONE" };
  }

  return request;
}


  // ================= ADMIN LIST =================
  async getAllRequests() {
    return this.prisma.sellerRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            sellerStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }


  
}

