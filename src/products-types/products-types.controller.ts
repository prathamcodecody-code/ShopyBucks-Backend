import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductTypesService } from './products-types.service.js';
import { CreateProductTypeDto } from './dto/create-product-type.dto.js';
import { UpdateProductTypeDto } from './dto/update-product-type.dto.js';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  // ✅ PUBLIC – used by frontend menu
  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    const cid = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.productTypesService.findAll(cid);
  }

  // ✅ PUBLIC (optional)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productTypesService.findOne(id);
  }

  // 🔒 ADMIN ONLY
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateProductTypeDto) {
    return this.productTypesService.create(dto);
  }

  // 🔒 ADMIN ONLY
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductTypeDto,
  ) {
    return this.productTypesService.update(id, dto);
  }

  // 🔒 ADMIN ONLY
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productTypesService.remove(id);
  }
}
