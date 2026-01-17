// auth/seller.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js"; // Import Prisma

@Injectable()
export class SellerGuard implements CanActivate {
  // 1. Inject Prisma
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // 2. Fetch the FRESH user status from the DB
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, sellerStatus: true }
    });

    // 3. Check the DB values, not the JWT values
    if (
      dbUser?.role === "SELLER" &&
      dbUser?.sellerStatus === "APPROVED"
    ) {
      return true;
    }

    throw new ForbiddenException("Seller not approved or role mismatch");
  }
}