import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Put,
  Patch,
  Req,
} from "@nestjs/common";
import { ProductsService } from "./products.service.js";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { JwtAuthGuard } from "../auth/strategies/jwt-auth.guard.js";
import { AdminGuard } from "../auth/admin.guard.js";
import { AdminOrSellerGuard } from "../auth/AdminOrSeller.guard.js";
import { UpdateProductSeoDto } from "./dto/update-product-seo.dto.js";

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
} from "@nestjs/swagger";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ================= CREATE PRODUCT (SELLER) =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create product (Seller)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        stock: { type: "number" },
        categoryId: { type: "number" },
        typeId: { type: "number" },
        subtypeId: { type: "number" },
        sizes: {
          type: "string",
          example: `[{"size":"S","stock":10},{"size":"M","stock":20}]`,
        },
        image1: { type: "string", format: "binary" },
        image2: { type: "string", format: "binary" },
        image3: { type: "string", format: "binary" },
        image4: { type: "string", format: "binary" },
      },
      required: ["title", "price", "stock", "categoryId", "sizes"],
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @UseGuards(JwtAuthGuard, AdminOrSellerGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), "uploads", "products"),
          filename: (_, file, cb) =>
            cb(null, `${Date.now()}-${Math.random()}${extname(file.originalname)}`),
        }),
      },
    ),
  )
  @Post()
  create(@UploadedFiles() files: any, @Body() body: any, @Req() req: any) {
    return this.productsService.create(body, files, req.user);
  }

  // ================= LIST PRODUCTS =================

  @ApiOperation({ summary: "Get products (filters & pagination)" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "typeId", required: false })
  @ApiQuery({ name: "subtypeId", required: false })
  @ApiQuery({ name: "minPrice", required: false })
  @ApiQuery({ name: "maxPrice", required: false })
  @ApiQuery({ name: "stock", required: false, enum: ["in", "out"] })
  @ApiQuery({ name: "sort", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiOkResponse({ description: "Products fetched successfully" })
  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  // ================= LOW STOCK (ADMIN) =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get low stock products (Admin)" })
  @ApiQuery({ name: "threshold", required: false })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/low-stock")
  getLowStock(@Query("threshold") threshold?: string) {
    return this.productsService.getLowStock(
      threshold ? Number(threshold) : 5,
    );
  }

  // ================= GET PRODUCT =================

  @ApiOperation({ summary: "Get product by slug" })
@ApiParam({ name: "slug", type: String })
@Get("slug/:slug")
findBySlug(@Param("slug") slug: string) {
  return this.productsService.findBySlug(slug);
}

@ApiOperation({ summary: "Get product by ID" })
@ApiParam({ name: "id", type: Number })
@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) {
  return this.productsService.findOne(id);
}

  // ================= UPDATE PRODUCT =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update product (Admin)" })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", type: Number })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]))
  @Put(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFiles() files: any,
    @Body() body: any,
  ) {
    return this.productsService.update(id, body, files);
  }

  // ================= DELETE =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete product (Admin)" })
  @ApiParam({ name: "id", type: Number })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  // ================= STOCK =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update product stock (Admin)" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ schema: { example: { stock: 100 } } })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id/stock")
  updateStock(
    @Param("id", ParseIntPipe) id: number,
    @Body("stock") stock: number,
  ) {
    return this.productsService.updateStock(id, stock);
  }

  // ================= DISCOUNT =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update product discount (Admin)" })
  @ApiParam({ name: "id", type: Number })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id/discount")
  updateDiscount(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { discountType?: string; discountValue?: number },
  ) {
    return this.productsService.updateDiscount(id, body);
  }

  // ================= SEO =================

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update product SEO (Admin)" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateProductSeoDto })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/seo")
  updateSeo(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProductSeoDto,
  ) {
    return this.productsService.updateSeo(id, dto);
  }
}
