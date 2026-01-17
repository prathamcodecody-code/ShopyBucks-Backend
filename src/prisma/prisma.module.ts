import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // so you don't need to import PrismaModule everywhere
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
