import { Module } from '@nestjs/common';
import { ProductSubtypesController } from './products-subtypes.controller.js';
import { ProductSubtypesService } from './products-subtypes.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ProductSubtypesController],
  providers: [ProductSubtypesService]
})
export class ProductsSubtypesModule {}
