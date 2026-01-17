import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
@Injectable()
export class AdminPayoutService {
  constructor(private prisma: PrismaService) {}




}