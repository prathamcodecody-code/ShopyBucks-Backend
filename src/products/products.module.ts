import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js'; // Import AuthModule

@Module({
  imports: [AuthModule], // Add this
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
})
export class ProductsModule {}