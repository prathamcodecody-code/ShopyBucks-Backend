import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from './settings.service.js';
import { SettingsController } from './settings.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [PrismaService, SettingsService],
  controllers: [SettingsController],
})
export class SettingsModule {}
