import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { KafkaModule } from '../kafka/kafka.module.js'; // Add this import
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard.js';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    KafkaModule, // Add this
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    JwtAuthGuard,
    JwtStrategy,
  ],
  exports: [OrdersService],
})
export class OrdersModule {
  constructor() {
    console.log('✅ OrdersModule loaded');
  }
}