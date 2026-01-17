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
} from '@nestjs/common';
import { ProductSubtypesService } from './products-subtypes.service.js';
import { CreateProductSubtypeDto } from './dto/create-product-subtype.dto.js';
import { UpdateProductSubtypeDto } from './dto/update-product-subtype.dto.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import {AdminOrSellerGuard} from '../auth/AdminOrSeller.guard.js'

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard,AdminOrSellerGuard )
@Controller('product-subtypes')
export class ProductSubtypesController {
  constructor(private readonly productSubtypesService: ProductSubtypesService) {}

  @Post()
  create(@Body() dto: CreateProductSubtypeDto) {
    return this.productSubtypesService.create(dto);
  }

  // GET /product-subtypes?typeId=2
  @Get()
  findAll(@Query('typeId') typeId?: string) {
    const tid = typeId ? parseInt(typeId, 10) : undefined;
    return this.productSubtypesService.findAll(tid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productSubtypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductSubtypeDto,
  ) {
    return this.productSubtypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productSubtypesService.remove(id);
  }
}
