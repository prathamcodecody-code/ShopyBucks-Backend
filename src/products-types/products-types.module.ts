import { Module } from '@nestjs/common';
import { ProductTypesController } from './products-types.controller.js';
import { ProductTypesService } from './products-types.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ProductTypesController],
  providers: [ProductTypesService]
})
export class ProductsTypesModule {}
